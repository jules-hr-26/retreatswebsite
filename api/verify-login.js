import { consumeLogin, sessionCookie } from '../lib/auth.js';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET required' });
  try {
    const session = await consumeLogin(req.query?.token);
    if (session) {
      res.writeHead(302, { 'Set-Cookie': sessionCookie(session.token, session.exp), Location: '/platform.html' });
      return res.end();
    }
  } catch (err) { console.error('[verify-login] sign-in failed'); }
  res.writeHead(302, { Location: '/login.html?error=expired' });
  res.end();
}
