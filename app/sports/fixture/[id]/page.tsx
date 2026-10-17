import type { Metadata } from 'next';
import Link from 'next/link';
import FixtureList from '../../../components/fixture-list';
import { formatDate, text } from '../../../lib/format';
import { getSportsData } from '../../../lib/server-data';

export const revalidate = 30;
export const metadata: Metadata = { title: 'Fixture detail' };

type Props = { params: Promise<{ id: string }> };

export default async function FixtureDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await getSportsData({ sport: 'soccer', league: 'eng.1', event_id: id });
  const events = Array.isArray(result.events) ? result.events : [];
  return <>
    <header><span className="eyebrow">Sports · provider detail</span><h1>Fixture detail</h1><p className="lede">This route shows only provider-returned fixture information. No outcome forecast is generated.</p></header>
    <div className="metric-grid">
      <div className="metric"><small>Source</small><strong>{text(result.provider, 'Unavailable')}</strong></div>
      <div className="metric"><small>Retrieved</small><strong>{formatDate(result.fetchedAt)}</strong></div>
      <div className="metric"><small>Returned fixtures</small><strong>{events.length}</strong></div>
      <div className="metric"><small>Provider quality</small><strong>{text(result.dataQuality, 'Unavailable')}</strong></div>
    </div>
    {events.length ? <section className="card"><FixtureList events={events} /></section> : <div className="empty">The provider returned no detail for this fixture identifier. Missing statistics, lineups, or history remain unavailable.</div>}
    <p className="footer"><Link href="/sports">Back to Sports</Link> · Data may be delayed or incomplete.</p>
  </>;
}
