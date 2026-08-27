import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeMemecoin } from './api/memecoins.js';

const supportedPair = {
  chainId: 'solana', dexId: 'raydium', pairAddress: 'pair-address', url: 'https://dexscreener.com/solana/pair-address',
  baseToken: { address: 'token-address', name: 'Example Meme', symbol: 'EXM' }, priceUsd: 0.00012,
  change24h: 4.5, marketCap: 150_000, liquidityUsd: 60_000, volume24h: 160_000,
  buys24h: 320, sells24h: 290, pairCreatedAt: '2026-08-20T10:00:00.000Z', fetchedAt: '2026-08-20T10:05:00.000Z'
};

test('normalizes a DEX Screener small-cap pair with a bounded discovery-context score', () => {
  const result = normalizeMemecoin(supportedPair);
  assert.equal(result.symbol, 'EXM');
  assert.equal(result.chainId, 'solana');
  assert.equal(result.marketCap, 150_000);
  assert.equal(result.liquidityUsd, 60_000);
  assert.equal(result.dataQuality, 'SUPPORTED');
  assert.ok(result.discoveryScore >= 0 && result.discoveryScore <= 100);
  assert.ok(result.activityScore >= 0 && result.activityScore <= 100);
  assert.equal(result.activityState, 'CONSTRUCTIVE');
  assert.equal(result.transactions24h, 610);
  assert.ok(result.activityReasons.some(reason => /buys and sells/i.test(reason)));
  assert.equal(result.liquidityProxy, 160_000 / 60_000);
});

test('flags thin-liquidity and extreme-movement small-cap pairs without inventing fields', () => {
  const result = normalizeMemecoin({
    ...supportedPair, priceUsd: null, change24h: 45, marketCap: 20_000, liquidityUsd: null, volume24h: null,
    pairCreatedAt: new Date().toISOString(), buys24h: null, sells24h: null
  });
  assert.equal(result.dataQuality, 'PARTIAL');
  assert.equal(result.riskLevel, 'HIGH');
  assert.ok(result.riskReasons.some(reason => /liquidity unavailable/i.test(reason)));
  assert.ok(result.riskReasons.some(reason => /volume unavailable/i.test(reason)));
  assert.equal(result.activityState, 'CAUTION');
  assert.ok(result.activityCautions.some(reason => /limited DEX liquidity/i.test(reason)));
  assert.equal(result.price, null);
  assert.equal(result.liquidityProxy, null);
});

test('does not represent discovery context as a price target or return forecast', () => {
  const result = normalizeMemecoin(supportedPair);
  assert.equal(Object.hasOwn(result, 'forecast'), false);
  assert.equal(Object.hasOwn(result, 'target'), false);
  assert.equal(Object.hasOwn(result, 'expectedMultiple'), false);
});
