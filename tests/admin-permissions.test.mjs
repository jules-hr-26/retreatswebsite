import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/admin.js';
import { createToken } from '../lib/session.js';

const actorEmail = 'actor@example.invalid';
const targetEmail = 'target@example.invalid';
const protectedEmail = 'protected-admin@example.invalid';
const reads = ['me', 'stats', 'members', 'allowlist', 'events', 'proposed', 'offerings', 'forum', 'forum-memberships'];
const restricted = [
  ['GET', 'export-allowlist'], ['GET', 'admins'],
  ...['export-member', 'delete-member', 'gdpr-erase-member', 'add-admin', 'update-admin', 'remove-admin'].map(a => ['POST', a]),
];

async function setup(t, role = 'admin') {
  process.env.SESSION_SECRET = 'admin-permissions-test-secret';
  process.env.SUPABASE_URL = 'https://admin-tests.invalid';
  const tables = {
    admins: [
      ...(role ? [{ email: actorEmail, role }] : []),
      { email: protectedEmail, role: 'super_admin' },
    ],
    alumni_allowlist: [
      { id: 'actor', email: actorEmail, first_name: 'Actor', last_name: 'Test' },
      { id: 'target', email: targetEmail, first_name: 'Target', last_name: 'Test' },
      { id: 'protected', email: protectedEmail, first_name: 'Protected', last_name: 'Admin' },
    ],
    app_sessions: [{ id: 'actor-session', email: actorEmail, created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 60000).toISOString() }],
    login_tokens: [],
    members: [{ auth_email: targetEmail, first_name: 'Target', last_name: 'Test' }],
    events: [{ id: 'event', name: 'Test event', start_date: '2026-10-10' }],
    proposed_events: [{ id: 'proposal', title: 'Proposed event', date: '2026-10-10', description: 'Test' }],
    offerings: [{ id: 'offer', email: targetEmail, title: 'Test offer' }],
    forum_posts: [{ post_id: 'post', author_email: targetEmail, title: 'Test post' }],
    forum_replies: [{ reply_id: 'reply', post_id: 'post', author_email: targetEmail }],
    forum_memberships: [], event_attendees: [],
  };
  const requests = [], emails = [];
  const store = { tables, requests, emails, fail: () => false };
  t.mock.method(globalThis, 'fetch', async (input, options = {}) => {
    const url = new URL(input);
    if (url.href === 'https://api.resend.com/emails') {
      emails.push(JSON.parse(options.body));
      return new Response('{}'); // Capture invitations locally; never send them.
    }
    assert.equal(url.origin, process.env.SUPABASE_URL, 'no external database requests');
    const table = url.pathname.split('/').at(-1), method = options.method || 'GET';
    const request = { table, method, filters: Object.fromEntries(url.searchParams) };
    requests.push(request);
    if (store.fail(request)) return new Response('unavailable', { status: 503 });
    const rows = tables[table] ||= [];
    const matches = row => [...url.searchParams].every(([key, filter]) => {
      if (['order', 'select', 'limit', 'on_conflict'].includes(key)) return true;
      const dot = filter.indexOf('.'), op = filter.slice(0, dot), value = filter.slice(dot + 1);
      if (op === 'is') return value === 'null' && row[key] == null;
      if (op === 'gt') return Date.parse(row[key]) > Date.parse(value);
      if (op === 'neq') return row[key] !== value;
      assert.equal(op, 'eq');
      return row[key] === value;
    });
    let result = rows.filter(matches);
    if (method === 'POST') {
      const data = JSON.parse(options.body), key = url.searchParams.get('on_conflict');
      const existing = key && rows.find(r => r[key] === data[key]);
      if (existing) { Object.assign(existing, data); result = [existing]; }
      else { rows.push({ ...data }); result = [rows.at(-1)]; }
    } else if (method === 'PATCH') result.forEach(row => Object.assign(row, JSON.parse(options.body)));
    else if (method === 'DELETE') {
      tables[table] = rows.filter(row => !matches(row));
      return new Response(null, { status: 204 });
    }
    return new Response(JSON.stringify(result));
  });
  // Even a signed stale role claim must never override the database role.
  const token = await createToken({ purpose: 'session', sid: 'actor-session', email: actorEmail, role: 'super_admin', exp: Date.now() + 60000 }, process.env.SESSION_SECRET);
  store.call = async (method, action, body = {}, cookie = 'cnlc_session=' + token) => {
    const res = { code: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
    await handler({ method, headers: { cookie, host: 'app.example.invalid' }, query: { action }, body: { action, ...body } }, res);
    return res;
  };
  return store;
}

test('ordinary admins cannot export, erase members, or manage administrators through direct API calls', async t => {
  const { tables, requests, emails, call } = await setup(t);
  const before = structuredClone(tables);
  for (const [method, action] of restricted) {
    requests.length = 0;
    const res = await call(method, action, { email: targetEmail, role: 'super_admin' });
    assert.equal(res.code, 403, action);
    assert.deepEqual(res.body, { error: 'super_admin required' });
    assert.ok(requests.every(r => r.method === 'GET' && ['app_sessions', 'alumni_allowlist', 'admins'].includes(r.table)), 'denied before sensitive data reads or writes');
  }
  assert.deepEqual(tables, before);
  assert.equal(emails.length, 0);
});

test('anonymous users, members and unrecognized admin roles cannot access any admin action', async t => {
  const store = await setup(t, null);
  for (const role of [null, 'viewer', 'SUPER_ADMIN']) {
    if (role) store.tables.admins.push({ email: actorEmail, role });
    for (const [method, action] of [...reads.map(a => ['GET', a]), ...restricted]) {
      assert.equal((await store.call(method, action, { email: targetEmail })).code, 401, `${role}: ${action}`);
    }
    store.tables.admins = store.tables.admins.filter(row => row.email !== actorEmail);
  }
  store.requests.length = 0;
  assert.equal((await store.call('GET', 'members', {}, '')).code, 401);
  assert.equal(store.requests.length, 0);
  assert.equal(store.emails.length, 0);
});

test('routine administration stays available to ordinary admins', async t => {
  const { call } = await setup(t);
  for (const action of reads) assert.equal((await call('GET', action)).code, 200, action);
  for (const [action, body] of [
    ['add-allowlist', { email: 'new@example.invalid', firstName: 'New', lastName: 'Member' }],
    ['bulk-add-allowlist', { rows: [{ email: 'bulk@example.invalid', firstName: 'Bulk', lastName: 'Member' }] }],
    ['update-allowlist', { id: 'target', email: 'updated@example.invalid', firstName: 'Updated' }],
    ['remove-allowlist', { email: 'updated@example.invalid' }],
    ['add-event', { name: 'New event', startDate: '2026-10-11' }],
    ['update-event', { id: 'event', name: 'Updated event', startDate: '2026-10-11' }],
    ['delete-event', { id: 'event' }], ['approve-proposed', { id: 'proposal' }],
    ['reject-proposed', { id: 'proposal' }], ['delete-offering', { id: 'offer' }],
    ['delete-reply', { replyId: 'reply' }], ['delete-post', { postId: 'post' }],
  ]) assert.equal((await call('POST', action, body)).code, 200, action);
});

test('super administrators can use every restricted operation', async t => {
  const { call, emails } = await setup(t, 'super_admin');
  for (const [method, action] of restricted) {
    const res = await call(method, action, { email: targetEmail, name: 'Test admin', role: 'admin' });
    assert.equal(res.code, 200, action);
    if (action === 'export-member') assert.equal(res.body.profile.auth_email, targetEmail);
    if (action === 'export-allowlist') assert.match(res.body.csv, /target@example.invalid/);
  }
  assert.equal(emails.length, 1, 'the invitation was captured by the local stub');
});

test('allowlist edits cannot remove or replace an administrator login address', async t => {
  const { tables, requests, call } = await setup(t);
  const before = structuredClone(tables);
  for (const body of [
    { id: 'protected', email: 'replacement@example.invalid' },
    { id: 'target', email: protectedEmail },
  ]) {
    assert.equal((await call('POST', 'update-allowlist', body)).code, 409);
  }
  assert.equal((await call('POST', 'remove-allowlist', { email: protectedEmail })).code, 409);
  assert.ok(requests.every(r => r.method === 'GET'), 'blocked changes must not revoke sessions or modify records');
  assert.deepEqual(tables, before);
});

test('failed target-admin checks block membership changes before any writes', async t => {
  const store = await setup(t);
  store.fail = r => r.table === 'admins' && r.filters.email !== 'eq.' + actorEmail;
  const before = structuredClone(store.tables);
  for (const [action, body] of [
    ['remove-allowlist', { email: protectedEmail }],
    ['update-allowlist', { id: 'protected', email: 'replacement@example.invalid' }],
    ['update-allowlist', { id: 'target', email: 'replacement@example.invalid' }],
  ]) assert.equal((await store.call('POST', action, body)).code, 503);
  assert.ok(store.requests.every(r => r.method === 'GET'));
  assert.deepEqual(store.tables, before);
});

test('role changes and removal take effect on the next request with the same cookie', async t => {
  const store = await setup(t, 'super_admin');
  assert.equal((await store.call('GET', 'admins')).code, 200);
  store.tables.admins.find(r => r.email === actorEmail).role = 'admin';
  assert.equal((await store.call('GET', 'admins')).code, 403);
  assert.equal((await store.call('GET', 'events')).code, 200);
  store.tables.admins = store.tables.admins.filter(r => r.email !== actorEmail);
  assert.equal((await store.call('GET', 'events')).code, 401);
});

test('unknown actions, wrong methods, and unavailable actor permissions never authorize writes', async t => {
  const store = await setup(t, 'super_admin');
  for (const action of ['future-dangerous-action', '__proto__', 'constructor', ['delete-member']]) {
    assert.equal((await store.call('POST', action)).code, 400);
  }
  assert.equal((await store.call('DELETE', 'delete-member', { email: targetEmail })).code, 405);
  store.fail = r => r.table === 'admins';
  assert.equal((await store.call('POST', 'delete-member', { email: targetEmail })).code, 401);
  assert.ok(store.requests.every(r => r.method === 'GET'));
});
