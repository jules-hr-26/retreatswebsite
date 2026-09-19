import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/events.js';
import { createToken } from '../lib/session.js';
test('event email unsubscribe preserves attendance', async () => {
  process.env.SESSION_SECRET = 'event-preferences-secret';
  process.env.SUPABASE_URL = 'https://database.example.org';
  const token = await createToken({purpose:'event-optout',email:'member@example.org',eventName:'Test',exp:Date.now()+60000},process.env.SESSION_SECRET);
  const original = globalThis.fetch;
  const writes = [];
  globalThis.fetch = async (url, opts) => { writes.push(JSON.parse(opts.body)); return new Response('[]'); };
  try {
    const res = {setHeader(){},writeHead(code){this.code=code;},end(){}};
    await handler({method:'GET',headers:{},query:{action:'optout',token}},res);
    assert.equal(res.code,302);
    assert.deepEqual(writes,[{notify:false}]);
  } finally { globalThis.fetch=original; }
});
