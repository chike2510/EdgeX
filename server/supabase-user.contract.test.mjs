import test from 'node:test';
import assert from 'node:assert/strict';
import { getVerifiedUserId } from './auth/supabase-user.js';

test('Supabase auth lookup returns only the user ID from a verified bearer token', async () => {
  let calledUrl;
  let calledOptions;
  const userId = await getVerifiedUserId({ headers: { authorization: 'Bearer test-access-token' } }, {
    env: { SUPABASE_URL: 'https://edge-project.supabase.co', SUPABASE_ANON_KEY: 'public-anon-key' },
    fetchImpl: async (url, options) => {
      calledUrl = String(url);
      calledOptions = options;
      return new Response(JSON.stringify({ id: 'user-123', email: 'private@example.test' }), { status: 200 });
    },
  });
  assert.equal(userId, 'user-123');
  assert.equal(calledUrl, 'https://edge-project.supabase.co/auth/v1/user');
  assert.equal(calledOptions.headers.apikey, 'public-anon-key');
  assert.equal(calledOptions.headers.Authorization, 'Bearer test-access-token');
  assert.ok(calledOptions.signal instanceof AbortSignal);
});

test('Supabase auth lookup is a no-op when the EdgeX project is not configured', async () => {
  let called = false;
  const userId = await getVerifiedUserId({ headers: { authorization: 'Bearer test-access-token' } }, {
    env: {},
    fetchImpl: async () => { called = true; throw new Error('must not run'); },
  });
  assert.equal(userId, null);
  assert.equal(called, false);
});

test('Supabase auth lookup rejects insecure project URLs and invalid responses', async () => {
  let called = false;
  const insecure = await getVerifiedUserId({ headers: { authorization: 'Bearer token' } }, {
    env: { SUPABASE_URL: 'http://example.test', SUPABASE_ANON_KEY: 'key' },
    fetchImpl: async () => { called = true; return new Response('{}'); },
  });
  assert.equal(insecure, null);
  assert.equal(called, false);

  const invalid = await getVerifiedUserId({ headers: { authorization: 'Bearer token' } }, {
    env: { SUPABASE_URL: 'https://edge-project.supabase.co', SUPABASE_ANON_KEY: 'key' },
    fetchImpl: async () => new Response(JSON.stringify({ email: 'not-an-id' }), { status: 200 }),
  });
  assert.equal(invalid, null);
});
