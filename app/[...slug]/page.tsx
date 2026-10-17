import { notFound, redirect } from 'next/navigation';

type SearchParams = Record<string, string | string[] | undefined>;
type Props = { params: Promise<{ slug: string[] }>; searchParams: Promise<SearchParams> };

const destinations: Record<string, string> = {
  'index.html': '/', 'home.html': '/', 'football.html': '/sports',
  'events.html': '/markets', 'markets.html': '/markets', 'crypto.html': '/markets#crypto', 'forex.html': '/markets#forex',
  'search.html': '/markets', 'saved-analysis.html': '/saved', 'profile.html': '/saved', 'favorites.html': '/saved',
  'notifications.html': '/saved', 'history.html': '/saved', 'settings.html': '/saved',
  'squads.html': '/sports/player', 'player-edge-details.html': '/sports/player',
};
const parked: Record<string, string> = {
  'basketball.html': 'Basketball', 'weather.html': 'Weather', 'memecoins.html': 'Memecoins',
  'bankroll.html': 'Legacy account activity',
};
const detailTypes: Record<string, string> = {
  'fixture-details.html': 'fixture', 'league-details.html': 'league', 'market-details.html': 'market',
  'crypto-details.html': 'crypto', 'forex-details.html': 'forex', 'detail.html': 'generic',
};

function values(value: string | string[] | undefined) {
  return Array.isArray(value) ? value : value ? [value] : [];
}
function first(query: SearchParams, ...keys: string[]) {
  for (const key of keys) {
    const value = values(query[key]).find(item => item.trim());
    if (value) return value;
  }
  return '';
}
function appendQuery(destination: string, params: SearchParams, type?: string) {
  const query = new URLSearchParams();
  if (type) query.set('type', type);
  for (const [key, value] of Object.entries(params)) {
    if (key === 'type' && type) continue;
    if (typeof value === 'string') query.set(key, value);
    else if (Array.isArray(value)) for (const item of value) query.append(key, item);
  }
  const [path, hash] = destination.split('#');
  const suffix = query.toString();
  return `${path}${suffix ? `?${suffix}` : ''}${hash ? `#${hash}` : ''}`;
}
function redirectDetail(type: string, query: SearchParams): never {
  if (type === 'fixture' || type === 'league') {
    const id = first(query, 'eventId', 'fixtureId', 'id');
    if (!id) redirect('/sports');
    const league = first(query, 'league');
    redirect(`/sports/fixture/${encodeURIComponent(id)}${league ? `?league=${encodeURIComponent(league)}` : ''}`);
  }
  if (type === 'market') {
    const id = first(query, 'marketId', 'market_id', 'id');
    redirect(id ? `/markets/${encodeURIComponent(id)}` : '/markets');
  }
  if (type === 'crypto') {
    const symbol = first(query, 'symbol', 'asset', 'coin', 'id');
    redirect(symbol ? `/assets/${encodeURIComponent(symbol.toUpperCase())}` : '/markets#crypto');
  }
  if (type === 'forex') {
    const pair = first(query, 'pair', 'symbol', 'id');
    if (!pair) redirect('/markets#forex');
    const slug = pair.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');
    redirect(`/assets/fx/${encodeURIComponent(slug)}`);
  }
  if (type === 'player') redirect(appendQuery('/sports/player', query));
  redirect(appendQuery('/detail', query, type));
}

export default async function LegacyRoute({ params, searchParams }: Props): Promise<never> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  if (slug.length !== 1) notFound();
  const legacyName = slug[0].toLowerCase();
  if (detailTypes[legacyName]) {
    const resolvedType = detailTypes[legacyName] === 'generic' ? first(query, 'type') || 'generic' : detailTypes[legacyName];
    redirectDetail(resolvedType, query);
  }
  if (parked[legacyName]) redirect(appendQuery('/parked', { ...query, section: parked[legacyName] }));
  if (destinations[legacyName]) redirect(appendQuery(destinations[legacyName], query));
  notFound();
}
