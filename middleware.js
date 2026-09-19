import { getSession } from './lib/auth.js';
export const config = { matcher: ['/platform.html', '/admin.html'] };
export default async function middleware(request) {
  const payload = await getSession(request.headers.get('cookie'));
  if (!payload) return Response.redirect(new URL('/login.html', request.url), 302);
}
