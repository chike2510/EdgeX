import assert from 'node:assert/strict';
import { test } from 'node:test';
import formHandler from './api/form.js';
import { normalizeSportApiEvent, sportApiProvider } from '../.generated/server/historical/sportapi.js';

function responseRecorder() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end() { return this; },
  };
}

async function callForm(event, extraQuery = {}) {
  const originalFetch = globalThis.fetch;
  const originalHistory = sportApiProvider.getTeamHistory;
  globalThis.fetch = async (url) => {
    if (String(url).includes('/schedule')) {
      return new Response(JSON.stringify({ events: event ? [event] : [] }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return new Response(JSON.stringify({ team: { record: { items: [] } } }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  sportApiProvider.getTeamHistory = async () => ({ status: 'unavailable', data: [] });
  try {
    const req = { method: 'GET', query: { league: 'eng.1', teamId: '1', ...extraQuery } };
    const res = responseRecorder();
    await formHandler(req, res);
    return res;
  } finally {
    globalThis.fetch = originalFetch;
    sportApiProvider.getTeamHistory = originalHistory;
  }
}

function completedFixture({ homeScore, awayScore, homeWinner = false, awayWinner = false } = {}) {
  return {
    date: '2026-10-16T18:00:00Z',
    competitions: [{
      status: { type: { completed: true } },
      competitors: [
        { team: { id: '1', displayName: 'Home FC' }, homeAway: 'home', winner: homeWinner, score: homeScore },
        { team: { id: '2', displayName: 'Away FC' }, homeAway: 'away', winner: awayWinner, score: awayScore },
      ],
    }],
  };
}

test('form route omits completed fixtures with missing scores instead of fabricating 0-0', async () => {
  const normalized = normalizeSportApiEvent({
    id: 'null-score',
    homeTeam: { id: '1', name: 'Home FC' },
    awayTeam: { id: '2', name: 'Away FC' },
    score: { home: null, away: null },
    startTimestamp: 1792173600,
  }, '/event/null-score');
  assert.equal(normalized.score.verified, false);

  const res = await callForm(completedFixture({ homeWinner: true, homeScore: null, awayScore: null }));
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.form, []);
  assert.equal(res.body.stats, null);
});

test('form route preserves an explicitly reported 0-0 score and does not invent unavailable rates', async () => {
  const res = await callForm(completedFixture({ homeScore: { value: 0 }, awayScore: { value: 0 } }));
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.form.length, 1);
  assert.equal(res.body.form[0].score, '0-0');
  assert.equal(res.body.form[0].result, 'D');
  assert.equal(res.body.teamStats.cornersForPG, null);
  assert.equal(res.body.teamStats.shotsAgainstPG, null);
  assert.equal(res.body.stats.awayWR, null);
});

test('form route ignores public debug flags and never returns raw provider structures', async () => {
  const res = await callForm(completedFixture({ homeScore: '1', awayScore: '0' }), { debug: '1' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.form.length, 1);
  assert.equal(res.body.completedSample, undefined);
  assert.equal(res.body._debug, undefined);
});

test('form route rejects non-GET requests', async () => {
  const req = { method: 'POST', query: {} };
  const res = responseRecorder();
  await formHandler(req, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.body.error, 'Method not allowed');
});
