import { select, insert, update, upsert } from './_lib/supabase.js';
import { readCookie, verifyToken, createToken } from '../lib/session.js';

const FORUMS = [
  { name: 'BIPOC Sangha', description: 'A space for Black, Indigenous and people of color practitioners to gather, share, and support one another.' },
];

function esc(s) {
  return String(s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const { action } = req.query || {};

  // ── GET: forum list ──────────────────────────────────────────────
  if (req.method === 'GET' && action === 'forums') {
    try {
      const memberRows = await select('forum_memberships').catch(() => []);
      const counts = {};
      FORUMS.forEach(f => { counts[f.name] = 0; });
      memberRows.forEach(r => {
        if (counts[r.forum_name] !== undefined && r.notify !== 'left') counts[r.forum_name]++;
      });
      return res.status(200).json({
        forums: FORUMS.map(f => ({ ...f, memberCount: counts[f.name] || 0 })),
      });
    } catch (err) {
      console.error('[forum] forums error', err.message);
      return res.status(500).json({ error: 'could not load forums' });
    }
  }

  // ── GET: posts for a forum ───────────────────────────────────────
  if (req.method === 'GET' && action === 'posts') {
    const forum = (req.query.forum || '').trim();
    if (!forum) return res.status(400).json({ error: 'forum required' });

    const session = await verifyToken(
      readCookie(req.headers.cookie, 'cnlc_session'),
      process.env.SESSION_SECRET
    ).catch(() => null);
    const myEmail = session?.email || null;

    try {
      const [postRows, replyRows, memberRows] = await Promise.all([
        select('forum_posts', { forum_name: forum }, { order: 'created_at.desc' }).catch(() => []),
        select('forum_replies', { forum_name: forum }).catch(() => []),
        select('forum_memberships', { forum_name: forum }).catch(() => []),
      ]);

      const isMember = myEmail && memberRows.some(r =>
        r.member_email === myEmail && r.notify !== 'left'
      );

      const repliesByPost = {};
      replyRows.forEach(r => {
        if (!repliesByPost[r.post_id]) repliesByPost[r.post_id] = [];
        repliesByPost[r.post_id].push({
          replyId:    r.reply_id,
          authorName: r.author_name,
          body:       r.body,
          timestamp:  r.created_at,
        });
      });

      const posts = postRows.map(r => ({
        postId:     r.post_id,
        authorName: r.author_name,
        title:      r.title,
        body:       r.body,
        timestamp:  r.created_at,
        replies:    repliesByPost[r.post_id] || [],
      }));

      return res.status(200).json({ posts, isMember: !!isMember });
    } catch (err) {
      console.error('[forum] posts error', err.message);
      return res.status(500).json({ error: 'could not load posts' });
    }
  }

  // ── GET: one-click opt-out ───────────────────────────────────────
  if (req.method === 'GET' && action === 'optout') {
    try {
      const payload = req.query.token
        ? await verifyToken(req.query.token, process.env.SESSION_SECRET)
        : null;
      if (payload?.purpose === 'forum-optout') {
        await update('forum_memberships',
          { forum_name: payload.forum, member_email: payload.email },
          { notify: 'no' }
        );
      }
    } catch (err) {
      console.error('[forum] optout error', err.message);
    }
    res.writeHead(302, { Location: '/platform.html?tab=bulletin&msg=unsubscribed' });
    return res.end();
  }

  // ── All POST actions require auth ────────────────────────────────
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const session = await verifyToken(
    readCookie(req.headers.cookie, 'cnlc_session'),
    process.env.SESSION_SECRET
  );
  if (!session?.email) return res.status(401).json({ error: 'not signed in' });

  const body = req.body || {};
  const { action: bodyAction } = body;
  const host   = req.headers['x-forwarded-host'] || req.headers.host;
  const myName = `${session.firstName || ''} ${session.lastName || ''}`.trim() || session.email;

  // ── Join ─────────────────────────────────────────────────────────
  if (bodyAction === 'join') {
    const { forum } = body;
    if (!forum) return res.status(400).json({ error: 'forum required' });
    await upsert('forum_memberships', { forum_name: forum, member_email: session.email, notify: 'yes' }, 'forum_name,member_email');
    return res.status(200).json({ ok: true });
  }

  // ── Leave ────────────────────────────────────────────────────────
  if (bodyAction === 'leave') {
    const { forum } = body;
    if (!forum) return res.status(400).json({ error: 'forum required' });
    await update('forum_memberships', { forum_name: forum, member_email: session.email }, { notify: 'left' });
    return res.status(200).json({ ok: true });
  }

  // ── New post ─────────────────────────────────────────────────────
  if (bodyAction === 'post') {
    const { forum, title, body: postBody } = body;
    if (!forum || !title || !postBody) {
      return res.status(400).json({ error: 'forum, title and body required' });
    }
    const memberRows = await select('forum_memberships', { forum_name: forum, member_email: session.email }).catch(() => []);
    const isActive = memberRows.some(r => r.notify !== 'left');
    if (!isActive) return res.status(403).json({ error: 'join this forum to post' });

    const postId    = String(Date.now());
    const timestamp = new Date().toISOString();
    await insert('forum_posts', {
      post_id: postId, forum_name: forum, author_email: session.email,
      author_name: myName, title: String(title).trim(), body: String(postBody).trim(),
      created_at: timestamp,
    });
    notifyForumMembers({ forum, subject: `New post in ${forum}: ${title}`, authorName: myName, content: postBody, host, myEmail: session.email })
      .catch(err => console.error('[forum] notify post error', err.message));
    return res.status(200).json({ ok: true, postId });
  }

  // ── Reply ────────────────────────────────────────────────────────
  if (bodyAction === 'reply') {
    const { forum, postId, body: replyBody } = body;
    if (!forum || !postId || !replyBody) {
      return res.status(400).json({ error: 'forum, postId and body required' });
    }
    const memberRows = await select('forum_memberships', { forum_name: forum, member_email: session.email }).catch(() => []);
    const isActive = memberRows.some(r => r.notify !== 'left');
    if (!isActive) return res.status(403).json({ error: 'join this forum to reply' });

    const replyId   = String(Date.now());
    const timestamp = new Date().toISOString();
    await insert('forum_replies', {
      reply_id: replyId, post_id: postId, forum_name: forum,
      author_email: session.email, author_name: myName,
      body: String(replyBody).trim(), created_at: timestamp,
    });

    let postTitle = forum;
    try {
      const postRows = await select('forum_posts', { post_id: postId });
      if (postRows.length) postTitle = postRows[0].title || forum;
    } catch (e) { /* ignore */ }

    notifyForumMembers({ forum, subject: `New reply in ${forum}: ${postTitle}`, authorName: myName, content: replyBody, host, myEmail: session.email })
      .catch(err => console.error('[forum] notify reply error', err.message));
    return res.status(200).json({ ok: true, replyId });
  }

  // ── Propose forum (email only, no DB write needed) ───────────────
  if (bodyAction === 'propose') {
    const { name, purpose, description } = body;
    if (!name || !purpose) return res.status(400).json({ error: 'name and purpose required' });
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'CNLC Platform <onboarding@resend.dev>',
        to:   'julia@globaloptimism.com',
        subject: `Forum proposal: ${name}`,
        html: `
          <p><strong>${esc(myName)}</strong> is proposing a new forum:</p>
          <p><strong>Name:</strong> ${esc(name)}</p>
          <p><strong>Purpose:</strong> ${esc(purpose)}</p>
          ${description ? `<p><strong>Description:</strong> ${esc(description)}</p>` : ''}
        `,
      }),
    }).catch(err => console.error('[forum] propose email error', err.message));
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: 'unknown action' });
}

async function notifyForumMembers({ forum, subject, authorName, content, host, myEmail }) {
  const memberRows = await select('forum_memberships', { forum_name: forum }).catch(() => []);
  const toNotify = memberRows.filter(r => r.member_email !== myEmail && r.notify === 'yes');
  if (!toNotify.length) return;

  const platformLink = `https://${host}/platform.html?tab=bulletin`;

  await Promise.all(toNotify.map(async r => {
    const memberEmail = r.member_email;
    const optoutToken = await createToken(
      { email: memberEmail, forum, purpose: 'forum-optout', exp: Date.now() + 365 * 24 * 60 * 60 * 1000 },
      process.env.SESSION_SECRET
    );
    const optoutLink = `https://${host}/api/bulletin?action=optout&token=${optoutToken}`;

    return fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'CNLC Platform <onboarding@resend.dev>',
        to:   memberEmail,
        subject,
        html: `
          <p><strong>${esc(authorName)}</strong> posted in the <strong>${esc(forum)}</strong> forum:</p>
          <blockquote style="border-left:3px solid #ccc;margin-left:0;padding-left:16px;color:#555;">
            ${esc(content).replace(/\n/g, '<br>')}
          </blockquote>
          <p><a href="${platformLink}">Open Forum →</a></p>
          <p style="margin-top:32px;font-size:12px;color:#999;">
            You're receiving this because you joined the ${esc(forum)} forum.<br>
            <a href="${optoutLink}" style="color:#999;">Stop notifications for this forum</a>
          </p>
        `,
      }),
    }).catch(err => console.error('[forum] notify send error', memberEmail, err.message));
  }));
}
