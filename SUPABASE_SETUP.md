# EdgeX Supabase setup

EdgeX is prepared to use Supabase Auth for email magic links and Google sign-in, and Supabase Postgres for saved analyses, watchlists, notes, and opt-in activity history. No EdgeX project has been provisioned or connected. Do not add credentials from an unrelated project.

## When project creation is approved

1. Use the organization the owner explicitly selects and review the Supabase project-cost result. If the estimate is nonzero, show the exact amount and obtain explicit confirmation before creation.
2. Create the EdgeX project in the selected region, then apply `supabase/migrations/20261017_000001_edgex_user_data.sql`.
3. Configure the project’s allowed redirect URL for the EdgeX host at `/auth/callback`. The local development callback is `http://localhost:3000/auth/callback`.
4. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the local `.env.local` and approved deployment environment. The same values may be supplied server-side as `SUPABASE_URL` and `SUPABASE_ANON_KEY`. Never use a service-role key in the browser; the app does not require one.
5. Enable email OTP/magic-link auth. Google sign-in requires the owner’s Google OAuth client ID and secret, Supabase provider configuration, and registered callback URL; it cannot be enabled until those credentials are supplied.
6. Verify sign-in, callback, Saved reads/writes, and row-level security with two separate test accounts before enabling account-backed use.

The migration creates `saved_analyses`, `watchlists`, `notes`, and `activity_history`, each with per-user row-level security. Activity history is opt-in in the UI and stores only the app section/path, not query strings or search text. Signed-out history remains in the browser.

The current app disables account behavior when the public project URL/key are absent. Migration and auth code are local source only; no remote tables, auth settings, secrets, or Vercel environment variables have been changed.
