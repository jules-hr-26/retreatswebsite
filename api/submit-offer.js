import { insert } from './_lib/supabase.js';
import { readCookie, verifyToken } from '../lib/session.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

  const session = await verifyToken(
    readCookie(req.headers.cookie, 'cnlc_session'),
    process.env.SESSION_SECRET
  ).catch(() => null);
  if (!session?.email) return res.status(401).json({ error: 'not signed in' });

  const { name, email, retreat, category, fee, feeInfo, location, format, title, description, website, linkedin } = req.body || {};

  if (!name || !String(name).trim())               return res.status(400).json({ error: 'name required' });
  if (!email || !String(email).trim())             return res.status(400).json({ error: 'email required' });
  if (!title || !String(title).trim())             return res.status(400).json({ error: 'title required' });
  if (!description || !String(description).trim()) return res.status(400).json({ error: 'description required' });

  const esc = (s) => String(s || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const feeLabel = fee === 'free' ? 'Free' : `Has a fee${feeInfo ? ` — ${esc(feeInfo)}` : ''}`;

  try {
    // Persist to DB — previously this was email-only and the data was lost
    await insert('offerings', {
      name:        String(name).trim(),
      email:       String(email).trim().toLowerCase(),
      retreat:     retreat || '',
      category:    category || '',
      fee_type:    fee || '',
      fee_info:    feeInfo || '',
      location:    location || '',
      format:      format || '',
      title:       String(title).trim(),
      description: String(description).trim(),
      website:     website || '',
      linkedin:    linkedin || '',
      status:      'published',
    });

    // Notify Julia — non-fatal if Resend is not yet configured
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Climate Plums <noreply@globaloptimism.com>',
        to: 'julia@globaloptimism.com',
        subject: `New community offer: ${title}`,
        html: `
          <h2>${esc(title)}</h2>
          <p><strong>From:</strong> ${esc(name)} &lt;${esc(email)}&gt;</p>
          <p><strong>Retreat:</strong> ${esc(retreat) || '—'}</p>
          <p><strong>Category:</strong> ${esc(category) || '—'}</p>
          <p><strong>Location:</strong> ${esc(location) || '—'}</p>
          <p><strong>Format:</strong> ${esc(format) || '—'}</p>
          <p><strong>Fee:</strong> ${feeLabel}</p>
          <p><strong>Description:</strong></p>
          <p>${esc(description).replace(/\n/g, '<br>')}</p>
          ${website ? `<p><strong>Website:</strong> ${esc(website)}</p>` : ''}
          ${linkedin ? `<p><strong>LinkedIn:</strong> ${esc(linkedin)}</p>` : ''}
          <p><em>This offering has been published automatically.</em></p>
        `,
      }),
    }).catch(err => console.error('[submit-offer] email notification failed', err.message));

  } catch (err) {
    console.error('[submit-offer] failed', err.message);
    return res.status(502).json({ error: 'submission failed' });
  }

  res.status(200).json({ ok: true });
}
