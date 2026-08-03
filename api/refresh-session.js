import { readCookie, verifyToken, createToken } from '../lib/session.js';

const SESSION_TTL_MS = 365 * 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  const sessionToken = readCookie(req.headers.cookie, 'cnlc_session');
  const payload = sessionToken ? await verifyToken(sessionToken, process.env.SESSION_SECRET) : null;

  if (!payload || !payload.email) {
    return res.status(401).json({ ok: false });
  }

  const refreshed = await createToken(
    { email: payload.email, firstName: payload.firstName, lastName: payload.lastName, exp: Date.now() + SESSION_TTL_MS },
    process.env.SESSION_SECRET,
  );
  const maxAgeSeconds = Math.floor(SESSION_TTL_MS / 1000);
  res.setHeader('Set-Cookie', `cnlc_session=${refreshed}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`);
  return res.status(200).json({ ok: true });
}
