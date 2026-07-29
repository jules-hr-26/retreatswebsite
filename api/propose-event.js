import { insert } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

  const { title, format, date, duration, location, link, description } = req.body || {};

  if (!title || !String(title).trim()) return res.status(400).json({ error: 'title required' });
  if (!date || !String(date).trim()) return res.status(400).json({ error: 'date required' });
  if (!description || !String(description).trim()) return res.status(400).json({ error: 'description required' });
  if ((format === 'In person' || format === 'Hybrid') && (!location || !String(location).trim())) {
    return res.status(400).json({ error: 'location required' });
  }

  const esc = (s) => String(s || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  const displayDate = /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : esc(date);

  const extraRows = [
    (format === 'In person' || format === 'Hybrid') ? `<p><strong>Location:</strong> ${esc(location)}</p>` : '',
    (format === 'Online' || format === 'Hybrid') ? `<p><strong>Link:</strong> ${esc(link) || '—'}</p>` : '',
  ].join('');

  try {
    // Insert directly into events — no approval step needed
    await insert('events', {
      name:            String(title).trim(),
      start_date:      date,
      end_date:        '',
      city:            location || '',
      description:     [String(description).trim(), format ? `Format: ${format}` : '', duration ? `Duration: ${duration}` : ''].filter(Boolean).join('\n'),
      discussion_link: link || '',
      status:          'approved',
    });

    // Notify Julia — non-fatal if Resend is not yet configured
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'CNLC Platform <onboarding@resend.dev>',
        to: 'julia@globaloptimism.com',
        subject: `New event added by member: ${title}`,
        html: `
          <h2>${esc(title)}</h2>
          <p><strong>Format:</strong> ${esc(format || 'Online')}</p>
          <p><strong>Proposed date:</strong> ${displayDate}</p>
          <p><strong>Duration:</strong> ${esc(duration) || '—'}</p>
          ${extraRows}
          <p><strong>Idea:</strong></p>
          <p>${esc(description).replace(/\n/g, '<br>')}</p>
          <p><em>This event has been added to the events list automatically.</em></p>
        `,
      }),
    }).catch(err => console.error('[propose-event] email notification failed', err.message));

  } catch (err) {
    console.error('[propose-event] failed', err.message);
    return res.status(502).json({ error: 'submission failed' });
  }

  res.status(200).json({ ok: true });
}
