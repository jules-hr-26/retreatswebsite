import { readCookie, verifyToken } from '../lib/session.js';
import { select } from './_lib/supabase.js';

export default async function handler(req, res) {
  const session = await verifyToken(readCookie(req.headers.cookie, 'cnlc_session'), process.env.SESSION_SECRET);
  if (!session || !session.email) return res.status(401).json({ error: 'not signed in' });

  try {
    const rows = await select('members', { auth_email: session.email });

    if (!rows.length) {
      return res.status(200).json({
        email: session.email,
        firstName: session.firstName || '',
        lastName: session.lastName || '',
        hasProfile: false,
      });
    }

    const m = rows[0];
    return res.status(200).json({
      email: session.email,
      hasProfile: true,
      firstName: m.first_name || '',
      lastName: m.last_name || '',
      displayEmail: m.display_email || '',
      city: m.city || '',
      country: m.country || '',
      organization: m.organisation || '',
      sector: m.sector || '',
      cohorts: (m.cohort || '').split(',').map((c) => c.trim()).filter(Boolean),
      role: m.role_title || '',

      shareWithCommunity: !!m.in_directory,
      headshotData: m.headshot_data || '',
    });
  } catch (err) {
    console.error('[get-profile]', err.message);
    return res.status(502).json({ error: 'lookup failed' });
  }
}
