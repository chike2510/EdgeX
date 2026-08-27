import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeSolanaActivity, summarizeSolanaActivity } from './api/wallet-tracker.js';

const wallet = '7YttLkQmGRLehLS5EJpefNyYNtevtqmTEoJ8yZt5tXV5';
const transaction = {
  signature: 'example-signature', timestamp: 1787596800, type: 'SWAP', source: 'JUPITER', fee: 5000,
  tokenTransfers: [{ fromUserAccount: wallet, toUserAccount: 'destination', mint: 'MintA' }, { fromUserAccount: 'source', toUserAccount: wallet, mint: 'MintB' }],
  nativeTransfers: [{ fromUserAccount: wallet, toUserAccount: 'validator', amount: 5000 }], events: { swap: { nativeInput: {}, tokenOutputs: [] } }
};

test('normalizes public Solana activity without wallet credentials or PnL fields', () => {
  const activity = normalizeSolanaActivity(transaction, wallet);
  assert.equal(activity.isSwap, true);
  assert.equal(activity.incomingTransfers, 1);
  assert.equal(activity.outgoingTransfers, 1);
  assert.equal(activity.feeSol, 0.000005);
  assert.equal(Object.hasOwn(activity, 'privateKey'), false);
  assert.equal(Object.hasOwn(activity, 'transactionIntent'), false);
  assert.equal(Object.hasOwn(activity, 'pnlUsd'), false);
});

test('summarizes observed transaction activity without claiming realized or unrealized performance', () => {
  const summary = summarizeSolanaActivity([transaction], wallet);
  assert.equal(summary.transactions, 1);
  assert.equal(summary.swaps, 1);
  assert.equal(summary.uniqueTokenMints, 2);
  assert.equal(Object.hasOwn(summary, 'realizedPnlUsd'), false);
  assert.equal(Object.hasOwn(summary, 'unrealizedPnlUsd'), false);
});
