import test from 'node:test';
import assert from 'node:assert/strict';
import events from '../api/events.js';
import bulletin from '../api/bulletin.js';

export function response() {
  return {
    statusCode: 200, headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    writeHead(code, headers) { this.statusCode = code; Object.assign(this.headers, headers); },
    end() {},
  };
}

for (const [handler, query] of [
  [events, { source: 'sheet' }], [events, { calendarId: 'private' }],
  [bulletin, { action: 'forums' }], [bulletin, { action: 'posts', forum: 'BIPOC Sangha' }],
]) {
  test(`private API rejects anonymous requests: ${JSON.stringify(query)}`, async () => {
    const original = globalThis.fetch;
    globalThis.fetch = () => { throw new Error('Anonymous request reached upstream'); };
    try {
      const res = response();
      await handler({ method: 'GET', headers: {}, query }, res);
      assert.equal(res.statusCode, 401);
      assert.equal(res.headers['Cache-Control'], 'no-store');
    } finally { globalThis.fetch = original; }
  });
}
