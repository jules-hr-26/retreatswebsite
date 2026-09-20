import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { validHeadshot } from '../api/_lib/images.js';
let onClick;
const context = { URL, atob, btoa, document: { addEventListener(type, fn) { if (type === 'click') onClick = fn; } } };
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
test('headshot rendering accepts a real JPEG and rejects hostile or non-JPEG data', () => {
  const jpeg = readFileSync('tests/fixtures/headshot.jpg').toString('base64');
  assert.equal(validHeadshot(jpeg), true);
  assert.equal(context.SafeUI.headshot(jpeg), jpeg);
  for (const value of ['\" onerror=alert(1)', Buffer.from('<svg onload="alert(1)"/>').toString('base64'), 'A'.repeat(180004), {}, null, jpeg.slice(0, -4)]) {
    assert.equal(context.SafeUI.headshot(value), '');
  }
});
test('delegated admin actions pass hostile values as data and reject unknown actions', () => {
  const hostile = '\");alert(1);// <img src=x onerror=alert(1)> & \'quoted\'';
  const received = [];
  context.SafeUI.bindActions({ viewMember(member) { received.push({ element: this, member }); } });
  const element = { dataset: { action: 'viewMember', args: JSON.stringify([{ first_name: hostile }]) } };
  const click = () => onClick({ target: { closest() { return element; } } });
  click();
  assert.equal(received.length, 1);
  assert.equal(received[0].element, element);
  assert.equal(received[0].member.first_name, hostile);
  for (const action of ['constructor', '__proto__', 'alert(1)']) {
    element.dataset.action = action;
    click();
  }
  element.dataset.action = 'viewMember';
  for (const args of ['not JSON', '{"first_name":"ignored"}', 'null']) {
    element.dataset.args = args;
    click();
  }
  assert.equal(received.length, 1);
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
