import Link from 'next/link';
import { formatDate, text } from '../lib/format';

type Props = { events: any[] };

function details(event: any) {
  const competition = event.competitions?.[0];
  const teams = competition?.competitors || [];
  const home = teams.find((team: any) => team.homeAway === 'home') || teams[0];
  const away = teams.find((team: any) => team.homeAway === 'away') || teams[1];
  const names = home?.team?.displayName && away?.team?.displayName
    ? `${home.team.displayName} vs ${away.team.displayName}`
    : text(event.shortName || event.name, 'Fixture names unavailable');
  const status = competition?.status?.type || {};
  const state = status.completed || status.state === 'post' ? 'Completed' : status.state === 'in' ? 'Live' : status.state === 'pre' ? 'Scheduled' : text(status.description || status.name, 'Status unavailable');
  const scores = [home?.score, away?.score].every(value => value !== undefined && value !== null) ? `${home.score}–${away.score}` : 'Score unavailable';
  return { names, state, scores };
}

export default function FixtureList({ events }: Props) {
  if (!events.length) return <div className="empty">No fixtures were returned for this date and competition. Try again later; EdgeX does not create placeholder fixtures.</div>;
  return <div className="list">{events.map((event, index) => {
    const item = details(event);
    const id = event.id == null ? '' : String(event.id);
    return <article className="list-row" key={id || index}>
      <div><strong>{id ? <Link href={`/sports/fixture/${encodeURIComponent(id)}`}>{item.names}</Link> : item.names}</strong><small>{item.state} · {formatDate(event.date)}</small></div>
      <span className="list-value">{item.scores}</span>
    </article>;
  })}</div>;
}
