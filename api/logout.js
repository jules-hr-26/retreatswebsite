import { revokeSession, sessionCookie } from '../lib/auth.js';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'method not allowed' });
  try {
    await revokeSession(req.headers.cookie);
  } catch { return res.status(503).json({ error: 'Could not complete sign-out. Please retry.' }); }
  res.writeHead(302, { 'Set-Cookie': sessionCookie('', 0), Location: '/login.html' });
  res.end();
}
