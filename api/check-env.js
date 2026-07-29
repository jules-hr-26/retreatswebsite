// TEMPORARY DIAGNOSTIC — DELETE AFTER DEBUGGING
export default async function handler(req, res) {
  const checks = {
    SESSION_SECRET:      !!process.env.SESSION_SECRET,
    RESEND_API_KEY:      !!process.env.RESEND_API_KEY,
    SUPABASE_URL:        !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
    DEV_PIN:             !!process.env.DEV_PIN,
    SUPABASE_URL_VALUE:  (process.env.SUPABASE_URL || '').slice(0, 30),
  };

  let supabaseTest = 'not tried';
  try {
    const url = `${process.env.SUPABASE_URL}/rest/v1/alumni_allowlist?limit=1`;
    const key = process.env.SUPABASE_SERVICE_KEY;
    const r = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    const body = await r.text();
    supabaseTest = `${r.status}: ${body.slice(0, 100)}`;
  } catch (err) {
    supabaseTest = `error: ${err.message}`;
  }

  return res.status(200).json({ checks, supabaseTest });
}
