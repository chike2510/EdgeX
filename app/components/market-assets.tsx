import Link from 'next/link';
import { formatPercent, formatUsd, text } from '../lib/format';

type Props = { crypto: any[]; forex: any[]; forexDate?: string | null };

function forexHref(symbol: string) {
  const parts = symbol.toUpperCase().split(/[/-]/).filter(Boolean);
  const slug = parts.length >= 2 ? `${parts[0]}-${parts[1]}` : symbol.toUpperCase().replace(/[^A-Z0-9]+/g, '-');
  return `/assets/fx/${encodeURIComponent(slug)}`;
}

export default function MarketAssets({ crypto, forex, forexDate }: Props) {
  return <>
    <section id="crypto" className="section-head"><div><span className="eyebrow">Digital assets</span><h2>Crypto context</h2></div><p>Provider values only; no signals, targets, or instructions.</p></section>
    {crypto.length ? <div className="table-wrap"><table><thead><tr><th>Asset</th><th>Price (USD)</th><th>24h movement</th><th>Market cap</th><th>Volume (24h)</th></tr></thead><tbody>{crypto.map((asset, index) => {
      const symbol = String(asset.symbol || asset.id || '').toUpperCase();
      return <tr key={asset.id || index}><td><strong><Link href={`/assets/${encodeURIComponent(symbol)}`}>{text(asset.name)}</Link></strong><small> · {symbol || 'Symbol unavailable'}</small></td><td>{formatUsd(asset.current_price)}</td><td>{formatPercent(asset.price_change_percentage_24h)}</td><td>{formatUsd(asset.market_cap)}</td><td>{formatUsd(asset.total_volume)}</td></tr>;
    })}</tbody></table></div> : <div className="empty">Crypto provider data is unavailable. No sample values are shown.</div>}

    <section id="forex" className="section-head"><div><span className="eyebrow">Reference rates</span><h2>Foreign exchange</h2></div><p>{forexDate ? `Provider date: ${forexDate}` : 'Provider date unavailable'}</p></section>
    {forex.length ? <div className="table-wrap"><table><thead><tr><th>Pair</th><th>Reference rate</th><th>Daily change</th><th>Reference date</th></tr></thead><tbody>{forex.map((pair, index) => {
      const symbol = String(pair.symbol || '');
      return <tr key={symbol || index}><td><strong><Link href={forexHref(symbol)}>{text(symbol)}</Link></strong></td><td>{typeof pair.price === 'number' && Number.isFinite(pair.price) ? pair.price.toLocaleString('en', { maximumSignificantDigits: 8 }) : 'Unavailable'}</td><td>{formatPercent(pair.change)}</td><td>{text(pair.date || forexDate, 'Unavailable')}</td></tr>;
    })}</tbody></table></div> : <div className="empty">Reference rates are unavailable. Missing rates and historical comparisons remain unavailable rather than inferred.</div>}
  </>;
}
