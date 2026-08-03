import { findAlumni } from './_lib/allowlist.js';
import { createToken } from '../lib/session.js';

const LOGIN_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const DEV_SESSION_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 365 days

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

  const { email, devPin } = req.body || {};
  if (!email || !String(email).trim()) return res.status(400).json({ error: 'email required' });

  // Dev PIN bypass: skip email entirely, create a long-lived session directly.
  // Remove DEV_PIN from env vars before launch to disable this path.
  if (devPin && process.env.DEV_PIN && String(devPin) === String(process.env.DEV_PIN)) {
    try {
      const match = await findAlumni(email);
      if (match) {
        const sessionToken = await createToken(
          { email: match.email, firstName: match.firstName, lastName: match.lastName, exp: Date.now() + DEV_SESSION_TTL_MS },
          process.env.SESSION_SECRET
        );
        const maxAgeSeconds = Math.floor(DEV_SESSION_TTL_MS / 1000);
        res.setHeader('Set-Cookie', `cnlc_session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`);
        return res.status(200).json({ ok: true, redirect: '/platform.html' });
      }
    } catch (err) {
      console.error('[request-login] dev-pin error', err.message);
    }
    return res.status(200).json({ ok: true });
  }

  try {
    const match = await findAlumni(email);

    if (match) {
      const token = await createToken(
        { email: match.email, firstName: match.firstName, lastName: match.lastName, exp: Date.now() + LOGIN_TOKEN_TTL_MS },
        process.env.SESSION_SECRET
      );
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const link = `https://${host}/api/verify-login?token=${token}`;

      // TEMP: log link so admin can retrieve it from Vercel logs while custom domain is pending
      console.log('[request-login] LOGIN LINK for', match.email, '→', link);

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'CNLC Platform <onboarding@resend.dev>',
          to: match.email,
          subject: 'Your sign-in link for the Climate and Nature Leaders Community',
          html: `
            <p>Hi ${match.firstName || 'there'},</p>
            <p>Click the link below to sign in to the Climate and Nature Leaders Community platform. This link expires in 15 minutes and can only be used once.</p>
            <p><a href="${link}">${link}</a></p>
            <p>If you didn't request this, you can safely ignore this email.</p>
          `,
        }),
      });

      const resendBody = await emailRes.text();
      if (!emailRes.ok) {
        console.error('[request-login] Resend error', emailRes.status, resendBody);
      } else {
        console.log('[request-login] Resend sent ok', emailRes.status, resendBody);
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
