import type { Metadata } from 'next';
import PlayerHistoryClient from '../../components/player-history-client';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Player research' };

type Query = Record<string, string | string[] | undefined>;
type Props = { searchParams: Promise<Query> };
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default async function PlayerResearchPage({ searchParams }: Props) {
  const query = await searchParams;
  return <>
    <header><span className="eyebrow">Sports · player evidence</span><h1>Player history</h1><p className="lede">Review provider-reported appearances and observed statistics. EdgeX does not show player prop lines or forecasts.</p></header>
    <div className="notice">Enter the provider team ID and either a player ID or name. The available sample depends on published provider lineups; missing observations stay unavailable.</div>
    <PlayerHistoryClient initial={{ teamId: first(query.teamId) || '', playerId: first(query.playerId) || '', playerName: first(query.playerName) || '', eventId: first(query.eventId) || '', metric: first(query.metric) || 'saves' }} />
  </>;
}
