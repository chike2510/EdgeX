const DEFAULT_HOST = "free-api-live-football-data.p.rapidapi.com";
const DEFAULT_TIMEOUT_MS = 8e3;
function text(value) {
  return typeof value === "string" && value.trim() ? value.trim() : void 0;
}
function num(value) {
  if (value === null || value === void 0 || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function first(...values) {
  return values.find((value) => value !== void 0 && value !== null);
}
function iso(value) {
  if (typeof value === "number" || /^\d+$/.test(String(value ?? ""))) {
    const n = Number(value);
    const date2 = new Date(n > 1e10 ? n : n * 1e3);
    if (!Number.isNaN(date2.getTime())) return date2.toISOString();
  }
  const date = new Date(String(value ?? ""));
  return Number.isNaN(date.getTime()) ? (/* @__PURE__ */ new Date(0)).toISOString() : date.toISOString();
}
function unwrap(payload) {
  return payload?.response ?? payload?.data ?? payload?.result ?? payload;
}
function normalizeTeam(raw) {
  const source = raw?.team ?? raw ?? {};
  return {
    id: String(first(source.id, source.teamId, source.team_id, "unknown")),
    name: text(first(source.name, source.teamName, source.displayName, source.shortName)) ?? "Unknown team",
    shortName: text(source.shortName),
    logoUrl: text(first(source.logo, source.logoUrl, source.image))
  };
}
function normalizeLeague(raw) {
  const source = raw?.league ?? raw?.tournament ?? raw ?? {};
  return {
    id: String(first(source.id, source.leagueId, source.league_id, "unknown")),
    name: text(first(source.name, source.leagueName, source.localizedName)) ?? "Football",
    countryCode: text(first(source.ccode, source.countryCode)),
    logoUrl: text(first(source.logo, source.logoUrl))
  };
}
function normalizeRows(payload) {
  const data = unwrap(payload);
  if (Array.isArray(data)) return data;
  for (const key of ["matches", "fixtures", "events", "games", "leagues", "results", "items"]) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}
function normalizeCreativesDevFixture(raw, endpoint) {
  const home = normalizeTeam(first(raw.homeTeam, raw.home, raw.home_team, raw.teams?.home));
  const away = normalizeTeam(first(raw.awayTeam, raw.away, raw.away_team, raw.teams?.away));
  const league = normalizeLeague(first(raw.league, raw.tournament, raw.competition));
  const homeScore = num(first(raw.homeScore, raw.home_score, raw.home?.score, raw.score?.home, raw.homeTeam?.score));
  const awayScore = num(first(raw.awayScore, raw.away_score, raw.away?.score, raw.score?.away, raw.awayTeam?.score));
  const state = String(first(raw.status, raw.matchStatus, raw.eventStatus, "")).toLowerCase();
  const completed = raw.finished === true || raw.isFinished === true || state.includes("finished") || state.includes("completed") || state === "ft";
  const live = raw.isLive === true || state.includes("live") || state.includes("progress");
  const status = completed ? "completed" : live ? "live" : state.includes("postpon") ? "postponed" : state.includes("cancel") ? "cancelled" : "scheduled";
  const kickoff = iso(first(raw.startTime, raw.startTimestamp, raw.kickoff, raw.date, raw.matchTime));
  const providerEventId = String(first(raw.id, raw.eventId, raw.event_id, "unknown"));
  return {
    canonicalFixtureKey: `creativesdev:${providerEventId}`,
    providerEventId,
    kickoff,
    status,
    completed,
    homeTeam: home,
    awayTeam: away,
    competition: league,
    score: { home: homeScore, away: awayScore, verified: homeScore !== null && awayScore !== null },
    historical: completed,
    evidenceClass: completed ? "historical" : "current-season",
    provenance: { provider: "creativesdev", endpoint, providerEventId, retrievedAt: (/* @__PURE__ */ new Date()).toISOString() }
  };
}
class CreativesDevHistoricalProvider {
  name = "creativesdev";
  version = "1.0.0";
  host;
  apiKey;
  timeoutMs;
  fetchImpl;
  constructor(config = {}) {
    const env = globalThis.process?.env ?? {};
    this.host = config.host ?? env.CREATIVESDEV_RAPIDAPI_HOST ?? DEFAULT_HOST;
    this.apiKey = config.apiKey ?? env.CREATIVESDEV_RAPIDAPI_KEY;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }
  async request(endpoint, params = {}) {
    const fetchedAt = (/* @__PURE__ */ new Date()).toISOString();
    if (!this.apiKey) {
      return { provider: "creativesdev", status: "unauthorized", data: [], fetchedAt, endpoint, diagnostics: { returned: 0, warnings: ["CREATIVESDEV_RAPIDAPI_KEY is not configured"] }, error: { code: "AUTH_REQUIRED", message: "Creativesdev RapidAPI key is not configured", retryable: false } };
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) if (value !== void 0 && value !== "") query.set(key, String(value));
      const url = `https://${this.host}${endpoint}${query.toString() ? `?${query}` : ""}`;
      const response = await this.fetchImpl(url, { headers: { "Content-Type": "application/json", "x-rapidapi-key": this.apiKey, "x-rapidapi-host": this.host }, signal: controller.signal });
      const bodyText = await response.text();
      let body = {};
      try {
        body = bodyText ? JSON.parse(bodyText) : {};
      } catch {
        body = { raw: bodyText };
      }
      const providerFailed = body?.status === "failed" || body?.success === false;
      if (!response.ok || providerFailed) {
        const message = String(body?.message ?? `Creativesdev returned ${response.status}`);
        const auth = response.status === 401 || response.status === 403;
        const rate = response.status === 429;
        return { provider: "creativesdev", status: rate ? "rate-limited" : auth ? "unauthorized" : "unavailable", data: [], fetchedAt, endpoint, diagnostics: { returned: 0, warnings: [message] }, error: { code: rate ? "RATE_LIMITED" : auth ? "AUTH_REQUIRED" : "UPSTREAM", message, retryable: rate || response.status >= 500 } };
      }
      return { provider: "creativesdev", status: "available", data: body, fetchedAt, endpoint, diagnostics: { returned: Array.isArray(body) ? body.length : 1, warnings: [] } };
    } catch (error) {
      const timeout = error?.name === "AbortError";
      return { provider: "creativesdev", status: "unavailable", data: [], fetchedAt, endpoint, diagnostics: { returned: 0, warnings: [String(error?.message ?? error)] }, error: { code: timeout ? "TIMEOUT" : "UNKNOWN", message: String(error?.message ?? error), retryable: true } };
    } finally {
      clearTimeout(timer);
    }
  }
  async getLeagues() {
    const endpoint = "/football-get-all-leagues";
    const result = await this.request(endpoint);
    const data = normalizeRows(result.data).map(normalizeLeague);
    return { ...result, data, status: data.length ? "available" : result.status === "available" ? "empty" : result.status, diagnostics: { ...result.diagnostics, returned: data.length } };
  }
  async getMatchesByDate(date, leagueId) {
    const endpoint = "/football-get-matches-by-date";
    const result = await this.request(endpoint, { date, leagueId, league_id: leagueId });
    const data = normalizeRows(result.data).map((row) => normalizeCreativesDevFixture(row, endpoint));
    return { ...result, data, status: data.length ? "available" : result.status === "available" ? "empty" : result.status, diagnostics: { ...result.diagnostics, returned: data.length } };
  }
  async getMatchStatistics(eventId) {
    const endpoint = "/football-get-match-event-all-stats";
    const result = await this.request(endpoint, { eventId, event_id: eventId });
    const data = result.status === "available" ? unwrap(result.data) ?? {} : {};
    return { ...result, data, diagnostics: { ...result.diagnostics, returned: Object.keys(data).length } };
  }
}
const creativesDevProvider = new CreativesDevHistoricalProvider();
export {
  CreativesDevHistoricalProvider,
  creativesDevProvider,
  normalizeCreativesDevFixture
};
