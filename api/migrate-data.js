// ONE-TIME DATA MIGRATION: Google Sheets → Supabase
// Protected by MIGRATION_SECRET env var.
// DELETE THIS FILE after migration is confirmed complete.

import { getValues } from './_lib/googleSheets.js';
import { insert } from './_lib/supabase.js';

export default async function handler(req, res) {
  const secret = req.query.secret || req.headers['x-migration-secret'];
  if (!secret || secret !== process.env.MIGRATION_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const results = {};
  const errors  = [];

  // ── Alumni Allowlist ─────────────────────────────────────────
  try {
    const rows = await getValues('Alumni Email Allowlist!A:C');
    const data = rows.slice(1)
      .filter(r => (r[2] || '').trim())
      .map(r => ({
        first_name: (r[0] || '').trim(),
        last_name:  (r[1] || '').trim(),
        email:      (r[2] || '').trim().toLowerCase(),
      }));

    if (data.length) {
      // Insert in batches of 100 to avoid payload limits
      for (let i = 0; i < data.length; i += 100) {
        await insert('alumni_allowlist', data.slice(i, i + 100));
      }
    }
    results.alumni_allowlist = data.length;
  } catch (err) {
    errors.push(`alumni_allowlist: ${err.message}`);
  }

  // ── Members (Profiles) ────────────────────────────────────────
  // Columns A–O: createdAt, firstName, lastName, authEmail, displayEmail,
  //              city, country, organisation, sector, cohort, role, phone,
  //              (blank), shareWithCommunity, headshotData
  try {
    const rows = await getValues('Profiles!A:O');
    const data = rows.slice(1)
      .filter(r => (r[3] || '').trim())
      .map(r => ({
        created_at:    r[0] || new Date().toISOString(),
        first_name:    (r[1] || '').trim(),
        last_name:     (r[2] || '').trim(),
        auth_email:    (r[3] || '').trim().toLowerCase(),
        display_email: (r[4] || '').trim(),
        city:          r[5] || '',
        country:       r[6] || '',
        organisation:  r[7] || '',
        sector:        r[8] || '',
        cohort:        r[9] || '',
        role_title:    r[10] || '',
        phone:         r[11] || '',
        in_directory:  (r[13] || '').trim().toLowerCase() === 'yes',
        headshot_data: r[14] || '',
        updated_at:    new Date().toISOString(),
      }));

    if (data.length) {
      for (let i = 0; i < data.length; i += 50) {
        await insert('members', data.slice(i, i + 50));
      }
    }
    results.members = data.length;
  } catch (err) {
    errors.push(`members: ${err.message}`);
  }

  // ── Events ────────────────────────────────────────────────────
  // Columns A–H: name, startDate, endDate, city, description, discussionLink, status, proposedBy
  try {
    const rows = await getValues('Events!A:H');
    const data = rows.slice(1)
      .filter(r => (r[0] || '').trim())
      .map(r => ({
        name:            (r[0] || '').trim(),
        start_date:      r[1] || '',
        end_date:        r[2] || '',
        city:            r[3] || '',
        description:     r[4] || '',
        discussion_link: r[5] || '',
        status:          r[6] || 'approved',
        proposed_by:     r[7] || '',
      }));

    if (data.length) {
      for (let i = 0; i < data.length; i += 100) {
        await insert('events', data.slice(i, i + 100));
      }
    }
    results.events = data.length;
  } catch (err) {
    errors.push(`events: ${err.message}`);
  }

  // ── Event Attendees ───────────────────────────────────────────
  // Columns A–D: eventName, memberEmail, status, createdAt
  try {
    const rows = await getValues('Event Attendees!A:D');
    const data = rows.slice(1)
      .filter(r => (r[0] || '').trim() && (r[1] || '').trim())
      .map(r => ({
        event_name:   (r[0] || '').trim(),
        member_email: (r[1] || '').trim().toLowerCase(),
        status:       r[2] || 'yes',
        created_at:   r[3] || new Date().toISOString(),
      }));

    if (data.length) {
      for (let i = 0; i < data.length; i += 100) {
        await insert('event_attendees', data.slice(i, i + 100));
      }
    }
    results.event_attendees = data.length;
  } catch (err) {
    errors.push(`event_attendees: ${err.message}`);
  }

  // ── Forum Posts ───────────────────────────────────────────────
  // Columns A–G: forumName, postId, authorEmail, authorName, title, body, timestamp
  try {
    const rows = await getValues("'Forum Posts'!A:G");
    const data = rows.slice(1)
      .filter(r => (r[1] || '').trim())
      .map(r => ({
        forum_name:   (r[0] || '').trim(),
        post_id:      (r[1] || '').trim(),
        author_email: (r[2] || '').trim().toLowerCase(),
        author_name:  r[3] || '',
        title:        r[4] || '',
        body:         r[5] || '',
        created_at:   r[6] || new Date().toISOString(),
      }));

    if (data.length) {
      for (let i = 0; i < data.length; i += 100) {
        await insert('forum_posts', data.slice(i, i + 100));
      }
    }
    results.forum_posts = data.length;
  } catch (err) {
    errors.push(`forum_posts: ${err.message}`);
  }

  // ── Forum Replies ─────────────────────────────────────────────
  // Columns A–G: postId, forumName, replyId, authorEmail, authorName, body, timestamp
  try {
    const rows = await getValues("'Forum Replies'!A:G");
    const data = rows.slice(1)
      .filter(r => (r[2] || '').trim())
      .map(r => ({
        post_id:      (r[0] || '').trim(),
        forum_name:   (r[1] || '').trim(),
        reply_id:     (r[2] || '').trim(),
        author_email: (r[3] || '').trim().toLowerCase(),
        author_name:  r[4] || '',
        body:         r[5] || '',
        created_at:   r[6] || new Date().toISOString(),
      }));

    if (data.length) {
      for (let i = 0; i < data.length; i += 100) {
        await insert('forum_replies', data.slice(i, i + 100));
      }
    }
    results.forum_replies = data.length;
  } catch (err) {
    errors.push(`forum_replies: ${err.message}`);
  }

  // ── Forum Memberships ─────────────────────────────────────────
  // Columns A–D: forumName, memberEmail, joinedAt, notify
  try {
    const rows = await getValues("'Forum Members'!A:D");
    const data = rows.slice(1)
      .filter(r => (r[0] || '').trim() && (r[1] || '').trim())
      .map(r => ({
        forum_name:   (r[0] || '').trim(),
        member_email: (r[1] || '').trim().toLowerCase(),
        joined_at:    r[2] || new Date().toISOString(),
        notify:       r[3] || 'yes',
      }));

    if (data.length) {
      for (let i = 0; i < data.length; i += 100) {
        await insert('forum_memberships', data.slice(i, i + 100));
      }
    }
    results.forum_memberships = data.length;
  } catch (err) {
    errors.push(`forum_memberships: ${err.message}`);
  }

  return res.status(errors.length ? 207 : 200).json({
    ok: errors.length === 0,
    migrated: results,
    errors: errors.length ? errors : undefined,
  });
}
