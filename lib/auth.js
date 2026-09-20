import { createToken, verifyToken, readCookie } from './session.js';
import { select, insert, update } from '../api/_lib/supabase.js';
import { findAlumni } from '../api/_lib/allowlist.js';

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_MAX_MS = 30 * 24 * 60 * 60 * 1000;
export const LOGIN_TTL_MS = 15 * 60 * 1000;
export function sessionCookie(token, exp) {
  return `cnlc_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${Math.max(0, Math.floor((exp - Date.now()) / 1000))}`;
}
export async function getSession(cookieHeader) {
  try {
    const payload = await verifyToken(readCookie(cookieHeader, 'cnlc_session'), process.env.SESSION_SECRET, 'session');
    if (!payload?.email || !payload.sid) return null;
    const rows = await select('app_sessions', { id: payload.sid, email: payload.email, 'revoked_at:is': 'null', 'expires_at:gt': new Date().toISOString() });
    if (!rows.length || Date.parse(rows[0].created_at) + SESSION_MAX_MS <= Date.now()) return null;
    const alumni = await findAlumni(payload.email);
    if (!alumni) return null;
    return { ...payload, ...alumni, createdAt: rows[0].created_at };
  } catch { return null; } // Storage/secret failures must never grant access.
}
export async function issueLogin(alumni) {
  const id = crypto.randomUUID(), exp = Date.now() + LOGIN_TTL_MS;
  await insert('login_tokens', { id, email: alumni.email, expires_at: new Date(exp).toISOString() });
  return createToken({ ...alumni, jti: id, purpose: 'login', exp }, process.env.SESSION_SECRET);
}
export async function consumeLogin(token) {
  const payload = await verifyToken(token, process.env.SESSION_SECRET, 'login');
  if (!payload?.email || !payload.jti) return null;
  const alumni = await findAlumni(payload.email);
  if (!alumni) return null;
  // Conditional UPDATE is atomic: only one concurrent request can consume a link.
  const consumed = await update('login_tokens', { id: payload.jti, email: payload.email, 'used_at:is': 'null', 'expires_at:gt': new Date().toISOString() }, { used_at: new Date().toISOString() });
  if (!consumed.length) return null;
  const sid = crypto.randomUUID(), exp = Date.now() + SESSION_TTL_MS;
  await insert('app_sessions', { id: sid, email: alumni.email, expires_at: new Date(exp).toISOString() });
  return { token: await createToken({ ...alumni, sid, purpose: 'session', exp }, process.env.SESSION_SECRET), exp };
}
export async function refreshSession(session) {
  const exp = Math.min(Date.now() + SESSION_TTL_MS, Date.parse(session.createdAt) + SESSION_MAX_MS);
  if (exp <= Date.now()) return null;
  const rows = await update('app_sessions', { id: session.sid, 'revoked_at:is': 'null', 'expires_at:gt': new Date().toISOString() }, { expires_at: new Date(exp).toISOString() });
  if (!rows.length) return null;
  const { email, firstName, lastName, sid } = session;
  return { token: await createToken({ email, firstName, lastName, sid, purpose: 'session', exp }, process.env.SESSION_SECRET), exp };
}
export async function revokeSession(cookieHeader) {
  const payload = await verifyToken(readCookie(cookieHeader, 'cnlc_session'), process.env.SESSION_SECRET, 'session');
  if (!payload?.email || !payload.sid) return;
  // Sign-out must attempt revocation even if the member lookup is unavailable.
  // Let storage failures reach the caller instead of treating them as signed out.
  await update('app_sessions', { id: payload.sid, email: payload.email, 'revoked_at:is': 'null' }, { revoked_at: new Date().toISOString() });
}
export async function revokeMemberSessions(email) {
  await update('app_sessions', { email }, { revoked_at: new Date().toISOString() });
  await update('login_tokens', { email, 'used_at:is': 'null' }, { used_at: new Date().toISOString() });
}
