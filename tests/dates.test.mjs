import test from 'node:test';
import assert from 'node:assert/strict';
import { eventDates } from '../api/_lib/dates.js';
test('event dates reject impossible days and backwards ranges, and normalize omitted ends', () => {
  for(const value of ['',undefined,'2026-02-29','2026-04-31','next Tuesday','2026-09-19T00:00:00Z']) assert.equal(eventDates(value),null);
  assert.equal(eventDates('2026-09-19','2026-09-18'),null);
  assert.deepEqual(eventDates('2024-02-29',''),{start_date:'2024-02-29',end_date:null});
  assert.deepEqual(eventDates('2026-09-19','2026-09-20'),{start_date:'2026-09-19',end_date:'2026-09-20'});
});
