import test from 'node:test';
import assert from 'node:assert/strict';
import login from '../api/request-login.js';
import { verifyToken } from '../lib/session.js';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('test email configuration never bypasses inbox verification', async () => {
  process.env.ADMIN_TEST_EMAILS = 'admin@example.org';
  process.env.SESSION_SECRET = 'test-secret-that-is-at-least-32-characters';
  process.env.SUPABASE_URL = 'https://database.example.org';
  const original = globalThis.fetch;
  const sent = [];
  const writes = [];
  globalThis.fetch = async (url, options) => {
    if (url.includes('/rpc/consume_login_attempt')) return new Response('true');
    if (url.includes('/alumni_allowlist')) return new Response(JSON.stringify([{ email: 'admin@example.org', first_name: 'Admin' }]));
    if (options.method === 'POST' && url.startsWith(process.env.SUPABASE_URL)) {
      writes.push(new URL(url).pathname);
      return new Response('[]');
    }
    if (url === 'https://api.resend.com/emails') sent.push(JSON.parse(options.body));
    return new Response('{}');
  };
  try {
    const headers = {};
    const res = { setHeader(k, v) { headers[k.toLowerCase()] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
    await login({ method: 'POST', headers: { host: 'community.example.org' }, body: { email: ' ADMIN@EXAMPLE.ORG ' } }, res);
    assert.equal(res.code, 200);
    assert.deepEqual(res.body, { ok: true });
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, 'admin@example.org');
    assert.deepEqual(writes, ['/rest/v1/login_tokens'], 'requesting a link must not create a signed-in session');
    assert.equal(headers['set-cookie'], undefined);
    const emailedLink = new URL(sent[0].html.match(/href="([^"]+)"/)[1]);
    const token = emailedLink.searchParams.get('token');
    assert.ok(await verifyToken(token, process.env.SESSION_SECRET, 'login'));
    assert.equal(await verifyToken(token, process.env.SESSION_SECRET, 'session'), null);
  } finally { globalThis.fetch = original; }
});

test('an unlisted test email cannot create a login link or session', async () => {
  process.env.ADMIN_TEST_EMAILS = 'outsider@example.org';
  process.env.SESSION_SECRET = 'test-secret-that-is-at-least-32-characters';
  process.env.SUPABASE_URL = 'https://database.example.org';
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(new URL(url).pathname);
    if (url.endsWith('/rpc/consume_login_attempt')) return new Response('true');
    return new Response('[]');
  };
  try {
    const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
    await login({ method: 'POST', headers: {}, body: { email: 'outsider@example.org' } }, res);
    assert.equal(res.code, 200);
    assert.deepEqual(res.body, { ok: true });
    assert.deepEqual(calls, ['/rest/v1/rpc/consume_login_attempt', '/rest/v1/alumni_allowlist']);
  } finally { globalThis.fetch = original; }
});

test('login UI never follows a legacy direct-login redirect response', async () => {
  const elements = {};
  const element = id => elements[id] ||= {
    value: 'admin@example.org', style: {}, innerHTML: '',
    classList: { toggle() {}, remove() {}, add() {} },
    addEventListener() {}, focus() {},
  };
  const location = { search: '', href: '/login.html' };
  const context = vm.createContext({
    URLSearchParams, window: { location },
    document: { getElementById: element, querySelector: element },
    fetch: async () => new Response(JSON.stringify({ ok: true, redirect: '/api/verify-login?token=legacy-shortcut' })),
  });
  vm.runInContext(readFileSync('assets/login.js', 'utf8'), context);
  await context.submitLogin();
  assert.equal(location.href, '/login.html');
  assert.match(elements['login-form'].innerHTML, /check your inbox/);
});

test('limited requests never look up members or send email and do not store raw identifiers', async () => {
  process.env.SESSION_SECRET = 'test-secret-that-is-at-least-32-characters';
  process.env.SUPABASE_URL = 'https://database.example.org';
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, opts) => {
    calls.push(url);
    assert.ok(url.endsWith('/rpc/consume_login_attempt'));
    const keys = JSON.parse(opts.body);
    assert.match(keys.email_key,/^[a-f0-9]{64}$/);
    assert.match(keys.source_key,/^[a-f0-9]{64}$/);
    assert.ok(!opts.body.includes('example.org'));
    return new Response('false');
  };
  try {
    const res = {status(code){this.code=code;return this;},json(body){this.body=body;}};
    await login({method:'POST',headers:{},body:{email:'member@example.org'},socket:{remoteAddress:'192.0.2.1'}},res);
    assert.equal(res.code,200);
    assert.deepEqual(res.body,{ok:true});
    assert.equal(calls.length,1);
  } finally { globalThis.fetch=original; }
});
