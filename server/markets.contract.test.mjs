import test from 'node:test';
import assert from 'node:assert/strict';

const originalFetch = globalThis.fetch;
globalThis.fetch = async () => new Response(JSON.stringify({ events: [{
  id: 'candidate-1',
  title: 'Peter Obi',
  outcome1Label: 'Yes',
  outcome1Price: 0.59,
  outcome2Label: 'No',
  outcome2Price: 0.41,
  yesPriceForEstimate: 0,
  rules: 'This market will resolve as Yes if INEC officially declares Peter Obi as the winner of the 2027 Presidential Election.',
  status: 'open',
}] }), { status: 200, headers: { 'content-type': 'application/json' } });

const { MarketProvider } = await import('./api/edgex-providers.js');

test('normalizes named market outcomes and derives the event question', async () => {
  const markets = await MarketProvider.getMarkets({ query: {} }, { limit: 1 });
  assert.equal(markets.length, 1);
  assert.equal(markets[0].subject, 'Peter Obi');
  assert.equal(markets[0].question, 'Who will win the 2027 Presidential Election?');
  assert.deepEqual(markets[0].outcomes.map(item => item.label), ['Yes', 'No']);
  assert.equal(markets[0].probability, 0.59);
  assert.match(markets[0].rules, /INEC officially declares Peter Obi/);
  globalThis.fetch = originalFetch;
});

