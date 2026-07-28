import { readCookie, verifyToken } from '../lib/session.js';
import { select } from './_lib/supabase.js';
import { regionForCountry } from './_lib/regions.js';

export default async function handler(req, res) {
  const session = await verifyToken(readCookie(req.headers.cookie, 'cnlc_session'), process.env.SESSION_SECRET);
  if (!session || !session.email) return res.status(401).json({ error: 'not signed in' });

  res.setHeader('Cache-Control', 'no-store');

  try {
    const rows = await select('members', { in_directory: true }, { order: 'first_name.asc' });

    const members = rows.map((m) => ({
      firstName: m.first_name || '',
      lastName:  m.last_name || '',
      city:      m.city || '',
      country:   m.country || '',
      region:    regionForCountry(m.country),
      organization: m.organisation || '',
      sector:    m.sector || '',
      cohorts:   (m.cohort || '').split(',').map((c) => c.trim()).filter(Boolean),
      role:      m.role_title || '',
      email:     (m.display_email || m.auth_email || '').trim(),
      headshotData: m.headshot_data || '',
    }));

    return res.status(200).json({ members });
  } catch (err) {
    console.error('[list-directory]', err.message);
    return res.status(502).json({ error: 'lookup failed' });
  }
}
