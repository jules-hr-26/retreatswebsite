import { findAlumni } from './_lib/allowlist.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

  const { email } = req.body || {};
  if (!email || !String(email).trim()) return res.status(400).json({ error: 'email required' });

  try {
    const match = await findAlumni(email);
    if (!match) return res.status(200).json({ allowed: false });
    return res.status(200).json({ allowed: true, firstName: match.firstName, lastName: match.lastName });
  } catch (err) {
    console.error('[check-alumni-email]', err.message);
    return res.status(502).json({ error: 'lookup failed' });
  }
}
