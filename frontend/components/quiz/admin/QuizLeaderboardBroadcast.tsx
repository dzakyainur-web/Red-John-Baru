"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Trophy } from "lucide-react";
import { broadcastQuizLeaderboard } from "@/lib/quiz";

export default function QuizLeaderboardBroadcast({ token }: { token: string }) {
  const [guildId, setGuildId] = useState(
    () => process.env.NEXT_PUBLIC_DISCORD_GUILD_ID?.trim() ?? "",
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function broadcast() {
    if (!/^\d{1,32}$/.test(guildId.trim())) {
      setError("Masukkan ID server Discord berupa angka.");
      setNotice("");
      return;
    }
    setSending(true);
    setError("");
    setNotice("");
    try {
      const result = await broadcastQuizLeaderboard(guildId.trim(), token);
      setNotice(result.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengantrikan pengumuman.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section aria-labelledby="quiz-broadcast-heading" className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-lg">
          <h2 id="quiz-broadcast-heading" className="text-sm font-semibold text-white">
            Pengumuman Top 5 Kuis
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-white/50">
            Kirim peringkat poin periode berjalan ke channel Discord yang sudah dikonfigurasi bot.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-semibold text-zinc-300">
            <span className="mb-1.5 block">ID Server Discord</span>
            <input
              value={guildId}
              onChange={(e) => setGuildId(e.target.value)}
              inputMode="numeric"
              disabled={sending}
              placeholder="123456789012345678"
              className="w-56 rounded-lg border border-white/15 bg-black/40 px-3 py-2 font-mono text-xs text-white placeholder:text-zinc-600 focus:border-[#3ECF8E] focus:outline-none focus:ring-1 focus:ring-[#3ECF8E]/40 disabled:opacity-50"
            />
          </label>
          <button
            type="button"
            onClick={() => void broadcast()}
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-lg bg-[#3ECF8E] px-4 py-2 text-xs font-semibold text-black hover:bg-[#4adeaa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3ECF8E] disabled:opacity-50"
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Trophy className="size-4" />}
            {sending ? "Mengantrikan…" : "Umumkan Top 5 ke Discord"}
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-3 flex items-center gap-2 text-xs text-red-300">
          <AlertCircle className="size-4 shrink-0" /> {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-3 flex items-center gap-2 text-xs text-[#3ECF8E]">
          <CheckCircle2 className="size-4 shrink-0" /> {notice}
        </p>
      )}
    </section>
  );
}
