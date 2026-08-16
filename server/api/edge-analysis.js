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
  return `You are EdgeX, a research-only intelligence engine. Use only the supplied normalized context. Do not invent lines, statistics, prices, probabilities, technical indicators, targets, stops, or confidence. If evidence is incomplete, verdict must be NO EDGE or INSUFFICIENT DATA. Return JSON only with this schema: ${JSON.stringify(schema)}. Allowed verdicts: BULLISH, BEARISH, NEUTRAL, NO EDGE, INSUFFICIENT DATA. Context: ${JSON.stringify(context)}`;
}

const emptyAnalysis = (message = 'No sufficient provider evidence was returned.') => ({ verdict: 'INSUFFICIENT DATA', confidence: null, projection: null, probability: null, reasons: [], positiveFactors: [], negativeFactors: [], uncertainties: [message], risk: 'unknown', dataQuality: 'none' });
const list = value => Array.isArray(value) ? value.filter(Boolean).map(item => String(item)).slice(0, 8) : [];
const finiteOrNull = value => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Math.max(0, Math.min(100, Number(value)));
function normalizeAnalysis(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const allowed = new Set(['BULLISH', 'BEARISH', 'NEUTRAL', 'NO EDGE', 'INSUFFICIENT DATA']);
  const verdict = String(source.verdict || '').toUpperCase();
  const normalized = {
    verdict: allowed.has(verdict) ? verdict : 'INSUFFICIENT DATA',
    confidence: finiteOrNull(source.confidence),
    projection: source.projection == null ? null : String(source.projection).slice(0, 240),
    probability: finiteOrNull(source.probability),
    reasons: list(source.reasons),
    positiveFactors: list(source.positiveFactors),
    negativeFactors: list(source.negativeFactors),
    uncertainties: list(source.uncertainties),
    risk: source.risk == null ? 'unknown' : String(source.risk).slice(0, 80),
    dataQuality: source.dataQuality == null ? 'unknown' : String(source.dataQuality).slice(0, 80)
  };
  if (normalized.verdict === 'INSUFFICIENT DATA' && !normalized.uncertainties.length) normalized.uncertainties.push('The model did not receive enough provider evidence.');
  if (normalized.verdict === 'NO EDGE' && !normalized.uncertainties.length) normalized.uncertainties.push('The available evidence did not establish a defensible edge.');
  if (normalized.verdict === 'INSUFFICIENT DATA' || normalized.verdict === 'NO EDGE') {
    normalized.confidence = null;
    normalized.probability = null;
    normalized.projection = null;
  }
  return normalized;
}

function parseStructuredText(text) {
  const clean = String(text || '').replace(/^```(?:json)?\s*|\s*```$/gi, '').trim();
  try { return JSON.parse(clean); } catch {}
  const start = clean.indexOf('{'); const end = clean.lastIndexOf('}');
  if (start >= 0 && end > start) { try { return JSON.parse(clean.slice(start, end + 1)); } catch {} }
  return null;
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
  if (!Object.keys(context.data).length) return res.status(200).json(emptyAnalysis('No normalized provider data supplied.'));
  const prompt = instruction(context);
  try {
    const protocol = req.headers?.['x-forwarded-proto'] || 'https'; const aiUrl = process.env.AI_API_URL || `${protocol}://${req.headers?.host || 'localhost'}/api/ai`; const upstream = await fetch(aiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, system: 'Return JSON only. Never fabricate data.', max_tokens: 900 }) });
    const result = await upstream.json();
    if (!upstream.ok || !result.text) return res.status(200).json({ ...emptyAnalysis('The AI provider did not return a response.'), provider: 'data-only' });
    const parsed = parseStructuredText(result.text);
    if (!parsed) return res.status(200).json({ ...emptyAnalysis('The AI provider returned an invalid structured response.'), provider: result.provider || 'data-only' });
    return res.status(200).json({ ...normalizeAnalysis(parsed), provider: result.provider || 'configured-ai' });
  } catch (error) {
    console.error('[EdgeX edge-analysis] provider failure', error?.message || error);
    return res.status(200).json({ ...emptyAnalysis('The AI analysis service is unavailable.'), provider: 'data-only' });
  }
}
