# EdgeX roadmap

Updated 17 October 2026. EdgeX is a research and learning product: present provider-backed evidence, sample sizes, uncertainty, and source health—not actions or performance promises.

## Now
- Keep the review PR open; do not merge or deploy until the owner approves the final production wiring.
- The local branch now contains a Next.js App Router + TypeScript experience with Overview, Sports, Markets, and Saved; detail routes; explicit core API route handlers; and a shared responsive design system.
- Remove wagering, bookmaker, accumulator, best-bet, BUY/SELL, fake-auth, and fabricated-score surfaces. Basketball, Weather, and Memecoins are parked.
- Use provider timeouts, bounded in-process caching/request coalescing, generic client errors, structured evidence review, and the instance-local `/api/health` endpoint.
- Sports standings remain explicitly unavailable: the checked-in ESPN/SportAPI adapters do not provide a validated table contract.
- Supabase Auth and RLS schema are prepared locally, including saved analyses, watchlists, notes, and opt-in activity history; no Supabase project or credentials have been configured.

## Next — requires owner decisions or external configuration
- Confirm the Supabase organization and review the exact project-cost estimate before any project is created. A non-zero cost needs separate explicit confirmation.
- Supply Google OAuth credentials if Google sign-in is required; email magic-link setup also needs the approved project and callback configuration.
- Decide whether to remove the repository’s existing `/api/*` Vercel rewrite to `api/index.js`. Explicit Next route handlers are implemented locally, but the rewrite and external Vercel settings remain unchanged under the current no-settings/no-deploy boundary.
- After approval, apply the checked-in Supabase migration and verify RLS using two separate test accounts.
- Select and validate a real standings provider contract before adding league tables.

## Later
- Replace the current bounded per-function cache with a shared multi-instance cache (for example Vercel Runtime Cache or Redis) if production traffic and provider quotas require it.
- Add supported comparison views for teams, players, and assets over time; never infer missing observations.
- Review stale-data thresholds and production observability after a preview deployment is explicitly approved.
