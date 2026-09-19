export function eventDates(start, end) {
  const valid = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
  if (!valid(start)) return null;
  if (end !== undefined && end !== null && end !== '' && (!valid(end) || end < start)) return null;
  return { start_date: start, end_date: end || null };
}
