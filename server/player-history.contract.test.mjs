import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeSportApiLineups } from './historical/sportapi-runtime.js';

const normalized = normalizeSportApiLineups({
  teams: [
    { homeAway: 'home', players: [{ player: { id: 'p1', name: 'Keeper' }, starter: true, minutesPlayed: 90, statistics: { saves: 4 } }] },
    { homeAway: 'away', players: [{ player: { id: 'p2', name: 'Forward' }, substitute: true, minutes: 22, statistics: { shots: 2 } }] },
  ],
});

assert.equal(normalized.home[0].minutes, 90);
assert.equal(normalized.home[0].statistics.saves, 4);
assert.equal(normalized.away[0].minutes, 22);
assert.equal(normalized.away[0].statistics.shots, 2);
assert.equal(normalized.published, true);

const route = fs.readFileSync(new URL('./api/player-history.js', import.meta.url), 'utf8');
const squads = fs.readFileSync(new URL('../edgex-squads.js', import.meta.url), 'utf8');
assert.match(route, /teamId and playerId or playerName are required/);
assert.match(route, /slice\(0, 15\)/);
assert.match(route, /LINEUP_PENDING/);
assert.match(route, /INSUFFICIENT_DATA/);
assert.match(squads, /\/api\/player-history\?/);
assert.match(squads, /averageMinutes/);
assert.match(squads, /SUPPORTED/);

console.log('player-history contract passed');
