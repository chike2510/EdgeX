import type { Metadata } from 'next';
import Link from 'next/link';
import FixtureList from '../components/fixture-list';
import { formatDate, text } from '../lib/format';
import { getSportsData } from '../lib/server-data';

export const revalidate = 30;
export const metadata: Metadata = { title: 'Sports' };

export default async function SportsPage() {
  const result = await getSportsData();
  const events = Array.isArray(result.events) ? result.events : [];
  const providerChain = Array.isArray(result.providerChain) ? result.providerChain : [];
  return <>
    <header><span className="eyebrow">Sports research</span><h1>Football</h1><p className="lede">Fixtures, verified historical team results, and player evidence with sample size and source limitations. EdgeX does not generate outcome recommendations.</p></header>
    <div className="metric-grid">
      <div className="metric"><small>Fixtures returned</small><strong>{events.length}</strong></div>
      <div className="metric"><small>Primary source</small><strong>{text(result.provider, 'Unavailable')}</strong></div>
      <div className="metric"><small>Retrieved</small><strong>{formatDate(result.fetchedAt)}</strong></div>
      <div className="metric"><small>Coverage state</small><strong>{text(result.dataQuality, events.length ? 'Available' : 'Unavailable')}</strong></div>
    </div>
    {providerChain.length ? <div className="notice">Provider chain: {providerChain.map((step: any) => `${text(step.provider)} — ${text(step.status)} (${Number.isFinite(Number(step.returned)) ? step.returned : 'count unavailable'} returned)`).join(' · ')}</div> : null}
    <div className="actions"><Link className="button" href="/sports/team">Team history research</Link><Link className="button" href="/sports/player">Player history research</Link></div>
    <section className="card"><div className="card-top"><div><span className="eyebrow">Current provider sample</span><h2>Fixtures</h2></div><span className="chip">{new Date().toISOString().slice(0, 10)} · date filter</span></div><FixtureList events={events} /></section>
    <section className="card"><span className="eyebrow">Competition context</span><h2>Standings</h2><p className="notice">Standings are unavailable: the current ESPN and SportAPI adapters do not expose a validated league-table contract. EdgeX does not derive a table from an incomplete fixture sample.</p></section>
    <p className="footer">Coverage is limited to returned provider data. Missing history and statistics are not synthesized; fixture data can be delayed, incomplete, or unavailable.</p>
  </>;
}
