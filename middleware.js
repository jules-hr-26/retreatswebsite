import { readCookie, verifyToken } from './lib/session.js';

export const config = {
  matcher: ['/platform.html'],
};

export default async function middleware(request) {
  const cookieHeader = request.headers.get('cookie');
  const sessionToken = readCookie(cookieHeader, 'cnlc_session');
  const payload = sessionToken ? await verifyToken(sessionToken, process.env.SESSION_SECRET) : null;

  if (!payload || !payload.email) {
    return Response.redirect(new URL('/login.html', request.url), 302);
  }
}
