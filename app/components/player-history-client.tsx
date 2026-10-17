'use client';

import { useState, type FormEvent } from 'react';

type Initial = { teamId: string; playerId: string; playerName: string; eventId: string; metric: string };
type Appearance = { eventId: string; date: string; opponent: string; score: string; value: number | null; minutes: number | null; position: string | null; started: boolean };
type History = { metric: string; evidenceState: string; evidence: { sampleSize: number; metricSample: number; minutesSample: number; currentLineup: string }; distribution: { average: number | null; maximum: number | null; minimum: number | null }; appearances: Appearance[] };
const metrics = ['saves', 'shots', 'shotsOnTarget', 'goals', 'assists', 'tackles', 'fouls', 'passes'];

export default function PlayerHistoryClient({ initial }: { initial: Initial }) {
  const [teamId, setTeamId] = useState(initial.teamId);
  const [playerId, setPlayerId] = useState(initial.playerId);
  const [playerName, setPlayerName] = useState(initial.playerName);
  const [eventId, setEventId] = useState(initial.eventId);
  const [metric, setMetric] = useState(metrics.includes(initial.metric) ? initial.metric : 'saves');
  const [history, setHistory] = useState<History | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setHistory(null);
    setLoading(true);
    const query = new URLSearchParams({ teamId, metric });
    if (playerId.trim()) query.set('playerId', playerId.trim());
    if (playerName.trim()) query.set('playerName', playerName.trim());
    if (eventId.trim()) query.set('eventId', eventId.trim());
    try {
      const response = await fetch(`/api/player-history?${query}`, { method: 'GET', cache: 'no-store', headers: { Accept: 'application/json' } });
      const result = await response.json();
      if (!response.ok || !result?.data) throw new Error(result?.error || 'Player history is unavailable.');
      setHistory(result.data as History);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Player history is unavailable.');
    } finally {
      setLoading(false);
    }
  }

  return <>
    <form className="research-form card" onSubmit={search}>
      <div className="form-grid">
        <label>Provider team ID<input required value={teamId} onChange={event => setTeamId(event.target.value)} maxLength={80} autoComplete="off" /></label>
        <label>Player ID (if known)<input value={playerId} onChange={event => setPlayerId(event.target.value)} maxLength={80} autoComplete="off" /></label>
        <label>Player name<input value={playerName} onChange={event => setPlayerName(event.target.value)} maxLength={120} autoComplete="off" /></label>
        <label>Observed statistic<select value={metric} onChange={event => setMetric(event.target.value)}>{metrics.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
        <label>Current event ID (optional)<input value={eventId} onChange={event => setEventId(event.target.value)} maxLength={80} autoComplete="off" /></label>
      </div>
      <div className="actions"><button className="button" type="submit" disabled={loading || !teamId.trim() || (!playerId.trim() && !playerName.trim())}>{loading ? 'Loading provider history…' : 'Load observed history'}</button></div>
    </form>
    {error ? <p className="review-error" role="alert">{error}</p> : null}
    {history ? <section className="history-result" aria-live="polite">
      <div className="card-top"><span className="chip">{history.evidenceState.replaceAll('_', ' ')}</span><span className="chip">Provider sample · {history.evidence.sampleSize} appearances</span></div>
      <div className="metric-grid">
        <div className="metric"><small>Metric observations</small><strong>{history.evidence.metricSample}</strong></div>
        <div className="metric"><small>Observed average</small><strong>{history.distribution.average ?? 'Unavailable'}</strong></div>
        <div className="metric"><small>Observed minimum–maximum</small><strong>{history.distribution.minimum ?? 'Unavailable'} – {history.distribution.maximum ?? 'Unavailable'}</strong></div>
        <div className="metric"><small>Minutes observations</small><strong>{history.evidence.minutesSample}</strong></div>
      </div>
      {history.appearances.length ? <div className="table-wrap"><table><thead><tr><th>Date</th><th>Opponent</th><th>Observed score</th><th>{history.metric}</th><th>Minutes</th><th>Role</th></tr></thead><tbody>{history.appearances.map(item => <tr key={item.eventId}><td>{Number.isFinite(new Date(item.date).getTime()) ? new Date(item.date).toLocaleDateString() : 'Unavailable'}</td><td>{item.opponent || 'Unavailable'}</td><td>{item.score || 'Unavailable'}</td><td>{item.value ?? 'Unavailable'}</td><td>{item.minutes ?? 'Unavailable'}</td><td>{item.position || (item.started ? 'Starter' : 'Unavailable')}</td></tr>)}</tbody></table></div> : <div className="empty">No matching player observations were returned from published provider lineups.</div>}
      <div className="notice">These are historical provider observations, not a forecast or player line. The sample can be incomplete and does not imply a future result.</div>
    </section> : null}
  </>;
}
