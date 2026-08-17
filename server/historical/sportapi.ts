export type SportApiStatus = "available" | "partial" | "empty" | "stale" | "rate-limited" | "unauthorized" | "unavailable" | "invalid";

export type SportApiProvider = "sportapi";

export interface SportApiProvenance {
  provider: SportApiProvider;
  endpoint: string;
  providerEventId?: string;
  providerTeamId?: string;
  providerSeasonId?: string;
  retrievedAt: string;
}

export interface SportApiTeam {
  id: string;
  name: string;
  shortName?: string;
  slug?: string;
  logoUrl?: string;
}

export interface SportApiCompetition {
  id?: string;
  name: string;
  slug?: string;
  country?: string;
  season?: string;
}

export interface SportApiFixture {
  canonicalFixtureKey: string;
  providerEventId: string;
  kickoff: string;
  status: "completed" | "scheduled" | "live" | "postponed" | "cancelled" | "unknown";
  completed: boolean;
  homeTeam: SportApiTeam;
  awayTeam: SportApiTeam;
  competition: SportApiCompetition;
  season?: string;
  score: {
    home: number | null;
    away: number | null;
    halftimeHome?: number | null;
    halftimeAway?: number | null;
    verified: boolean;
  };
  venue?: { name?: string; city?: string; neutral?: boolean };
  statistics?: SportApiStatistics;
  lineups?: SportApiLineups;
  shotmap?: SportApiShotmap;
  evidenceClass: "current-season" | "previous-season" | "historical" | "direct-h2h";
  historical: boolean;
  provenance: SportApiProvenance;
}

export interface SportApiStatistics {
  possessionHome?: number | null;
  possessionAway?: number | null;
  shotsHome?: number | null;
  shotsAway?: number | null;
  shotsOnTargetHome?: number | null;
  shotsOnTargetAway?: number | null;
  cornersHome?: number | null;
  cornersAway?: number | null;
  foulsHome?: number | null;
  foulsAway?: number | null;
  yellowCardsHome?: number | null;
  yellowCardsAway?: number | null;
  redCardsHome?: number | null;
  redCardsAway?: number | null;
}

export interface SportApiLineups {
  home: SportApiPlayer[];
  away: SportApiPlayer[];
  published: boolean;
}

export interface SportApiPlayer {
  id?: string;
  name: string;
  jerseyNumber?: string;
  position?: string;
  starter?: boolean;
  substitute?: boolean;
  status?: string;
}

export interface SportApiShotmap {
  shots: Array<{
    teamId?: string;
    playerId?: string;
    playerName?: string;
    x?: number | null;
    y?: number | null;
    outcome?: string;
    minute?: number | null;
    xg?: number | null;
  }>;
}

export interface SportApiResult<T> {
  provider: SportApiProvider;
  status: SportApiStatus;
  data: T;
  fetchedAt: string;
  endpoint: string;
  diagnostics: {
    returned: number;
    warnings: string[];
  };
  error?: {
    code: "AUTH_REQUIRED" | "RATE_LIMITED" | "UPSTREAM" | "TIMEOUT" | "INVALID_PAYLOAD" | "UNKNOWN";
    message: string;
    retryable: boolean;
    httpStatus?: number;
  };
}

export interface SportApiConfig {
  apiKey?: string;
  host?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

const DEFAULT_HOST = "sportapi7.p.rapidapi.com";
const BASE_PATH = "/api/v1";
const DEFAULT_TIMEOUT_MS = 8_000;

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown): number | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function first<T>(...values: T[]): T | undefined {
  return values.find((value) => value !== undefined && value !== null);
}

function unixToIso(value: unknown): string {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    const milliseconds = numeric > 10_000_000_000 ? numeric : numeric * 1000;
    const date = new Date(milliseconds);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  const parsed = new Date(String(value ?? ""));
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString() : parsed.toISOString();
}

function unwrap(payload: any): any {
  return payload?.data ?? payload?.result ?? payload;
}

function team(raw: any): SportApiTeam {
  const source = raw?.team ?? raw ?? {};
  const id = String(first(source.id, source.teamId, "unknown"));
  return {
    id,
    name: text(first(source.name, source.displayName, source.shortName)) ?? "Unknown team",
    shortName: text(source.shortName),
    slug: text(source.slug),
    logoUrl: text(first(source.logo, source.logoUrl, source.image)),
  };
}

function eventTeams(raw: any): { home: SportApiTeam; away: SportApiTeam } {
  const homeRaw = first(raw?.homeTeam, raw?.home, raw?.home_team);
  const awayRaw = first(raw?.awayTeam, raw?.away, raw?.away_team);
  if (homeRaw || awayRaw) return { home: team(homeRaw), away: team(awayRaw) };

  const competitors = raw?.competitors ?? raw?.participants ?? raw?.teams ?? [];
  const home = competitors.find((item: any) => item.homeAway === "home" || item.isHome === true);
  const away = competitors.find((item: any) => item.homeAway === "away" || item.isHome === false);
  return { home: team(home ?? competitors[0]), away: team(away ?? competitors[1]) };
}

function statusOf(raw: any, homeScore: number | null, awayScore: number | null): SportApiFixture["status"] {
  const status = String(first(raw?.status?.type, raw?.status, raw?.eventStatus, "")).toLowerCase();
  if (status.includes("postpon")) return "postponed";
  if (status.includes("cancel")) return "cancelled";
  if (status.includes("live") || status.includes("inprogress") || status.includes("in_progress")) return "live";
  if (status.includes("finish") || status.includes("ended") || status.includes("complete")) return "completed";
  if (homeScore !== null || awayScore !== null) return raw?.startTimestamp ? "completed" : "unknown";
  return "scheduled";
}

function scoreOf(raw: any): SportApiFixture["score"] {
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
    verified: home !== undefined && away !== undefined,
  };
}

function canonicalKey(raw: any, home: SportApiTeam, away: SportApiTeam, kickoff: string, competition: SportApiCompetition): string {
  const providerId = text(first(raw?.id, raw?.eventId, raw?.event_id));
  if (providerId) return `sportapi:${providerId}`;
  return [kickoff.slice(0, 10), home.id, away.id, competition.id ?? competition.name].join("|");
}

export function normalizeSportApiEvent(rawInput: any, endpoint: string, evidenceClass: SportApiFixture["evidenceClass"] = "historical"): SportApiFixture {
  const raw = unwrap(rawInput) ?? {};
  const { home, away } = eventTeams(raw);
  const score = scoreOf(raw);
  const kickoff = unixToIso(first(raw.startTimestamp, raw.startTime, raw.kickoff, raw.start_at, raw.date));
  const competitionRaw = raw.tournament ?? raw.uniqueTournament ?? raw.competition ?? raw.league ?? {};
  const competition: SportApiCompetition = {
    id: text(first(competitionRaw.id, competitionRaw.uniqueTournamentId)),
    name: text(first(competitionRaw.name, competitionRaw.displayName, competitionRaw.slug)) ?? "Football",
    slug: text(competitionRaw.slug),
    country: text(first(competitionRaw.category?.name, competitionRaw.country)),
    season: text(first(raw.season?.name, raw.season?.year, raw.season)),
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
    venue: raw.venue ? { name: text(first(raw.venue.name, raw.venue.stadium)), city: text(raw.venue.city), neutral: raw.venue.neutral === true } : undefined,
    evidenceClass,
    historical: evidenceClass !== "current-season",
    provenance: {
      provider: "sportapi",
      endpoint,
      providerEventId,
      providerTeamId: undefined,
      providerSeasonId: text(first(raw.season?.id, raw.seasonId)),
      retrievedAt: new Date().toISOString(),
    },
  };
}

function normalizeList(payload: any): any[] {
  const data = unwrap(payload);
  if (Array.isArray(data)) return data;
  for (const key of ["events", "matches", "fixtures", "results", "items", "games"]) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

function mergeStatValue(target: SportApiStatistics, key: keyof SportApiStatistics, value: unknown): void {
  const parsed = numberValue(value);
  if (parsed !== undefined) target[key] = parsed;
}

export function normalizeSportApiStatistics(payload: any): SportApiStatistics {
  const data = unwrap(payload);
  const stats: SportApiStatistics = {};
  const groups = Array.isArray(data) ? data : data?.statistics ?? data?.groups ?? data?.teams ?? [];
  const rows = Array.isArray(groups) ? groups.flatMap((group: any) => group?.statistics ?? group?.items ?? group?.stats ?? [group]) : [];
  for (const row of rows) {
    const name = String(first(row?.name, row?.key, row?.type, "")).toLowerCase().replace(/[^a-z]/g, "");
    const home = first(row?.home, row?.homeValue, row?.value?.home, row?.statistics?.home);
    const away = first(row?.away, row?.awayValue, row?.value?.away, row?.statistics?.away);
    const pair: [keyof SportApiStatistics, keyof SportApiStatistics] | undefined =
      name.includes("possession") ? ["possessionHome", "possessionAway"] :
      name.includes("shotontarget") || name.includes("shotsontarget") ? ["shotsOnTargetHome", "shotsOnTargetAway"] :
      name === "shots" || name.includes("totalshots") ? ["shotsHome", "shotsAway"] :
      name.includes("corner") ? ["cornersHome", "cornersAway"] :
      name.includes("foul") ? ["foulsHome", "foulsAway"] :
      name.includes("yellow") ? ["yellowCardsHome", "yellowCardsAway"] :
      name.includes("red") ? ["redCardsHome", "redCardsAway"] : undefined;
    if (pair) {
      mergeStatValue(stats, pair[0], home);
      mergeStatValue(stats, pair[1], away);
    }
  }
  return stats;
}

export function normalizeSportApiLineups(payload: any): SportApiLineups {
  const data = unwrap(payload);
  const groups = data?.teams ?? data?.lineups ?? data?.players ?? data ?? [];
  const list = Array.isArray(groups) ? groups : [];
  const players = (raw: any): SportApiPlayer => ({
    id: text(first(raw?.player?.id, raw?.id)),
    name: text(first(raw?.player?.name, raw?.name, raw?.playerName)) ?? "Unknown player",
    jerseyNumber: text(first(raw?.shirtNumber, raw?.jerseyNumber, raw?.number)),
    position: text(first(raw?.position?.name, raw?.position, raw?.role)),
    starter: raw?.starter === true || raw?.substitute === false,
    substitute: raw?.substitute === true,
    status: text(first(raw?.status, raw?.reason)),
  });
  const homeRows = list.find((group: any) => group?.team?.homeAway === "home" || group?.homeAway === "home")?.players ?? data?.home?.players ?? data?.home ?? [];
  const awayRows = list.find((group: any) => group?.team?.homeAway === "away" || group?.homeAway === "away")?.players ?? data?.away?.players ?? data?.away ?? [];
  return {
    home: Array.isArray(homeRows) ? homeRows.map(players) : [],
    away: Array.isArray(awayRows) ? awayRows.map(players) : [],
    published: Array.isArray(homeRows) && Array.isArray(awayRows) && (homeRows.length > 0 || awayRows.length > 0),
  };
}

export function normalizeSportApiShotmap(payload: any): SportApiShotmap {
  const data = unwrap(payload);
  const list = Array.isArray(data) ? data : data?.shots ?? data?.shotmap ?? [];
  return {
    shots: (Array.isArray(list) ? list : []).map((shot: any) => ({
      teamId: text(first(shot?.team?.id, shot?.teamId)),
      playerId: text(first(shot?.player?.id, shot?.playerId)),
      playerName: text(first(shot?.player?.name, shot?.playerName)),
      x: numberValue(first(shot?.x, shot?.coordinates?.x)),
      y: numberValue(first(shot?.y, shot?.coordinates?.y)),
      outcome: text(first(shot?.outcome, shot?.result)),
      minute: numberValue(first(shot?.minute, shot?.time)),
      xg: numberValue(first(shot?.xg, shot?.expectedGoals)),
    })),
  };
}

export class SportApiHistoricalProvider {
  readonly name = "sportapi" as const;
  readonly version = "1.0.0";
  private readonly host: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(config: SportApiConfig = {}) {
    const env = (globalThis as any).process?.env ?? {};
    this.host = config.host ?? env.SPORTAPI_RAPIDAPI_HOST ?? DEFAULT_HOST;
    this.apiKey = config.apiKey ?? env.RAPIDAPI_KEY;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  private async request<T>(endpoint: string): Promise<SportApiResult<T>> {
    const fetchedAt = new Date().toISOString();
    if (!this.apiKey) {
      return { provider: "sportapi", status: "unauthorized", data: [] as T, fetchedAt, endpoint, diagnostics: { returned: 0, warnings: ["RAPIDAPI_KEY is not configured"] }, error: { code: "AUTH_REQUIRED", message: "SportAPI RapidAPI key is not configured", retryable: false } };
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(`https://${this.host}${BASE_PATH}${endpoint}`, {
        headers: { "Content-Type": "application/json", "x-rapidapi-host": this.host, "x-rapidapi-key": this.apiKey },
        signal: controller.signal,
      });
      const bodyText = await response.text();
      let body: any = {};
      try { body = bodyText ? JSON.parse(bodyText) : {}; } catch { body = { raw: bodyText }; }
      if (!response.ok) {
        const isRateLimit = response.status === 429;
        const isAuth = response.status === 401 || response.status === 403;
        return { provider: "sportapi", status: isRateLimit ? "rate-limited" : isAuth ? "unauthorized" : "unavailable", data: [] as T, fetchedAt, endpoint, diagnostics: { returned: 0, warnings: [String(body?.message ?? "SportAPI request failed")] }, error: { code: isRateLimit ? "RATE_LIMITED" : isAuth ? "AUTH_REQUIRED" : "UPSTREAM", message: String(body?.message ?? `SportAPI returned ${response.status}`), retryable: isRateLimit || response.status >= 500, httpStatus: response.status } };
      }
      return { provider: "sportapi", status: "available", data: body as T, fetchedAt, endpoint, diagnostics: { returned: Array.isArray(body) ? body.length : 1, warnings: [] } };
    } catch (error: any) {
      const timeout = error?.name === "AbortError";
      return { provider: "sportapi", status: "unavailable", data: [] as T, fetchedAt, endpoint, diagnostics: { returned: 0, warnings: [String(error?.message ?? error)] }, error: { code: timeout ? "TIMEOUT" : "UNKNOWN", message: String(error?.message ?? error), retryable: true } };
    } finally {
      clearTimeout(timer);
    }
  }

  async getTeamHistory(teamId: string, options: { page?: number } = {}): Promise<SportApiResult<SportApiFixture[]>> {
    const endpoint = `/team/${encodeURIComponent(teamId)}/events/last/${options.page ?? 0}`;
    const result = await this.request<any>(endpoint);
    const rows = normalizeList(result.data);
    const data = rows.map((row) => normalizeSportApiEvent(row, endpoint, "historical"));
    return { ...result, data, status: data.length ? "available" : result.status === "available" ? "empty" : result.status, diagnostics: { ...result.diagnostics, returned: data.length } };
  }

  async getH2H(eventId: string): Promise<SportApiResult<SportApiFixture[]>> {
    const endpoint = `/event/${encodeURIComponent(eventId)}/h2h`;
    const result = await this.request<any>(endpoint);
    const rows = normalizeList(result.data);
    const data = rows.map((row) => normalizeSportApiEvent(row, endpoint, "direct-h2h"));
    return { ...result, data, status: data.length ? "available" : result.status === "available" ? "empty" : result.status, diagnostics: { ...result.diagnostics, returned: data.length } };
  }

  async getEvent(eventId: string): Promise<SportApiResult<SportApiFixture | null>> {
    const endpoint = `/event/${encodeURIComponent(eventId)}`;
    const result = await this.request<any>(endpoint);
    const data = result.status === "available" ? normalizeSportApiEvent(result.data, endpoint, "historical") : null;
    return { ...result, data, diagnostics: { ...result.diagnostics, returned: data ? 1 : 0 } };
  }

  async getStatistics(eventId: string): Promise<SportApiResult<SportApiStatistics>> {
    const endpoint = `/event/${encodeURIComponent(eventId)}/statistics`;
    const result = await this.request<any>(endpoint);
    const data = result.status === "available" ? normalizeSportApiStatistics(result.data) : {};
    return { ...result, data, diagnostics: { ...result.diagnostics, returned: Object.keys(data).length } };
  }

  async getLineups(eventId: string): Promise<SportApiResult<SportApiLineups>> {
    const endpoint = `/event/${encodeURIComponent(eventId)}/lineups`;
    const result = await this.request<any>(endpoint);
    const data = result.status === "available" ? normalizeSportApiLineups(result.data) : { home: [], away: [], published: false };
    return { ...result, data, diagnostics: { ...result.diagnostics, returned: data.home.length + data.away.length } };
  }

  async getShotmap(eventId: string, teamId: string): Promise<SportApiResult<SportApiShotmap>> {
    const endpoint = `/event/${encodeURIComponent(eventId)}/shotmap/${encodeURIComponent(teamId)}`;
    const result = await this.request<any>(endpoint);
    const data = result.status === "available" ? normalizeSportApiShotmap(result.data) : { shots: [] };
    return { ...result, data, diagnostics: { ...result.diagnostics, returned: data.shots.length } };
  }
}

export const sportApiProvider = new SportApiHistoricalProvider();
