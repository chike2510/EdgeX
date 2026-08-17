export type CreativesDevStatus = "available" | "partial" | "empty" | "rate-limited" | "unauthorized" | "unavailable" | "invalid";

export interface CreativesDevProvenance {
  provider: "creativesdev";
  endpoint: string;
  providerEventId?: string;
  retrievedAt: string;
}

export interface CreativesDevTeam {
  id: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
}

export interface CreativesDevLeague {
  id: string;
  name: string;
  countryCode?: string;
  logoUrl?: string;
}

export interface CreativesDevFixture {
  canonicalFixtureKey: string;
  providerEventId: string;
  kickoff: string;
  status: "completed" | "scheduled" | "live" | "postponed" | "cancelled" | "unknown";
  completed: boolean;
  homeTeam: CreativesDevTeam;
  awayTeam: CreativesDevTeam;
  competition: CreativesDevLeague;
  score: { home: number | null; away: number | null; verified: boolean };
  historical: boolean;
  evidenceClass: "current-season" | "previous-season" | "historical";
  provenance: CreativesDevProvenance;
}

export interface CreativesDevResult<T> {
  provider: "creativesdev";
  status: CreativesDevStatus;
  data: T;
  fetchedAt: string;
  endpoint: string;
  diagnostics: { returned: number; warnings: string[] };
  error?: {
    code: "AUTH_REQUIRED" | "RATE_LIMITED" | "UPSTREAM" | "TIMEOUT" | "INVALID_PAYLOAD" | "UNKNOWN";
    message: string;
    retryable: boolean;
    httpStatus?: number;
  };
}

export interface CreativesDevConfig {
  apiKey?: string;
  host?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

const DEFAULT_HOST = "free-api-live-football-data.p.rapidapi.com";
const DEFAULT_TIMEOUT_MS = 8_000;

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function first<T>(...values: T[]): T | undefined {
  return values.find((value) => value !== undefined && value !== null);
}

function iso(value: unknown): string {
  if (typeof value === "number" || /^\d+$/.test(String(value ?? ""))) {
    const n = Number(value);
    const date = new Date(n > 10_000_000_000 ? n : n * 1000);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  const date = new Date(String(value ?? ""));
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

function unwrap(payload: any): any {
  return payload?.response ?? payload?.data ?? payload?.result ?? payload;
}

function normalizeTeam(raw: any): CreativesDevTeam {
  const source = raw?.team ?? raw ?? {};
  return {
    id: String(first(source.id, source.teamId, source.team_id, "unknown")),
    name: text(first(source.name, source.teamName, source.displayName, source.shortName)) ?? "Unknown team",
    shortName: text(source.shortName),
    logoUrl: text(first(source.logo, source.logoUrl, source.image)),
  };
}

function normalizeLeague(raw: any): CreativesDevLeague {
  const source = raw?.league ?? raw?.tournament ?? raw ?? {};
  return {
    id: String(first(source.id, source.leagueId, source.league_id, "unknown")),
    name: text(first(source.name, source.leagueName, source.localizedName)) ?? "Football",
    countryCode: text(first(source.ccode, source.countryCode)),
    logoUrl: text(first(source.logo, source.logoUrl)),
  };
}

function normalizeRows(payload: any): any[] {
  const data = unwrap(payload);
  if (Array.isArray(data)) return data;
  for (const key of ["matches", "fixtures", "events", "games", "leagues", "results", "items"]) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

export function normalizeCreativesDevFixture(raw: any, endpoint: string): CreativesDevFixture {
  const home = normalizeTeam(first(raw.homeTeam, raw.home, raw.home_team, raw.teams?.home));
  const away = normalizeTeam(first(raw.awayTeam, raw.away, raw.away_team, raw.teams?.away));
  const league = normalizeLeague(first(raw.league, raw.tournament, raw.competition));
  const homeScore = num(first(raw.homeScore, raw.home_score, raw.home?.score, raw.score?.home, raw.homeTeam?.score));
  const awayScore = num(first(raw.awayScore, raw.away_score, raw.away?.score, raw.score?.away, raw.awayTeam?.score));
  const state = String(first(raw.status, raw.matchStatus, raw.eventStatus, "")).toLowerCase();
  const completed = raw.finished === true || raw.isFinished === true || state.includes("finished") || state.includes("completed") || state === "ft";
  const live = raw.isLive === true || state.includes("live") || state.includes("progress");
  const status: CreativesDevFixture["status"] = completed ? "completed" : live ? "live" : state.includes("postpon") ? "postponed" : state.includes("cancel") ? "cancelled" : "scheduled";
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
    provenance: { provider: "creativesdev", endpoint, providerEventId, retrievedAt: new Date().toISOString() },
  };
}

export class CreativesDevHistoricalProvider {
  readonly name = "creativesdev" as const;
  readonly version = "1.0.0";
  private readonly host: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(config: CreativesDevConfig = {}) {
    const env = (globalThis as any).process?.env ?? {};
    this.host = config.host ?? env.CREATIVESDEV_RAPIDAPI_HOST ?? DEFAULT_HOST;
    this.apiKey = config.apiKey ?? env.CREATIVESDEV_RAPIDAPI_KEY;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  private async request<T>(endpoint: string, params: Record<string, string | number | undefined> = {}): Promise<CreativesDevResult<T>> {
    const fetchedAt = new Date().toISOString();
    if (!this.apiKey) {
      return { provider: "creativesdev", status: "unauthorized", data: [] as T, fetchedAt, endpoint, diagnostics: { returned: 0, warnings: ["CREATIVESDEV_RAPIDAPI_KEY is not configured"] }, error: { code: "AUTH_REQUIRED", message: "Creativesdev RapidAPI key is not configured", retryable: false } };
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== "") query.set(key, String(value));
      const url = `https://${this.host}${endpoint}${query.toString() ? `?${query}` : ""}`;
      const response = await this.fetchImpl(url, { headers: { "Content-Type": "application/json", "x-rapidapi-key": this.apiKey, "x-rapidapi-host": this.host }, signal: controller.signal });
      const bodyText = await response.text();
      let body: any = {};
      try { body = bodyText ? JSON.parse(bodyText) : {}; } catch { body = { raw: bodyText }; }
      const providerFailed = body?.status === "failed" || body?.success === false;
      if (!response.ok || providerFailed) {
        const message = String(body?.message ?? `Creativesdev returned ${response.status}`);
        const auth = response.status === 401 || response.status === 403;
        const rate = response.status === 429;
        return { provider: "creativesdev", status: rate ? "rate-limited" : auth ? "unauthorized" : "unavailable", data: [] as T, fetchedAt, endpoint, diagnostics: { returned: 0, warnings: [message] }, error: { code: rate ? "RATE_LIMITED" : auth ? "AUTH_REQUIRED" : "UPSTREAM", message, retryable: rate || response.status >= 500 } };
      }
      return { provider: "creativesdev", status: "available", data: body as T, fetchedAt, endpoint, diagnostics: { returned: Array.isArray(body) ? body.length : 1, warnings: [] } };
    } catch (error: any) {
      const timeout = error?.name === "AbortError";
      return { provider: "creativesdev", status: "unavailable", data: [] as T, fetchedAt, endpoint, diagnostics: { returned: 0, warnings: [String(error?.message ?? error)] }, error: { code: timeout ? "TIMEOUT" : "UNKNOWN", message: String(error?.message ?? error), retryable: true } };
    } finally {
      clearTimeout(timer);
    }
  }

  async getLeagues(): Promise<CreativesDevResult<CreativesDevLeague[]>> {
    const endpoint = "/football-get-all-leagues";
    const result = await this.request<any>(endpoint);
    const data = normalizeRows(result.data).map(normalizeLeague);
    return { ...result, data, status: data.length ? "available" : result.status === "available" ? "empty" : result.status, diagnostics: { ...result.diagnostics, returned: data.length } };
  }

  async getMatchesByDate(date: string, leagueId?: string): Promise<CreativesDevResult<CreativesDevFixture[]>> {
    const endpoint = "/football-get-matches-by-date";
    const result = await this.request<any>(endpoint, { date, leagueId, league_id: leagueId });
    const data = normalizeRows(result.data).map((row) => normalizeCreativesDevFixture(row, endpoint));
    return { ...result, data, status: data.length ? "available" : result.status === "available" ? "empty" : result.status, diagnostics: { ...result.diagnostics, returned: data.length } };
  }

  async getMatchStatistics(eventId: string): Promise<CreativesDevResult<Record<string, unknown>>> {
    const endpoint = "/football-get-match-event-all-stats";
    const result = await this.request<any>(endpoint, { eventId, event_id: eventId });
    const data = result.status === "available" ? (unwrap(result.data) ?? {}) : {};
    return { ...result, data, diagnostics: { ...result.diagnostics, returned: Object.keys(data).length } };
  }
}

export const creativesDevProvider = new CreativesDevHistoricalProvider();
