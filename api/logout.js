export default async function handler(req, res) {
  res.writeHead(302, {
    'Set-Cookie': 'cnlc_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
    Location: '/login.html',
  });
  res.end();
}
