import { select } from './supabase.js';

export async function findAlumni(email) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return null;

  const rows = await select('alumni_allowlist', { email: normalized });
  if (!rows.length) return null;

  return { firstName: rows[0].first_name, lastName: rows[0].last_name, email: normalized };
}
