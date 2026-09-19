import test from 'node:test';
import assert from 'node:assert/strict';
import { createToken, verifyToken, readCookie } from '../lib/session.js';
import { consumeLogin, getSession, issueLogin, refreshSession } from '../lib/auth.js';
const secret = 'test-session-secret-at-least-32-characters';
process.env.SESSION_SECRET = secret;
process.env.SUPABASE_URL = 'https://database.example.org';

test('signed tokens must match purpose, audience and expiry; malformed input fails closed', async () => {
  const optout = await createToken({ email: 'member@example.org', purpose: 'forum-optout', exp: Date.now() + 60000 }, secret);
  assert.equal(await verifyToken(optout, secret), null);
  assert.equal(await verifyToken(optout, secret, 'login'), null);
  assert.ok(await verifyToken(optout, secret, 'forum-optout'));
  for (const payload of [{purpose:'session'}, {purpose:'session',exp:Date.now()-1}, {exp:Date.now()+60000}]) {
    assert.equal(await verifyToken(await createToken(payload, secret), secret), null);
  }
  assert.equal(await verifyToken(optout + '.extra', secret), null);
  assert.equal(readCookie('cnlc_session=%zz', 'cnlc_session'), null);
  const token = await createToken({ firstName: 'Óscar', purpose: 'session', exp: Date.now()+60000 }, secret);
  assert.equal((await verifyToken(token,secret)).firstName, 'Óscar');
});

test('login links are single-use and removed/revoked members lose access', async () => {
  const original = globalThis.fetch;
  let allowed = true, used = false, revoked = false, issued;
  globalThis.fetch = async (input, opts = {}) => {
    const url = new URL(input), method = opts.method || 'GET';
    let rows = [];
    if (url.pathname.endsWith('/alumni_allowlist')) rows = allowed ? [{first_name:'Test',last_name:'Member'}] : [];
    if (url.pathname.endsWith('/login_tokens') && method === 'PATCH') {
      if (!used) { used = true; rows = [{id:'test'}]; }
    }
    if (url.pathname.endsWith('/app_sessions')) {
      if (method === 'POST') { issued = JSON.parse(opts.body); rows = [issued]; }
      else rows = revoked ? [] : [{ ...issued, created_at: new Date().toISOString() }];
    }
    return new Response(JSON.stringify(rows));
  };
  try {
    const link = await issueLogin({email:'member@example.org',firstName:'Test',lastName:'Member'});
    const sessions = await Promise.all([consumeLogin(link), consumeLogin(link)]);
    assert.equal(sessions.filter(Boolean).length, 1);
    const session = sessions.find(Boolean);
    const cookie = `cnlc_session=${session.token}`;
    const active = await getSession(cookie);
    assert.ok(active);
    assert.ok(await refreshSession(active));
    allowed = false;
    assert.equal(await getSession(cookie), null);
    allowed = true; revoked = true;
    assert.equal(await getSession(cookie), null);
    assert.equal(await refreshSession(active), null);
  } finally { globalThis.fetch = original; }
});
