import Link from 'next/link';
import { formatDate, formatPercent, formatProbability, formatUsd, text } from './lib/format';
import { getCryptoData, getForexData, getMarketsData, getSportsData } from './lib/server-data';

export const revalidate = 30;

function eventLabel(event: any) {
  const competition = event.competitions?.[0];
  const teams = competition?.competitors || [];
  const home = teams.find((team: any) => team.homeAway === 'home') || teams[0];
  const away = teams.find((team: any) => team.homeAway === 'away') || teams[1];
  if (home?.team?.displayName && away?.team?.displayName) return `${home.team.displayName} vs ${away.team.displayName}`;
  return text(event.shortName || event.name, 'Fixture names unavailable');
}

function eventState(event: any) {
  const type = event.competitions?.[0]?.status?.type || {};
  const state = String(type.state || type.name || '').toLowerCase();
  if (state === 'in' || state.includes('live')) return 'Live';
  if (type.completed || state === 'post' || state.includes('final')) return 'Completed';
  if (state === 'pre' || state.includes('scheduled')) return 'Scheduled';
  return 'Status unavailable';
}

export default async function OverviewPage() {
  const [sports, marketData, cryptoData, forexData] = await Promise.all([
    getSportsData(), getMarketsData({ limit: '12' }), getCryptoData({ per_page: '10' }), getForexData(),
  ]);
  const fixtures = Array.isArray(sports.events) ? sports.events.slice(0, 3) : [];
  const markets = Array.isArray(marketData.markets) ? marketData.markets.slice(0, 3) : [];
  const crypto = Array.isArray(cryptoData.data) ? cryptoData.data.slice(0, 3) : [];
  const forex = Array.isArray(forexData.pairs) ? forexData.pairs.slice(0, 3) : [];
  const liveCount = Array.isArray(sports.events) ? sports.events.filter((event: any) => eventState(event) === 'Live').length : 0;

  return (
    <>
      <section className="hero">
        <span className="eyebrow">Evidence first · provider sourced</span>
        <h1>Read the context.<br />See what is missing.</h1>
        <p className="lede">EdgeX brings together current sports and market information, with source freshness and unavailable data shown plainly. It focuses on evidence and context, not calls to action.</p>
        <div className="actions"><Link className="button" href="/sports">Explore Sports</Link><Link className="button" href="/markets">Explore Markets</Link></div>
      </section>

      <section className="metric-grid" aria-label="Current provider coverage">
        <div className="metric"><small>Football fixtures returned</small><strong>{Array.isArray(sports.events) ? sports.events.length : 0}</strong></div>
        <div className="metric"><small>Live in returned sample</small><strong>{liveCount}</strong></div>
        <div className="metric"><small>Public markets returned</small><strong>{Array.isArray(marketData.markets) ? marketData.markets.length : 0}</strong></div>
        <div className="metric"><small>Markets provider check</small><strong>{marketData.dataQuality === 'unavailable' ? 'Unavailable' : formatDate(marketData.fetchedAt)}</strong></div>
      </section>

      <div className="section-head"><div><span className="eyebrow">A current sample</span><h2>Provider-backed snapshots</h2></div><p>Only values returned by providers are displayed.</p></div>
      <div className="grid">
        <section className="card">
          <div className="card-top"><div><span className="eyebrow">Sports</span><h3>Football fixtures</h3></div><span className="chip">{text(sports.provider, 'Source unavailable')}</span></div>
          {fixtures.length ? <div className="list">{fixtures.map((event: any, index: number) => <div className="list-row" key={event.id || index}><div><strong>{eventLabel(event)}</strong><small>{eventState(event)} · {formatDate(event.date)}</small></div><span className="list-value">{event.competitions?.[0]?.competitors?.map((team: any) => team.score ?? null).filter((score: unknown) => score !== null).join('–') || 'Score unavailable'}</span></div>)}</div> : <div className="empty">No fixtures were returned for the selected date and competition.</div>}
          <div className="actions"><Link className="button" href="/sports">Open Sports</Link></div>
        </section>

        <section className="card">
          <div className="card-top"><div><span className="eyebrow">Prediction markets</span><h3>Public market questions</h3></div><span className="chip">Provider prices</span></div>
          {markets.length ? <div className="list">{markets.map((market: any, index: number) => <div className="list-row" key={market.id || index}><div><strong>{text(market.question, 'Market question unavailable')}</strong><small>{text(market.category, 'Category unavailable')} · market-reported leading outcome</small></div><span className="list-value">{formatProbability(market.probability)}</span></div>)}</div> : <div className="empty">Market data is currently unavailable. No estimate is substituted.</div>}
          <div className="actions"><Link className="button" href="/markets">Open Markets</Link></div>
        </section>

        <section className="card">
          <div className="card-top"><div><span className="eyebrow">Crypto</span><h3>Market context</h3></div><span className="chip">CoinGecko</span></div>
          {crypto.length ? <div className="list">{crypto.map((asset: any, index: number) => <div className="list-row" key={asset.id || index}><div><strong>{text(asset.name)} <small>{text(asset.symbol, '').toUpperCase()}</small></strong><small>Provider-reported 24h change</small></div><span className="list-value">{formatUsd(asset.current_price)}<small>{formatPercent(asset.price_change_percentage_24h)}</small></span></div>)}</div> : <div className="empty">Crypto values are unavailable from the provider.</div>}
          <div className="actions"><Link className="button" href="/markets#crypto">Open Markets</Link></div>
        </section>

        <section className="card">
          <div className="card-top"><div><span className="eyebrow">Foreign exchange</span><h3>Reference rates</h3></div><span className="chip">ECB reference</span></div>
          {forex.length ? <div className="list">{forex.map((pair: any, index: number) => <div className="list-row" key={pair.symbol || index}><div><strong>{text(pair.symbol)}</strong><small>{text(pair.date || forexData.date, 'Reference date unavailable')}</small></div><span className="list-value">{typeof pair.price === 'number' ? pair.price.toLocaleString('en', { maximumSignificantDigits: 7 }) : 'Unavailable'}<small>{formatPercent(pair.change)}</small></span></div>)}</div> : <div className="empty">Reference rates are unavailable. Missing rates are not filled with estimates.</div>}
          <div className="actions"><Link className="button" href="/markets#forex">Open Markets</Link></div>
        </section>
      </div>

      <p className="footer">Sports and market data can be delayed or incomplete. Provider-reported prices describe a snapshot, not EdgeX forecasts. Every unavailable value remains explicitly unavailable.</p>
    </>
  );
}
