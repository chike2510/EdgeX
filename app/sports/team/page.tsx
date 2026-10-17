import type { Metadata } from 'next';
import TeamFormClient from '../../components/team-form-client';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Team research' };

type Query = Record<string, string | string[] | undefined>;
type Props = { searchParams: Promise<Query> };
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default async function TeamResearchPage({ searchParams }: Props) {
  const query = await searchParams;
  return <>
    <header><span className="eyebrow">Sports · team evidence</span><h1>Team form</h1><p className="lede">Inspect completed provider-reported results and descriptive totals. This page does not estimate future outcomes.</p></header>
    <div className="notice">Enter a provider team ID and competition code. Only completed fixtures with verified scores are included; incomplete or unavailable observations are omitted.</div>
    <TeamFormClient initial={{ teamId: first(query.teamId) || '', league: first(query.league) || 'eng.1' }} />
  </>;
}
