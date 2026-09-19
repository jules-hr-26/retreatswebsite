import { getSession } from '../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET required' });
  if (!await getSession(req.headers.cookie)) return res.status(401).json({ error: 'not signed in' });
  const q = typeof req.query?.q === 'string' ? req.query.q.trim() : '';
  if (q.length < 2 || q.length > 100) return res.status(400).json({ error: 'Search must contain 2–100 characters' });
  try {
    const url = new URL('https://photon.komoot.io/api/');
    url.search = new URLSearchParams({ q, limit: '8', layer: 'city' });
    const upstream = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!upstream.ok) throw new Error('Lookup failed');
    const data = await upstream.json();
    const features = (Array.isArray(data.features) ? data.features : []).slice(0,8).map(f => ({
      properties: {
        name: String(f.properties?.name || '').slice(0,200),
        country: String(f.properties?.country || '').slice(0,200),
      },
    }));
    return res.status(200).json({ features });
  } catch {
    return res.status(502).json({ error: 'City suggestions unavailable; enter your city manually' });
  }
}
