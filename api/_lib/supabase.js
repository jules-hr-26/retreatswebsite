const BASE = () => `${process.env.SUPABASE_URL}/rest/v1`;

function headers(extra = {}) {
  const key = process.env.SUPABASE_SERVICE_KEY;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    ...extra,
  };
}

function buildQuery(filters = {}) {
  const p = new URLSearchParams();
  for (const [key, val] of Object.entries(filters)) {
    // key may be 'col' (defaults to eq) or 'col:op' (explicit operator)
    const [col, op = 'eq'] = key.split(':');
    p.append(col, `${op}.${val}`);
  }
  return p.toString();
}

async function check(res, label) {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Supabase ${label} failed: ${res.status} ${body}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

// SELECT — returns array of rows
// filters: { col: val } or { 'col:ilike': '%val%' } etc.
// options: { order: 'col.asc', limit: 100, columns: 'col1,col2' }
export async function select(table, filters = {}, options = {}) {
  const q = buildQuery(filters);
  const extra = new URLSearchParams();
  if (options.order)   extra.set('order', options.order);
  if (options.limit)   extra.set('limit', String(options.limit));
  if (options.columns) extra.set('select', options.columns);
  const qs = [q, extra.toString()].filter(Boolean).join('&');
  const res = await fetch(`${BASE()}/${table}${qs ? '?' + qs : ''}`, { headers: headers() });
  return check(res, `select(${table})`);
}

// INSERT — returns inserted row(s)
export async function insert(table, data) {
  const res = await fetch(`${BASE()}/${table}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  return check(res, `insert(${table})`);
}

// UPSERT — insert or update on unique-key conflict
// onConflict: column name(s) to detect the conflict on, e.g. 'auth_email' or 'forum_name,member_email'
export async function upsert(table, data, onConflict) {
  const qs = onConflict ? `?on_conflict=${encodeURIComponent(onConflict)}` : '';
  const res = await fetch(`${BASE()}/${table}${qs}`, {
    method: 'POST',
    headers: headers({ Prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify(data),
  });
  return check(res, `upsert(${table})`);
}

// UPDATE — patch rows matching filters, returns updated row(s)
export async function update(table, filters, data) {
  const q = buildQuery(filters);
  const res = await fetch(`${BASE()}/${table}${q ? '?' + q : ''}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(data),
  });
  return check(res, `update(${table})`);
}

// DELETE — remove rows matching filters
export async function remove(table, filters) {
  const q = buildQuery(filters);
  const res = await fetch(`${BASE()}/${table}${q ? '?' + q : ''}`, {
    method: 'DELETE',
    headers: headers({ Prefer: 'return=minimal' }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Supabase remove(${table}) failed: ${res.status} ${body}`);
  }
}
