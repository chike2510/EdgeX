'use client';

import { useState, type FormEvent } from 'react';

type Initial = { teamId: string; league: string };
type Match = { date: string; opponent: string; score: string; result: 'W' | 'D' | 'L'; isHome: boolean };
type FormResult = { providerLabel?: string; form: Match[]; stats: { played: number; wins: number; draws: number; losses: number; gfpg: string; gapg: string; ppg: string; homeWR: string | null; awayWR: string | null } | null };
const leagues = ['eng.1', 'esp.1', 'ger.1', 'ita.1', 'fra.1', 'uefa.champions', 'uefa.europa'];

export default function TeamFormClient({ initial }: { initial: Initial }) {
  const [teamId, setTeamId] = useState(initial.teamId);
  const [league, setLeague] = useState(leagues.includes(initial.league) ? initial.league : 'eng.1');
  const [result, setResult] = useState<FormResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    const query = new URLSearchParams({ league, teamId: teamId.trim(), limit: '15' });
    try {
      const response = await fetch(`/api/form?${query}`, { method: 'GET', cache: 'no-store', headers: { Accept: 'application/json' } });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || 'Team history is unavailable.');
      setResult(body as FormResult);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Team history is unavailable.');
    } finally {
      setLoading(false);
    }
  }

  return <>
    <form className="research-form card" onSubmit={load}>
      <div className="form-grid">
        <label>Provider team ID<input required value={teamId} onChange={event => setTeamId(event.target.value)} maxLength={80} autoComplete="off" /></label>
        <label>Competition<select value={league} onChange={event => setLeague(event.target.value)}>{leagues.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
      </div>
      <div className="actions"><button className="button" type="submit" disabled={loading || !teamId.trim()}>{loading ? 'Loading completed results…' : 'Load team history'}</button></div>
    </form>
    {error ? <p className="review-error" role="alert">{error}</p> : null}
    {result ? <section className="history-result" aria-live="polite">
      <div className="card-top"><span className="chip">Source · {result.providerLabel || 'Unavailable'}</span><span className="chip">Completed sample · {result.form.length}</span></div>
      {result.stats ? <div className="metric-grid">
        <div className="metric"><small>Observed record</small><strong>{result.stats.wins}–{result.stats.draws}–{result.stats.losses}</strong></div>
        <div className="metric"><small>Goals scored / match</small><strong>{result.stats.gfpg}</strong></div>
        <div className="metric"><small>Goals conceded / match</small><strong>{result.stats.gapg}</strong></div>
        <div className="metric"><small>Observed home/away win rate</small><strong>{result.stats.homeWR ?? 'Unavailable'} / {result.stats.awayWR ?? 'Unavailable'}</strong></div>
      </div> : null}
      {result.form.length ? <div className="table-wrap"><table><thead><tr><th>Date</th><th>Opponent</th><th>Venue</th><th>Verified score</th><th>Past result</th></tr></thead><tbody>{result.form.map((match, index) => <tr key={`${match.date}-${index}`}><td>{Number.isFinite(new Date(match.date).getTime()) ? new Date(match.date).toLocaleDateString() : 'Unavailable'}</td><td>{match.opponent || 'Unavailable'}</td><td>{match.isHome ? 'Home' : 'Away'}</td><td>{match.score}</td><td>{match.result}</td></tr>)}</tbody></table></div> : <div className="empty">No completed provider results with verified scorelines were returned.</div>}
      <div className="notice">All results are historical and descriptive. Missing scores are omitted; no result is inferred from a winner flag alone.</div>
    </section> : null}
  </>;
}
