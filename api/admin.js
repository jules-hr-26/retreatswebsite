import { select, insert, upsert, update, remove } from './_lib/supabase.js';
import { readCookie, verifyToken } from '../lib/session.js';

async function getAdmin(req) {
  const session = await verifyToken(
    readCookie(req.headers.cookie, 'cnlc_session'),
    process.env.SESSION_SECRET
  ).catch(() => null);
  if (!session?.email) return null;
  const rows = await select('admins', { email: session.email }).catch(() => []);
  if (!rows.length) return null;
  return { email: session.email, firstName: session.firstName, lastName: session.lastName, role: rows[0].role };
}

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const admin = await getAdmin(req);
  if (!admin) return res.status(401).json({ error: 'admin access required' });

  // ── GET ──────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { action, search } = req.query || {};

    if (action === 'me') {
      return res.status(200).json({ email: admin.email, firstName: admin.firstName, lastName: admin.lastName, role: admin.role });
    }

    if (action === 'stats') {
      const [members, allowlist, events, offerings, proposed] = await Promise.all([
        select('members').catch(() => []),
        select('alumni_allowlist').catch(() => []),
        select('events', { 'status:neq': 'proposed' }).catch(() => []),
        select('offerings').catch(() => []),
        select('proposed_events').catch(() => []),
      ]);
      return res.status(200).json({
        members:  members.length,
        allowlist: allowlist.length,
        events:   events.length,
        offerings: offerings.length,
        proposed: proposed.length,
      });
    }

    if (action === 'members') {
      const rows = await select('members', {}, { order: 'first_name.asc' }).catch(() => []);
      const filtered = search
        ? rows.filter(r => `${r.first_name} ${r.last_name} ${r.auth_email} ${r.organisation}`.toLowerCase().includes(search.toLowerCase()))
        : rows;
      return res.status(200).json({ members: filtered });
    }

    if (action === 'allowlist') {
      const rows = await select('alumni_allowlist', {}, { order: 'first_name.asc' }).catch(() => []);
      const filtered = search
        ? rows.filter(r => `${r.first_name} ${r.last_name} ${r.email}`.toLowerCase().includes(search.toLowerCase()))
        : rows;
      return res.status(200).json({ allowlist: filtered });
    }

    if (action === 'events') {
      const rows = await select('events', {}, { order: 'created_at.desc' }).catch(() => []);
      return res.status(200).json({ events: rows });
    }

    if (action === 'proposed') {
      const rows = await select('proposed_events', {}, { order: 'created_at.desc' }).catch(() => []);
      return res.status(200).json({ proposed: rows });
    }

    if (action === 'offerings') {
      const rows = await select('offerings', {}, { order: 'created_at.desc' }).catch(() => []);
      return res.status(200).json({ offerings: rows });
    }

    if (action === 'forum') {
      const [posts, replies] = await Promise.all([
        select('forum_posts', {}, { order: 'created_at.desc' }).catch(() => []),
        select('forum_replies', {}, { order: 'created_at.desc' }).catch(() => []),
      ]);
      return res.status(200).json({ posts, replies });
    }

    if (action === 'admins') {
      if (admin.role !== 'super_admin') return res.status(403).json({ error: 'super_admin required' });
      const rows = await select('admins', {}, { order: 'created_at.asc' }).catch(() => []);
      return res.status(200).json({ admins: rows });
    }

    return res.status(400).json({ error: 'unknown action' });
  }

  // ── POST ─────────────────────────────────────────────────────────
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const body = req.body || {};
  const { action } = body;

  // ── Allowlist ────────────────────────────────────────────────────
  if (action === 'add-allowlist') {
    const { email, firstName, lastName } = body;
    if (!email) return res.status(400).json({ error: 'email required' });
    await upsert('alumni_allowlist', {
      email: email.trim().toLowerCase(),
      first_name: (firstName || '').trim(),
      last_name:  (lastName  || '').trim(),
    }, 'email');
    return res.status(200).json({ ok: true });
  }

  if (action === 'remove-allowlist') {
    const { email } = body;
    if (!email) return res.status(400).json({ error: 'email required' });
    await remove('alumni_allowlist', { email: email.trim().toLowerCase() });
    return res.status(200).json({ ok: true });
  }

  // ── Events ───────────────────────────────────────────────────────
  if (action === 'add-event') {
    const { name, startDate, endDate, city, description, discussionLink, status } = body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const row = await insert('events', {
      name, start_date: startDate || '', end_date: endDate || '',
      city: city || '', description: description || '',
      discussion_link: discussionLink || '', status: status || 'approved',
    });
    return res.status(200).json({ ok: true, event: row[0] });
  }

  if (action === 'update-event') {
    const { id, name, startDate, endDate, city, description, discussionLink, status } = body;
    if (!id) return res.status(400).json({ error: 'id required' });
    await update('events', { id }, {
      name, start_date: startDate, end_date: endDate,
      city, description, discussion_link: discussionLink, status,
    });
    return res.status(200).json({ ok: true });
  }

  if (action === 'delete-event') {
    const { id } = body;
    if (!id) return res.status(400).json({ error: 'id required' });
    await remove('events', { id });
    return res.status(200).json({ ok: true });
  }

  if (action === 'approve-proposed') {
    const { id } = body;
    if (!id) return res.status(400).json({ error: 'id required' });
    const rows = await select('proposed_events', { id });
    if (!rows.length) return res.status(404).json({ error: 'not found' });
    const p = rows[0];
    const details = [p.description, p.format ? `Format: ${p.format}` : '', p.duration ? `Duration: ${p.duration}` : ''].filter(Boolean).join('\n');
    await insert('events', {
      name: p.title, start_date: p.date || '', end_date: '',
      city: p.location || '', description: details,
      discussion_link: p.link || '', status: 'approved', proposed_by: '',
    });
    await update('proposed_events', { id }, { status: 'approved' });
    return res.status(200).json({ ok: true });
  }

  if (action === 'reject-proposed') {
    const { id } = body;
    if (!id) return res.status(400).json({ error: 'id required' });
    await update('proposed_events', { id }, { status: 'rejected' });
    return res.status(200).json({ ok: true });
  }

  // ── Offerings ────────────────────────────────────────────────────
  if (action === 'approve-offering') {
    const { id } = body;
    if (!id) return res.status(400).json({ error: 'id required' });
    await update('offerings', { id }, { status: 'published' });
    return res.status(200).json({ ok: true });
  }

  if (action === 'reject-offering') {
    const { id } = body;
    if (!id) return res.status(400).json({ error: 'id required' });
    await update('offerings', { id }, { status: 'rejected' });
    return res.status(200).json({ ok: true });
  }

  // ── Forum moderation ─────────────────────────────────────────────
  if (action === 'delete-post') {
    const { postId } = body;
    if (!postId) return res.status(400).json({ error: 'postId required' });
    await remove('forum_replies', { post_id: postId });
    await remove('forum_posts', { post_id: postId });
    return res.status(200).json({ ok: true });
  }

  if (action === 'delete-reply') {
    const { replyId } = body;
    if (!replyId) return res.status(400).json({ error: 'replyId required' });
    await remove('forum_replies', { reply_id: replyId });
    return res.status(200).json({ ok: true });
  }

  // ── GDPR: export member data ─────────────────────────────────────
  if (action === 'export-member') {
    const { email } = body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const e = email.trim().toLowerCase();
    const [profile, allowlistEntry, rsvps, posts, replies, memberOfferings] = await Promise.all([
      select('members',           { auth_email: e }).catch(() => []),
      select('alumni_allowlist',  { email: e }).catch(() => []),
      select('event_attendees',   { member_email: e }).catch(() => []),
      select('forum_posts',       { author_email: e }).catch(() => []),
      select('forum_replies',     { author_email: e }).catch(() => []),
      select('offerings',         { email: e }).catch(() => []),
    ]);
    return res.status(200).json({
      email: e,
      exported_at: new Date().toISOString(),
      profile: profile[0] || null,
      allowlist: allowlistEntry[0] || null,
      event_rsvps: rsvps,
      forum_posts: posts,
      forum_replies: replies,
      offerings: memberOfferings,
    });
  }

  // ── GDPR: delete member ──────────────────────────────────────────
  if (action === 'delete-member') {
    const { email } = body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const e = email.trim().toLowerCase();
    await Promise.all([
      remove('event_attendees',   { member_email: e }),
      remove('forum_memberships', { member_email: e }),
      remove('forum_posts',       { author_email: e }),
      remove('forum_replies',     { author_email: e }),
      remove('offerings',         { email: e }),
      remove('members',           { auth_email:   e }),
    ]);
    return res.status(200).json({ ok: true });
  }

  // ── Admin management (super_admin only) ──────────────────────────
  if (action === 'add-admin') {
    if (admin.role !== 'super_admin') return res.status(403).json({ error: 'super_admin required' });
    const { email, name, role } = body;
    if (!email) return res.status(400).json({ error: 'email required' });
    await upsert('admins', {
      email: email.trim().toLowerCase(),
      name: (name || '').trim(),
      role: role === 'super_admin' ? 'super_admin' : 'admin',
      created_by: admin.email,
    }, 'email');
    return res.status(200).json({ ok: true });
  }

  if (action === 'remove-admin') {
    if (admin.role !== 'super_admin') return res.status(403).json({ error: 'super_admin required' });
    const { email } = body;
    if (!email) return res.status(400).json({ error: 'email required' });
    if (email.trim().toLowerCase() === admin.email) {
      return res.status(400).json({ error: 'cannot remove yourself' });
    }
    await remove('admins', { email: email.trim().toLowerCase() });
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: 'unknown action' });
}
