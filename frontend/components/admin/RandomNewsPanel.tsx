"use client";

import { useState } from "react";
import { CATEGORY_LABEL, formatNewsDate } from "@/lib/labels";
import { broadcastNews, fetchRandomNews } from "@/lib/random-news";
import type { NewsItem } from "@/lib/news";
import { Dice5, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

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
    <section className="space-y-4" aria-labelledby="random-news-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3
            id="random-news-heading"
            className="text-xs font-bold uppercase tracking-wider text-zinc-400"
          >
            Penyebaran Berita Otomatis ke Discord
          </h3>
          <p className="mt-1 text-xs text-zinc-400">
            Pilih 5 berita scam terverifikasi acak untuk disiarkan ke channel pengumuman server Discord.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void pick()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#3ECF8E] px-4 py-2.5 text-xs font-semibold text-black shadow-sm hover:bg-[#4adeaa] disabled:opacity-50 transition-all"
        >
          {loading || broadcast === "sending" ? (
            <>
              <Loader2 className="size-3.5 animate-spin text-black" />
              <span>Memproses…</span>
            </>
          ) : (
            <>
              <Dice5 className="size-3.5" />
              <span>Tampilkan & Broadcast 5 Berita</span>
            </>
          )}
        </button>
      </div>

      <div className="max-w-md space-y-1.5 pt-2">
        <label className="text-xs font-semibold text-zinc-300">
          ID Server (Guild ID) Discord
        </label>
        <div className="flex items-center gap-2">
          <input
            value={guildId}
            onChange={(e) => setGuildId(e.target.value)}
            inputMode="numeric"
            placeholder="Contoh: 123456789012345678"
            className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-[#3ECF8E] focus:bg-[#111211] focus:outline-none focus:ring-1 focus:ring-[#3ECF8E]/40 font-mono"
          />
        </div>
        <p className="text-[11px] text-zinc-500">
          {guildId.trim()
            ? "Bot akan memposting ke channel #berita-scam di server ini."
            : "Masukkan ID server Discord untuk mengaktifkan webhook siaran otomatis."}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          <AlertCircle className="size-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {notice && !error && (
        <div className="flex items-center gap-2 rounded-xl border border-[#3ECF8E]/30 bg-[#3ECF8E]/10 p-3 text-xs text-[#3ECF8E]">
          <CheckCircle2 className="size-4 shrink-0 text-[#3ECF8E]" />
          <span>{notice}</span>
        </div>
      )}

      {pressedAt && !error && items.length === 0 && !loading && (
        <p className="text-xs text-zinc-500 italic">
          {total === 0
            ? "Belum ada berita terverifikasi di database."
            : "Tidak ada berita yang bisa diambil."}
        </p>
      )}

      {items.length > 0 && (
        <div className="space-y-3 pt-2">
          <p className="text-xs font-semibold text-zinc-400">
            Menampilkan {items.length} dari {total} berita terverifikasi · Terakhir diperbarui:{" "}
            {pressedAt?.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </p>

          <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-[#161817]">
            {items.map((item, i) => (
              <div key={item.id} className="flex items-start gap-3 p-3.5 hover:bg-white/[0.03] transition-colors">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-xs font-bold text-zinc-300">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-white hover:text-[#3ECF8E] hover:underline leading-snug"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <p className="text-xs font-bold text-white leading-snug">{item.title}</p>
                  )}
                  <p className="mt-1 text-[11px] text-zinc-500">
                    <span className="font-semibold text-zinc-300">
                      {item.categories.map((c) => CATEGORY_LABEL[c] ?? c).join(" · ")}
                    </span>
                    {item.source ? ` • Sumber: ${item.source}` : ""}
                    {formatNewsDate(item.published_at) &&
                      ` • ${formatNewsDate(item.published_at)}`}
                  </p>
                  {item.snippet && (
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-400 leading-relaxed">
                      {item.snippet}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
