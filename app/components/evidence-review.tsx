'use client';

import { useState } from 'react';
import { getSupabaseBrowserClient } from '../lib/supabase-browser';

type Domain = 'sports' | 'markets' | 'crypto' | 'forex';
type Evidence = { id: string; source: string; label: string; value: string | number | boolean | null; timestamp?: string };
type Review = { summary: string; claims: Array<{ text: string; evidenceIds: string[] }>; uncertainties: string[]; dataQuality: string; evidence: Evidence[]; provider?: string; generatedAt?: string };
const STORAGE_KEY = 'edgex_v2_saved_analysis';

export default function EvidenceReview({ domain = 'markets', subject, evidence }: { domain?: Domain; subject: string; evidence: Evidence[] }) {
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  async function analyze() {
    setLoading(true); setError(''); setSaveMessage(''); setReview(null);
    try {
      const client = getSupabaseBrowserClient();
      const { data } = client ? await client.auth.getSession() : { data: { session: null } };
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (data.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`;
      const response = await fetch('/api/edge-analysis', {
        method: 'POST', headers, cache: 'no-store',
        body: JSON.stringify({ domain, subject, evidence }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error('The explanation service is unavailable.');
      if (!result || typeof result.summary !== 'string' || !Array.isArray(result.claims) || !Array.isArray(result.evidence)) throw new Error('The explanation did not match the expected format.');
      setReview(result as Review);
    } catch {
      setError('A source-cited explanation could not be loaded. The provider evidence remains available above.');
    } finally { setLoading(false); }
  }

  async function saveReview() {
    if (!review) return;
    setSaving(true); setSaveMessage(''); setError('');
    const client = getSupabaseBrowserClient();
    try {
      const { data, error: sessionError } = client ? await client.auth.getSession() : { data: { session: null }, error: null };
      if (sessionError) throw new Error('The account session could not be checked.');
      if (client && data.session) {
        const { error: insertError } = await client.from('saved_analyses').insert({
          domain, subject, title: subject, summary: review.summary,
          evidence: review.evidence, analysis: review,
        });
        if (insertError) throw new Error('The account save failed. Confirm the Supabase migration is applied; nothing was saved locally.');
        setSaveMessage('Saved to your EdgeX account.');
      } else {
        let stored: unknown = [];
        try { stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]'); } catch { stored = []; }
        const items = Array.isArray(stored) ? stored : [];
        const item = { id: crypto.randomUUID(), domain, subject, title: subject, summary: review.summary, evidence: review.evidence, analysis: review, timestamp: new Date().toISOString() };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([item, ...items]));
        setSaveMessage('Saved in this browser only. Sign in to use account-backed storage; this item was not uploaded.');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The review could not be saved.');
    } finally { setSaving(false); }
  }

  return <div className="review-box">
    <button className="button" type="button" onClick={analyze} disabled={loading || !evidence.length}>{loading ? 'Preparing explanation…' : review ? 'Refresh explanation' : 'Explain this evidence'}</button>
    {error ? <p className="review-error" role="status">{error}</p> : null}
    {saveMessage ? <p className="auth-message" role="status">{saveMessage}</p> : null}
    {review ? <section className="review-result" aria-live="polite">
      <div className="card-top"><span className="chip">{review.dataQuality} evidence</span><span className="chip">{review.evidence.length} source item{review.evidence.length === 1 ? '' : 's'}</span></div>
      <p>{review.summary}</p>
      {review.claims.length ? <div className="list">{review.claims.map((claim, index) => <div className="list-row" key={`${claim.evidenceIds.join('-')}-${index}`}><div><strong>{claim.text}</strong><small>Evidence: {claim.evidenceIds.join(', ')}</small></div></div>)}</div> : <div className="empty">No claims were returned because the evidence was insufficient or could not be cited.</div>}
      {review.uncertainties.length ? <p className="review-uncertainty"><strong>Limitations:</strong> {review.uncertainties.join(' ')}</p> : null}
      <details><summary>Source evidence supplied</summary><ul>{review.evidence.map(item => <li key={item.id}><strong>{item.id} · {item.source} · {item.label}:</strong> {String(item.value ?? 'Unavailable')}</li>)}</ul></details>
      <div className="actions"><button className="button" type="button" onClick={saveReview} disabled={saving}>{saving ? 'Saving…' : 'Save this research'}</button></div>
    </section> : null}
  </div>;
}
