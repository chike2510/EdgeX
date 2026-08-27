import assert from 'node:assert/strict';
import test from 'node:test';
import handler from './api/wallet-tracker.js';

function response() {
  const captured = { statusCode: 200, body: null, headers: {} };
  return {
    captured,
    setHeader(key, value) { captured.headers[key] = value; },
    status(code) { captured.statusCode = code; return this; },
    json(body) { captured.body = body; return this; },
    end() { return this; }
  };
}

test('rejects invalid public wallet identifiers before any provider call', async () => {
  const res = response();
  await handler({ method: 'GET', query: { address: 'not-a-solana-address' } }, res);
  assert.equal(res.captured.statusCode, 400);
  assert.equal(res.captured.body.dataQuality, 'invalid_address');
});

test('returns configuration-required state without requesting a wallet key or signing authority', async () => {
  const originalKey = process.env.HELIUS_API_KEY;
  delete process.env.HELIUS_API_KEY;
  const res = response();
  await handler({ method: 'GET', query: { address: '7YttLkQmGRLehLS5EJpefNyYNtevtqmTEoJ8yZt5tXV5' } }, res);
  if (originalKey) process.env.HELIUS_API_KEY = originalKey;
  assert.equal(res.captured.statusCode, 503);
  assert.equal(res.captured.body.dataQuality, 'configuration_required');
  assert.match(res.captured.body.requirement, /private keys or wallet-signing permissions/i);
});
