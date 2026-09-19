import { getSession } from '../lib/auth.js';
import { select } from './_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET required' });
  if (!await getSession(req.headers.cookie)) return res.status(401).json({ error: 'not signed in' });
  try {
    const offerings = await select('offerings', { status: 'published' }, {
      order: 'created_at.desc',
      columns: 'name,email,category,location,format,title,description,website,linkedin,fee_type,fee_info',
    });
    return res.status(200).json({ offerings });
  } catch {
    return res.status(502).json({ error: 'Unable to load offerings' });
  }
}
