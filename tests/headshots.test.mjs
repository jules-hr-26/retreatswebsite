import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import profile from '../api/get-profile.js';
import directory from '../api/list-directory.js';
import events from '../api/events.js';
import saveProfile from '../api/register-profile.js';
import { createToken } from '../lib/session.js';

const jpeg = readFileSync('tests/fixtures/headshot.jpg').toString('base64');
const hostile = '\"><img src=x onerror=alert(1)>';
const invalid = [hostile, Buffer.from('<svg onload="alert(1)"/>').toString('base64'), 'A'.repeat(180004)];

async function setup(t, headshot) {
  process.env.SESSION_SECRET = 'headshot-test-secret';
  process.env.SUPABASE_URL = 'https://database.example.org';
  const email = 'member@example.org';
  const member = { auth_email: email, first_name: 'Member', last_name: 'Test', headshot_data: headshot, in_directory: true };
  const writes = [];
  const tables = {
    members: [member], app_sessions: [{ created_at: new Date().toISOString() }],
    alumni_allowlist: [{ email, first_name: 'Member' }],
    events: [{ name: 'Test event' }], event_attendees: [{ member_email: email, event_name: 'Test event', status: 'yes' }],
  };
  t.mock.method(globalThis, 'fetch', async (url, options = {}) => {
    if (options.method === 'POST') writes.push(JSON.parse(options.body));
    return new Response(JSON.stringify(tables[new URL(url).pathname.split('/').pop()] || []));
  });
  const token = await createToken({ purpose: 'session', sid: 'test', email, exp: Date.now() + 60000 }, process.env.SESSION_SECRET);
  async function call(handler, body, query = {}) {
    const res = { setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
    await handler({ method: body ? 'POST' : 'GET', headers: { cookie: 'cnlc_session=' + token }, body, query }, res);
    return res;
  }
  return { member, writes, call };
}

test('profile, directory and event responses suppress unsafe stored headshots and keep valid JPEGs', async t => {
  const { member, call } = await setup(t, '');
  for (const value of [...invalid, jpeg]) {
    member.headshot_data = value;
    const expected = value === jpeg ? jpeg : '';
    const own = await call(profile);
    const listing = await call(directory);
    const calendar = await call(events, undefined, { source: 'sheet' });
    for (const res of [own, listing, calendar]) assert.equal(res.code, 200);
    assert.equal(own.body.headshotData, expected);
    assert.equal(listing.body.members[0].headshotData, expected);
    assert.equal(calendar.body.events[0].attendees[0].headshot, expected);
  }
});

test('unsafe uploads are rejected before a profile write, and a valid JPEG is saved', async t => {
  const { writes, call } = await setup(t, '');
  for (const headshotData of invalid) {
    const res = await call(saveProfile, { firstName: 'Member', lastName: 'Test', headshotData });
    assert.equal(res.code, 400);
    assert.equal(writes.length, 0);
  }
  const res = await call(saveProfile, { firstName: 'Member', lastName: 'Test', headshotData: jpeg });
  assert.equal(res.code, 200);
  assert.equal(writes[0].headshot_data, jpeg);
});

test('saving without a new photo preserves a valid JPEG but does not re-save unsafe legacy data', async t => {
  const { member, writes, call } = await setup(t, '');
  for (const headshot of [hostile, jpeg]) {
    member.headshot_data = headshot;
    const res = await call(saveProfile, { firstName: 'Member', lastName: 'Test', headshotData: '' });
    assert.equal(res.code, 200);
    assert.equal(writes.at(-1).headshot_data, headshot === jpeg ? jpeg : '');
  }
});
