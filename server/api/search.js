// api/search.js — EdgeX Web Search Proxy (Serper.dev)
// Fetches current news snippets to ground AI picks in real-world data
// Setup: add SERPER_API_KEY to Vercel environment variables
// Free tier: 2,500 queries/month at serper.dev

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'query param q required' });

  if (!process.env.SERPER_API_KEY) {
    return res.status(503).json({ error: 'SERPER_API_KEY not set', snippets: '' });
  }

  try {
    // Fetch recent news (past 2 weeks)
    const r = await fetch('https://google.serper.dev/news', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.SERPER_API_KEY,
      },
      body: JSON.stringify({ q, num: 6, tbs: 'qdr:2w' }),
    });

    if (!r.ok) {
      const err = await r.text();
      console.error('[EdgeX search] Serper error:', r.status, err.slice(0, 200));
      return res.status(502).json({ error: 'Search provider error', snippets: '' });
    }

    const data = await r.json();
    const items = (data.news || data.organic || []).slice(0, 5);

    // Format as clean text snippets for AI injection
    const snippets = items
      .map(n => {
        const src = n.source || n.domain || '';
        const date = n.date || '';
        const title = n.title || '';
        const body = n.snippet || n.description || '';
        return `[${src}${date ? ' · ' + date : ''}] ${title}${body ? ': ' + body : ''}`;
      })
      .filter(Boolean)
      .join('\n');

    return res.status(200).json({
      snippets,
      count: items.length,
      query: q,
    });
  } catch (e) {
    console.error('[EdgeX search] Failed:', e.message);
    return res.status(500).json({ error: e.message, snippets: '' });
  }
}
