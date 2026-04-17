// api/claude.js — EdgeX AI Proxy
// Routes to Claude (primary) → OpenAI GPT-4o (fallback) → Gemini (final fallback)
// Set env vars: ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: 'Invalid JSON body' }); }

  const { prompt, max_tokens = 1500 } = body;
  if (!prompt) return res.status(400).json({ error: 'prompt required' });

  // ── 1. Try Claude ─────────────────────────────────────────
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (r.ok) {
        const data = await r.json();
        const text = (data.content || []).map(c => c.text || '').join('');
        return res.status(200).json({ text, provider: 'claude' });
      }
    } catch (e) {
      console.error('[EdgeX claude] Claude failed:', e.message);
    }
  }

  // ── 2. Fallback: OpenAI GPT-4o ────────────────────────────
  if (process.env.OPENAI_API_KEY) {
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (r.ok) {
        const data = await r.json();
        const text = data.choices?.[0]?.message?.content || '';
        return res.status(200).json({ text, provider: 'openai' });
      }
    } catch (e) {
      console.error('[EdgeX claude] OpenAI failed:', e.message);
    }
  }

  // ── 3. Final fallback: Gemini Flash ───────────────────────
  if (process.env.GEMINI_API_KEY) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: max_tokens },
          }),
        }
      );
      if (r.ok) {
        const data = await r.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return res.status(200).json({ text, provider: 'gemini' });
      }
    } catch (e) {
      console.error('[EdgeX claude] Gemini failed:', e.message);
    }
  }

  return res.status(503).json({ error: 'All AI providers unavailable' });
}
