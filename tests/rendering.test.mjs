import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { validHeadshot } from '../api/_lib/images.js';
const context = { URL };
vm.createContext(context);
vm.runInContext(readFileSync('assets/safe-ui.js', 'utf8'), context);
test('member data stays data in action attributes and image sources', () => {
  const hostile = '\"><img src=x onerror=alert(1)>\' &';
  const result = context.actionAttrs('viewMember', [{ first_name: hostile }]);
  assert.ok(!result.includes('<img'));
  assert.ok(result.includes('&quot;'));
  assert.equal(context.SafeUI.headshot(hostile), '');
  assert.equal(context.SafeUI.httpUrl('javascript:alert(1)'), '');
  assert.equal(context.SafeUI.httpUrl('https://example.org/a'), 'https://example.org/a');
});
test('server rejects malformed, oversized and non-image headshots', () => {
  for (const value of ['\" onerror=alert(1)', Buffer.from('<svg/>').toString('base64'), 'A'.repeat(180004), {}, '/9j/2Q==']) {
    assert.equal(validHeadshot(value), false);
  }
  assert.equal(validHeadshot(''), true);
});
test('pages and dynamically generated markup have no inline event handlers', () => {
  for (const name of ['admin', 'platform', 'login']) {
    const page = readFileSync(`${name}.html`, 'utf8');
    const script = readFileSync(`assets/${name}.js`, 'utf8');
    assert.ok(!/\bon[a-z]+\s*=/.test(page));
    assert.ok(!/[\s]on[a-z]+\s*=["']/.test(script));
    new vm.Script(script);
  }
  assert.ok(readFileSync('vercel.json', 'utf8').includes("script-src 'self';"));
});
