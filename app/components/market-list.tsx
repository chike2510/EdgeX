import Link from 'next/link';
import { formatDate, formatProbability, text } from '../lib/format';
import EvidenceReview from './evidence-review';

type Props = { markets: any[] };

export default function MarketList({ markets }: Props) {
  if (!markets.length) return <div className="empty">No public markets were returned. EdgeX will not substitute synthetic questions or estimated prices.</div>;
  return <div className="grid">{markets.map((market, index) => {
    const outcomes = Array.isArray(market.outcomes) ? market.outcomes : [];
    const hasReportedProbability = market.probability !== null && market.probability !== undefined && Number.isFinite(Number(market.probability));
    const leading = hasReportedProbability ? market.outcomes?.find((item: any) => item.probability !== null && Number(item.probability) === Number(market.probability)) : null;
    const id = market.id == null ? '' : String(market.id);
    return <article className="card" key={id || index}>
      <div className="card-top"><span className="chip">{text(market.category, 'Category unavailable')}</span><span className="chip">Provider price</span></div>
      {market.subject ? <span className="eyebrow">{text(market.subject)}</span> : null}
      <h3>{id ? <Link href={`/markets/${encodeURIComponent(id)}`}>{text(market.question, 'Market question unavailable')}</Link> : text(market.question, 'Market question unavailable')}</h3>
      {outcomes.length ? <div className="list">{outcomes.map((outcome: any, outcomeIndex: number) => <div className="list-row" key={outcome.id || outcomeIndex}><div><strong>{text(outcome.label || outcome.name, 'Outcome name unavailable')}</strong><small>Provider-reported outcome price</small></div><span className="list-value">{formatProbability(outcome.probability ?? outcome.price)}</span></div>)}</div> : <div className="empty">Outcome labels unavailable; the returned market price cannot be interpreted safely.</div>}
      <div className="stat-row"><div className="stat"><small>Leading outcome</small><strong>{text(leading?.label, 'Unavailable')}</strong></div><div className="stat"><small>Market-reported price</small><strong>{formatProbability(market.probability)}</strong></div><div className="stat"><small>Resolution</small><strong>{formatDate(market.resolutionDate)}</strong></div></div>
      <p>Provider-reported market prices are a snapshot, not an EdgeX forecast or recommendation.</p>
      <EvidenceReview domain="markets" subject={text(market.question, 'Market question unavailable')} evidence={[
        { id: 'market-question', source: 'Bayse', label: 'Public market question', value: market.question || null, timestamp: market.sourceTimestamp },
        { id: 'market-outcomes', source: 'Bayse', label: 'Named outcomes and provider prices', value: outcomes.map((outcome: any) => `${text(outcome.label || outcome.name)}: ${formatProbability(outcome.probability ?? outcome.price)}`).join('; ') || null, timestamp: market.sourceTimestamp },
        { id: 'market-volume', source: 'Bayse', label: 'Reported market volume', value: typeof market.volume === 'number' ? market.volume : null, timestamp: market.sourceTimestamp },
        { id: 'market-resolution', source: 'Bayse', label: 'Resolution date', value: market.resolutionDate || null, timestamp: market.sourceTimestamp },
      ]} />
    </article>;
  })}</div>;
}
