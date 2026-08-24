import test from 'node:test';
import assert from 'node:assert/strict';

const requests = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  const target = String(url);
  requests.push(target);
  if (target.includes('sportapi7.p.rapidapi.com') || target.includes('rapidapi')) {
    return new Response(JSON.stringify({ message: 'quota unavailable' }), { status: 429, headers: { 'content-type': 'application/json' } });
  }
  return new Response(JSON.stringify({
    leagues: [{ id: 'eng.1', name: 'English Premier League' }],
    events: [{ id: 'fixture-1', name: 'Home at Away', date: '2025-05-18T12:00:00Z' }],
  }), { status: 200, headers: { 'content-type': 'application/json' } });
};

const { default: sportsHandler } = await import('./api/sports.js');

test('football scoreboard compacts ISO dates and falls back to ESPN', async () => {
  const response = {
    statusCode: 200,
    body: null,
    setHeader() {},
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end() {},
  };
  await sportsHandler({ method: 'GET', query: { sport: 'soccer', league: 'eng.1', date: '2025-05-18' } }, response);
  assert.equal(response.statusCode, 200);
  assert.ok(response.body.events.length > 0);
  assert.deepEqual(response.body.providerChain.map((item) => item.provider), ['sportapi', 'creativesdev', 'espn']);
  const espnUrl = requests.find((url) => url.includes('site.web.api.espn.com'));
  assert.match(espnUrl, /dates=20250518/);
  assert.doesNotMatch(espnUrl, /dates=2025-05-18/);
  globalThis.fetch = originalFetch;
});

