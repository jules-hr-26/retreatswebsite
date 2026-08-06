import { select, insert, update } from './_lib/supabase.js';
import { readCookie, verifyToken, createToken } from '../lib/session.js';

function esc(s) {
  return String(s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

export default async function handler(req, res) {
  const { calendarId, source, action } = req.query || {};

  // ── Luma proxy (unchanged) ────────────────────────────────────
  if (calendarId) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(
        `https://api.lu.ma/public/v1/calendar/list-events?calendar_api_id=${encodeURIComponent(calendarId)}`,
        { headers: { 'x-luma-api-key': process.env.LUMA_API_KEY, accept: 'application/json' }, signal: controller.signal }
      );
      clearTimeout(timeout);
      const data = await response.json();
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
      return res.status(response.ok ? 200 : response.status).json(data);
    } catch (err) {
      if (err.name === 'AbortError') return res.status(504).json({ error: 'upstream timeout' });
      return res.status(500).json({ error: err.message });
    }
  }

  // ── List events from DB (with attendees + current-user flag) ──
  if (req.method === 'GET' && source === 'sheet') {
    try {
      const session = await verifyToken(
        readCookie(req.headers.cookie, 'cnlc_session'),
        process.env.SESSION_SECRET
      ).catch(() => null);
      const myEmail = session?.email || null;

      const [eventRows, attendeeRows, allowlistRows, memberRows] = await Promise.all([
        select('events'),
        select('event_attendees'),
        select('alumni_allowlist'),
        select('members'),
      ]);

      const nameMap = {};
      allowlistRows.forEach(r => {
        if (r.email) nameMap[r.email] = `${r.first_name || ''} ${r.last_name || ''}`.trim();
      });

      const headshotMap = {};
      memberRows.forEach(r => {
        if (r.auth_email && r.headshot_data) headshotMap[r.auth_email] = r.headshot_data;
      });

      const attendeesByEvent = {};
      attendeeRows.forEach(r => {
        if (!r.event_name || !r.member_email || r.status !== 'yes') return;
        if (!attendeesByEvent[r.event_name]) attendeesByEvent[r.event_name] = [];
        attendeesByEvent[r.event_name].push({
          email:    r.member_email,
          name:     nameMap[r.member_email] || r.member_email,
          headshot: headshotMap[r.member_email] || '',
        });
      });

      const events = eventRows.map(r => {
        const evAttendees = attendeesByEvent[r.name] || [];
        return {
          name:                 r.name,
          startDate:            r.start_date || '',
          endDate:              r.end_date || '',
          city:                 r.city || '',
          description:          r.description || '',
          discussionLink:       r.discussion_link || '',
          attendees:            evAttendees,
          currentUserAttending: myEmail ? evAttendees.some(a => a.email === myEmail) : false,
        };
      });

      return res.status(200).json({ events });
    } catch (err) {
      console.error('[events] list error', err.message);
      return res.status(502).json({ error: 'could not load events' });
    }
  }

  // ── One-click opt-out (no auth needed) ────────────────────────
  if (req.method === 'GET' && action === 'optout') {
    try {
      const payload = req.query.token
        ? await verifyToken(req.query.token, process.env.SESSION_SECRET)
        : null;

      if (payload?.purpose === 'event-optout') {
        await update('event_attendees',
          { event_name: payload.eventName, member_email: payload.email },
          { status: 'no' }
        );
      }
    } catch (err) {
      console.error('[events] optout error', err.message);
    }
    res.writeHead(302, { Location: '/platform.html?tab=events&msg=unsubscribed' });
    return res.end();
  }

  // ── POST actions (auth required) ──────────────────────────────
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const session = await verifyToken(
    readCookie(req.headers.cookie, 'cnlc_session'),
    process.env.SESSION_SECRET
  );
  if (!session?.email) return res.status(401).json({ error: 'not signed in' });

  const { action: bodyAction, eventName, name, startDate, endDate, city, description, discussionLink } = req.body || {};
  const host = req.headers['x-forwarded-host'] || req.headers.host;

  // ── Cancel RSVP ───────────────────────────────────────────────
  if (bodyAction === 'cancel-rsvp') {
    if (!eventName) return res.status(400).json({ error: 'eventName required' });
    const existing = await select('event_attendees', { event_name: eventName, member_email: session.email });
    if (existing.length) {
      await update('event_attendees', { event_name: eventName, member_email: session.email }, { status: 'no' });
    }
    return res.status(200).json({ ok: true });
  }

  // ── RSVP ──────────────────────────────────────────────────────
  if (bodyAction === 'rsvp') {
    if (!eventName) return res.status(400).json({ error: 'eventName required' });

    const existing = await select('event_attendees', { event_name: eventName, member_email: session.email });
    if (existing.length && existing[0].status === 'yes') {
      return res.status(200).json({ ok: true, alreadyRsvped: true });
    }

    if (existing.length) {
      await update('event_attendees', { event_name: eventName, member_email: session.email }, { status: 'yes' });
    } else {
      await insert('event_attendees', { event_name: eventName, member_email: session.email, status: 'yes' });
    }

    // Notify others in background
    notifyAttendees(eventName, session, host).catch(err =>
      console.error('[events] notify error', err.message)
    );

    return res.status(200).json({ ok: true });
  }

  // ── Propose (mark attending a climate event) ──────────────────
  if (bodyAction === 'propose') {
    if (!name || !startDate || !city) {
      return res.status(400).json({ error: 'name, startDate and city are required' });
    }

    await insert('events', {
      name, start_date: startDate, end_date: endDate || '',
      city, description: description || '', discussion_link: discussionLink || '',
      status: 'approved', proposed_by: session.email,
    });

    const proposerName = `${session.firstName || ''} ${session.lastName || ''}`.trim() || session.email;
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'CNLC Platform <onboarding@resend.dev>',
        to: 'julia@globaloptimism.com',
        subject: `New event proposal: ${name}`,
        html: `
          <p><strong>${esc(proposerName)}</strong> proposed a climate event:</p>
          <p><strong>Event:</strong> ${esc(name)}</p>
          <p><strong>Dates:</strong> ${esc(startDate)}${endDate ? ' – ' + esc(endDate) : ''}</p>
          <p><strong>City:</strong> ${esc(city)}</p>
          ${description ? `<p><strong>Description:</strong> ${esc(description)}</p>` : ''}
          ${discussionLink ? `<p><strong>Discussion link:</strong> ${esc(discussionLink)}</p>` : ''}
        `,
      }),
    }).catch(err => console.error('[events] propose email error', err.message));

    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: 'unknown action' });
}

async function notifyAttendees(eventName, newAttendee, host) {
  const [attendeeRows, allowlistRows] = await Promise.all([
    select('event_attendees', { event_name: eventName }),
    select('alumni_allowlist'),
  ]);

  const toNotify = attendeeRows.filter(r =>
    r.member_email !== newAttendee.email && r.status === 'yes'
  );
  if (!toNotify.length) return;

  const nameMap = {};
  allowlistRows.forEach(r => {
    if (r.email) nameMap[r.email] = { first: r.first_name || '', full: `${r.first_name || ''} ${r.last_name || ''}`.trim() };
  });

  const myName        = (nameMap[newAttendee.email] || {}).full || newAttendee.email;
  const platformLink  = `https://${host}/platform.html?tab=events`;

  await Promise.all(toNotify.map(async r => {
    const attendeeEmail = r.member_email;
    const attendeeName  = (nameMap[attendeeEmail] || {}).first || 'there';

    const optoutToken = await createToken(
      { email: attendeeEmail, eventName, purpose: 'event-optout', exp: Date.now() + 365 * 24 * 60 * 60 * 1000 },
      process.env.SESSION_SECRET
    );
    const optoutLink = `https://${host}/api/events?action=optout&token=${optoutToken}`;

    return fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'CNLC Platform <onboarding@resend.dev>',
        to: attendeeEmail,
        subject: `${myName} is also attending ${eventName}`,
        html: `
          <p>Hi ${esc(attendeeName)},</p>
          <p><strong>${esc(myName)}</strong> just marked themselves as attending <strong>${esc(eventName)}</strong>.</p>
          <p><a href="${platformLink}">See who else is going →</a></p>
          <p style="margin-top:32px;font-size:12px;color:#999;">
            You're getting this because you marked yourself as attending ${esc(eventName)}.<br>
            <a href="${optoutLink}" style="color:#999;">Stop updates for this event</a>
          </p>
        `,
      }),
    }).catch(err => console.error('[events] notify send error', attendeeEmail, err.message));
  }));
}
