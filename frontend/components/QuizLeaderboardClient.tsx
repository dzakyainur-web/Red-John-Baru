"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getQuizLeaderboard, type LeaderboardEntry } from "@/lib/quiz";
import { supabase } from "@/lib/supabase";

type State = {
  label: string;
  day: string;
  entries: LeaderboardEntry[];
  /** Deadline reset dalam epoch ms klien (dari selisih resets_at - server_now). */
  deadline: number | null;
};

const REFETCH_MS = 60_000;

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export default function QuizLeaderboardClient() {
  const [state, setState] = useState<State>({ label: "", day: "", entries: [], deadline: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [myId, setMyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getQuizLeaderboard(20);
      const skew = new Date(data.resets_at).getTime() - new Date(data.server_now).getTime();
      setState({
        label: data.label,
        day: data.day,
        entries: data.entries,
        deadline: Date.now() + skew,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat klasemen.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const kick = setTimeout(() => void load(), 0);
    const id = setInterval(() => void load(), REFETCH_MS);
    return () => {
      clearTimeout(kick);
      clearInterval(id);
    };
  }, [load]);

  useEffect(() => {
    const deadline = state.deadline;
    if (deadline === null) return;
    const tick = () => {
      const left = deadline - Date.now();
      setRemaining(left);
      if (left <= 0) void load();
    };
    const kick = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(kick);
      clearInterval(id);
    };
  }, [state.deadline, load]);

  useEffect(() => {
    supabase?.auth.getSession().then(({ data }) => setMyId(data.session?.user.id ?? null));
  }, []);

  return (
    <main className="min-h-screen bg-[#0c0d0d] px-3 pt-24 pb-20 font-sans text-white sm:px-4">
      <div className="mx-auto w-full max-w-[720px]">
        <header className="mb-6">
          <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.18em] text-[#FF3815]">
            Simulasi Kognitif
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Klasemen Harian</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#8a8a8a]">
            Total poin per periode. Papan direset setiap hari pukul 21:00 WIB; top 10 juga
            diumumkan di Discord.
          </p>
        </header>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="min-w-0">
            <span className="block text-[11px] uppercase tracking-wider text-[#8a8a8a]">Periode</span>
            <span className="block truncate text-[13px] font-medium text-white">
              {state.label || "—"}
            </span>
          </div>
          <div className="text-right">
            <span className="block text-[11px] uppercase tracking-wider text-[#8a8a8a]">Reset dalam</span>
            <span className="block font-[family-name:var(--font-geist-mono)] text-[13px] font-semibold text-white tabular-nums">
              {remaining === null ? "--:--:--" : formatCountdown(remaining)}
            </span>
          </div>
        </div>

        {error && (
          <p role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}{" "}
            <button type="button" onClick={() => void load()} className="underline">
              Coba lagi
            </button>
          </p>
        )}

        {loading && state.entries.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-[#8a8a8a]">
            Memuat klasemen…
          </p>
        ) : state.entries.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <p className="text-sm text-white">Belum ada peserta pada periode ini.</p>
            <p className="mt-1 text-[12px] text-[#8a8a8a]">
              Login lalu mainkan kuis untuk masuk klasemen.
            </p>
            <Link
              href="/quiz"
              className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-[12px] font-bold text-black transition-colors hover:bg-[#EDEDED]"
            >
              Mulai Kuis →
            </Link>
          </div>
        ) : (
          <ol className="space-y-1.5">
            {state.entries.map((e) => {
              const mine = myId !== null && e.user_id === myId;
              return (
                <li
                  key={`${e.rank}-${e.user_id}`}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 sm:px-4 ${
                    mine
                      ? "border-[#FF3815]/50 bg-[#FF3815]/[0.08]"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <span
                    className={`w-8 shrink-0 text-center font-[family-name:var(--font-geist-mono)] text-[13px] font-bold tabular-nums ${
                      e.rank <= 3 ? "text-[#FF3815]" : "text-[#8a8a8a]"
                    }`}
                  >
                    #{e.rank}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
                    {e.name}
                    {mine && (
                      <span className="ml-2 rounded bg-[#FF3815] px-1.5 py-0.5 text-[10px] font-bold text-black">
                        KAMU
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-[family-name:var(--font-geist-mono)] text-[13px] font-bold text-white tabular-nums">
                      {e.points} poin
                    </span>
                    <span className="block text-[11px] text-[#8a8a8a]">{e.solved} kasus</span>
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <Link
            href="/quiz"
            className="text-[12px] text-[#8a8a8a] underline transition-colors hover:text-white"
          >
            ← Kembali ke kuis
          </Link>
          {myId === null && (
            <span className="text-[11px] text-[#8a8a8a]">Login agar poinmu masuk klasemen.</span>
          )}
        </div>
      </div>
    </main>
  );
}
