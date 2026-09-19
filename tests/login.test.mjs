import test from 'node:test';
import assert from 'node:assert/strict';
import login from '../api/request-login.js';

test('test email configuration never bypasses inbox verification', async () => {
  process.env.ADMIN_TEST_EMAILS = 'admin@example.org';
  process.env.SESSION_SECRET = 'test-secret-that-is-at-least-32-characters';
  process.env.SUPABASE_URL = 'https://database.example.org';
  const original = globalThis.fetch;
  const sent = [];
  globalThis.fetch = async (url, options) => {
    if (url.includes('/rpc/consume_login_attempt')) return new Response('true');
    if (url.includes('/alumni_allowlist')) return new Response(JSON.stringify([{ email: 'admin@example.org', first_name: 'Admin' }]));
    if (url.includes('/login_tokens')) return new Response('[]');
    sent.push(JSON.parse(options.body));
    return new Response('{}');
  };
  try {
    const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
    await login({ method: 'POST', headers: { host: 'community.example.org' }, body: { email: 'admin@example.org' } }, res);
    assert.equal(res.code, 200);
    assert.deepEqual(res.body, { ok: true });
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, 'admin@example.org');
  } finally { globalThis.fetch = original; }
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
