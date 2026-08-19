import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeMemecoin } from './api/memecoins.js';

test('normalizes provider-backed market fields and returns a bounded discovery score', () => {
  const result = normalizeMemecoin({
    id: 'example-meme', name: 'Example Meme', symbol: 'exm', image: null,
    price: 0.12, change24h: 4.5, marketCap: 150_000_000, volume24h: 12_000_000,
    sourceTimestamp: '2026-08-20T10:00:00.000Z',
    metadata: { price_change_percentage_7d_in_currency: 8.2, circulating_supply: 700, total_supply: 1000, market_cap_rank: 240 },
  });
  assert.equal(result.symbol, 'exm');
  assert.equal(result.dataQuality, 'SUPPORTED');
  assert.equal(result.riskLevel, 'WATCH');
  assert.ok(result.discoveryScore >= 0 && result.discoveryScore <= 100);
  assert.equal(result.liquidityProxy, 0.08);
});

test('flags extreme movement, small capitalization, and missing liquidity without inventing values', () => {
  const result = normalizeMemecoin({ id: 'thin', name: 'Thin Meme', symbol: 'THN', price: null, change24h: 45, marketCap: 2_000_000, volume24h: null, metadata: {} });
  assert.equal(result.dataQuality, 'PARTIAL');
  assert.equal(result.riskLevel, 'HIGH');
  assert.ok(result.riskReasons.some(reason => reason.includes('Very small')));
  assert.ok(result.riskReasons.some(reason => reason.includes('volume unavailable')));
  assert.equal(result.price, null);
  assert.equal(result.liquidityProxy, null);
});

test('does not treat a positive daily move as a return forecast', () => {
  const result = normalizeMemecoin({ id: 'pump', name: 'Pump Meme', symbol: 'PMP', price: 1, change24h: 12, marketCap: 200_000_000, volume24h: 20_000_000, metadata: {} });
  assert.equal(result.discoveryScore >= 0, true);
  assert.equal(Object.hasOwn(result, 'forecast'), false);
  assert.equal(Object.hasOwn(result, 'target'), false);
});
