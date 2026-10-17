import test from 'node:test';
import assert from 'node:assert/strict';
import { allowRateLimit, isSameOriginRequest } from './api/proxy-guards.js';

test('same-origin guard accepts an exact HTTP(S) origin-host match', () => {
  assert.equal(isSameOriginRequest({ headers: { origin: 'https://edgex.example', host: 'edgex.example' } }), true);
  assert.equal(isSameOriginRequest({ headers: { origin: 'http://localhost:3000', host: 'localhost:3000' } }), true);
});

test('same-origin guard rejects missing, malformed, and foreign origins', () => {
  assert.equal(isSameOriginRequest({ headers: { host: 'edgex.example' } }), false);
  assert.equal(isSameOriginRequest({ headers: { origin: 'null', host: 'edgex.example' } }), false);
  assert.equal(isSameOriginRequest({ headers: { origin: 'https://attacker.example', host: 'edgex.example' } }), false);
});

test('same-origin guard uses the forwarded host when present', () => {
  assert.equal(isSameOriginRequest({ headers: { origin: 'https://preview.example', host: 'internal.local', 'x-forwarded-host': 'preview.example' } }), true);
});

test('rate limits requests per route and client address for each time window', () => {
  const req = { headers: { 'x-forwarded-for': '203.0.113.7' } };
  const start = 2_000_000;
  assert.equal(allowRateLimit(req, 'guard-test', 2, 1000, start), true);
  assert.equal(allowRateLimit(req, 'guard-test', 2, 1000, start + 1), true);
  assert.equal(allowRateLimit(req, 'guard-test', 2, 1000, start + 2), false);
  assert.equal(allowRateLimit(req, 'guard-test', 2, 1000, start + 1000), true);
});
