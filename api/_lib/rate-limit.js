import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { rpc } from './supabase.js';

export async function allowLoginAttempt(req, email) {
  if (!process.env.SESSION_SECRET) throw new Error('Missing session secret');
  // Vercel overwrites this header. Outside Vercel, trust only the socket address.
  const forwarded = process.env.VERCEL === '1' ? req.headers['x-forwarded-for'] : '';
  const source = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '';
  const ip = isIP(source) ? source : req.socket?.remoteAddress || 'unknown';
  const hash = value => createHmac('sha256', process.env.SESSION_SECRET).update(value).digest('hex');
  return await rpc('consume_login_attempt', {
    email_key: hash('email:' + email),
    source_key: hash('source:' + ip),
  }) === true;
}
