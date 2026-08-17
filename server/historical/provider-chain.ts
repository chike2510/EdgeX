export type ProviderChainName = "espn" | "sportapi" | "creativesdev";

export interface ProviderChainRecord {
  canonicalFixtureKey: string;
  kickoff: string;
  completed: boolean;
  provider: ProviderChainName;
  providerEventId?: string;
  [key: string]: unknown;
}

export interface ProviderBatch<T extends ProviderChainRecord> {
  provider: ProviderChainName;
  status: "available" | "partial" | "empty" | "unavailable" | "rate-limited" | "unauthorized";
  data: T[];
}

export const ANALYTICAL_WINDOW_LIMIT = 15;

const PROVIDER_PRIORITY: ProviderChainName[] = ["sportapi", "creativesdev", "espn"];

export function mergeProviderHistory<T extends ProviderChainRecord>(batches: ProviderBatch<T>[]): T[] {
  const priority = new Map(PROVIDER_PRIORITY.map((provider, index) => [provider, index]));
  const chosen = new Map<string, T>();

  for (const batch of batches) {
    if (!batch.data?.length) continue;
    for (const record of batch.data) {
      if (!record.completed) continue;
      const key = record.canonicalFixtureKey;
      const previous = chosen.get(key);
      if (!previous || (priority.get(record.provider) ?? 99) < (priority.get(previous.provider) ?? 99)) {
        chosen.set(key, record);
      }
    }
  }

  return [...chosen.values()].sort((a, b) => Date.parse(b.kickoff) - Date.parse(a.kickoff));
}

export function selectAnalyticalWindow<T extends ProviderChainRecord>(records: T[], limit = ANALYTICAL_WINDOW_LIMIT): T[] {
  const safeLimit = Math.min(Math.max(0, Math.floor(limit)), ANALYTICAL_WINDOW_LIMIT);
  return records.filter((record) => record.completed).slice(0, safeLimit);
}

export function evidenceFromChain<T extends ProviderChainRecord>(archive: T[], analysisWindow: T[]) {
  const providers = [...new Set(archive.map((record) => record.provider))];
  return {
    archiveCount: archive.length,
    selectedCount: analysisWindow.length,
    providers,
    tier: analysisWindow.length >= 5 ? "historical-supported" : "early-season-limited",
    confidenceCeiling: analysisWindow.length >= 10 ? 0.82 : analysisWindow.length >= 5 ? 0.72 : 0.58,
  } as const;
}
