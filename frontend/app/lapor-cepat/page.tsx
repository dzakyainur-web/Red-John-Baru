"use client";

import { useState } from "react";
import Link from "next/link";
import SupabaseNavbar from "@/components/SupabaseNavbar";
import StudioFooter from "@/components/StudioFooter";
import { useSound } from "@/components/SoundManager";
import {
  inspectUrl,
  probePage,
  type ProbeResult,
  type Severity,
  type UrlReport,
} from "@/lib/url-inspect";

const SAMPLES = [
  {
    url: "https://bca-verifikasi.xyz/login",
    category: "Typosquat Bank BCA",
  },
  {
    url: "http://192.168.10.20/otp",
    category: "Alamat IP & Non-HTTPS",
  },
  {
    url: "bit.ly/undangan-nikah-resi-paket",
    category: "Shortlink Penyamar",
  },
  {
    url: "https://instagram-account-verify.online",
    category: "Phishing Medsos",
  },
  {
    url: "https://bca.co.id/",
    category: "Domain Resmi (Aman)",
  },
];

export default function LaporCepatPage() {
  const [input, setInput] = useState("");
  const [report, setReport] = useState<UrlReport | null>(null);
  const [probe, setProbe] = useState<ProbeResult | null>(null);
  const [probing, setProbing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"findings" | "probe" | "mitigation">("findings");

  const { playClick, playSuccess, playAlert } = useSound();

  function analyze() {
    if (!input.trim()) return;
    setError(null);
    setProbe(null);
    setCopied(false);
    playClick();

    const res = inspectUrl(input);
    setReport(res);

    if (res.level === "high" || res.level === "medium") {
      playAlert();
    } else {
      playSuccess();
    }
  }

  async function runProbe() {
    if (!input.trim() || probing) return;
    setProbing(true);
    setProbe(null);
    playClick();

    try {
      const res = await probePage(input);
      setProbe(res);
      if (res.ok && (res.hasPasswordField || res.otpMentions.length > 0)) {
        playAlert();
      } else {
        playSuccess();
      }
    } catch {
      setError("Gagal melakukan probe terhadap halaman tujuan.");
    } finally {
      setProbing(false);
    }
  }

  async function handlePaste() {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setInput(clipText);
        setReport(null);
        setProbe(null);
        playClick();
      }
    } catch {
      setError("Izin akses papan klip (clipboard) tidak diberikan oleh peramban.");
    }
  }

  function handleClear() {
    setInput("");
    setReport(null);
    setProbe(null);
    setError(null);
    playClick();
  }

  async function handleCopyReport() {
    if (!report) return;
    const findingsList = report.findings
      .map((f) => `- [${f.severity.toUpperCase()}] ${f.title}: ${f.detail}`)
      .join("\n");

    const summary = [
      `[LAPORAN FORENSIK TAUTAN RED JOHN]`,
      `Alamat Diperiksa: ${report.input}`,
      `Host / Domain: ${report.host || "Tidak dapat diurai"}`,
      `Status Risiko: ${report.level.toUpperCase()} (${report.score}/100)`,
      `\nTemuan Indikator:`,
      findingsList || "Tidak ditemukan kejanggalan struktural pada domain.",
      `\nCatatan Keamanan:`,
      `Analisis URL bekerja secara lokal di browser. Domain yang terlihat sah tetap dapat disalahgunakan penipu. Selalu verifikasi lewat aplikasi resmi.`,
      `Diverifikasi via Red John Forensics (https://redjohn.id)`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      playSuccess();
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Gagal menyalin laporan ke papan klip.");
    }
  }

  const getRiskMeta = (level: "low" | "medium" | "high") => {
    switch (level) {
      case "high":
        return {
          title: "RISIKO TINGGI (BAHAYA)",
          sub: "Tautan ini memiliki indikator kuat situs phishing, manipulasi domain (typosquatting), punycode homoglyph, atau alamat server tidak lazim.",
          badgeBg: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          barBg: "from-rose-500 to-red-600",
          border: "border-rose-500/30",
          glow: "shadow-[0_0_40px_rgba(244,63,94,0.15)]",
        };
      case "medium":
        return {
          title: "RISIKO SEDANG (WASPADA)",
          sub: "Ditemukan pola shortlink tersembunyi, protokol HTTP tanpa enkripsi, atau ekstensi domain murah yang sering dipakai kampanye penipuan.",
          badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          barBg: "from-amber-400 to-amber-600",
          border: "border-amber-500/30",
          glow: "shadow-[0_0_40px_rgba(245,158,11,0.15)]",
        };
      default:
        return {
          title: "RISIKO RENDAH (AMAN)",
          sub: "Struktur domain dan URL tidak menunjukkan ciri penyamaran umum. Tetap berhati-hati sebelum mengisi kredensial atau nomor kartu.",
          badgeBg: "bg-[#3ECF8E]/10 text-[#3ECF8E] border-[#3ECF8E]/30",
          barBg: "from-[#3ECF8E] to-emerald-400",
          border: "border-[#3ECF8E]/30",
          glow: "shadow-[0_0_40px_rgba(62,207,142,0.15)]",
        };
    }
  };

  return (
    <div id="top" className="min-h-screen bg-[#0c0d0d] text-white selection:bg-white selection:text-black font-sans">
      {/* =========================================================================
          SUPABASE NAVBAR — Exact clone of Landing Page header
          ========================================================================= */}
      <SupabaseNavbar />

      {/* =========================================================================
          HERO SECTION — 2-Column Landing Page Hero Layout
          ========================================================================= */}
      <section className="pt-28 sm:pt-36 pb-12 px-6 bg-[#0c0d0d] font-sans relative overflow-hidden">
        {/* Subtle radial emerald blur */}
        <div className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 size-[580px] rounded-full bg-[#3ECF8E]/6 blur-[140px]" />

        <div className="max-w-[1200px] mx-auto relative z-10">
          {/* Emergency Fast Banner if user already transferred funds */}
          <div className="mb-8 rounded-2xl bg-[#161817] border border-rose-500/30 p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="size-2.5 rounded-full bg-rose-500 animate-ping" />
              <p className="text-xs sm:text-sm text-zinc-300">
                Sudah terlanjur mentransfer uang atau membagikan kode OTP ke penipu?
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/darurat"
                className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold text-xs transition-all whitespace-nowrap"
              >
                <span>Paket Laporan Darurat</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>

          {/* 2-column layout: headline left | description & checklist right */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-16">
            {/* LEFT COLUMN: Badge + Headline + Threat Categories */}
            <div className="lg:max-w-[620px]">
              {/* Badge pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161817] border border-white/[0.08] text-xs font-medium text-zinc-300 mb-6">
                <span className="size-2 rounded-full bg-[#3ECF8E] animate-pulse" />
                <span>Forensik Tautan, Typosquatting &amp; Anti-Phishing</span>
              </div>

              {/* Headline — Manrope, exact landing page scale */}
              <h1 className="text-[40px] sm:text-[54px] lg:text-[62px] font-black text-white leading-[1.08] tracking-[-0.03em] font-heading">
                Lapor &amp; inspeksi.
                <br />
                <span className="text-[#3ECF8E]">Urai tautan jebakan.</span>
              </h1>

              {/* Threat tags pills */}
              <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-[#A0A0A0]">
                <span className="text-zinc-500 font-mono text-[11px] uppercase mr-1">
                  Vektor Pengujian:
                </span>
                {["Domain Typosquatting", "Shortlink Samar", "Punycode Homoglyph", "Port & IP Tak Lazim", "Pencurian Akun"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300"
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Description & Checklist */}
            <div className="lg:max-w-[400px] lg:pt-3 space-y-5">
              <p className="text-[15px] sm:text-[16px] text-[#A0A0A0] leading-[1.65]">
                Dapat tautan asing dari WhatsApp, SMS, atau bio media sosial? Bedah struktur domain, shortlink bertingkat, dan trik penyamaran visual sebelum membukanya di browser.
              </p>

              {/* Value proposition checklist */}
              <ul className="space-y-2.5 text-[14px] text-zinc-300">
                <li className="flex items-center gap-2.5">
                  <span className="size-5 rounded-full bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 text-[#3ECF8E] flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                  <span><strong>100% Sisi Klien:</strong> Alamat URL tidak dikirim ke server</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="size-5 rounded-full bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 text-[#3ECF8E] flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                  <span><strong>Deteksi Typosquatting:</strong> Meniru nama bank resmi</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="size-5 rounded-full bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 text-[#3ECF8E] flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                  <span><strong>Probe Halaman Aman:</strong> Cek form login &amp; input OTP</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MAIN URL INSPECTOR WORKBENCH (Supabase Bento Studio Card)
          ========================================================================= */}
      <section className="pb-16 px-6 bg-[#0c0d0d] relative z-10">
        <div className="max-w-[1200px] mx-auto space-y-6">
          <div className="relative rounded-2xl sm:rounded-3xl bg-[#161817] border border-white/[0.08] p-6 sm:p-8 backdrop-blur-xl shadow-2xl transition-all">
            {/* Subtle Ambient Radial Glow */}
            <div className="pointer-events-none absolute -top-32 right-10 size-[360px] rounded-full bg-[#3ECF8E]/5 blur-[120px]" />

            {/* Console Header Bar */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-400">
                <span className="size-2 rounded-full bg-[#3ECF8E] animate-pulse" />
                <span>ENGINE // FORENSIK STRUKTURAL URL &amp; PROBE KLIEN</span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#A0A0A0]">
                <span>12 Aturan Heuristik Sisi Klien</span>
                <span>•</span>
                <span className="text-[#3ECF8E]">Zero-Trace Logging</span>
              </div>
            </div>

            {/* Presets Chips */}
            <div className="py-4 flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-medium text-[#A0A0A0] mr-1">
                Uji contoh tautan:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLES.map((s) => (
                  <button
                    key={s.url}
                    type="button"
                    onClick={() => {
                      setInput(s.url);
                      setReport(null);
                      setProbe(null);
                      playClick();
                    }}
                    className="px-3 py-1 rounded-full text-xs bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-zinc-300 transition-all cursor-pointer font-mono"
                  >
                    {s.category}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Box Area */}
            <div className="space-y-4">
              <div className="relative rounded-xl sm:rounded-2xl bg-[#0c0d0d] border border-white/[0.08] focus-within:border-[#3ECF8E] focus-within:ring-1 focus-within:ring-[#3ECF8E]/25 transition-all p-4">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && analyze()}
                  placeholder="Tempel tautan mencurigakan di sini (contoh: bca-verifikasi.xyz/login atau bit.ly/resi-paket)..."
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full bg-transparent text-sm sm:text-base text-zinc-100 placeholder:text-zinc-600 focus:outline-none font-mono py-1"
                />

                {/* Inner Bottom Controls Toolbar */}
                <div className="pt-3 mt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs text-[#A0A0A0]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePaste}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] hover:text-white border border-white/[0.06] transition-colors cursor-pointer"
                      title="Tempel tautan dari papan klip"
                    >
                      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                      </svg>
                      <span>Tempel Clipboard</span>
                    </button>

                    {input.length > 0 && (
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
                    Tekan <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white">Enter</kbd> untuk menganalisis
                  </div>
                </div>
              </div>

              {/* Action Footer Row */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
                  <span className="size-1.5 rounded-full bg-[#3ECF8E]" />
                  <span>Analisis berjalan 100% di browser • Alamat tidak dikirim ke server</span>
                </div>

                <button
                  type="button"
                  onClick={analyze}
                  disabled={!input.trim()}
                  className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-[#3ECF8E] hover:bg-[#4adeaa] text-black font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(62,207,142,0.3)] cursor-pointer"
                >
                  <span>Analisis Tautan Sekarang</span>
                  <span className="ml-1 text-base leading-none">&rarr;</span>
                </button>
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3">
                <svg className="size-4 shrink-0 mt-0.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <div className="flex-1 leading-relaxed">
                  <strong>Pemberitahuan:</strong> {error}
                </div>
              </div>
            )}
          </div>

          {/* =========================================================================
              RESULTS SECTION — Supabase Studio Bento Breakdown
              ========================================================================= */}
          {report && (
            <div className={`rounded-2xl sm:rounded-3xl bg-[#161817] border ${getRiskMeta(report.level).border} p-6 sm:p-8 backdrop-blur-xl ${getRiskMeta(report.level).glow} transition-all space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300`}>
              {/* Top Result Banner */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
                {/* Risk Title & Explanation */}
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border tracking-wider uppercase ${getRiskMeta(report.level).badgeBg}`}>
                      {getRiskMeta(report.level).title}
                    </span>
                    {report.host && (
                      <span className="text-xs font-mono text-zinc-300 bg-white/[0.06] px-2.5 py-0.5 rounded-md border border-white/10">
                        {report.host}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {report.level === "high"
                      ? "Peringatan Bahaya: Terdeteksi Ciri Khas Phishing / Jebakan"
                      : report.level === "medium"
                      ? "Waspada: Ditemukan Kejanggalan Struktur atau Penyamaran"
                      : "Struktur Bersih: Tidak Ditemukan Penyamaran Domain"}
                  </h3>
                  <p className="text-sm text-[#A0A0A0] leading-relaxed">
                    {getRiskMeta(report.level).sub}
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
                        {report.score}
                      </span>
                      <span className="text-xs text-[#A0A0A0]">/ 100</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-28 sm:w-32 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getRiskMeta(report.level).barBg}`}
                        style={{ width: `${Math.min(100, Math.max(5, report.score))}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="border-l border-white/[0.08] pl-5 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleCopyReport}
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
                      Uji Tautan Lain
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub-Navigation Tabs */}
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
                  Temuan Indikator ({report.findings.length})
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab("probe"); playClick(); }}
                  className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                    activeTab === "probe"
                      ? "bg-white/[0.1] text-white"
                      : "text-[#A0A0A0] hover:text-white"
                  }`}
                >
                  Probe Isi Halaman
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab("mitigation"); playClick(); }}
                  className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                    activeTab === "mitigation"
                      ? "bg-white/[0.1] text-white"
                      : "text-[#A0A0A0] hover:text-white"
                  }`}
                >
                  Panduan Mitigasi
                </button>
              </div>

              {/* TAB 1: FINDINGS */}
              {activeTab === "findings" && (
                <div className="space-y-4">
                  {report.findings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {report.findings.map((f) => {
                        const isHigh = f.severity === "tinggi";
                        const isMed = f.severity === "sedang";
                        return (
                          <div
                            key={f.id}
                            className="rounded-xl bg-[#0c0d0d] border border-white/[0.08] p-5 flex flex-col justify-between space-y-3 hover:border-white/[0.15] transition-all"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-mono text-zinc-500 uppercase">
                                  KODE #{f.id}
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
                                  SEVERITAS {f.severity}
                                </span>
                              </div>

                              <h4 className="text-[15px] font-semibold text-white tracking-tight">
                                {f.title}
                              </h4>

                              <p className="text-xs text-[#A0A0A0] leading-relaxed">
                                {f.detail}
                              </p>
                            </div>
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
                        Tidak Ada Ciri Penipuan Struktural
                      </h4>
                      <p className="text-xs text-[#A0A0A0] max-w-md mx-auto leading-relaxed">
                        Domain dan URL yang diperiksa tidak mengandung trik homoglyph, shortlink penyamar, atau IP langsung. Namun ingat: situs resmi yang diretas atau barang palsu di marketplace tetap dapat menggunakan domain resmi.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: SAFE PAGE PROBE */}
              {activeTab === "probe" && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-[#0c0d0d] border border-white/[0.08] p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          Probe Isi Halaman Sisi Klien (Opsional)
                        </h4>
                        <p className="text-xs text-[#A0A0A0] mt-1 leading-relaxed max-w-xl">
                          Mencoba mengambil kode HTML halaman dari browser Anda untuk mendeteksi apakah situs memuat kolom kata sandi tersembunyi, meminta OTP, atau memuat skrip asing.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={runProbe}
                        disabled={probing}
                        className="px-5 py-2.5 rounded-lg bg-[#3ECF8E] hover:bg-[#4adeaa] text-black font-semibold text-xs transition-all disabled:opacity-50 whitespace-nowrap cursor-pointer shrink-0"
                      >
                        {probing ? "Mengambil Data Halaman..." : "Jalankan Probe Halaman →"}
                      </button>
                    </div>

                    {probe && (
                      <div className="pt-4 border-t border-white/[0.08] space-y-3 text-xs font-mono">
                        {probe.ok ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              <div className="p-3 rounded-lg bg-black/60 border border-white/[0.06]">
                                <span className="text-[10px] text-zinc-500 block uppercase">STATUS HTTP</span>
                                <span className="text-white font-bold text-sm">{probe.status} OK</span>
                              </div>
                              <div className="p-3 rounded-lg bg-black/60 border border-white/[0.06]">
                                <span className="text-[10px] text-zinc-500 block uppercase">UKURAN RESPON</span>
                                <span className="text-white font-bold text-sm">{(probe.bytes / 1024).toFixed(1)} KB</span>
                              </div>
                              <div className="p-3 rounded-lg bg-black/60 border border-white/[0.06]">
                                <span className="text-[10px] text-zinc-500 block uppercase">FORM PASSWORD</span>
                                <span className={probe.hasPasswordField ? "text-rose-400 font-bold" : "text-[#3ECF8E]"}>
                                  {probe.hasPasswordField ? "⚠️ ADA FORM PASSWORD" : "✓ TIDAK ADA"}
                                </span>
                              </div>
                              <div className="p-3 rounded-lg bg-black/60 border border-white/[0.06]">
                                <span className="text-[10px] text-zinc-500 block uppercase">KATA KUNCI OTP</span>
                                <span className={probe.otpMentions.length > 0 ? "text-rose-400 font-bold" : "text-[#3ECF8E]"}>
                                  {probe.otpMentions.length > 0 ? probe.otpMentions.join(", ") : "✓ TIDAK ADA"}
                                </span>
                              </div>
                            </div>

                            <div className="p-3 rounded-lg bg-black/60 border border-white/[0.06] space-y-1">
                              <span className="text-[10px] text-zinc-500 uppercase block font-sans">JUDUL HALAMAN (TITLE):</span>
                              <div className="text-white font-sans text-sm">{probe.title || "(Tanpa judul)"}</div>
                            </div>

                            <div className="p-3 rounded-lg bg-black/60 border border-white/[0.06] space-y-1">
                              <span className="text-[10px] text-zinc-500 uppercase block font-sans">URL AKHIR (SETELAH REDIRECT):</span>
                              <div className="text-zinc-300 break-all">{probe.finalUrl}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-lg bg-black/60 border border-white/[0.08] text-[#A0A0A0] leading-relaxed">
                            <span className="text-amber-400 font-bold block mb-1">Catatan Keamanan Browser:</span>
                            {probe.reason}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: MITIGATION GUIDE */}
              {activeTab === "mitigation" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-xl bg-[#0c0d0d] border border-white/[0.08] space-y-2">
                      <div className="size-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold text-sm">
                        1
                      </div>
                      <h4 className="text-sm font-semibold text-white">Jangan Isi Formulir Login</h4>
                      <p className="text-xs text-[#A0A0A0] leading-relaxed">
                        Jika tautan meminta username, PIN, atau kata sandi internet banking, segera tutup tab browser. Bank tidak pernah meminta konfirmasi akun via link chat.
                      </p>
                    </div>

                    <div className="p-5 rounded-xl bg-[#0c0d0d] border border-white/[0.08] space-y-2">
                      <div className="size-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-sm">
                        2
                      </div>
                      <h4 className="text-sm font-semibold text-white">Periksa Domain Resmi</h4>
                      <p className="text-xs text-[#A0A0A0] leading-relaxed">
                        Ketik sendiri alamat situs resmi di peramban (misalnya <code>bca.co.id</code> bukan <code>bca-verifikasi.xyz</code>). Jangan klik link dari SMS asing.
                      </p>
                    </div>

                    <div className="p-5 rounded-xl bg-[#0c0d0d] border border-white/[0.08] space-y-2">
                      <div className="size-8 rounded-lg bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/20 flex items-center justify-center font-bold text-sm">
                        3
                      </div>
                      <h4 className="text-sm font-semibold text-white">Laporkan &amp; Blokir</h4>
                      <p className="text-xs text-[#A0A0A0] leading-relaxed">
                        Laporkan domain mencurigakan ke AduanKonten Kominfo atau layanan perbankan terkait agar domain tersebut segera diblokir secara nasional.
                      </p>
                    </div>
                  </div>

                  {/* Quick Module Bridges */}
                  <div className="p-4 rounded-xl bg-[#0c0d0d] border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
                    <div className="text-xs text-[#A0A0A0]">
                      Tautan dikirim bersamaan dengan pesan atau SMS mencurigakan?
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href="/pemindai"
                        className="px-4 py-2 rounded-lg bg-[#3ECF8E]/10 hover:bg-[#3ECF8E]/20 text-xs font-semibold text-[#3ECF8E] border border-[#3ECF8E]/20 transition-colors"
                      >
                        Pindai Pesan di Pemindai &rarr;
                      </Link>
                      <Link
                        href="/act"
                        className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-white border border-white/10 transition-colors"
                      >
                        Lihat Playbook Mitigasi &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          BENTO THREAT VECTORS GRID — 4 Cards (similar to BentoFeatures Row 2)
          ========================================================================= */}
      <section className="py-16 px-6 bg-[#0c0d0d] border-t border-white/[0.06] font-sans">
        <div className="max-w-[1200px] mx-auto space-y-8">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-[#3ECF8E] mb-2">
              VEKTOR PENYAMARAN TAUTAN
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-heading">
              Trik Rekayasa URL yang Kerap Menipu Korban
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Typosquatting */}
            <div className="rounded-2xl bg-[#161817] border border-white/[0.08] p-6 flex flex-col justify-between hover:border-white/[0.14] transition-all">
              <div className="space-y-3">
                <div className="size-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-lg">
                  🪞
                </div>
                <h3 className="text-base font-semibold text-white">
                  Typosquatting Brand
                </h3>
                <p className="text-xs text-[#A0A0A0] leading-relaxed">
                  Menyisipkan nama bank atau institusi resmi ke dalam domain tidak resmi (misalnya <code>bca-login.xyz</code> atau <code>mandiri-info.top</code>).
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-white/[0.06] text-[11px] font-mono text-zinc-400">
                Deteksi: Jarak Levenshtein &amp; Folded Subdomain
              </div>
            </div>

            {/* Card 2: Shortlink Abuse */}
            <div className="rounded-2xl bg-[#161817] border border-white/[0.08] p-6 flex flex-col justify-between hover:border-white/[0.14] transition-all">
              <div className="space-y-3">
                <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-lg">
                  🔗
                </div>
                <h3 className="text-base font-semibold text-white">
                  Shortlink Penyamar
                </h3>
                <p className="text-xs text-[#A0A0A0] leading-relaxed">
                  Layanan pemendek tautan seperti bit.ly, s.id, atau tinyurl dipakai menyembunyikan alamat unduhan malware .APK atau halaman login tiruan.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-white/[0.06] text-[11px] font-mono text-zinc-400">
                Deteksi: Katalog 15+ Host Pemendek Tautan
              </div>
            </div>

            {/* Card 3: Punycode & Homoglyph */}
            <div className="rounded-2xl bg-[#161817] border border-white/[0.08] p-6 flex flex-col justify-between hover:border-white/[0.14] transition-all">
              <div className="space-y-3">
                <div className="size-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center text-lg">
                  🔡
                </div>
                <h3 className="text-base font-semibold text-white">
                  Punycode Homoglyph
                </h3>
                <p className="text-xs text-[#A0A0A0] leading-relaxed">
                  Memakai alfabet non-Latin (misal huruf Sirilik &lsquo;а&rsquo; yang mirip &lsquo;a&rsquo; Latin) sehingga mata manusia mengira tautan tersebut asli.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-white/[0.06] text-[11px] font-mono text-zinc-400">
                Deteksi: Awalan Punycode xn--
              </div>
            </div>

            {/* Card 4: IP & Open Redirect */}
            <div className="rounded-2xl bg-[#161817] border border-white/[0.08] p-6 flex flex-col justify-between hover:border-white/[0.14] transition-all">
              <div className="space-y-3">
                <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#3ECF8E] flex items-center justify-center text-lg">
                  🎯
                </div>
                <h3 className="text-base font-semibold text-white">
                  IP Literal &amp; Redirect
                </h3>
                <p className="text-xs text-[#A0A0A0] leading-relaxed">
                  Mengakses alamat IP numerik secara langsung atau menyematkan parameter pengalihan (?redirect=) untuk melempar korban ke situs penipuan.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-white/[0.06] text-[11px] font-mono text-zinc-400">
                Deteksi: Host IPv4/IPv6 &amp; Redirect Params
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PRIVACY & ARCHITECTURE BENTO GRID — 3 Cards (Row 1 Style)
          ========================================================================= */}
      <section className="py-16 px-6 bg-[#0c0d0d] font-sans">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bento 1: Client-Side Safety */}
            <div className="rounded-2xl bg-[#161817] border border-white/[0.08] p-7 space-y-4 hover:border-white/[0.14] transition-all">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 text-[#3ECF8E] flex items-center justify-center text-sm font-bold">
                  🔒
                </div>
                <h3 className="text-base font-semibold text-white">
                  100% Sisi Klien &amp; Privat
                </h3>
              </div>
              <p className="text-xs text-[#A0A0A0] leading-relaxed">
                URL yang Anda ketikkan atau tempel diurai seluruhnya di dalam memori peramban tanpa pernah dikirim ke server pusat atau pihak ketiga. Privasi pencarian Anda terjamin penuh.
              </p>
              <div className="pt-2 text-[12px] text-[#3ECF8E] font-medium">
                Client-Side URL Parser &rarr;
              </div>
            </div>

            {/* Bento 2: Database Institusi Nasional */}
            <div className="rounded-2xl bg-[#161817] border border-white/[0.08] p-7 space-y-4 hover:border-white/[0.14] transition-all">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 text-[#3ECF8E] flex items-center justify-center text-sm font-bold">
                  ⚡
                </div>
                <h3 className="text-base font-semibold text-white">
                  Katalog Institusi Nasional
                </h3>
              </div>
              <p className="text-xs text-[#A0A0A0] leading-relaxed">
                Mencocokkan nama brand terhadap domain resmi perbankan (BCA, BRI, Mandiri, BNI, BTN), regulator (Bank Indonesia, OJK, Kominfo), dan platform medsos terverifikasi.
              </p>
              <div className="pt-2 text-[12px] text-[#3ECF8E] font-medium">
                Official Registry Matching &rarr;
              </div>
            </div>

            {/* Bento 3: Ekosistem Penyelamatan Cepat */}
            <div className="rounded-2xl bg-[#161817] border border-white/[0.08] p-7 space-y-4 hover:border-white/[0.14] transition-all">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 text-[#3ECF8E] flex items-center justify-center text-sm font-bold">
                  🛡️
                </div>
                <h3 className="text-base font-semibold text-white">
                  Mitigasi Penipuan Cepat
                </h3>
              </div>
              <p className="text-xs text-[#A0A0A0] leading-relaxed">
                Tersambung langsung dengan panduan isolasi perbankan, langkah pemblokiran kartu, serta format resmi pelaporan rekening penampung ke aparat berwenang.
              </p>
              <div className="pt-2 text-[12px] text-[#3ECF8E] font-medium">
                Emergency Incident Response &rarr;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CLOSING CTA — Exact clone of Landing Page CTA Banner
          ========================================================================= */}
      <section className="relative z-10 py-16 px-4 sm:px-8 border-t border-white/[0.06] bg-[#0c0d0d]">
        <div className="max-w-[1200px] mx-auto rounded-3xl bg-[#161817] border border-white/[0.08] px-6 py-14 sm:px-14 text-center relative overflow-hidden shadow-2xl">
          {/* Subtle green ambient blur */}
          <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 size-[420px] rounded-full bg-[#3ECF8E]/8 blur-[120px]" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white font-heading">
              Periksa pesan atau uji naluri waspadamu.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-400 font-sans leading-relaxed">
              Tautan seringkali disisipkan ke dalam pesan WhatsApp atau SMS dengan narasi panik. Gunakan Pemindai Pesan untuk menganalisis isi percakapan secara utuh.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/pemindai"
                className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-[#3ECF8E] hover:bg-[#4adeaa] text-black font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(62,207,142,0.3)]"
              >
                Buka Pemindai Pesan &rarr;
              </Link>
              <Link
                href="/quiz"
                className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.12] font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Mulai Kuis Kriminal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          STUDIO FOOTER
          ========================================================================= */}
      <StudioFooter />
    </div>
  );
}
