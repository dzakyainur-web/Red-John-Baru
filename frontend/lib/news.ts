import { cacheLife } from "next/cache";
import { API_BASE } from "./api";

export type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  published_at: string | null;
  snippet: string;
  categories: string[];
};

export type NewsListOut = {
  items: NewsItem[];
  total: number;
  limit: number;
  offset: number;
  updated_at: string | null;
  configured: boolean;
};

const EMPTY: NewsListOut = {
  items: [],
  total: 0,
  limit: 0,
  offset: 0,
  updated_at: null,
  configured: false,
};

// Berita dikumpulkan backend tiap 6 jam; cache 10 menit cukup.
// Next 16 (cacheComponents) butuh "use cache" — `next.revalidate` saja ditolak saat prerender.
// Error DILEMPAR dari dalam fungsi cache: Next tidak menyimpan hasil gagal, jadi backend
// yang sempat mati tidak mengunci halaman kosong selama 10 menit.
async function newsCached(limit: number): Promise<NewsListOut> {
  "use cache";
  cacheLife({ revalidate: 600 });
  const res = await fetch(`${API_BASE}/api/news?limit=${limit}`);
  if (!res.ok) throw new Error(`/api/news ${res.status}`);
  return (await res.json()) as NewsListOut;
}

export async function fetchNews(limit = 60): Promise<NewsListOut> {
  try {
    return await newsCached(limit);
  } catch {
    return { ...EMPTY, limit };
  }
}

export const CATEGORY_LABEL: Record<string, string> = {
  fake_job: "Kerja palsu",
  phishing_link: "Phishing",
  giveaway_palsu: "Hadiah palsu",
  malware_apk: "Malware APK",
  pinjol_ilegal: "Pinjol ilegal",
};

// Tanggal absolut (bukan "x hari lalu") supaya render server == klien.
const DATE_FORMAT = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

export function formatNewsDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : DATE_FORMAT.format(date);
}
