"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

const CONTEXT_CONFIG: Record<
  Context,
  { label: string; icon: string; description: string }
> = {
  umum: {
    label: "Semua Saluran",
    icon: "🌐",
    description: "Analisis teks umum tanpa filter saluran spesifik",
  },
  sms: {
    label: "SMS / WhatsApp",
    icon: "💬",
    description: "Optimasi untuk pesan instan, tautan pendek, dan modus kurir/bank",
  },
  dm: {
    label: "DM Media Sosial",
    icon: "📱",
    description: "Deteksi impersonasi, pemulihan akun palsu, dan phishing medsos",
  },
  email: {
    label: "Email",
    icon: "✉️",
    description: "Inspeksi spoofing pengirim, lampiran tagihan, dan urgensi denda",
  },
  lowongan: {
    label: "Lowongan Kerja",
    icon: "💼",
    description: "Pemeriksaan modus gaji instan, biaya seragam, dan manipulasi data pribadi",
  },
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
    category: "Kurir Resi .APK",
    text: "Paket J&T Express Anda tertunda di gudang karena alamat kurang lengkap. Silakan instal surat konfirmasi ini: konfirmasi_paket_resi88.apk",
  },
  {
    id: "f-4",
    label: "scam",
    category: "Lowongan Kerja Palsu",
    text: "Halo kak, lowongan admin online gaji 15 juta WFH tanpa pengalaman. Kirim foto KTP dan KK ya kak untuk verifikasi data pelamar.",
  },
  {
    id: "f-5",
    label: "scam",
    category: "Phishing Medsos",
    text: "Akun Instagram kamu akan dibekukan dalam 24 jam karena pelanggaran hak cipta. Verifikasi akun di https://instagram-verifikasi.xyz/login untuk mencegah penutupan.",
  },
  {
    id: "f-6",
    label: "legit",
    category: "Pesan Bank Resmi",
    text: "Transaksi Rp75.000 berhasil pada 03/11/2026. Bank BCA TIDAK PERNAH meminta kode OTP atau PIN Anda kepada siapa pun.",
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
  const [activeTab, setActiveTab] = useState<"findings" | "advice" | "specs">("findings");
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
          ? "Layanan backend sedang tidak terjangkau (Offline). Pastikan backend aktif di port 8000."
          : err instanceof Error
          ? err.message
          : "Gagal memproses pesan."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handlePaste() {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setText(clipText);
        playClick();
      }
    } catch {
      setError("Izin clipboard tidak diberikan oleh peramban.");
    }
  }

  function handleClear() {
    setText("");
    setResult(null);
    setError(null);
    playClick();
  }

  async function handleCopy() {
    if (!result) return;
    const flagTitles = result.flags.map((f: Flag) => f.title).join(", ");
    const summary = [
      `[LAPORAN INTELIJEN RED JOHN]`,
      `Saluran: ${CONTEXT_CONFIG[context].label.toUpperCase()}`,
      `Status Risiko: ${result.risk_level.toUpperCase()} (${result.score}/100)`,
      `Anomali Terdeteksi: ${flagTitles || "Tidak ada indikator bahaya umum"}`,
      `Catatan: ${result.disclaimer}`,
      `Diverifikasi mandiri via Red John Platform (https://redjohn.id)`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      playSuccess();
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Gagal menyalin laporan ke clipboard.");
    }
  }

  const getRiskMeta = (level: "low" | "medium" | "high") => {
    switch (level) {
      case "high":
        return {
          title: "RISIKO TINGGI",
          sub: "Pesan ini memiliki indikator kuat rekayasa sosial, manipulasi urgensi, atau upaya pencurian aset/kredensial.",
          badgeBg: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          barBg: "from-rose-500 to-red-600",
          border: "border-rose-500/30",
          glow: "shadow-[0_0_40px_rgba(244,63,94,0.15)]",
          iconColor: "text-rose-400",
        };
      case "medium":
        return {
          title: "RISIKO SEDANG",
          sub: "Pesan ini menunjukkan kejanggalan atau pola manipulasi psikologis. Hindari mengeklik link atau membagikan data apa pun.",
          badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          barBg: "from-amber-400 to-amber-600",
          border: "border-amber-500/30",
          glow: "shadow-[0_0_40px_rgba(245,158,11,0.15)]",
          iconColor: "text-amber-400",
        };
      default:
        return {
          title: "RISIKO RENDAH (AMAN)",
          sub: "Tidak ditemukan tanda bahaya umum seperti pemaksaan OTP atau nomor rekening mencurigakan. Tetap lakukan verifikasi silang.",
          badgeBg: "bg-[#3ECF8E]/10 text-[#3ECF8E] border-[#3ECF8E]/30",
          barBg: "from-[#3ECF8E] to-emerald-400",
          border: "border-[#3ECF8E]/30",
          glow: "shadow-[0_0_40px_rgba(62,207,142,0.15)]",
          iconColor: "text-[#3ECF8E]",
        };
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* =========================================================================
          MAIN SCANNER CONSOLE CARD (Supabase Bento Style)
          ========================================================================= */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-[#161817] border border-white/[0.08] p-6 sm:p-8 backdrop-blur-xl shadow-2xl transition-all">
        {/* Subtle Ambient Radial Glow */}
        <div className="pointer-events-none absolute -top-32 right-10 size-[360px] rounded-full bg-[#3ECF8E]/5 blur-[120px]" />

        {/* Console Header Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
          {/* Channel Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[12px] font-medium text-[#A0A0A0] mr-1 hidden sm:inline">
              Saluran:
            </span>
            {CONTEXTS.map((c) => {
              const active = context === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setContext(c);
                    playClick();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? "bg-[#0c0d0d] text-white border border-white/20 shadow-sm"
                      : "text-[#A0A0A0] hover:text-white hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <span>{CONTEXT_CONFIG[c].icon}</span>
                  <span>{CONTEXT_CONFIG[c].label}</span>
                </button>
              );
            })}
          </div>

          {/* Engine Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0c0d0d] border border-white/[0.08] text-[11px] text-[#A0A0A0]">
            <span className="size-2 rounded-full bg-[#3ECF8E] animate-pulse" />
            <span>TF-IDF + Heuristik Multilapis</span>
          </div>
        </div>

        {/* Quick Presets Section */}
        <div className="py-4 flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-medium text-[#A0A0A0] mr-1">
            Uji contoh kasus:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {examples.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => {
                  setText(ex.text);
                  // Context inference heuristic
                  if (ex.category.toLowerCase().includes("otp") || ex.category.toLowerCase().includes("kurir")) {
                    setContext("sms");
                  } else if (ex.category.toLowerCase().includes("lowongan")) {
                    setContext("lowongan");
                  } else if (ex.category.toLowerCase().includes("phishing") || ex.category.toLowerCase().includes("instagram")) {
                    setContext("dm");
                  }
                  playClick();
                }}
                className="px-3 py-1 rounded-full text-xs bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-zinc-300 transition-all cursor-pointer"
              >
                {ex.category || ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Box Area */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative rounded-xl sm:rounded-2xl bg-[#0c0d0d] border border-white/[0.08] focus-within:border-[#3ECF8E] focus-within:ring-1 focus-within:ring-[#3ECF8E]/25 transition-all p-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              maxLength={5000}
              placeholder="Tempel pesan teks, SMS mencurigakan, chat WhatsApp, Telegram, email tagihan, tawaran pekerjaan, atau instruksi di sini..."
              className="w-full bg-transparent text-sm sm:text-[15px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none resize-y min-h-[140px] leading-relaxed font-sans"
            />

            {/* Inner Bottom Controls Toolbar */}
            <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs text-[#A0A0A0]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePaste}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] hover:text-white border border-white/[0.06] transition-colors cursor-pointer"
                  title="Tempel teks dari papan klip"
                >
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                  </svg>
                  <span>Tempel Clipboard</span>
                </button>

                {text.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 border border-white/[0.06] transition-colors cursor-pointer"
                  >
                    <span>Bersihkan</span>
                  </button>
                )}
              </div>

              <div className="font-mono text-[11px] text-[#A0A0A0]">
                {text.length} / 5000 karakter
              </div>
            </div>
          </div>

          {/* Action Footer Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
              <span className="size-1.5 rounded-full bg-[#3ECF8E]" />
              <span>Analisis memori lokal • Tanpa penyimpanan percakapan</span>
            </div>

            <button
              type="submit"
              disabled={!text.trim() || loading}
              className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-[#3ECF8E] hover:bg-[#4adeaa] text-black font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(62,207,142,0.3)] cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 size-4 text-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Memeriksa Indikator...</span>
                </>
              ) : (
                <>
                  <span>Periksa Pesan Sekarang</span>
                  <span className="ml-1 text-base leading-none">&rarr;</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error Notification */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3">
            <svg className="size-4 shrink-0 mt-0.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div className="flex-1 leading-relaxed">
              <strong>Pemberitahuan Sistem:</strong> {error}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          RESULTS SECTION — Supabase Studio Bento Breakdown
          ========================================================================= */}
      {result && (
        <div className={`rounded-2xl sm:rounded-3xl bg-[#161817] border ${getRiskMeta(result.risk_level).border} p-6 sm:p-8 backdrop-blur-xl ${getRiskMeta(result.risk_level).glow} transition-all space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300`}>
          {/* Top Result Banner */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
            {/* Risk Title & Explanation */}
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2.5">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border tracking-wider uppercase ${getRiskMeta(result.risk_level).badgeBg}`}>
                  {getRiskMeta(result.risk_level).title}
                </span>
                <span className="text-xs text-[#A0A0A0]">
                  Saluran: <strong className="text-white">{CONTEXT_CONFIG[context].label}</strong>
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {result.risk_level === "high"
                  ? "Peringatan: Pola Kejahatan Siber Terdeteksi"
                  : result.risk_level === "medium"
                  ? "Perhatian: Indikator Manipulasi Perlu Dikonfirmasi"
                  : "Status Bersih: Tidak Ada Ciri Penipuan Umum"}
              </h3>
              <p className="text-sm text-[#A0A0A0] leading-relaxed">
                {getRiskMeta(result.risk_level).sub}
              </p>
            </div>

            {/* Score Metric Gauge */}
            <div className="flex items-center gap-6 shrink-0 bg-[#0c0d0d] border border-white/[0.08] p-4 sm:p-5 rounded-2xl">
              <div className="space-y-1">
                <div className="text-[11px] font-medium text-[#A0A0A0] uppercase tracking-wider">
                  Skor Risiko
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-black text-white font-heading">
                    {result.score}
                  </span>
                  <span className="text-xs text-[#A0A0A0]">/ 100</span>
                </div>
                {/* Progress bar */}
                <div className="w-28 sm:w-32 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getRiskMeta(result.risk_level).barBg}`}
                    style={{ width: `${Math.min(100, Math.max(5, result.score))}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-l border-white/[0.08] pl-5 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-white transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <span className="text-[#3ECF8E]">✓</span>
                      <span>Laporan Tersalin</span>
                    </>
                  ) : (
                    <>
                      <svg className="size-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.453-.038.91-.06 1.37-.06.46 0 .917.022 1.37.06 1.131.094 1.976 1.057 1.976 2.192V7.5M12 14.25h.008v.008H12v-.008zM12 11.25h.008v.008H12v-.008zM12 8.25h.008v.008H12v-.008z" />
                      </svg>
                      <span>Salin Laporan</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer text-center"
                >
                  Uji Pesan Lain
                </button>
              </div>
            </div>
          </div>

          {/* Result Sub-Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 text-xs font-medium">
            <button
              type="button"
              onClick={() => { setActiveTab("findings"); playClick(); }}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === "findings"
                  ? "bg-white/[0.1] text-white"
                  : "text-[#A0A0A0] hover:text-white"
              }`}
            >
              Temuan Indikator ({result.flags?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("advice"); playClick(); }}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === "advice"
                  ? "bg-white/[0.1] text-white"
                  : "text-[#A0A0A0] hover:text-white"
              }`}
            >
              Panduan Mitigasi
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("specs"); playClick(); }}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === "specs"
                  ? "bg-white/[0.1] text-white"
                  : "text-[#A0A0A0] hover:text-white"
              }`}
            >
              Spesifikasi Deteksi
            </button>
          </div>

          {/* TAB 1: FINDINGS */}
          {activeTab === "findings" && (
            <div className="space-y-4">
              {result.flags && result.flags.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.flags.map((flag: Flag, idx: number) => {
                    const isHigh = flag.severity === "tinggi";
                    const isMed = flag.severity === "sedang";
                    return (
                      <div
                        key={flag.id || idx}
                        className="rounded-xl bg-[#0c0d0d] border border-white/[0.08] p-5 flex flex-col justify-between space-y-3 hover:border-white/[0.15] transition-all"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-mono text-zinc-500 uppercase">
                              ATURAN #{flag.id}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                isHigh
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  : isMed
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-zinc-800 text-zinc-400 border border-white/10"
                              }`}
                            >
                              SEVERITAS {flag.severity}
                            </span>
                          </div>

                          <h4 className="text-[15px] font-semibold text-white tracking-tight">
                            {flag.title}
                          </h4>

                          {/* Evidence Excerpt */}
                          {flag.evidence && (
                            <div className="p-2.5 rounded-lg bg-black/60 border-l-2 border-[#3ECF8E] text-xs font-mono text-zinc-300 leading-relaxed break-words">
                              <span className="text-zinc-500 block text-[10px] uppercase font-sans mb-0.5">
                                Bukti Kalimat:
                              </span>
                              &ldquo;{flag.evidence}&rdquo;
                            </div>
                          )}

                          <p className="text-xs text-[#A0A0A0] leading-relaxed">
                            {flag.explanation}
                          </p>
                        </div>

                        {/* Advice note */}
                        {flag.advice && (
                          <div className="pt-3 border-t border-white/[0.06] text-xs text-zinc-300 flex items-start gap-2">
                            <span className="text-[#3ECF8E] shrink-0 font-bold">Langkah:</span>
                            <span>{flag.advice}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl bg-[#0c0d0d] border border-white/[0.08] p-8 text-center space-y-3">
                  <div className="size-12 rounded-full bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 text-[#3ECF8E] flex items-center justify-center mx-auto text-xl">
                    ✓
                  </div>
                  <h4 className="text-base font-semibold text-white">
                    Pola Ancaman Kritis Tidak Terdeteksi
                  </h4>
                  <p className="text-xs text-[#A0A0A0] max-w-md mx-auto leading-relaxed">
                    Pesan tidak memuat kata kunci pemaksaan OTP, berkas APK berbahaya, maupun rekening penampung. Namun, penipu dapat menggunakan gaya percakapan bertahap. Tetap waspada jika pengirim meminta tindakan finansial kemudian.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MITIGATION ADVICE */}
          {activeTab === "advice" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl bg-[#0c0d0d] border border-white/[0.08] space-y-2">
                  <div className="size-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h4 className="text-sm font-semibold text-white">Jangan Terpancing Urgensi</h4>
                  <p className="text-xs text-[#A0A0A0] leading-relaxed">
                    Penipu sengaja membuat kepanikan seperti akun akan diblokir atau paket gagal kirim agar Anda bertindak tanpa berpikir logis.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#0c0d0d] border border-white/[0.08] space-y-2">
                  <div className="size-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h4 className="text-sm font-semibold text-white">Verifikasi Kanal Resmi</h4>
                  <p className="text-xs text-[#A0A0A0] leading-relaxed">
                    Jangan gunakan nomor telepon atau tautan yang ada di dalam pesan. Buka aplikasi resmi atau kunjungi call center yang tertera di kartu/situs bank.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#0c0d0d] border border-white/[0.08] space-y-2">
                  <div className="size-8 rounded-lg bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/20 flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h4 className="text-sm font-semibold text-white">Tindakan Cepat Jika Terlanjur</h4>
                  <p className="text-xs text-[#A0A0A0] leading-relaxed">
                    Jika sempat mengirimkan OTP atau menginstal APK, segera matikan koneksi internet (mode pesawat), hubungi bank untuk blokir rekening, dan reset password.
                  </p>
                </div>
              </div>

              {/* Quick Module Bridges */}
              <div className="p-4 rounded-xl bg-[#0c0d0d] border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-[#A0A0A0]">
                  Butuh langkah pemulihan akun atau pelaporan resmi?
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/act"
                    className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-white border border-white/10 transition-colors"
                  >
                    Buka Playbook Mitigasi &rarr;
                  </Link>
                  <Link
                    href="/quiz"
                    className="px-4 py-2 rounded-lg bg-[#3ECF8E]/10 hover:bg-[#3ECF8E]/20 text-xs font-semibold text-[#3ECF8E] border border-[#3ECF8E]/20 transition-colors"
                  >
                    Uji Modus di Kuis Kriminal &rarr;
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DETECTION SPECS */}
          {activeTab === "specs" && (
            <div className="p-5 rounded-xl bg-[#0c0d0d] border border-white/[0.08] space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase">SKOR ATURAN HEURISTIK</span>
                  <span className="text-white text-sm font-bold">{(result.rule_score * 100).toFixed(1)} / 100</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase">PROBABILITAS ML</span>
                  <span className="text-white text-sm font-bold">
                    {result.ml ? `${(result.ml.fraud_probability * 100).toFixed(1)}%` : "Mode Heuristik Deterministik"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase">MODEL VERSI</span>
                  <span className="text-white text-sm font-bold">
                    {result.ml?.model_version || "RJ-ENGINE-v2.4"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase">STATUS TELEMETRI</span>
                  <span className="text-[#3ECF8E] text-sm font-bold">ZERO-LOGGING (PRIVAT)</span>
                </div>
              </div>

              {result.disclaimer && (
                <div className="pt-3 border-t border-white/[0.06] text-[11px] text-zinc-400 font-sans leading-relaxed">
                  <strong>Pemberitahuan Etis:</strong> {result.disclaimer}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
