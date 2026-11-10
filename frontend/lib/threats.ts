import { API_BASE } from "./api";

export const THREAT_STATUSES = ["all", "pending", "verified", "rejected"] as const;
export type ThreatStatusFilter = (typeof THREAT_STATUSES)[number];
export type ThreatStatus = Exclude<ThreatStatusFilter, "all">;

export const THREAT_SOURCES = ["all", "scraped", "user_report"] as const;
export type ThreatSourceFilter = (typeof THREAT_SOURCES)[number];
export type ThreatSource = Exclude<ThreatSourceFilter, "all">;

export const THREAT_CATEGORIES = [
  "all",
  "fake_job",
  "phishing_link",
  "giveaway_palsu",
  "malware_apk",
  "pinjol_ilegal",
] as const;
export type ThreatCategoryFilter = (typeof THREAT_CATEGORIES)[number];
export type ThreatCategory = Exclude<ThreatCategoryFilter, "all">;

export const INDICATOR_TYPES = ["url", "phone", "apk", "bank_account"] as const;
export type IndicatorType = (typeof INDICATOR_TYPES)[number];

export type Indicator = { type: IndicatorType; value: string };

export type Threat = {
  id: string;
  title: string;
  category: ThreatCategory;
  description: string;
  scammer_indicators: Indicator[];
  source_url: string | null;
  source_media: string;
  source_type: ThreatSource;
  status: ThreatStatus;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ThreatList = {
  items: Threat[];
  total: number;
  limit: number;
  offset: number;
  configured: boolean;
};

export type ThreatFilters = {
  status: ThreatStatusFilter;
  source_type: ThreatSourceFilter;
  category: ThreatCategoryFilter;
  q: string;
};

export type ThreatInput = {
  title: string;
  category: ThreatCategory;
  description: string;
  scammer_indicators: Indicator[];
  source_url: string | null;
};

export const EMPTY_FILTERS: ThreatFilters = {
  status: "all",
  source_type: "all",
  category: "all",
  q: "",
};

export const SOURCE_LABEL: Record<ThreatSource, string> = {
  scraped: "Scraped",
  user_report: "Laporan",
};

export const STATUS_LABEL: Record<ThreatStatus, string> = {
  pending: "Menunggu",
  verified: "Terverifikasi",
  rejected: "Ditolak",
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    });
  } catch {
    // Fetch gagal total: backend mati, URL salah, atau CORS ditolak.
    throw new Error(`Backend tidak dapat dihubungi (${API_BASE}${path}).`);
  }
  if (!res.ok) {
    // FastAPI membalas {"detail": "..."} — tampilkan pesannya, bukan JSON mentah.
    const body = await res.text().catch(() => "");
    let detail = body;
    try {
      const parsed = JSON.parse(body) as { detail?: unknown };
      if (typeof parsed.detail === "string") detail = parsed.detail;
    } catch {
      // Bukan JSON (mis. halaman error proxy) — pakai teks apa adanya.
    }
    throw new Error(`(${res.status}) ${detail.slice(0, 300) || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export function listThreats(filters: ThreatFilters, limit = 100, offset = 0) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.source_type !== "all") params.set("source_type", filters.source_type);
  if (filters.category !== "all") params.set("category", filters.category);
  if (filters.q.trim()) params.set("q", filters.q.trim());
  return request<ThreatList>(`/api/threats?${params.toString()}`);
}

export const createThreat = (input: ThreatInput) =>
  request<Threat>("/api/threats", { method: "POST", body: JSON.stringify(input) });

export type ThreatPatch = {
  title?: string;
  category?: ThreatCategory;
  description?: string;
  scammer_indicators?: Indicator[];
  /** null = kosongkan tautan sumber. */
  source_url?: string | null;
  status?: ThreatStatus;
};

export const updateThreat = (id: string, patch: ThreatPatch) =>
  request<Threat>(`/api/threats/${id}`, { method: "PATCH", body: JSON.stringify(patch) });

/** Soft delete: backend mengubah status jadi `rejected`, data tidak dihapus. */
export const archiveThreat = (id: string) =>
  request<Threat>(`/api/threats/${id}`, { method: "DELETE" });
