import test from 'node:test';
import assert from 'node:assert/strict';
import handler from './api/player-history.js';
import { sportApiProvider } from '../.generated/server/historical/sportapi.js';

function responseMock() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end() { this.ended = true; return this; },
  };
}
function request(query, ip = '198.51.100.240') {
  return { method: 'GET', headers: { origin: 'https://edgex.test', host: 'edgex.test', 'x-forwarded-for': ip }, query };
}

const fixture = {
  providerEventId: 'player-history-route-fixture',
  kickoff: '2026-10-16T00:00:00.000Z',
  completed: true,
  score: { home: 1, away: 0, verified: true },
  homeTeam: { id: 'player-history-team', name: 'Home Team' },
  awayTeam: { id: 'player-history-opponent', name: 'Away Team' },
};

test('player history returns only verified, provider-backed sample observations', async () => {
  const originalHistory = sportApiProvider.getTeamHistory;
  const originalLineups = sportApiProvider.getLineups;
  try {
    sportApiProvider.getTeamHistory = async (_teamId, { page }) => ({
      status: 'available', endpoint: 'test/history',
      data: page === 0 ? [fixture, { ...fixture, providerEventId: 'unverified-score', score: { home: null, away: null, verified: false } }] : [],
    });
    sportApiProvider.getLineups = async () => ({
      status: 'available', endpoint: 'test/lineups',
      data: { home: [{ id: 'player-77', name: 'Test Player', minutes: 90, starter: true, statistics: { goals: 1 } }], away: [], published: true },
    });
    const response = responseMock();
    await handler(request({ teamId: 'player-history-team', playerId: 'player-77', metric: 'goals' }), response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.data.evidence.sampleSize, 1);
    assert.equal(response.body.data.distribution.average, 1);
    assert.equal(response.body.data.appearances[0].score, '1-0');
    assert.equal(response.body.dataQuality, 'partial');
    assert.equal(response.body.data.diagnostics, undefined);
    assert.doesNotMatch(JSON.stringify(response.body), /unverified-score/);
  } finally {
    sportApiProvider.getTeamHistory = originalHistory;
    sportApiProvider.getLineups = originalLineups;
  }
});

test('player history rejects unsupported metrics and hides upstream exception details', async () => {
  const invalid = responseMock();
  await handler(request({ teamId: 'metrics-team', playerName: 'Test Player', metric: 'unsupported-field' }, '198.51.100.241'), invalid);
  assert.equal(invalid.statusCode, 400);

  const originalHistory = sportApiProvider.getTeamHistory;
  try {
    sportApiProvider.getTeamHistory = async () => { throw new Error('sensitive provider token detail'); };
    const failed = responseMock();
    await handler(request({ teamId: 'error-team', playerName: 'Test Player', metric: 'goals' }, '198.51.100.242'), failed);
    assert.equal(failed.statusCode, 503);
    assert.doesNotMatch(JSON.stringify(failed.body), /sensitive provider token detail/);
  } finally {
    sportApiProvider.getTeamHistory = originalHistory;
  }
});
