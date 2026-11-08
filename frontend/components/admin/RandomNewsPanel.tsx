"use client";

import { useState } from "react";
import { CATEGORY_LABEL, formatNewsDate } from "@/lib/labels";
import { broadcastNews, fetchRandomNews } from "@/lib/random-news";
import type { NewsItem } from "@/lib/news";

const mono = "font-[family-name:var(--font-geist-mono)]";

/**
 * Panel /admin: tombol memilih 5 berita acak terverifikasi dari database, lalu
 * meminta bot Discord memposting set 5 berita itu ke channel berita server
 * (tipe `/config news-channel`). Panel menampilkan yang sama dengan Discord.
 */
export default function RandomNewsPanel() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pressedAt, setPressedAt] = useState<Date | null>(null);
  const [guildId, setGuildId] = useState(
    () => process.env.NEXT_PUBLIC_DISCORD_GUILD_ID?.trim() ?? "",
  );
  const [broadcast, setBroadcast] = useState<"idle" | "sending" | "sent">("idle");
  const [notice, setNotice] = useState<string | null>(null);

  async function pick() {
    setLoading(true);
    setError(null);
    setNotice(null);
    setBroadcast("idle");
    try {
      const data = await fetchRandomNews(5);
      setItems(data.items);
      setTotal(data.total);
      setPressedAt(new Date());
      if (data.items.length === 0 || !/^\d{1,32}$/.test(guildId.trim())) {
        return;
      }
      // Sampel di panel dan di Discord dipilih terpisah (bot mengambilnya sendiri),
      // jadi keduanya bisa berbeda — keduanya dari 5 berita terverifikasi acak.
      setBroadcast("sending");
      try {
        setNotice(await broadcastNews(guildId.trim()));
        setBroadcast("sent");
      } catch (e) {
        setBroadcast("idle");
        setError(
          `Berita tampil di panel, tetapi gagal dikirim ke Discord: ${
            e instanceof Error ? e.message : String(e)
          }`,
        );
      }
    } catch (e) {
      setItems([]);
      setTotal(0);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="border-t border-rule pt-6" aria-labelledby="random-news-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="random-news-heading"
            className={`${mono} text-[11px] font-semibold uppercase tracking-wider text-muted`}
          >
            Sampel acak berita
          </h2>
          <p className="mt-1 text-sm text-muted">
            5 berita terverifikasi dipilih acak, lalu bot mempostingnya ke channel berita Discord.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void pick()}
          disabled={loading}
          className="btn btn-primary"
          aria-busy={loading}
        >
          {loading || broadcast === "sending"
            ? "Memilih…"
            : "🎲 Tampilkan 5 berita acak"}
        </button>
      </div>

      <label className="mt-3 flex max-w-xs flex-col gap-1">
        <span className={`${mono} text-[11px] uppercase tracking-wider text-muted`}>
          ID server Discord tujuan
        </span>
        <input
          value={guildId}
          onChange={(e) => setGuildId(e.target.value)}
          inputMode="numeric"
          placeholder="mis. 123456789012345678"
          className={`${mono} border border-rule bg-transparent px-2 py-1 text-sm`}
        />
        <span className="text-xs text-muted">
          {guildId.trim()
            ? "Bot memposting ke channel `/config news-channel` server ini (fallback: channel alert)."
            : "Isi ID server Discord agar bot ikut memposting ke Discord."}
        </span>
      </label>

      {error && (
        <p role="alert" className="mt-4 border-l-2 border-l-alert pl-3 text-sm text-alert-ink">
          {error}
        </p>
      )}

      {notice && !error && (
        <p role="status" className="mt-4 border-l-2 border-l-safe pl-3 text-sm text-ink">
          {broadcast === "sent" ? "✅ " : "⏳ "}
          {notice}
        </p>
      )}

      {pressedAt && !error && items.length === 0 && !loading && (
        <p className={`mt-4 text-sm text-muted ${mono}`}>
          {total === 0
            ? "Belum ada berita terverifikasi di database."
            : "Tidak ada berita yang bisa diambil."}
        </p>
      )}

      {items.length > 0 && (
        <>
          <p className={`mt-4 ${mono} text-xs text-muted`}>
            Menampilkan {items.length} dari {total} berita terverifikasi ·{" "}
            {pressedAt?.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <ol className="mt-3 divide-y divide-rule border-y border-rule">
            {items.map((item, i) => (
              <li key={item.id} className="flex gap-3 py-3">
                <span className={`${mono} w-5 shrink-0 pt-0.5 text-xs text-muted`}>{i + 1}.</span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-ink underline-offset-4 hover:underline"
                      >
                        {item.title}
                      </a>
                    ) : (
                      <span className="font-semibold text-ink">{item.title}</span>
                    )}
                  </div>
                  <p className={`${mono} mt-1 text-[11px] uppercase tracking-wider text-muted`}>
                    {item.categories.map((c) => CATEGORY_LABEL[c] ?? c).join(" · ")}
                    {item.source ? ` · ${item.source}` : ""}
                    {formatNewsDate(item.published_at) &&
                      ` · ${formatNewsDate(item.published_at)}`}
                  </p>
                  {item.snippet && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{item.snippet}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
