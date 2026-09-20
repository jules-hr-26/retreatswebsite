import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createToken, verifyToken } from '../lib/session.js';
import { getSession, issueLogin, consumeLogin, refreshSession } from '../lib/auth.js';
import logout from '../api/logout.js';
import verifyLogin from '../api/verify-login.js';
import refresh from '../api/refresh-session.js';
import profile from '../api/get-profile.js';
import admin from '../api/admin.js';

const secret = 'session-lifecycle-test-only-secret';
const email = 'member@example.org';
const day = 24 * 60 * 60 * 1000;

function setup(t) {
  process.env.SESSION_SECRET = secret;
  process.env.SUPABASE_URL = 'https://auth-tests.invalid';
  const tables = {
    alumni_allowlist: [{ id: 'member', email }, { id: 'admin', email: 'admin@example.org' }],
    admins: [{ email: 'admin@example.org', role: 'super_admin' }],
    app_sessions: [], login_tokens: [], members: [],
  };
  const calls = [];
  const store = { tables, calls, fail: () => false };
  t.mock.method(globalThis, 'fetch', async (input, options = {}) => {
    const url = new URL(input);
    assert.equal(url.origin, process.env.SUPABASE_URL, 'no real database or email calls');
    const table = url.pathname.split('/').at(-1);
    const method = options.method || 'GET';
    calls.push({ table, method, filters: Object.fromEntries(url.searchParams) });
    if (store.fail(table, method)) return new Response('unavailable', { status: 503 });
    const rows = tables[table] ||= [];
    const matches = row => [...url.searchParams].every(([key, filter]) => {
      if (['select', 'order', 'limit'].includes(key)) return true;
      const dot = filter.indexOf('.'), op = filter.slice(0, dot), value = filter.slice(dot + 1);
      if (op === 'is') return value === 'null' && row[key] == null;
      if (op === 'gt') return Date.parse(row[key]) > Date.parse(value);
      assert.equal(op, 'eq');
      return row[key] === value;
    });
    let result = rows.filter(matches);
    if (method === 'POST') {
      result = [{ created_at: new Date().toISOString(), ...JSON.parse(options.body) }];
      rows.push(...result);
    } else if (method === 'PATCH') {
      result.forEach(row => Object.assign(row, JSON.parse(options.body)));
    } else if (method === 'DELETE') {
      tables[table] = rows.filter(row => !matches(row));
      return new Response(null, { status: 204 });
    }
    return new Response(JSON.stringify(result));
  });
  store.signIn = async (address = email) => consumeLogin(await issueLogin({ email: address }));
  return store;
}

async function call(handler, { cookie, method = 'GET', body, query = {} } = {}) {
  const res = {
    code: 200, headers: {},
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; },
    writeHead(code, headers) { this.code = code; for (const [k, v] of Object.entries(headers)) this.setHeader(k, v); },
    end() {},
  };
  await handler({ method, headers: { cookie }, body, query }, res);
  return res;
}
const cookieFor = session => 'cnlc_session=' + session.token;

test('unsubscribe tokens cannot become sessions, login links, or refreshed cookies', async t => {
  const { calls } = setup(t);
  for (const purpose of ['event-optout', 'forum-optout']) {
    const token = await createToken({ email, sid: 'forged-session', jti: 'forged-login', purpose, exp: Date.now() + day }, secret);
    const cookie = 'cnlc_session=' + token;
    assert.equal(await getSession(cookie), null);
    assert.equal((await call(profile, { cookie })).code, 401);
    const renewed = await call(refresh, { cookie, method: 'POST' });
    assert.equal(renewed.code, 401);
    assert.equal(renewed.headers['set-cookie'], undefined);
    const login = await call(verifyLogin, { query: { token } });
    assert.equal(login.headers.location, '/login.html?error=expired');
    assert.equal(login.headers['set-cookie'], undefined);
  }
  assert.equal(calls.length, 0, 'wrong-purpose tokens are rejected before database access');
});

test('validly signed tokens for another audience and legacy untyped tokens are rejected', async () => {
  for (const payload of [
    { email, purpose: 'session', aud: 'another-app', exp: Date.now() + day },
    { email, exp: Date.now() + day },
  ]) {
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = createHmac('sha256', secret).update(data).digest('base64url');
    assert.equal(await verifyToken(data + '.' + signature, secret, 'session'), null);
  }
});

test('login links expire after 15 minutes, can be consumed only once, and set secure session cookies', async t => {
  const { tables } = setup(t);
  const before = Date.now();
  const token = await issueLogin({ email });
  const payload = await verifyToken(token, secret, 'login');
  assert.ok(payload.exp >= before + 15 * 60000 && payload.exp <= Date.now() + 15 * 60000);
  const results = await Promise.all([call(verifyLogin, { query: { token } }), call(verifyLogin, { query: { token } })]);
  assert.equal(results.filter(res => res.headers.location === '/platform.html').length, 1);
  assert.equal(tables.app_sessions.length, 1);
  const cookie = results.find(res => res.headers['set-cookie']).headers['set-cookie'];
  for (const flag of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/']) assert.ok(cookie.includes(flag));
  const maxAge = Number(cookie.match(/Max-Age=(\d+)/)[1]);
  assert.ok(maxAge > 604790 && maxAge <= 604800, 'sessions last at most seven days');
  const expired = await issueLogin({ email });
  tables.login_tokens.at(-1).expires_at = new Date(Date.now() - 1).toISOString();
  assert.equal(await consumeLogin(expired), null);
});

test('refresh cannot extend the thirty-day session limit or restore an expired session', async t => {
  const { tables, signIn } = setup(t);
  const session = await signIn();
  const row = tables.app_sessions[0];
  row.created_at = new Date(Date.now() - 29 * day).toISOString();
  const active = await getSession(cookieFor(session));
  const refreshed = await refreshSession(active);
  assert.equal(refreshed.exp, Date.parse(row.created_at) + 30 * day);
  row.created_at = new Date(Date.now() - 31 * day).toISOString();
  assert.equal(await getSession(cookieFor(session)), null);
  assert.equal(await refreshSession({ ...active, createdAt: row.created_at }), null);
  row.created_at = new Date().toISOString();
  row.expires_at = new Date(Date.now() - 1).toISOString();
  assert.equal(await getSession(cookieFor(session)), null);
  assert.equal(await refreshSession(active), null);
});

test('logout reports storage failure without discarding the cookie, then revokes it on retry', async t => {
  const store = setup(t);
  const session = await store.signIn();
  const cookie = cookieFor(session);
  store.fail = () => true;
  const failed = await call(logout, { cookie, method: 'POST' });
  assert.equal(failed.code, 503);
  assert.equal(failed.headers['set-cookie'], undefined);
  assert.equal(failed.headers.location, undefined);
  store.fail = () => false;
  assert.ok(await getSession(cookie));
  const retried = await call(logout, { cookie, method: 'POST' });
  assert.equal(retried.code, 302);
  assert.match(retried.headers['set-cookie'], /Max-Age=0/);
  assert.equal(await getSession(cookie), null);
  assert.equal((await call(refresh, { cookie, method: 'POST' })).code, 401);
});

test('logout revokes only the current session and does not depend on allowlist availability', async t => {
  const store = setup(t);
  const current = await store.signIn(), other = await store.signIn();
  store.fail = table => table === 'alumni_allowlist';
  const result = await call(logout, { cookie: cookieFor(current) });
  assert.equal(result.code, 302);
  store.fail = () => false;
  assert.equal(await getSession(cookieFor(current)), null);
  assert.ok(await getSession(cookieFor(other)));
});

test('changing an allowed email revokes old sessions and pending links even if the address is added back', async t => {
  const { tables, signIn } = setup(t);
  const member = await signIn(), administrator = await signIn('admin@example.org');
  const pendingLink = await issueLogin({ email });
  const result = await call(admin, {
    cookie: cookieFor(administrator), method: 'POST',
    body: { action: 'update-allowlist', id: 'member', email: 'new@example.org', firstName: 'Updated', lastName: 'Member' },
  });
  assert.equal(result.code, 200);
  tables.alumni_allowlist.push({ id: 're-added', email });
  assert.equal(await getSession(cookieFor(member)), null);
  assert.equal(await consumeLogin(pendingLink), null);
  assert.ok(await getSession(cookieFor(administrator)));
  assert.ok(await signIn('new@example.org'), 'the new address can complete normal inbox-based sign-in');
});

test('editing names keeps sessions active; removing allowlist membership permanently revokes existing access', async t => {
  const { tables, signIn } = setup(t);
  const member = await signIn(), administrator = await signIn('admin@example.org');
  const cookie = cookieFor(administrator);
  assert.equal((await call(admin, { cookie, method: 'POST', body: {
    action: 'update-allowlist', id: 'member', email, firstName: 'Updated', lastName: 'Member',
  } })).code, 200);
  assert.ok(await getSession(cookieFor(member)));
  const pendingLink = await issueLogin({ email });
  assert.equal((await call(admin, { cookie, method: 'POST', body: { action: 'remove-allowlist', email } })).code, 200);
  assert.equal(await getSession(cookieFor(member)), null);
  tables.alumni_allowlist.push({ id: 're-added', email });
  assert.equal(await getSession(cookieFor(member)), null);
  assert.equal(await consumeLogin(pendingLink), null);
});
