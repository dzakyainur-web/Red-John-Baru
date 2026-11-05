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

// Sumber tunggal data berita: JSON hasil `python tools/news_fetch.py`.
export const NEWS_ITEMS = (news.items ?? []) as NewsItem[];
export const NEWS_UPDATED_AT: string | null = news.generated_at ?? null;

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
