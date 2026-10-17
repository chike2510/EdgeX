import { createHash } from 'node:crypto';
import { z } from 'zod';
import { cached } from './edgex-data.js';
import { generateAI } from './ai.js';
import { allowRateLimit, isSameOriginRequest } from './proxy-guards.js';
import { getVerifiedUserId } from '../auth/supabase-user.js';

const MAX_BODY_CHARS = 16_000;
const RATE_LIMIT = 12;
const RATE_WINDOW_MS = 60_000;

const EvidenceSchema = z.object({
  id: z.string().trim().min(1).max(80).regex(/^[a-z0-9][a-z0-9._:-]*$/i),
  source: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(120),
  value: z.union([z.string().max(800), z.number().finite(), z.boolean(), z.null()]),
  timestamp: z.string().max(48).optional(),
}).strict();

const RequestSchema = z.object({
  domain: z.enum(['sports', 'markets', 'crypto', 'forex']),
  subject: z.string().trim().min(1).max(160),
  evidence: z.array(EvidenceSchema).max(20),
}).strict().superRefine((input, context) => {
  const ids = new Set();
  input.evidence.forEach((item, index) => {
    if (ids.has(item.id)) context.addIssue({ code: 'custom', path: ['evidence', index, 'id'], message: 'Evidence identifiers must be unique.' });
    ids.add(item.id);
  });
});

const ClaimSchema = z.object({
  text: z.string().trim().min(1).max(260),
  evidenceIds: z.array(z.string().trim().min(1).max(80)).min(1).max(5),
}).strict();

const OutputSchema = z.object({
  summary: z.string().trim().min(1).max(600),
  claims: z.array(ClaimSchema).max(6),
  uncertainties: z.array(z.string().trim().min(1).max(220)).max(8),
  dataQuality: z.enum(['sufficient', 'limited', 'insufficient']),
}).strict();

const FORBIDDEN_ACTION_LANGUAGE = /\b(?:bet|wager|stake|bookmaker|accumulator|buy|sell|long|short|take[ -]?profit|stop[ -]?loss|guarantee|sure thing)\b/i;

function parseStructuredText(text) {
  const clean = String(text || '').replace(/^```(?:json)?\s*|\s*```$/gi, '').trim();
  try { return JSON.parse(clean); } catch { return null; }
}

function fallback(evidence, reason = 'The available source evidence is insufficient for a grounded explanation.') {
  return {
    summary: 'Insufficient data for a source-grounded explanation.',
    claims: [],
    uncertainties: [reason],
    dataQuality: 'insufficient',
    evidence,
    provider: 'data-only',
    generatedAt: new Date().toISOString(),
  };
}

function makePrompt(input) {
  return [
    'Produce a short research explanation using only the supplied provider evidence.',
    'Do not forecast, recommend actions, invent statistics, or create probabilities, confidence values, targets, picks, or trading/betting instructions.',
    'Return JSON only with exactly this schema: {"summary":"string","claims":[{"text":"string","evidenceIds":["id"]}],"uncertainties":["string"],"dataQuality":"sufficient|limited|insufficient"}.',
    'Every claim must cite one or more exact evidence IDs from the input. If the evidence is thin or incomplete, return no claims and use dataQuality="insufficient".',
    `Research input: ${JSON.stringify(input)}`,
  ].join('\n');
}

async function generateReview(input) {
  const date = new Date().toISOString().slice(0, 10);
  const subjectDigest = createHash('sha256').update(input.subject.trim().toLowerCase()).digest('hex').slice(0, 20);
  const evidenceDigest = createHash('sha256').update(JSON.stringify(input.evidence)).digest('hex').slice(0, 32);
  const key = `research-review:${input.domain}:${date}:${subjectDigest}:${evidenceDigest}`;
  const tomorrowUtc = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() + 1);
  const cacheTtl = Math.max(1000, tomorrowUtc - Date.now());
  return cached(key, cacheTtl, async () => {
    const result = await generateAI(makePrompt(input), 650);
    if (!result?.text) throw new Error('The explanation service did not return a response.');
    const parsed = OutputSchema.safeParse(parseStructuredText(result.text));
    if (!parsed.success) throw new Error('The explanation service returned an invalid structured response.');
    const ids = new Set(input.evidence.map(item => item.id));
    const claimsAreGrounded = parsed.data.claims.every(claim => claim.evidenceIds.every(id => ids.has(id)));
    const outputText = [parsed.data.summary, ...parsed.data.claims.map(claim => claim.text), ...parsed.data.uncertainties].join(' ');
    if (!claimsAreGrounded || FORBIDDEN_ACTION_LANGUAGE.test(outputText)) {
      throw new Error('The generated explanation did not satisfy source-citation and research-only checks.');
    }
    return { ...parsed.data, evidence: input.evidence, provider: result.provider || 'configured-ai', generatedAt: new Date().toISOString() };
  });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!isSameOriginRequest(req)) return res.status(403).json({ error: 'Same-origin requests only' });
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const userId = await getVerifiedUserId(req);
  if (!allowRateLimit(req, 'edge-analysis', RATE_LIMIT, RATE_WINDOW_MS, Date.now(), userId)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Request limit reached. Please try again shortly.' });
  }

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}; }
  catch { return res.status(400).json({ error: 'Invalid JSON body' }); }
  let serialized;
  try { serialized = JSON.stringify(body); }
  catch { return res.status(400).json({ error: 'Invalid JSON body' }); }
  if (serialized.length > MAX_BODY_CHARS) return res.status(413).json({ error: 'Evidence payload is too large.' });

  const validation = RequestSchema.safeParse(body);
  if (!validation.success) return res.status(400).json({ error: 'Invalid research evidence payload.' });
  const input = validation.data;
  if (!input.evidence.length || !input.evidence.some(item => item.value !== null && item.value !== '')) {
    return res.status(200).json(fallback(input.evidence, 'No usable provider evidence was supplied.'));
  }

  try {
    const review = await generateReview(input);
    return res.status(200).json(review);
  } catch (error) {
    console.error('[EdgeX research review] provider failure', error?.name || 'Error');
    return res.status(200).json(fallback(input.evidence, 'The explanation service is temporarily unavailable.'));
  }
}
