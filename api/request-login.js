import { findAlumni } from './_lib/allowlist.js';
import { createToken } from '../lib/session.js';

const LOGIN_TOKEN_TTL_MS = 60 * 60 * 1000; // 60 minutes

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

  const { email } = req.body || {};
  if (!email || !String(email).trim()) return res.status(400).json({ error: 'email required' });

  try {
    const match = await findAlumni(email);

    if (match) {
      const token = await createToken(
        { email: match.email, firstName: match.firstName, lastName: match.lastName, purpose: 'login', exp: Date.now() + LOGIN_TOKEN_TTL_MS },
        process.env.SESSION_SECRET
      );
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const link = `https://${host}/api/verify-login?token=${token}`;

      // Admin test bypass: skip email for whitelisted addresses, redirect directly.
      // Set ADMIN_TEST_EMAILS=email1,email2 in Vercel env; remove when real email delivery is confirmed.
      const adminEmails = (process.env.ADMIN_TEST_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
      if (adminEmails.includes(match.email)) {
        return res.status(200).json({ ok: true, redirect: `/api/verify-login?token=${token}` });
      }

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Climate Plums <noreply@globaloptimism.com>',
          to: match.email,
          subject: 'Your sign-in link for Climate Plums',
          html: `
            <p>Hi ${match.firstName || 'there'},</p>
            <p>Click the link below to sign in to Climate Plums. This link expires in 60 minutes.</p>
            <p><a href="${link}">${link}</a></p>
            <p>If you didn't request this, you can safely ignore this email.</p>
          `,
        }),
      });

      if (!emailRes.ok) {
        const body = await emailRes.text();
        console.error('[request-login] Resend error', emailRes.status, body);
      }
    }

    // Always respond the same way whether or not the email matched, so the
    // response can't be used to enumerate who is on the alumni list.
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[request-login]', err.message);
    return res.status(200).json({ ok: true });
  }
}
