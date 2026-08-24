const DEFAULT_HOST = "sportapi7.p.rapidapi.com";
const BASE_PATH = "/api/v1";
const DEFAULT_TIMEOUT_MS = 8e3;
function text(value) {
  return typeof value === "string" && value.trim() ? value.trim() : void 0;
}
function numberValue(value) {
  if (value === null || value === void 0 || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : void 0;
}
function first(...values) {
  return values.find((value) => value !== void 0 && value !== null);
}
function unixToIso(value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    const milliseconds = numeric > 1e10 ? numeric : numeric * 1e3;
    const date = new Date(milliseconds);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  const parsed = new Date(String(value ?? ""));
  return Number.isNaN(parsed.getTime()) ? (/* @__PURE__ */ new Date(0)).toISOString() : parsed.toISOString();
}
function unwrap(payload) {
  return payload?.data ?? payload?.result ?? payload;
}
function team(raw) {
  const source = raw?.team ?? raw ?? {};
  const id = String(first(source.id, source.teamId, "unknown"));
  return {
    id,
    name: text(first(source.name, source.displayName, source.shortName)) ?? "Unknown team",
    shortName: text(source.shortName),
    slug: text(source.slug),
    logoUrl: text(first(source.logo, source.logoUrl, source.image))
  };
}
function eventTeams(raw) {
  const homeRaw = first(raw?.homeTeam, raw?.home, raw?.home_team);
  const awayRaw = first(raw?.awayTeam, raw?.away, raw?.away_team);
  if (homeRaw || awayRaw) return { home: team(homeRaw), away: team(awayRaw) };
  const competitors = raw?.competitors ?? raw?.participants ?? raw?.teams ?? [];
  const home = competitors.find((item) => item.homeAway === "home" || item.isHome === true);
  const away = competitors.find((item) => item.homeAway === "away" || item.isHome === false);
  return { home: team(home ?? competitors[0]), away: team(away ?? competitors[1]) };
}
function statusOf(raw, homeScore, awayScore) {
  const status = String(first(raw?.status?.type, raw?.status, raw?.eventStatus, "")).toLowerCase();
  if (status.includes("postpon")) return "postponed";
  if (status.includes("cancel")) return "cancelled";
  if (status.includes("live") || status.includes("inprogress") || status.includes("in_progress")) return "live";
  if (status.includes("finish") || status.includes("ended") || status.includes("complete")) return "completed";
  if (homeScore !== null || awayScore !== null) return raw?.startTimestamp ? "completed" : "unknown";
  return "scheduled";
}
function scoreOf(raw) {
  const score = raw?.score ?? raw?.scores ?? {};
  const home = numberValue(first(score.home, score.homeScore, score.current?.home, raw?.homeScore));
  const away = numberValue(first(score.away, score.awayScore, score.current?.away, raw?.awayScore));
  const halftimeHome = numberValue(first(score.period1?.home, score.ht?.home, score.halfTime?.home));
  const halftimeAway = numberValue(first(score.period1?.away, score.ht?.away, score.halfTime?.away));
  return {
    home: home ?? null,
    away: away ?? null,
    halftimeHome,
    halftimeAway,
    verified: home !== void 0 && away !== void 0
  };
}
function canonicalKey(raw, home, away, kickoff, competition) {
  const providerId = text(first(raw?.id, raw?.eventId, raw?.event_id));
  if (providerId) return `sportapi:${providerId}`;
  return [kickoff.slice(0, 10), home.id, away.id, competition.id ?? competition.name].join("|");
}
function normalizeSportApiEvent(rawInput, endpoint, evidenceClass = "historical") {
  const raw = unwrap(rawInput) ?? {};
  const { home, away } = eventTeams(raw);
  const score = scoreOf(raw);
  const kickoff = unixToIso(first(raw.startTimestamp, raw.startTime, raw.kickoff, raw.start_at, raw.date));
  const competitionRaw = raw.tournament ?? raw.uniqueTournament ?? raw.competition ?? raw.league ?? {};
  const competition = {
    id: text(first(competitionRaw.id, competitionRaw.uniqueTournamentId)),
    name: text(first(competitionRaw.name, competitionRaw.displayName, competitionRaw.slug)) ?? "Football",
    slug: text(competitionRaw.slug),
    country: text(first(competitionRaw.category?.name, competitionRaw.country)),
    season: text(first(raw.season?.name, raw.season?.year, raw.season))
  };
  const providerEventId = String(first(raw.id, raw.eventId, raw.event_id, "unknown"));
  const status = statusOf(raw, score.home, score.away);
  return {
    canonicalFixtureKey: canonicalKey(raw, home, away, kickoff, competition),
    providerEventId,
    kickoff,
    status,
    completed: status === "completed",
    homeTeam: home,
    awayTeam: away,
    competition,
    season: competition.season,
    score,
    venue: raw.venue ? { name: text(first(raw.venue.name, raw.venue.stadium)), city: text(raw.venue.city), neutral: raw.venue.neutral === true } : void 0,
    evidenceClass,
    historical: evidenceClass !== "current-season",
    provenance: {
      provider: "sportapi",
      endpoint,
      providerEventId,
      providerTeamId: void 0,
      providerSeasonId: text(first(raw.season?.id, raw.seasonId)),
      retrievedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
}
function normalizeList(payload) {
  const data = unwrap(payload);
  if (Array.isArray(data)) return data;
  for (const key of ["events", "matches", "fixtures", "results", "items", "games"]) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}
function mergeStatValue(target, key, value) {
  const parsed = numberValue(value);
  if (parsed !== void 0) target[key] = parsed;
}
function normalizeSportApiStatistics(payload) {
  const data = unwrap(payload);
  const stats = {};
  const groups = Array.isArray(data) ? data : data?.statistics ?? data?.groups ?? data?.teams ?? [];
  const rows = Array.isArray(groups) ? groups.flatMap((group) => group?.statistics ?? group?.items ?? group?.stats ?? [group]) : [];
  for (const row of rows) {
    const name = String(first(row?.name, row?.key, row?.type, "")).toLowerCase().replace(/[^a-z]/g, "");
    const home = first(row?.home, row?.homeValue, row?.value?.home, row?.statistics?.home);
    const away = first(row?.away, row?.awayValue, row?.value?.away, row?.statistics?.away);
    const pair = name.includes("possession") ? ["possessionHome", "possessionAway"] : name.includes("shotontarget") || name.includes("shotsontarget") ? ["shotsOnTargetHome", "shotsOnTargetAway"] : name === "shots" || name.includes("totalshots") ? ["shotsHome", "shotsAway"] : name.includes("corner") ? ["cornersHome", "cornersAway"] : name.includes("foul") ? ["foulsHome", "foulsAway"] : name.includes("yellow") ? ["yellowCardsHome", "yellowCardsAway"] : name.includes("red") ? ["redCardsHome", "redCardsAway"] : void 0;
    if (pair) {
      mergeStatValue(stats, pair[0], home);
      mergeStatValue(stats, pair[1], away);
    }
  }
  return stats;
}
function normalizeSportApiLineups(payload) {
  const data = unwrap(payload);
  const groups = data?.teams ?? data?.lineups ?? data?.players ?? data ?? [];
  const list = Array.isArray(groups) ? groups : [];
  const players = (raw) => {
    const source = raw?.statistics ?? raw?.stats ?? raw?.playerStatistics ?? {};
    const statistics = {};
    for (const [key, value] of Object.entries(source)) {
      const parsed = numberValue(value);
      if (parsed !== void 0) statistics[key] = parsed;
    }
    return {
      id: text(first(raw?.player?.id, raw?.id)),
      name: text(first(raw?.player?.name, raw?.name, raw?.playerName)) ?? "Unknown player",
      jerseyNumber: text(first(raw?.shirtNumber, raw?.jerseyNumber, raw?.number)),
      position: text(first(raw?.position?.name, raw?.position, raw?.role)),
      starter: raw?.starter === true || raw?.substitute === false,
      substitute: raw?.substitute === true,
      status: text(first(raw?.status, raw?.reason)),
      minutes: numberValue(first(raw?.minutesPlayed, raw?.minutes, source?.minutesPlayed, source?.minutes)),
      statistics
    };
  };
  const homeRows = list.find((group) => group?.team?.homeAway === "home" || group?.homeAway === "home")?.players ?? data?.home?.players ?? data?.home ?? [];
  const awayRows = list.find((group) => group?.team?.homeAway === "away" || group?.homeAway === "away")?.players ?? data?.away?.players ?? data?.away ?? [];
  return {
    home: Array.isArray(homeRows) ? homeRows.map(players) : [],
    away: Array.isArray(awayRows) ? awayRows.map(players) : [],
    published: Array.isArray(homeRows) && Array.isArray(awayRows) && (homeRows.length > 0 || awayRows.length > 0)
  };
}
function normalizeSportApiShotmap(payload) {
  const data = unwrap(payload);
  const list = Array.isArray(data) ? data : data?.shots ?? data?.shotmap ?? [];
  return {
    shots: (Array.isArray(list) ? list : []).map((shot) => ({
      teamId: text(first(shot?.team?.id, shot?.teamId)),
      playerId: text(first(shot?.player?.id, shot?.playerId)),
      playerName: text(first(shot?.player?.name, shot?.playerName)),
      x: numberValue(first(shot?.x, shot?.coordinates?.x)),
      y: numberValue(first(shot?.y, shot?.coordinates?.y)),
      outcome: text(first(shot?.outcome, shot?.result)),
      minute: numberValue(first(shot?.minute, shot?.time)),
      xg: numberValue(first(shot?.xg, shot?.expectedGoals))
    }))
  };
}
class SportApiHistoricalProvider {
  name = "sportapi";
  version = "1.0.0";
  host;
  apiKey;
  timeoutMs;
  fetchImpl;
  constructor(config = {}) {
    const env = globalThis.process?.env ?? {};
    this.host = config.host ?? env.SPORTAPI_RAPIDAPI_HOST ?? DEFAULT_HOST;
    this.apiKey = config.apiKey ?? env.RAPIDAPI_KEY;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }
  async request(endpoint) {
    const fetchedAt = (/* @__PURE__ */ new Date()).toISOString();
    if (!this.apiKey) {
      return { provider: "sportapi", status: "unauthorized", data: [], fetchedAt, endpoint, diagnostics: { returned: 0, warnings: ["RAPIDAPI_KEY is not configured"] }, error: { code: "AUTH_REQUIRED", message: "SportAPI RapidAPI key is not configured", retryable: false } };
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(`https://${this.host}${BASE_PATH}${endpoint}`, {
        headers: { "Content-Type": "application/json", "x-rapidapi-host": this.host, "x-rapidapi-key": this.apiKey },
        signal: controller.signal
      });
      const bodyText = await response.text();
      let body = {};
      try {
        body = bodyText ? JSON.parse(bodyText) : {};
      } catch {
        body = { raw: bodyText };
      }
      if (!response.ok) {
        const isRateLimit = response.status === 429;
        const isAuth = response.status === 401 || response.status === 403;
        return { provider: "sportapi", status: isRateLimit ? "rate-limited" : isAuth ? "unauthorized" : "unavailable", data: [], fetchedAt, endpoint, diagnostics: { returned: 0, warnings: [String(body?.message ?? "SportAPI request failed")] }, error: { code: isRateLimit ? "RATE_LIMITED" : isAuth ? "AUTH_REQUIRED" : "UPSTREAM", message: String(body?.message ?? `SportAPI returned ${response.status}`), retryable: isRateLimit || response.status >= 500, httpStatus: response.status } };
      }
      return { provider: "sportapi", status: "available", data: body, fetchedAt, endpoint, diagnostics: { returned: Array.isArray(body) ? body.length : 1, warnings: [] } };
    } catch (error) {
      const timeout = error?.name === "AbortError";
      return { provider: "sportapi", status: "unavailable", data: [], fetchedAt, endpoint, diagnostics: { returned: 0, warnings: [String(error?.message ?? error)] }, error: { code: timeout ? "TIMEOUT" : "UNKNOWN", message: String(error?.message ?? error), retryable: true } };
    } finally {
      clearTimeout(timer);
    }
  }
  async getScheduledEvents(date) {
    const endpoint = `/sport/football/scheduled-events/${encodeURIComponent(date)}`;
    const result = await this.request(endpoint);
    const rows = normalizeList(result.data);
    const data = rows.map((row) => normalizeSportApiEvent(row, endpoint, "current-season"));
    return { ...result, data, status: data.length ? "available" : result.status === "available" ? "empty" : result.status, diagnostics: { ...result.diagnostics, returned: data.length } };
  }
  async getTeamHistory(teamId, options = {}) {
    const endpoint = `/team/${encodeURIComponent(teamId)}/events/last/${options.page ?? 0}`;
    const result = await this.request(endpoint);
    const rows = normalizeList(result.data);
    const data = rows.map((row) => normalizeSportApiEvent(row, endpoint, "historical"));
    return { ...result, data, status: data.length ? "available" : result.status === "available" ? "empty" : result.status, diagnostics: { ...result.diagnostics, returned: data.length } };
  }
  async getH2H(eventId) {
    const endpoint = `/event/${encodeURIComponent(eventId)}/h2h`;
    const result = await this.request(endpoint);
    const rows = normalizeList(result.data);
    const data = rows.map((row) => normalizeSportApiEvent(row, endpoint, "direct-h2h"));
    return { ...result, data, status: data.length ? "available" : result.status === "available" ? "empty" : result.status, diagnostics: { ...result.diagnostics, returned: data.length } };
  }
  async getEvent(eventId) {
    const endpoint = `/event/${encodeURIComponent(eventId)}`;
    const result = await this.request(endpoint);
    const data = result.status === "available" ? normalizeSportApiEvent(result.data, endpoint, "historical") : null;
    return { ...result, data, diagnostics: { ...result.diagnostics, returned: data ? 1 : 0 } };
  }
  async getStatistics(eventId) {
    const endpoint = `/event/${encodeURIComponent(eventId)}/statistics`;
    const result = await this.request(endpoint);
    const data = result.status === "available" ? normalizeSportApiStatistics(result.data) : {};
    return { ...result, data, diagnostics: { ...result.diagnostics, returned: Object.keys(data).length } };
  }
  async getLineups(eventId) {
    const endpoint = `/event/${encodeURIComponent(eventId)}/lineups`;
    const result = await this.request(endpoint);
    const data = result.status === "available" ? normalizeSportApiLineups(result.data) : { home: [], away: [], published: false };
    return { ...result, data, diagnostics: { ...result.diagnostics, returned: data.home.length + data.away.length } };
  }
  async getShotmap(eventId, teamId) {
    const endpoint = `/event/${encodeURIComponent(eventId)}/shotmap/${encodeURIComponent(teamId)}`;
    const result = await this.request(endpoint);
    const data = result.status === "available" ? normalizeSportApiShotmap(result.data) : { shots: [] };
    return { ...result, data, diagnostics: { ...result.diagnostics, returned: data.shots.length } };
  }
}
const sportApiProvider = new SportApiHistoricalProvider();
export {
  SportApiHistoricalProvider,
  normalizeSportApiEvent,
  normalizeSportApiLineups,
  normalizeSportApiShotmap,
  normalizeSportApiStatistics,
  sportApiProvider
};
