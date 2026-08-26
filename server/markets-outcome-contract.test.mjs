import test from 'node:test';
import assert from 'node:assert/strict';
import { MarketProvider } from './api/edgex-providers.js';

const originalFetch = global.fetch;

function request() {
  return { headers: { host: 'edgex.local', 'x-forwarded-proto': 'https' } };
}

test.after(() => { global.fetch = originalFetch; });

test('combined candidate markets retain candidate-specific binary questions and leading probability', async () => {
  global.fetch = async () => new Response(JSON.stringify({ events: [{
    id: 'election-2027', title: 'Who will win the 2027 Presidential Election?', category: 'Politics',
    markets: [{
      id: 'candidate-a', title: 'Candidate A', outcome1Label: 'Yes', outcome1Price: 0.42,
      outcome2Label: 'No', outcome2Price: 0.58
    }]
  }] }), { status: 200 });
  const [market] = await MarketProvider.getMarkets(request());
  assert.equal(market.question, 'Will Candidate A win the 2027 Presidential Election?');
  assert.equal(market.subject, 'Candidate A');
  assert.equal(market.answerType, 'candidate_binary');
  assert.equal(market.probability, 0.58);
  assert.equal(market.outcomes.find(outcome => outcome.label === 'No')?.probability, 0.58);
});

test('combined range markets retain the range label instead of rendering an unscoped Yes/No question', async () => {
  global.fetch = async () => new Response(JSON.stringify({ events: [{
    id: 'streams', title: 'How many first-day streams for New Artist?', category: 'Entertainment',
    markets: [{ id: 'streams-range', title: '10M–15M', outcome1Label: 'Yes', outcome1Price: 0.62, outcome2Label: 'No', outcome2Price: 0.38 }]
  }] }), { status: 200 });
  const [market] = await MarketProvider.getMarkets(request());
  assert.equal(market.answerType, 'range_binary');
  assert.match(market.question, /fall within 10M–15M/i);
  assert.equal(market.subject, '10M–15M');
  assert.equal(market.probability, 0.62);
});

test('standalone binary markets remain binary and preserve the actual leading outcome', async () => {
  global.fetch = async () => new Response(JSON.stringify({ events: [{
    id: 'fixture', question: 'Will Team A face Team B this season?', category: 'Sports',
    outcome1Label: 'Yes', outcome1Price: 0.46, outcome2Label: 'No', outcome2Price: 0.54
  }] }), { status: 200 });
  const [market] = await MarketProvider.getMarkets(request());
  assert.equal(market.answerType, 'binary');
  assert.equal(market.question, 'Will Team A face Team B this season?');
  assert.equal(market.probability, 0.54);
});
