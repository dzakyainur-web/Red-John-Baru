import { cacheLife } from "next/cache";
import { API_BASE } from "./api";

export type NewsItem = {
  id: string;
  title: string;
  // null untuk laporan manual admin yang tidak punya artikel sumber.
  url: string | null;
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

export { CATEGORY_LABEL, formatNewsDate } from "./labels";
