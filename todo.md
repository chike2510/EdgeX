# EdgeX Prompt 1–8 completion checklist

- [ ] Re-audit the original ZIP against the complete prompt set and document the completion matrix.
- [ ] Normalize provider payloads and add explicit loading, empty, stale, error, and data-quality states.
- [ ] Complete Sports Predictions with filters, sorting, competition/date tabs, prediction detail, confidence factors, and honest no-edge states.
- [ ] Complete Squads Player Edge with player search, filters, prop categories, confidence factors, and player detail routes.
- [x] Complete Markets and Bayse Events with market discovery, category/time filters, probability context, and non-transaction analysis views.
- [ ] Complete Crypto Signals and Memecoin Finder with asset search, signal filters, catalyst/risk context, and detail views.
- [ ] Complete Forex Signals with pair search, timeframe filters, direction/context, and data-quality states.
- [ ] Complete Weather Intelligence with location/context handling and unavailable-data states.
- [ ] Complete Profile, Settings, Favorites, Saved Analysis, Notifications, and Global Search flows.
- [ ] Ensure visible copy stays research-only with no betting, wallet, deposit, withdrawal, or transaction CTAs.
- [ ] Remove or neutralize remaining visible betting, staking, trade, and BUY/SELL UI from legacy Football, Forex, and shared Bayse copy.
- [x] Run syntax, route, provider-contract, browser, responsive, and regression checks.
- [ ] Package only modified and newly added files into the final ZIP.
- [ ] Deliver the final tested ZIP and a truthful completion summary.
- [ ] Reproduce production Football fixture failure and correct current-date ESPN loading.
- [ ] Repair production Markets provider routing and unavailable-state regression.
- [ ] Consolidate mobile navigation, typography, and responsive shells across legacy and V2 pages.
- [x] Re-verify all reported pages and push the complete repair to GitHub.
- [ ] Review the uploaded Markets mobile video for scrolling, tap, layout, and feedback issues.
- [x] Restore visible Squads market selections, line values, and provider-backed analysis context.
- [x] Stabilize Basketball fixture rendering so loading updates do not shake or duplicate the fixture list.
- [x] Simplify Markets mobile cards, improve evidence-state presentation, and make analysis options discoverable.
- [x] Verify touch targets, sticky headers, scrolling, and mobile navigation on affected routes.
- [x] Add provider-backed Bayse outcome labels, thresholds, and explicit no-estimate states to Markets cards and dialogs.
- [x] Validate the structured analysis endpoint with real normalized Squads and Bayse-shaped payloads.
- [x] Rebuild landing, home, and intelligence pages around one coherent responsive application shell.
- [x] Remove duplicated or conflicting mobile sidebar/header shells and align the top-left brand/navigation treatment.
- [x] Repair back behavior from Football, Basketball, Crypto, Forex, Squads, and detail routes so it returns to the correct in-app parent instead of the landing page.
- [x] Stabilize Football fixture loading and header rendering using the same no-jitter lifecycle as Basketball.
- [x] Verify responsive shell, navigation drawer, bottom navigation, and page headers on mobile and desktop.
- [x] Make Landing, Home, and intelligence pages share the same compact shell language rather than separate header systems.
- [x] Fix mobile drawer item collisions, oversized menu treatment, and inconsistent section spacing.
- [x] Simplify the Football context toolbar so Back, Football/APEX, live state, Insights, and History do not crowd or overlap.
- [x] Re-capture 540px mobile states for Landing, Home, Football, and the open drawer and verify visual hierarchy before pushing.
- [x] Freeze implementation changes until the new Home, Landing, mobile shell, drawer, and Football context-bar mockups are approved.
- [x] Create a fresh mockup direction using the actual EdgeX typography hierarchy, compact navigation controls, and one visual system across public and intelligence surfaces.
- [x] Present the mockups for approval before rewriting production pages.
- [x] Implement the approved mockup as the source of truth for the shared shell, typography, spacing, drawer, bottom navigation, and page context bars.
- [x] Rewrite Landing and Home rather than wrapping their old layouts, preserving only real data flows and approved content domains.
- [x] Apply the approved visual system to all intelligence pages and simplify Football context controls.
- [x] Run full responsive, routing, syntax, and provider-data regression checks before pushing the approved redesign.
- [x] Replace shell and domain placeholder glyphs with consistent inline SVG icons or restrained illustrations.
- [x] Remove the ill-fitting Landing hero image asset and keep Landing free of the app bottom navigation.
- [x] Re-capture Landing, Home, Football, and drawer mobile states after the icon and navigation refinement.
- [x] Create a distinct EdgeX logo mark and wordmark direction for Landing and Home headers.
- [x] Present the logo concept for approval before integrating it into production headers.
- [x] Integrate the approved logo and verify it at mobile and desktop header sizes.
- [x] Audit every page controller, provider adapter, dispatcher route, and real-data state before functionality changes.
- [x] Repair and normalize sports, crypto, forex, markets/events, player edge, weather, and home feed contracts without fabricated values.
- [x] Complete core filters, sorting, date navigation, search, analysis dialogs, detail routes, and explicit loading/error/empty states.
- [x] Run provider-contract, route, syntax, responsive, and data-integrity checks before pushing the functionality pass.
- [x] Diagnose the deployed Forex unavailable state against the actual API response and client renderer.
- [x] Expand Crypto coverage with more provider-backed CoinGecko assets and broader Forex pair coverage from the configured rate provider.
- [x] Verify expanded live payloads, mobile rendering, and explicit unavailable states before pushing.
- [x] Trace why the 34 Crypto coins and 21 Forex pairs are not visibly updating in real time, including websocket, polling, and provider source states.
- [x] Repair observable live refresh and asset coverage so every returned Crypto and Forex asset has a clear updated, unchanged, unavailable, or stale state.
- [x] Rebuild deterministic APEX analytical context for Sports, Markets, Squads, Crypto, and Forex using only provider-backed evidence.
- [x] Repair structured AI analysis contracts and graceful no-edge/insufficient-data handling across all analytical domains.
- [x] Verify asset refresh, AI/APEX outputs, detail views, mobile states, and route behavior before pushing.

- [x] Repair Forex detail missing-change presentation and align provider freshness with the analysis evidence.
- [x] Repair Player Edge provider-line consistency and make the NO EDGE dialog explain evidence quality clearly.
- [x] Replace Crypto detail zero-change fallback and align its legacy detail presentation with the shared shell/model states.
- [x] Re-run 540px responsive regression checks and push the screenshot-driven repairs.

- [x] Trace the actual Forex, Crypto, and Squads provider response contracts causing unavailable or stale values.
- [x] Repair server provider adapters and client feed mappings so real provider values reach detail views.
- [x] Verify the application routes return usable provider-backed values and timestamps before pushing.

- [x] Preserve the existing Sports fixture-list feed and route contract before adding fixture-detail navigation.
- [x] Define distinct finished, live, and upcoming fixture-detail information states using provider-backed fields only.
- [x] Add fixture-detail rendering as an additive route with safe loading, unavailable, and feed-error fallbacks.
- [x] Verify fixture-list loading and 540px detail responsiveness before pushing.

- [x] Restore interactive Overview, Lineups, Stats, and Insights tabs in Sports fixture details.
- [x] Reintroduce the complete user-approved APEX market list under Insights with evidence-aware states.
- [x] Verify the Insights tab, market cards, and fixture feed remain safe at 540px before pushing.

- [x] Restore all 19 canonical analytical markets under the fixture Insights tab.
- [x] Strengthen APEX market scoring with evidence weighting, calibration guards, and explicit insufficient-data thresholds.
- [x] Add interactive Overview, Lineups, Stats, Insights, and H2H fixture-detail tabs.
- [x] Add a provider-backed H2H route and render past fixtures without fabricated history.
- [x] Verify all 19 markets, H2H loading, and fixture-list safety at 540px before pushing.

- [x] Fix H2H provider loading so success and failure states resolve visibly instead of remaining stuck.
- [x] Isolate H2H from the unrelated Sofascore context loader in the fixture detail panels.
- [x] Verify H2H behavior at 540px and push the regression fix.

- [x] Trace ESPN team schedule/history support for selected home and away teams.
- [x] Add normalized ESPN-backed recent home and away histories with up to 15 fixtures each.
- [x] Render direct H2H, home recent form, and away recent form as separate provider-backed sections.
- [x] Verify ESPN history loading and fixture-feed safety at 540px before pushing.

- [x] Verify the ESPN 15-game histories flow into APEX form and probability inputs rather than only the H2H display.
- [x] Test probability sensitivity when recent-game evidence changes while season evidence remains constant.
- [x] Document whether all 19 market probabilities use the recent-game sample and identify any gaps.

- [x] Enrich main Sports fixture-list cards with bounded ESPN 15-game form data before APEX scoring.
- [x] Keep list rendering responsive with cached or bounded-concurrency form requests and season-only fallback on provider failure.
- [x] Verify list-card and detail-view APEX outputs use the same evidence contract without breaking fixture loading.

- [x] Make the Stats tab render actual provider-backed in-game match statistics, not recent form or generic match metadata.
- [x] Move recent-form evidence to the appropriate analytical context and repair its live loading contract for current fixtures.
- [x] Ensure H2H resolves to ESPN history, no-history, or provider-error state instead of remaining on a spinner.
- [x] Re-run 540px state regression checks and push the corrected fixture-detail experience.

- [ ] Verify the redeployed live-match Stats tab contains provider-backed match statistics.
- [ ] Verify the redeployed H2H tab resolves to history, no-history, or an explicit provider error without an indefinite spinner.

- [x] Repair mobile match-statistics markup so labels, values, and team columns render as a readable grid at 540px.
- [x] Remove fragile cross-script H2H context dependence and use ESPN team schedules as the primary H2H history source.
- [x] Distinguish direct meetings, recent home history, recent away history, no history, and provider failure in H2H.
- [x] Verify the corrected Stats and H2H views at 540px before pushing.

- [x] Verify the latest live Football deployment renders up to 15 ESPN-backed H2H fixtures for both teams.

- [x] Add evidence tiers for early-season fixtures so thin H2H/recent-form samples do not produce overconfident predictions.
- [x] Replace short fixture commentary with detailed provider-backed analytical commentary and explicit uncertainty.
- [x] Expand match statistics with meaningful provider fields and event context for live and finished matches.
- [x] Implement provider-backed lineups with confirmed, projected, unavailable, and not-yet-published states.
- [x] Verify early-season live/upcoming/finished fixture detail at 540px before pushing.

- [ ] Define a season-aware historical fixture contract that separates current, prior-season, and H2H records.
- [ ] Specify recency, competition-strength, venue, and direct-H2H weighting rules for backfilled evidence.
- [ ] Design caching, provenance, deduplication, and no-fabrication safeguards for historical backfill.

- [ ] Separate a large historical archive from the strict 15-match analytical window.
- [ ] Assess SofaScore as a supplemental historical and H2H provider, including access stability and provenance requirements.
- [ ] Define cross-provider deduplication, caching, and fallback rules for ESPN plus SofaScore historical data.

- [x] Evaluate RapidAPI SofaScore-related providers for historical and H2H coverage, quotas, pricing, licensing, and production suitability.

- [ ] Design the server-side HistoricalProvider interface and canonical ESPN/SofaSport normalization schema.
- [ ] Define provider fallback, provenance, deduplication, cache, and strict 15-match analytical-window contracts.

- [ ] Implement the server-side TypeScript SofaSport RapidAPI adapter and canonical response mappings.
- [ ] Add RapidAPI secret/configuration handling without exposing credentials to the client.
- [ ] Add deterministic adapter tests for season events, team history, H2H, event details, errors, deduplication, and the 15-match guard.

- [x] Retry RapidAPI validation against the correct subscribed SofaScore-related listing and host before continuing the adapter implementation.

- [x] Switch historical-provider assumptions from SofaSport to the subscribed SportAPI RapidAPI host and `/api/v1` route family.
- [ ] Rotate the RapidAPI credential exposed in chat/screenshot and validate the replacement key server-side.
- [x] Map SportAPI event, team-history, H2H, statistics, lineups, and shotmap responses into the canonical HistoricalProvider schema.

- [x] Select the alternate secure RapidAPI key from the key holder and validate it against `sportapi7.p.rapidapi.com` without using the exposed chat key.

- [x] Identify and validate the Creativesdev Free API Live Football Data RapidAPI host and endpoint contract.
- [x] Add the third football provider as a server-side fallback after ESPN and SportAPI with canonical normalization and provenance.
- [x] Preserve cross-provider deduplication and the strict 15-match analytical window across all three providers.

- [x] Restore fixture loading after the Creativesdev fallback regression without breaking the existing ESPN fixture route.
- [x] Add a regression guard ensuring optional fallback modules cannot prevent the ESPN fixture feed from initializing.

- [x] Use SportAPI first, Creativesdev second, and ESPN third for upcoming/live commentary, statistics, and lineup enrichment.
- [x] Keep ESPN authoritative for completed-match event data and use field-aware fallback when a provider response is incomplete.
- [x] Add regression coverage for upcoming, live, and completed provider precedence.

- [x] Remove ESPN-first behavior from upcoming/live form, H2H, commentary, and detail-context loaders.
- [x] Make SportAPI primary, Creativesdev secondary, and ESPN tertiary for non-completed detail context.
- [x] Add deployed-view regression checks proving provider labels and evidence sources are not ESPN-first.

- [x] Investigate and repair the latest fixture-loading regression without weakening ESPN fixture-route isolation.
- [ ] Define a real-data player-props model using player availability, minutes, usage, recent performance, opponent context, and uncertainty.
- [ ] Implement evidence-gated player-props predictions with transparent source labels and insufficient-data states.
- [ ] Add regression coverage for fixture loading and player-props probability behavior.

- [x] Add Player Edge card badges for SUPPORTED, LINEUP_PENDING, and INSUFFICIENT_DATA.
- [x] Add state-specific card copy, disabled analysis behavior, and accessible status semantics.
- [x] Add responsive Player Edge state-card styling and deterministic UI regression coverage.

- [x] Remove visible ESPN, SportAPI, Creativesdev, and other provider names from user-facing Football, H2H, stats, lineup, commentary, and Player Edge copy.
- [x] Preserve provider names only in internal provenance, server diagnostics, and non-user-facing debug data.
- [x] Add regression coverage proving internal provider names do not appear in rendered product copy.

- [x] Enrich the Football Stats tab with additional confirmed match metrics, periods, incidents, and event context.
- [x] Replace event-only commentary with exact contextual narratives using minute, team, player, score-state, and event metadata.
- [x] Add regression coverage for richer statistics, contextual commentary, unavailable fields, and 540px layout.

- [ ] Audit the Squad page and current player-data routes for real identity, availability, minutes, event statistics, and role fields.
- [ ] Define a provider-neutral Squad player profile and historical event contract for analysis.
- [ ] Specify evidence gates for player analysis based on lineup status, minutes, recent appearances, and event-level sample quality.

- [x] Update squads.html with a roster overview layer and selected-player detail layer.
- [x] Add SUPPORTED, LINEUP_PENDING, and INSUFFICIENT_DATA states to the player-detail experience.
- [x] Preserve the existing Player Edge feed and add responsive roster/player-detail interaction coverage.

- [x] Verify the deployed Squads roster and selected-player detail layer show actual analysis output, not only market rows or evidence badges.

- [x] Add a server-side player-history route for canonical player identity, recent appearances, minutes, saves, and event distributions.
- [x] Add provider fallback and explicit evidence states for player-history responses.
- [x] Wire player-history summaries into Squad cards without exposing provider names.
- [x] Add deterministic route, normalization, and Squad-card regression coverage.

- [ ] Audit existing crypto routes, feeds, and UI shell for a Memecoin Finder insertion point.
- [ ] Define real-data memecoin discovery filters, liquidity/market-risk fields, and neutral risk states.
- [ ] Implement a server-side Memecoin Finder route and responsive finder UI without fabricated token data.
- [ ] Add deterministic data-integrity and crypto-analysis regression coverage, including no-data and high-risk states.

- [x] Add a real-data Memecoin Finder route using provider-reported meme-token market fields only.
- [x] Add transparent discovery-context scoring, observable market-risk flags, filter controls, and explicit unavailable/empty states.
- [x] Add the responsive Memecoin Finder page and link it from the Crypto page.
- [x] Add deterministic memecoin normalization and no-fabrication regression tests.

- [x] Integrate Sportmonks as an optional player-statistics provider with scoped coverage, provenance, caching, and explicit unavailable states.
- [x] Add server-side DEX Screener pair enrichment for Memecoin Finder with chain/address normalization, throttling-aware caching, and licensing-aware attribution.
- [x] Wire both integrations into the existing fallback contracts and add deterministic regression tests for provider failure and missing fields.

- [x] Remove Sportmonks from football and Squads provider paths after confirming its permanent free-plan coverage is not suitable for EdgeX’s target competitions.
- [x] Preserve SportAPI → Creativesdev → ESPN for broad football coverage and keep DEX Screener enrichment active for Memecoin Finder.
- [x] Re-run provider, football, Squads, and Memecoin Finder regression checks after the Sportmonks removal.

- [x] Test SportAPI → Creativesdev → ESPN precedence for football livescores and non-completed match statistics without Sportmonks.
- [x] Test completed-match authority, partial payload merging, provider errors, and explicit no-data states.
- [x] Verify football fixture detail tabs and match-statistics layout at 540px after the fallback checks.

- [x] Normalize football scoreboard dates for the ESPN-compatible route and preserve a real SportAPI → Creativesdev → ESPN fallback path.
- [x] Add/verify non-completed match-statistics fallback behavior and completed-match authority without exposing provider names in user-facing copy.
- [ ] Reduce repeated unavailable blocks and improve primary-vs-secondary information hierarchy on Forex mobile.
- [ ] Improve Player Edge evidence presentation so insufficient data is clear but not visually repetitive or misleading.
- [ ] Improve Markets mobile cards so analysis, source state, and unavailable movement are visually distinct and less crowded.
- [x] Verify shared shell spacing, bottom navigation overlap, typography contrast, and 540px responsive behavior across the affected screens.
