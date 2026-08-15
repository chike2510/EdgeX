import { buildAIContext } from './edgex-data.js';

const schema = {
  verdict: 'string',
  confidence: 'number|null',
  projection: 'string|null',
  probability: 'number|null',
  reasons: 'string[]',
  positiveFactors: 'string[]',
  negativeFactors: 'string[]',
  uncertainties: 'string[]',
  risk: 'string',
  dataQuality: 'string'
};

function instruction(context) {
  return `You are EdgeX, a research-only intelligence engine. Use only the supplied normalized context. Do not invent lines, statistics, prices, probabilities, or confidence. If evidence is incomplete, verdict must be NO EDGE or INSUFFICIENT DATA. Return JSON only with this schema: ${JSON.stringify(schema)}. Context: ${JSON.stringify(context)}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}; } catch { return res.status(400).json({ error: 'Invalid JSON body' }); }
  if (!body.domain || !body.subject || !body.data) return res.status(400).json({ error: 'domain, subject, and normalized data are required' });
  const context = buildAIContext(body);
  if (!Object.keys(context.data).length) return res.status(200).json({ verdict: 'INSUFFICIENT DATA', confidence: null, projection: null, probability: null, reasons: [], positiveFactors: [], negativeFactors: [], uncertainties: ['No normalized provider data supplied.'], risk: 'unknown', dataQuality: 'none' });
  const prompt = instruction(context);
  try {
    const protocol = req.headers?.['x-forwarded-proto'] || 'https'; const aiUrl = process.env.AI_API_URL || `${protocol}://${req.headers?.host || 'localhost'}/api/ai`; const upstream = await fetch(aiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, system: 'Return JSON only. Never fabricate data.', max_tokens: 900 }) });
    const result = await upstream.json();
    if (!upstream.ok || !result.text) return res.status(503).json({ error: 'AI unavailable', fallback: 'data-only' });
    let parsed;
    try { parsed = JSON.parse(result.text.replace(/^```json\s*|\s*```$/g, '')); } catch { return res.status(502).json({ error: 'AI returned invalid structured output', fallback: 'data-only' }); }
    return res.status(200).json({ ...parsed, provider: result.provider || 'configured-ai' });
  } catch (error) {
    console.error('[EdgeX edge-analysis] provider failure', error?.message || error);
    return res.status(503).json({ error: 'AI unavailable', fallback: 'data-only' });
  }
}
