import type { Metadata } from 'next';
import FixtureList from '../components/fixture-list';
import MarketList from '../components/market-list';
import { formatDate, formatPercent, formatUsd, text } from '../lib/format';
import { getCryptoData, getForexData, getMarketsData, getSportsData } from '../lib/server-data';

export const revalidate = 30;
export const metadata: Metadata = { title: 'Research detail' };

type Query = Record<string, string | string[] | undefined>;
type Props = { searchParams: Promise<Query> };
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default async function DetailPage({ searchParams }: Props) {
  const query = await searchParams;
  const type = (first(query.type) || 'generic').toLowerCase();
  const id = first(query.id) || first(query.eventId) || first(query.marketId) || '';

  if (type === 'fixture' || type === 'league') {
    const result = await getSportsData({ sport: 'soccer', league: first(query.league) || 'eng.1', event_id: id });
    const events = Array.isArray(result.events) ? result.events : [];
    return <><header><span className="eyebrow">Sports · provider detail</span><h1>Fixture detail</h1><p className="lede">This page displays only fixture details returned by the sports provider.</p></header>{events.length ? <section className="card"><FixtureList events={events} /></section> : <div className="empty">No fixture detail was returned for this identifier. The provider response may not include this fixture or competition.</div>}<p className="footer">No predicted outcome is shown. Missing statistics, form, or lineups remain unavailable.</p></>;
  }

  if (type === 'market') {
    const result = await getMarketsData({ limit: '50' });
    const markets = Array.isArray(result.markets) ? result.markets : [];
    const selected = markets.filter((item: any) => !id || String(item.id) === id || String(item.parentId) === id).slice(0, 1);
    return <><header><span className="eyebrow">Markets · provider detail</span><h1>Market detail</h1><p className="lede">Provider-reported prices and event context, not an EdgeX forecast.</p></header><MarketList markets={selected} /></>;
  }

  if (type === 'crypto') {
    const symbol = first(query.symbol) || first(query.asset) || first(query.coin) || first(query.id) || 'BTC';
    const result = await getCryptoData({ symbol });
    const assets = Array.isArray(result.data) ? result.data : [];
    const asset = assets.find((item: any) => String(item.symbol || item.id || '').toLowerCase() === symbol.toLowerCase());
    return <><header><span className="eyebrow">Markets · crypto provider detail</span><h1>{asset ? `${text(asset.name)} (${text(asset.symbol, '').toUpperCase()})` : symbol}</h1><p className="lede">Current provider-supplied values only; no generated signals, price targets, or instructions.</p></header>{asset ? <section className="card"><div className="metric-grid"><div className="metric"><small>Price (USD)</small><strong>{formatUsd(asset.current_price)}</strong></div><div className="metric"><small>24h movement</small><strong>{formatPercent(asset.price_change_percentage_24h)}</strong></div><div className="metric"><small>Market cap</small><strong>{formatUsd(asset.market_cap)}</strong></div><div className="metric"><small>Provider</small><strong>{text(result.provider)}</strong></div></div><p>Provider update: {formatDate(result.fetchedAt)}. Missing values are not estimated.</p></section> : <div className="empty">No provider data was returned for this asset.</div>}</>;
  }

  if (type === 'forex') {
    const pair = (first(query.pair) || 'USD/EUR').toUpperCase().replace(/-/g, '/');
    const [base, target] = pair.split('/');
    const result = await getForexData({ base: base || 'USD', symbols: target || 'EUR', currency: target || 'EUR' });
    const item = Array.isArray(result.pairs) ? result.pairs[0] : null;
    return <><header><span className="eyebrow">Markets · FX reference detail</span><h1>{pair}</h1><p className="lede">Reference rate supplied by the provider. This is not a trading signal.</p></header>{item ? <section className="card"><div className="metric-grid"><div className="metric"><small>Reference rate</small><strong>{typeof item.price === 'number' ? item.price.toLocaleString('en', { maximumSignificantDigits: 8 }) : 'Unavailable'}</strong></div><div className="metric"><small>Change</small><strong>{formatPercent(item.change)}</strong></div><div className="metric"><small>Reference date</small><strong>{text(item.date || result.date)}</strong></div><div className="metric"><small>Provider</small><strong>{text(result.provider)}</strong></div></div></section> : <div className="empty">No provider data was returned for this pair. Unsupported rates remain unavailable.</div>}</>;
  }

  return <><header><span className="eyebrow">Unified detail route</span><h1>Research detail</h1><p className="lede">Choose a supported Sports or Markets item to see provider-backed details.</p></header><div className="empty">No supported detail type was supplied. The old deep link is preserved, but EdgeX will not invent missing detail data.</div></>;
}
