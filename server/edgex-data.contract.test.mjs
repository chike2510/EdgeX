import test from 'node:test';
import assert from 'node:assert/strict';
import { cached, normalizeFixture, safeNumber } from './api/edgex-data.js';

test('shared cache coalesces concurrent loads and reuses the fresh value', async () => {
  const key = `contract:coalesce:${crypto.randomUUID()}`;
  let calls = 0;
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const loader = async () => { calls += 1; await gate; return { value: 42 }; };
  const first = cached(key, 5_000, loader);
  const second = cached(key, 5_000, loader);
  await Promise.resolve();
  release();
  const [a, b] = await Promise.all([first, second]);
  const third = await cached(key, 5_000, loader);
  assert.equal(calls, 1);
  assert.deepEqual(a, { value: 42 });
  assert.deepEqual(b, a);
  assert.deepEqual(third, a);
});

test('a failed cached load is removed so a later request can recover', async () => {
  const key = `contract:recovery:${crypto.randomUUID()}`;
  let calls = 0;
  await assert.rejects(cached(key, 5_000, async () => { calls += 1; throw new Error('expected test failure'); }), /expected test failure/);
  const result = await cached(key, 5_000, async () => { calls += 1; return 'recovered'; });
  assert.equal(calls, 2);
  assert.equal(result, 'recovered');
});

test('safeNumber preserves numeric zero and rejects absent or non-finite values', () => {
  assert.equal(safeNumber(0), 0);
  assert.equal(safeNumber('0'), 0);
  assert.equal(safeNumber(null), null);
  assert.equal(safeNumber(undefined), null);
  assert.equal(safeNumber(''), null);
  assert.equal(safeNumber('not-a-number'), null);
  assert.equal(safeNumber(Infinity), null);
});

test('fixture normalization preserves missing scores as null instead of zero', () => {
  const normalized = normalizeFixture({
    id: 'fixture-1',
    competitions: [{
      competition: { name: 'Test League' },
      competitors: [
        { homeAway: 'home', score: '0', team: { id: 'h', displayName: 'Home' } },
        { homeAway: 'away', team: { id: 'a', displayName: 'Away' } },
      ],
    }],
  });
  assert.equal(normalized.home.score, 0);
  assert.equal(normalized.away.score, null);
  assert.equal(normalized.competition, 'Test League');
});
