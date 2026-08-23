# Data access findings

## DEX Screener

The official API reference at https://docs.dexscreener.com/api/reference lists public JSON endpoints for token profiles, token pairs, token search, pairs, boosts, and metadata. The reference shows 60 requests per minute for profile/boost/metadata endpoints and 300 requests per minute for token/pair/search endpoints. The API can therefore be used as a supplemental market-data source for Memecoin Finder, subject to rate limiting, caching, endpoint-specific parameters, and the API terms at https://docs.dexscreener.com/api/api-terms-and-conditions.

## Opta / Stats Perform

The official Stats Perform pages position Opta as a commercial sports-data product and direct API/data-delivery access, pricing, and configuration questions to sales/contact channels. No official free public Opta player-statistics API was found. Opta should be treated as licensed/partner access unless the project obtains a written commercial agreement or an authorized distribution connector. Existing provider-backed sources should remain the basis for EdgeX player history until then.
