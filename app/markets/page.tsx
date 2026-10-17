import type { Metadata } from 'next';
import MarketAssets from '../components/market-assets';
import MarketList from '../components/market-list';
import { formatDate, text } from '../lib/format';
import { getCryptoData, getForexData, getMarketsData } from '../lib/server-data';

export const revalidate = 30;
export const metadata: Metadata = { title: 'Markets' };

export default async function MarketsPage() {
  const [marketData, cryptoData, forexData] = await Promise.all([
    getMarketsData({ limit: '50' }), getCryptoData({ per_page: '30' }), getForexData(),
  ]);
  const markets = Array.isArray(marketData.markets) ? marketData.markets : [];
  const crypto = Array.isArray(cryptoData.data) ? cryptoData.data : [];
  const forex = Array.isArray(forexData.pairs) ? forexData.pairs : [];
  return <>
    <header><span className="eyebrow">Markets research</span><h1>Markets</h1><p className="lede">A single view of public prediction-market context, provider-reported crypto values, and foreign-exchange reference rates.</p></header>
    <div className="metric-grid">
      <div className="metric"><small>Public markets</small><strong>{markets.length}</strong></div>
      <div className="metric"><small>Crypto assets</small><strong>{crypto.length}</strong></div>
      <div className="metric"><small>FX pairs</small><strong>{forex.length}</strong></div>
      <div className="metric"><small>Market data retrieved</small><strong>{formatDate(marketData.fetchedAt)}</strong></div>
    </div>
    <div className="notice">Market-reported outcome prices are not EdgeX forecasts. Crypto and FX values are informational provider data; EdgeX does not present trading directions or targets.</div>
    <section><div className="section-head"><div><span className="eyebrow">Public market context · {text(marketData.provider, 'Provider unavailable')}</span><h2>Prediction markets</h2></div><p>{markets.length ? `${markets.length} returned` : 'No provider data'}</p></div><MarketList markets={markets.slice(0, 30)} /></section>
    <MarketAssets crypto={crypto} forex={forex} forexDate={forexData.date || null} />
    <p className="footer">All numbers come from the named providers and may be delayed. Missing, stale, or unsupported fields are shown as unavailable rather than guessed.</p>
  </>;
}
