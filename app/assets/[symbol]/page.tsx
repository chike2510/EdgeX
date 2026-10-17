import type { Metadata } from 'next';
import Link from 'next/link';
import { formatDate, formatPercent, formatUsd, text } from '../../lib/format';
import { getCryptoData } from '../../lib/server-data';

export const revalidate = 30;
export const metadata: Metadata = { title: 'Crypto asset detail' };

type Props = { params: Promise<{ symbol: string }> };

export default async function CryptoAssetPage({ params }: Props) {
  const { symbol } = await params;
  const result = await getCryptoData({ per_page: '100', symbol: symbol.toUpperCase() });
  const assets = Array.isArray(result.data) ? result.data : [];
  const asset = assets.find((item: any) => String(item.symbol || item.id || '').toLowerCase() === symbol.toLowerCase());
  return <>
    <header><span className="eyebrow">Markets · Crypto provider detail</span><h1>{asset ? `${text(asset.name)} (${text(asset.symbol, '').toUpperCase()})` : symbol.toUpperCase()}</h1><p className="lede">Provider-supplied market context only. EdgeX does not generate trading directions or price targets.</p></header>
    {asset ? <section className="card"><div className="metric-grid">
      <div className="metric"><small>Price (USD)</small><strong>{formatUsd(asset.current_price)}</strong></div>
      <div className="metric"><small>24h movement</small><strong>{formatPercent(asset.price_change_percentage_24h)}</strong></div>
      <div className="metric"><small>Market cap</small><strong>{formatUsd(asset.market_cap)}</strong></div>
      <div className="metric"><small>Provider</small><strong>{text(result.provider, 'Unavailable')}</strong></div>
    </div><p>Provider update: {formatDate(result.fetchedAt)}. Missing values are not estimated.</p></section> : <div className="empty">No provider data was returned for {symbol.toUpperCase()}.</div>}
    <p className="footer"><Link href="/markets#crypto">Back to Markets</Link></p>
  </>;
}
