// api/ai.js — EdgeX AI Proxy (Groq primary, Gemini fallback)
// Free tier: Groq llama-3.3-70b-versatile + Google Gemini Flash
// Set env vars: GROQ_API_KEY, GEMINI_API_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: 'Invalid JSON body' }); }

  const { prompt, system, max_tokens = 1200 } = body;
  if (!prompt) return res.status(400).json({ error: 'prompt required' });

  const messages = system
    ? [{ role: 'system', content: system }, { role: 'user', content: prompt }]
    : [{ role: 'user', content: prompt }];

  // ── 1. Groq (primary — fast, free) ───────────────────────────
  if (process.env.GROQ_API_KEY) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens,
          temperature: 0.4,
          messages,
        }),
      });
      if (r.ok) {
        const data = await r.json();
        const text = data.choices?.[0]?.message?.content || '';
        return res.status(200).json({ text, provider: 'groq' });
      }
      const err = await r.text();
      console.error('[EdgeX ai] Groq error:', r.status, err.slice(0, 200));
    } catch (e) {
      console.error('[EdgeX ai] Groq failed:', e.message);
    }
  }

  // ── 2. Gemini Flash (fallback — free tier) ────────────────────
  if (process.env.GEMINI_API_KEY) {
    try {
      const geminiMessages = system
        ? [{ parts: [{ text: system + '\n\n' + prompt }] }]
        : [{ parts: [{ text: prompt }] }];
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: geminiMessages,
            generationConfig: { maxOutputTokens: max_tokens, temperature: 0.4 },
          }),
        }
      );
      if (r.ok) {
        const data = await r.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return res.status(200).json({ text, provider: 'gemini' });
      }
    } catch (e) {
      console.error('[EdgeX ai] Gemini failed:', e.message);
    }
  }

  return res.status(503).json({ error: 'All AI providers unavailable. Set GROQ_API_KEY in Vercel env vars.' });
}
