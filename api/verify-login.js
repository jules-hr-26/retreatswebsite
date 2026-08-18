import { createToken, verifyToken } from '../lib/session.js';

const SESSION_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 365 days

export default async function handler(req, res) {
  const { token } = req.query || {};

  const payload = token ? await verifyToken(token, process.env.SESSION_SECRET) : null;

  if (!payload || !payload.email) {
    res.writeHead(302, { Location: '/login.html?error=expired' });
    return res.end();
  }

  // Reject any token whose purpose is not 'login'.
  // Opt-out tokens, event tokens, etc. carry a different purpose and must not grant sessions.
  if (payload.purpose && payload.purpose !== 'login') {
    res.writeHead(302, { Location: '/login.html?error=expired' });
    return res.end();
  }

  const sessionToken = await createToken(
    { email: payload.email, firstName: payload.firstName, lastName: payload.lastName, exp: Date.now() + SESSION_TTL_MS },
    process.env.SESSION_SECRET
  );

  const maxAgeSeconds = Math.floor(SESSION_TTL_MS / 1000);
  res.writeHead(302, {
    'Set-Cookie': `cnlc_session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`,
    Location: '/platform.html',
  });
  res.end();
}
