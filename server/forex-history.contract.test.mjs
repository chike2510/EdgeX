import test from 'node:test';
import assert from 'node:assert/strict';

const originalFetch = globalThis.fetch;
const dailyRates = Object.fromEntries(Array.from({ length: 240 }, (_, index) => {
  const date = new Date(Date.UTC(2025, 0, 1 + index)).toISOString().slice(0, 10);
  return [date, { EUR: 0.85 + index * 0.0001 }];
}));

globalThis.fetch = async url => {
  const value = String(url);
  if (value.includes('/latest?')) return new Response(JSON.stringify({ base: 'USD', date: '2025-08-28', rates: { EUR: 0.874, NGN: 1500 } }), { status: 200 });
  if (value.includes('/2025-08-27?')) return new Response(JSON.stringify({ rates: { EUR: 0.873 } }), { status: 200 });
  if (value.includes('/2024-12-31..2025-08-28')) return new Response(JSON.stringify({ start_date: '2024-12-31', end_date: '2025-08-28', rates: dailyRates }), { status: 200 });
  return new Response(JSON.stringify({ rates: {} }), { status: 404 });
};

const { default: handler } = await import('./api/forex.js');

function response() {
  return { statusCode: 200, body: null, setHeader() {}, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; }, end() { return this; } };
}

test('returns a supported daily history when the reference source supplies enough observations', async () => {
  const res = response();
  await handler({ method: 'GET', query: { base: 'USD', symbols: 'EUR', currency: 'EUR', history: '1' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.history.status, 'SUPPORTED');
  assert.ok(res.body.history.points.length >= 200);
});

test('keeps NGN history explicitly unavailable when the source has no comparable series', async () => {
  const res = response();
  await handler({ method: 'GET', query: { base: 'USD', symbols: 'NGN', currency: 'NGN', history: '1' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.history.status, 'UNAVAILABLE');
  assert.match(res.body.history.reason, /NGN/);
});

test.after(() => { globalThis.fetch = originalFetch; });
