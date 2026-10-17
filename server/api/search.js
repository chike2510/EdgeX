// api/search.js — EdgeX Web Search Proxy (Serper.dev)
// Setup: add SERPER_API_KEY to the server environment.
import { allowRateLimit, isSameOriginRequest } from './proxy-guards.js';

const MAX_QUERY_CHARS = 300;
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!isSameOriginRequest(req)) return res.status(403).json({ error: 'Same-origin requests only' });
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!allowRateLimit(req, 'search', RATE_LIMIT, RATE_WINDOW_MS)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Request limit reached. Please try again shortly.', snippets: '' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body', snippets: '' });
  }
  const query = typeof body?.q === 'string' ? body.q.trim() : '';
  if (!query) return res.status(400).json({ error: 'query required', snippets: '' });
  if (query.length > MAX_QUERY_CHARS) return res.status(413).json({ error: 'query is too long', snippets: '' });
  if (!process.env.SERPER_API_KEY) return res.status(503).json({ error: 'Search service is unavailable.', snippets: '' });

  try {
    const response = await fetch('https://google.serper.dev/news', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.SERPER_API_KEY,
      },
      body: JSON.stringify({ q: query, num: 6, tbs: 'qdr:2w' }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.error('[EdgeX search] Serper provider error:', response.status);
      return res.status(502).json({ error: 'Search provider error', snippets: '' });
    }

    const data = await response.json();
    const items = (data.news || data.organic || []).slice(0, 5);
    const snippets = items
      .map(item => {
        const source = item.source || item.domain || '';
        const date = item.date || '';
        const title = item.title || '';
        const text = item.snippet || item.description || '';
        return `[${source}${date ? ` · ${date}` : ''}] ${title}${text ? `: ${text}` : ''}`;
      })
      .filter(Boolean)
      .join('\n');

    return res.status(200).json({ snippets, count: items.length, query });
  } catch (error) {
    console.error('[EdgeX search] Request failed:', error?.name || 'Error');
    return res.status(502).json({ error: 'Search provider is unavailable.', snippets: '' });
  }
}
