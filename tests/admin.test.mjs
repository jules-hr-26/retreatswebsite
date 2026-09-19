import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/admin.js';
import { createToken } from '../lib/session.js';
test('ordinary administrators cannot export or erase members', async () => {
  process.env.SESSION_SECRET = 'test-admin-secret';
  process.env.SUPABASE_URL = 'https://database.example.org';
  const token = await createToken({purpose:'session',sid:'test',email:'admin@example.org',exp:Date.now()+60000},process.env.SESSION_SECRET);
  const original = globalThis.fetch;
  globalThis.fetch = async (url, opts={}) => {
    assert.equal(opts.method || 'GET', 'GET', 'no mutations permitted');
    const table = new URL(url).pathname.split('/').pop();
    const data = table === 'app_sessions' ? [{created_at:new Date().toISOString()}] : table === 'admins' ? [{role:'admin'}] : [{}];
    return new Response(JSON.stringify(data));
  };
  try {
    for(const action of ['export-member','delete-member','gdpr-erase-member']) {
      const res = {setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;}};
      await handler({method:'POST',headers:{cookie:'cnlc_session='+token},body:{action,email:'member@example.org'}},res);
      assert.equal(res.code,403);
    }
  } finally { globalThis.fetch=original; }
});
