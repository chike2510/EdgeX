import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/index.js';
import { recordProviderHealth } from './api/edgex-data.js';

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

function request(method, url) {
  return { method, url, query: {}, headers: { host: 'edgex.example' } };
}

test('health route reports cache and provider status without secret values', async () => {
  recordProviderHealth('contract-test-provider', { status: 'available', latencyMs: 12 });
  const response = responseMock();
  await handler(request('GET', '/api/health'), response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.scope, 'current-function-instance');
  assert.match(response.body.checkedAt, /^\d{4}-\d\d-\d\dT/);
  assert.equal(response.body.providers['contract-test-provider'].status, 'available');
  assert.equal(typeof response.body.cache.entries, 'number');
  assert.doesNotMatch(JSON.stringify(response.body), /api[_-]?key|secret|token|authorization/i);
});

test('health route rejects non-GET methods and generic AI, search, and Weather routes are not dispatched', async () => {
  const wrongMethod = responseMock();
  await handler(request('POST', '/api/health'), wrongMethod);
  assert.equal(wrongMethod.statusCode, 405);

  const parked = responseMock();
  await handler(request('GET', '/api/weather'), parked);
  assert.equal(parked.statusCode, 404);
  assert.equal(parked.body.error, 'API route not found');

  for (const route of ['ai', 'search']) {
    const response = responseMock();
    await handler(request('GET', `/api/${route}`), response);
    assert.equal(response.statusCode, 404);
    assert.equal(response.body.error, 'API route not found');
  }
});

test('dispatcher preserves the bounded player-history research route', async () => {
  const response = responseMock();
  await handler({ ...request('GET', '/api/player-history'), query: { route: 'player-history' } }, response);
  assert.equal(response.statusCode, 400);
  assert.match(response.body.error, /teamId and playerId or playerName/);
});
