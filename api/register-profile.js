import { readCookie, verifyToken } from '../lib/session.js';
import { select, upsert } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

  const session = await verifyToken(readCookie(req.headers.cookie, 'cnlc_session'), process.env.SESSION_SECRET);
  if (!session || !session.email) return res.status(401).json({ error: 'not signed in' });

  const {
    firstName, lastName, city, country, organization,
    sector, cohort, role, email, phone, headshotData, shareWithCommunity,
  } = req.body || {};

  if (!firstName || !String(firstName).trim()) return res.status(400).json({ error: 'firstName required' });
  if (!lastName || !String(lastName).trim())   return res.status(400).json({ error: 'lastName required' });

  try {
    const existing = await select('members', { auth_email: session.email });
    const existingHeadshot = existing.length ? (existing[0].headshot_data || '') : '';
    const finalHeadshot = headshotData || existingHeadshot;

    await upsert('members', {
      auth_email:      session.email,
      display_email:   email || '',
      first_name:      String(firstName).trim(),
      last_name:       String(lastName).trim(),
      city:            city || '',
      country:         country || '',
      organisation:    organization || '',
      sector:          sector || '',
      cohort:          cohort || '',
      role_title:      role || '',
      phone:           phone || '',
      in_directory:    shareWithCommunity ? true : false,
      headshot_data:   finalHeadshot,
      gdpr_consent_at: existing.length ? undefined : new Date().toISOString(),
      updated_at:      new Date().toISOString(),
    }, 'auth_email');

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[register-profile]', err.message);
    res.status(502).json({ error: 'save failed' });
  }
}
