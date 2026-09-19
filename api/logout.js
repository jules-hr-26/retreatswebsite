import { getSession, sessionCookie } from '../lib/auth.js';
import { update } from './_lib/supabase.js';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'method not allowed' });
  const session = await getSession(req.headers.cookie);
  try {
    if (session) await update('app_sessions', { id: session.sid }, { revoked_at: new Date().toISOString() });
  } catch { return res.status(503).json({ error: 'Could not complete sign-out. Please retry.' }); }
  res.writeHead(302, { 'Set-Cookie': sessionCookie('', 0), Location: '/login.html' });
  res.end();
}
