import type { Metadata } from 'next';
import Link from 'next/link';
import MarketList from '../../components/market-list';
import { getMarketsData } from '../../lib/server-data';

export const revalidate = 30;
export const metadata: Metadata = { title: 'Market detail' };

type Props = { params: Promise<{ id: string }> };

export default async function MarketDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await getMarketsData({ limit: '50' });
  const markets = Array.isArray(result.markets) ? result.markets : [];
  const selected = markets.filter((market: any) => String(market.id || '') === id || String(market.parentId || '') === id).slice(0, 1);
  return <>
    <header><span className="eyebrow">Markets · provider detail</span><h1>Market detail</h1><p className="lede">Provider-reported outcome prices are context from the market, not an EdgeX forecast or recommendation.</p></header>
    {selected.length ? <MarketList markets={selected} /> : <div className="empty">No matching market was returned. Provider prices and source details are not estimated.</div>}
    <p className="footer"><Link href="/markets">Back to Markets</Link></p>
  </>;
}
