import { getSession, refreshSession, sessionCookie } from '../lib/auth.js';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  const session = await getSession(req.headers.cookie);
  if (!session) return res.status(401).json({ ok: false });
  try {
    const refreshed = await refreshSession(session);
    if (!refreshed) return res.status(401).json({ ok: false });
    res.setHeader('Set-Cookie', sessionCookie(refreshed.token, refreshed.exp));
    return res.status(200).json({ ok: true });
  } catch { return res.status(503).json({ error: 'Session refresh unavailable' }); }
}
