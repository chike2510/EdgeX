import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizePair } from './api/dexscreener.js';
import { normalizeFixturePlayerStats, normalizePlayer } from './api/sportmonks.js';

test('normalizes DEX Screener pair liquidity, volume, movement, and transactions', () => {
  const pair = normalizePair({
    chainId: 'solana', dexId: 'raydium', pairAddress: 'pair-1', url: 'https://dexscreener.com/solana/pair-1',
    baseToken: { address: 'token-1', name: 'Example', symbol: 'EXM' }, quoteToken: { address: 'usdc', symbol: 'USDC' },
    priceUsd: '0.0123', fdv: 1000000, liquidity: { usd: 25000 }, volume: { h24: 40000 },
    priceChange: { h24: 12.5 }, txns: { h24: { buys: 40, sells: 20 } }, pairCreatedAt: 1780000000000,
  });
  assert.equal(pair.chainId, 'solana');
  assert.equal(pair.priceUsd, 0.0123);
  assert.equal(pair.liquidityUsd, 25000);
  assert.equal(pair.volume24h, 40000);
  assert.equal(pair.buys24h, 40);
  assert.equal(pair.sells24h, 20);
});

test('normalizes Sportmonks season player statistics without tracking claims', () => {
  const player = normalizePlayer({ data: { id: 7, name: 'Example Player', image_path: null, statistics: [{ season_id: 10, details: [{ type_id: 101, type: { name: 'Minutes Played' }, value: 720 }, { type_id: 102, type: { name: 'Shots' }, value: 12 }] }] } });
  assert.equal(player.id, '7');
  assert.equal(player.stats.length, 2);
  assert.equal(player.stats[0].value, 720);
  assert.equal(player.stats[1].name, 'Shots');
  assert.equal(Object.hasOwn(player, 'distanceCovered'), false);
});

test('normalizes Sportmonks fixture lineups and keeps absent statistics empty', () => {
  const players = normalizeFixturePlayerStats({ data: { lineups: [{ player_id: 7, player: { name: 'Example Player' }, team_id: 3, minutes_played: 83, statistics: [{ type_id: 200, type: { name: 'Passes' }, value: 31 }] }, { player_id: 8, player: { name: 'Second Player' }, team_id: 4 }] } });
  assert.equal(players.length, 2);
  assert.equal(players[0].minutes, 83);
  assert.equal(players[0].statistics[0].name, 'Passes');
  assert.deepEqual(players[1].statistics, []);
});
