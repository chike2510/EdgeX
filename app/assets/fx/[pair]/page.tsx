import type { Metadata } from 'next';
import Link from 'next/link';
import { formatDate, formatPercent, text } from '../../../lib/format';
import { getForexData } from '../../../lib/server-data';

export const revalidate = 30;
export const metadata: Metadata = { title: 'FX reference rate' };

type Props = { params: Promise<{ pair: string }> };

export default async function ForexAssetPage({ params }: Props) {
  const { pair: slug } = await params;
  const [base = 'USD', target = 'EUR'] = slug.toUpperCase().split('-');
  const pair = `${base}/${target}`;
  const result = await getForexData({ base, symbols: target, currency: target });
  const item = Array.isArray(result.pairs) ? result.pairs[0] : null;
  return <>
    <header><span className="eyebrow">Markets · FX reference detail</span><h1>{pair}</h1><p className="lede">Provider reference rate and update date. This is informational context, not a trading signal.</p></header>
    {item ? <section className="card"><div className="metric-grid">
      <div className="metric"><small>Reference rate</small><strong>{typeof item.price === 'number' && Number.isFinite(item.price) ? item.price.toLocaleString('en', { maximumSignificantDigits: 8 }) : 'Unavailable'}</strong></div>
      <div className="metric"><small>Reported change</small><strong>{formatPercent(item.change)}</strong></div>
      <div className="metric"><small>Reference date</small><strong>{text(item.date || result.date)}</strong></div>
      <div className="metric"><small>Provider</small><strong>{text(result.provider, 'Unavailable')}</strong></div>
    </div></section> : <div className="empty">No provider reference rate was returned for {pair}. Unsupported rates remain unavailable.</div>}
    <p className="footer">Provider update: {formatDate(result.fetchedAt)} · <Link href="/markets#forex">Back to Markets</Link></p>
  </>;
}
