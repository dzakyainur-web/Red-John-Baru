import { supabase } from "./supabase";
import type { NewsItem, NewsListOut } from "./news";

/** Sampel acak berita terverifikasi untuk panel /admin (GET /api/news/random). */
export async function fetchRandomNews(limit = 5): Promise<NewsListOut> {
  // Route handler Next (same-origin) agar cacheComponents tetap aman & tanpa CORS.
  const res = await fetch(`/api/news/random?limit=${limit}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Gagal memuat berita acak (${res.status})`);
  return (await res.json()) as NewsListOut;
}

/**
 * Minta bot Discord memposting 5 berita acak ke channel berita server.
 * Backend hanya mengantrikan job; bot mengambilnya saat polling (beberapa detik).
 */
export async function broadcastNews(guildId: string): Promise<string> {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  if (!session) throw new Error("Login admin diperlukan untuk broadcast.");
  const res = await fetch("/api/discord/broadcast", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ guild_id: guildId }),
  });
  const body = (await res.json().catch(() => null)) as { detail?: unknown; message?: unknown } | null;
  if (!res.ok) {
    const detail = typeof body?.detail === "string" ? body.detail : `Permintaan gagal (${res.status})`;
    throw new Error(detail);
  }
  return typeof body?.message === "string"
    ? body.message
    : "Permintaan diterima. Bot sedang memposting ke Discord.";
}

export type { NewsItem };
