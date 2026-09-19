const encoder = new TextEncoder();

function bytesToBase64url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToString(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + ((4 - (str.length % 4)) % 4), '=');
  return new TextDecoder().decode(Uint8Array.from(atob(padded), c => c.charCodeAt(0)));
}

async function hmacKey(secret) {
  if (typeof secret !== 'string' || !secret) throw new Error('SESSION_SECRET required');
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

async function sign(payloadB64, secret) {
  const key = await hmacKey(secret);
  const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadB64));
  return bytesToBase64url(new Uint8Array(sigBuf));
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createToken(payload, secret) {
  const payloadB64 = bytesToBase64url(encoder.encode(JSON.stringify({ ...payload, aud: 'climate-plums' })));
  const sig = await sign(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

export async function verifyToken(token, secret, purpose = 'session') {
  try {
    if (typeof token !== 'string' || token.length > 8192) return null;
    const parts = token.split('.');
    if (parts.length !== 2 || !parts.every(p => /^[A-Za-z0-9_-]+$/.test(p))) return null;
    const [payloadB64, sig] = parts;
    if (!timingSafeEqual(sig, await sign(payloadB64, secret))) return null;
    const payload = JSON.parse(base64urlToString(payloadB64));
    if (payload.aud !== 'climate-plums' || payload.purpose !== purpose || !Number.isFinite(payload.exp) || Date.now() >= payload.exp) return null;
    return payload;
  } catch { return null; }
}

export function readCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const match = cookieHeader.split(';').map((c) => c.trim()).find((c) => c.startsWith(name + '='));
  try { return match ? decodeURIComponent(match.slice(name.length + 1)) : null; } catch { return null; }
}
