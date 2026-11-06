import scraped from "./news_scraped.json";
import news from "./news.json";

export type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  published_at: string | null;
  snippet: string;
  categories: string[];
};

// Dua jalur data: RSS (`python tools/news_fetch.py`) dan halaman tag portal tanpa RSS
// (`python tools/news_scrape.py`). Digabung, URL sama diambil yang pertama.
const merge = (...lists: NewsItem[][]): NewsItem[] => {
  const byUrl = new Map<string, NewsItem>();
  for (const item of lists.flat()) if (!byUrl.has(item.url)) byUrl.set(item.url, item);
  return [...byUrl.values()].sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
};

export const NEWS_ITEMS = merge((news.items ?? []) as NewsItem[], (scraped.items ?? []) as NewsItem[]);
export const NEWS_UPDATED_AT: string | null = [news.generated_at, scraped.generated_at]
  .filter(Boolean)
  .sort()
  .pop() ?? null;

export const CATEGORY_LABEL: Record<string, string> = {
  kerja: "Kerja palsu",
  giveaway: "Hadiah",
  impersonasi: "Impersonasi",
  investasi: "Investasi/pinjol",
  phishing: "Phishing",
  umum: "Umum",
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
