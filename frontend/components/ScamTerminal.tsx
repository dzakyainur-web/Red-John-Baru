"use client";

import { useEffect, useState } from "react";
import {
  checkMessage,
  fetchExamples,
  CONTEXTS,
  type CheckResult,
  type Context,
  type Example,
  type Flag,
} from "@/lib/api";
import { useSound } from "./SoundManager";

const CONTEXT_LABEL: Record<Context, string> = {
  umum: "UMUM",
  dm: "DM SOSMED",
  sms: "SMS / WA",
  email: "EMAIL",
  lowongan: "LOWONGAN",
};

const EXAMPLES_FALLBACK: Example[] = [
  {
    id: "f-1",
    label: "scam",
    category: "OTP CS BCA",
    text: "Mbak, ini dari CS Bank BCA. Ada transaksi Rp4.750.000 dari kartu Anda. Untuk pembatalan, segera kirim kode OTP yang masuk ke HP Anda ke nomor ini.",
  },
  {
    id: "f-2",
    label: "scam",
    category: "Investasi Bodong",
    text: "Bergabung sekarang! Modal 500rb profit 10% per hari, dijamin tanpa risiko. Slot terakhir hari ini, transfer ke rekening pribadi mentor ya.",
  },
  {
    id: "f-3",
    label: "scam",
    category: "Kurir Resi APK",
    text: "Paket J&T Express Anda tertunda di gudang karena alamat kurang lengkap. Silakan instal surat konfirmasi ini: konfirmasi_paket_resi88.apk",
  },
];

export default function ScamTerminal() {
  const [text, setText] = useState("");
  const [context, setContext] = useState<Context>("umum");
  const [examples, setExamples] = useState<Example[]>(EXAMPLES_FALLBACK);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { playClick, playSuccess, playAlert } = useSound();

  useEffect(() => {
    let alive = true;
    fetchExamples()
      .then((list) => {
        if (alive && list.length > 0) setExamples(list);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!text.trim() || loading) return;

    setLoading(true);
    setError(null);
    setCopied(false);
    playClick();

    try {
      const res = await checkMessage(text, context);
      setResult(res);
      if (res.risk_level === "high" || res.risk_level === "medium") {
        playAlert();
      } else {
        playSuccess();
      }
    } catch (err) {
      setResult(null);
      setError(
        err instanceof TypeError
          ? "Backend luring — sistem berjalan dalam mode luring."
          : err instanceof Error
          ? err.message
          : "Gagal memproses pesan."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    const flagTitles = result.flags.map((f: Flag) => f.title).join(", ");
    const summary = `[LAPORAN INTELIJEN GUARDIAN AI]\nSaluran: ${context.toUpperCase()}\nRisiko: ${result.risk_level.toUpperCase()} (${result.score}/100)\nTanda Bahaya: ${flagTitles || "Tidak ada"}\n${result.disclaimer}`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      playSuccess();
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Gagal mengakses papan klip.");
    }
  }

  const getRiskColor = (level: "low" | "medium" | "high") => {
    switch (level) {
      case "high":
        return {
          text: "text-[#FF3815]",
          border: "border-[#FF3815]/50",
          bg: "bg-[#FF3815]/10",
          glow: "shadow-[0_0_30px_rgba(255,56,21,0.25)]",
          label: "TINGGI",
        };
      case "medium":
        return {
          text: "text-amber-400",
          border: "border-amber-500/50",
          bg: "bg-amber-500/10",
          glow: "shadow-[0_0_30px_rgba(245,158,11,0.25)]",
          label: "SEDANG",
        };
      default:
        return {
          text: "text-emerald-400",
          border: "border-emerald-500/50",
          bg: "bg-emerald-500/10",
          glow: "shadow-[0_0_30px_rgba(16,185,129,0.25)]",
          label: "RENDAH",
        };
    }
  };

  return (
    <div className="relative rounded-2xl bg-[#0c0c0c] border border-white/10 p-6 sm:p-8 backdrop-blur-xl">
      {/* Terminal Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-[#FF3815]" />
            <span className="size-3 rounded-full bg-amber-500/70" />
            <span className="size-3 rounded-full bg-emerald-500/70" />
          </div>
          <span className="font-[family-name:var(--font-geist-mono)] text-xs uppercase tracking-widest text-zinc-400">
            ENGINE // PEMINDAI FORENSIK PENIPUAN
          </span>
        </div>

        {/* Live status */}
        <div className="flex items-center gap-2 text-xs font-[family-name:var(--font-geist-mono)] text-zinc-500">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>MODEL: TF-IDF + HEURISTIK</span>
        </div>
      </div>

      {/* Preset pills */}
      <div className="py-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-[family-name:var(--font-geist-mono)] text-zinc-500 uppercase tracking-wider mr-1">
          CONTOH ANCAMAN:
        </span>
        {examples.map((ex) => (
          <button
            key={ex.id}
            type="button"
            onClick={() => {
              setText(ex.text);
              playClick();
            }}
            className="px-3 py-1 rounded-full text-xs font-[family-name:var(--font-geist-mono)] bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-300 transition-all cursor-pointer"
          >
            {ex.category || ex.label}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            maxLength={5000}
            placeholder="Tempel SMS mencurigakan, chat Telegram/WhatsApp, isi email, atau tautan di sini..."
            className="w-full rounded-xl bg-black/60 border border-white/10 p-4 font-[family-name:var(--font-geist-mono)] text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#FF3815] transition-colors resize-y min-h-[140px]"
          />
          <div className="absolute bottom-3 right-3 text-[11px] font-[family-name:var(--font-geist-mono)] text-zinc-500">
            {text.length} / 5000
          </div>
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Context Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-[family-name:var(--font-geist-mono)] text-zinc-500 mr-1">
              SALURAN:
            </span>
            {CONTEXTS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setContext(c);
                  playClick();
                }}
                className={`px-3 py-1 rounded text-xs font-[family-name:var(--font-geist-mono)] transition-all cursor-pointer ${
                  context === c
                    ? "bg-white text-black font-semibold"
                    : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5"
                }`}
              >
                {CONTEXT_LABEL[c]}
              </button>
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!text.trim() || loading}
            className="px-6 py-2.5 rounded-full bg-[#FF3815] hover:bg-[#FF5533] disabled:opacity-40 text-black font-bold font-[family-name:var(--font-geist-mono)] text-xs tracking-wider uppercase transition-all duration-200 shadow-[0_0_25px_rgba(255,56,21,0.35)] flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="size-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>MEMERIKSA...</span>
              </>
            ) : (
              <>
                <span>PERIKSA ANCAMAN</span>
                <span>&rarr;</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error display */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-[family-name:var(--font-geist-mono)]">
          [PEMBERITAHUAN] {error}
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div
          className={`mt-6 rounded-xl border p-6 font-[family-name:var(--font-geist-mono)] transition-all ${
            getRiskColor(result.risk_level).border
          } ${getRiskColor(result.risk_level).bg} ${
            getRiskColor(result.risk_level).glow
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="text-[10px] tracking-widest text-zinc-400 uppercase">
                HASIL DETEKSI
              </div>
              <div
                className={`text-2xl sm:text-3xl font-black uppercase tracking-tight ${
                  getRiskColor(result.risk_level).text
                }`}
              >
                RISIKO {getRiskColor(result.risk_level).label}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[10px] tracking-widest text-zinc-400 uppercase">
                  SKOR RISIKO
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {result.score}
                  <span className="text-xs text-zinc-400">/100</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-xs text-white transition-all cursor-pointer"
              >
                {copied ? "TERSALIN ✓" : "SALIN LAPORAN"}
              </button>
            </div>
          </div>

          {/* Matched Red Flags */}
          {result.flags && result.flags.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-xs text-zinc-400 uppercase tracking-wider">
                ANOMALI & TANDA BAHAYA TERDETEKSI:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.flags.map((flag: Flag, idx: number) => (
                  <div
                    key={flag.id || idx}
                    className="p-3 rounded-lg bg-black/50 border border-white/10 text-xs text-zinc-200"
                  >
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span>{flag.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 uppercase text-zinc-400">
                        {flag.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">{flag.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation */}
          {result.disclaimer && (
            <p className="mt-4 text-xs text-zinc-400 leading-relaxed border-t border-white/10 pt-3">
              {result.disclaimer}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
