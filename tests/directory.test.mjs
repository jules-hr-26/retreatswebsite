import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/list-directory.js';
import { createToken } from '../lib/session.js';
test('directory never substitutes private sign-in email for blank contact email', async () => {
  process.env.SESSION_SECRET = 'directory-secret';
  process.env.SUPABASE_URL = 'https://database.example.org';
  const token = await createToken({purpose:'session',sid:'test',email:'member@example.org',exp:Date.now()+60000},process.env.SESSION_SECRET);
  const original = globalThis.fetch;
  globalThis.fetch = async url => {
    const table = new URL(url).pathname.split('/').pop();
    const rows = table === 'members' ? [{auth_email:'private@example.org',display_email:''},{auth_email:'private2@example.org',display_email:'public@example.org'}] : table === 'app_sessions' ? [{created_at:new Date().toISOString()}] : [{}];
    return new Response(JSON.stringify(rows));
  };
  try {
    const res = {setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;}};
    await handler({method:'GET',headers:{cookie:'cnlc_session='+token}},res);
    assert.equal(res.code,200);
    assert.deepEqual(res.body.members.map(m=>m.email),['','public@example.org']);
  } finally { globalThis.fetch=original; }
});
