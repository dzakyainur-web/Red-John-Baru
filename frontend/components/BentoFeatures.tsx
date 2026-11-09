"use client";

import Link from "next/link";

// Supabase exact bento features grid clone
// Row 1: 3 cards — Automatic Crime Quiz | Authentication | News Feeds
// Row 2: 4 cards — Storage | Realtime | Vector | Data APIs

export default function BentoFeatures() {
  return (
    <section id="modul" className="pb-20 px-6 bg-[#0c0d0d] font-sans">
      <div className="max-w-[1200px] mx-auto">

        {/* =====================================================================
            ROW 1 — 3 Cards: Crime Quiz (large) | Auth | News Feeds
            ===================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">

          {/* ── CARD 1: Automatic Crime Quiz ── */}
          <Link
            href="/quiz"
            className="group md:col-span-2 rounded-2xl bg-[#161817] border border-white/[0.08] p-7 flex flex-col justify-between relative overflow-hidden min-h-[340px] hover:border-white/[0.14] transition-colors"
          >
            {/* Background video — dekoratif, overlay menjaga kontras teks */}
            <video
              className="absolute inset-0 size-full object-cover opacity-70 pointer-events-none motion-reduce:hidden"
              src="/pixel-boat.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden
              tabIndex={-1}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#161817]/90 via-[#161817]/30 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="relative">
              <div className="flex items-center gap-2.5 mb-3">
                {/* Quiz / clipboard-check icon */}
                <svg className="size-6 text-white opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M9 3.75h6a1.5 1.5 0 0 1 1.5 1.5v.75H16.5a1.5 1.5 0 0 0-1.5 1.5v.75h-6v-.75a1.5 1.5 0 0 0-1.5-1.5H6.75v-.75a1.5 1.5 0 0 1 1.5-1.5Zm7.5 3.75h2.25a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V9a1.5 1.5 0 0 1 1.5-1.5H7.5" />
                </svg>
                <h3 className="text-[16px] font-semibold text-white" style={{ letterSpacing: "-0.01em" }}>Kuis Kriminal Otomatis</h3>
              </div>

              <p className="text-[13.5px] text-[#D4D4D4] leading-relaxed max-w-[280px]">
                Uji naluri waspada dengan <strong className="text-white font-semibold">kuis otomatis</strong> berisi modus kriminal digital yang benar-benar terjadi di Indonesia.
              </p>
            </div>

            {/* Checklist */}
            <div className="relative mt-auto">
              <ul className="space-y-2 text-[14px] text-[#D4D4D4] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                <li className="flex items-center gap-2">
                  <span className="text-[#3ECF8E] text-sm">✓</span>
                  <span>Modus asli Indonesia</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#3ECF8E] text-sm">✓</span>
                  <span>Diperbarui <span className="text-[#3ECF8E] underline underline-offset-2">setiap hari</span></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#3ECF8E] text-sm">✓</span>
                  <span>Tanpa biaya</span>
                </li>
              </ul>

              <div className="mt-5 inline-flex items-center gap-2 text-[12px] text-[#3ECF8E] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                <span>Mulai kuis</span>
                <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>→</span>
              </div>
            </div>

          </Link>

          {/* ── CARD 2: Authentication ── */}
          <div className="rounded-2xl bg-[#161817] border border-white/[0.08] p-7 flex flex-col justify-between relative overflow-hidden min-h-[340px] hover:border-white/[0.14] transition-colors">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                {/* Lock Icon */}
                <svg className="size-5 text-white opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
                </svg>
                <h3 className="text-[13px] font-semibold text-white" style={{ letterSpacing: "-0.01em" }}>Authentication</h3>
              </div>

              <p className="text-[13px] text-[#A0A0A0] leading-relaxed">
                Add user <span className="text-white font-bold underline underline-offset-2">sign ups</span> and <span className="text-white font-bold underline underline-offset-2">logins</span>, securing your data with Row Level Security.
              </p>
            </div>

            {/* Mock email/password input pills — 2×2 grid */}
            <div className="mt-6 space-y-2">
              {/* Row 1 */}
              <div className="grid grid-cols-2 gap-2">
                <div className="px-3 py-2 rounded-lg bg-[#0d0e0d] border border-white/[0.08] text-[11px] text-[#666] truncate" style={{ fontFamily: "var(--font-supa-mono)" }}>
                  j1980@gmail.com
                </div>
                <div className="px-3 py-2 rounded-lg bg-[#0d0e0d] border border-white/[0.08] text-[11px] text-[#666] truncate" style={{ fontFamily: "var(--font-supa-mono)" }}>
                  alex1601
                </div>
              </div>
              {/* Row 2 — password dots */}
              <div className="grid grid-cols-2 gap-2">
                <div className="px-3 py-2 rounded-lg bg-[#0d0e0d] border border-white/[0.08] flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="size-1.5 rounded-full bg-[#555] inline-block" />
                  ))}
                </div>
                <div className="px-3 py-2 rounded-lg bg-[#0d0e0d] border border-white/[0.08] flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="size-1.5 rounded-full bg-[#555] inline-block" />
                  ))}
                </div>
              </div>
              {/* Row 3 */}
              <div className="grid grid-cols-2 gap-2">
                <div className="px-3 py-2 rounded-lg bg-[#0d0e0d] border border-white/[0.08] text-[11px] text-[#666] truncate" style={{ fontFamily: "var(--font-supa-mono)" }}>
                  j567@gmail.com
                </div>
                <div className="px-3 py-2 rounded-lg bg-[#0d0e0d] border border-white/[0.08] text-[11px] text-[#666] truncate" style={{ fontFamily: "var(--font-supa-mono)" }}>
                  mememaster
                </div>
              </div>
            </div>
          </div>

          {/* ── CARD 3: News Feeds (teks statis, klik ke /berita) ── */}
          <Link
            href="/berita"
            className="group rounded-2xl bg-[#161817] border border-white/[0.08] p-7 flex flex-col justify-between relative overflow-hidden min-h-[340px] hover:border-white/[0.14] transition-colors"
          >
            {/* Background video — dekoratif, overlay menjaga kontras teks */}
            <video
              className="absolute inset-0 size-full object-cover opacity-70 pointer-events-none motion-reduce:hidden"
              src="/pixel-floating-island.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden
              tabIndex={-1}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#161817]/90 via-[#161817]/30 to-transparent pointer-events-none" />

            <div className="relative">
              <div className="flex items-center gap-2.5 mb-3">
                {/* Radar / broadcast icon */}
                <svg className="size-5 text-white opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
                </svg>
                <h3 className="text-[13px] font-semibold text-white" style={{ letterSpacing: "-0.01em" }}>News Feeds</h3>
                <span className="ml-auto flex items-center gap-1.5 text-[10px] tracking-wider text-[#3ECF8E] uppercase">
                  <span className="relative flex size-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3ECF8E] opacity-75" />
                    <span className="relative inline-flex rounded-full size-1.5 bg-[#3ECF8E]" />
                  </span>
                  live
                </span>
              </div>

              <p className="text-[13px] text-[#A0A0A0] leading-relaxed">
                Situs ini punya <span className="text-white font-bold">feed berita terverifikasi</span>. Modus penipuan digital terbaru dari media nasional, dikurasi otomatis tiap hari.
              </p>
            </div>

            <div className="relative mt-auto pt-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0d0e0d]/80 backdrop-blur-sm border border-[#3ECF8E]/30 text-[12px]" style={{ fontFamily: "var(--font-supa-mono)" }}>
                <span className="text-[#3ECF8E]">$</span>
                <span className="text-white">redjohn</span>
                <span className="text-[#3ECF8E]">news</span>
                <span className="text-white group-hover:translate-x-0.5 transition-transform" aria-hidden>↵</span>
              </div>
            </div>
          </Link>

        </div>

        {/* =====================================================================
            ROW 2 — 4 Cards: Storage | Realtime | Vector | Data APIs
            ===================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* ── CARD 4: Storage ── */}
          <div className="rounded-2xl bg-[#161817] border border-white/[0.08] p-6 flex flex-col justify-between relative overflow-hidden min-h-[300px] hover:border-white/[0.14] transition-colors">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                {/* Archive box icon */}
                <svg className="size-4.5 text-white opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                <h3 className="text-[13px] font-semibold text-white" style={{ letterSpacing: "-0.01em" }}>Storage</h3>
              </div>
              <p className="text-[13px] text-[#A0A0A0] leading-relaxed">
                Store, organize, and serve large files, from <span className="text-[#3ECF8E]">videos</span> to <span className="text-[#3ECF8E]">images</span>.
              </p>
            </div>

            {/* 4×3 file icon grid */}
            <div className="mt-6 grid grid-cols-4 gap-1.5">
              {/* Row 1: image icons */}
              {[...Array(4)].map((_, i) => (
                <div key={`img-${i}`} className="aspect-square rounded-lg bg-[#0d0e0d] border border-white/[0.07] flex items-center justify-center">
                  <svg className="size-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                </div>
              ))}
              {/* Row 2: document icons */}
              {[...Array(4)].map((_, i) => (
                <div key={`doc-${i}`} className="aspect-square rounded-lg bg-[#0d0e0d] border border-white/[0.07] flex items-center justify-center">
                  <svg className="size-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
              ))}
              {/* Row 3: video icons */}
              {[...Array(4)].map((_, i) => (
                <div key={`vid-${i}`} className="aspect-square rounded-lg bg-[#0d0e0d] border border-white/[0.07] flex items-center justify-center">
                  <svg className="size-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
              ))}
            </div>
          </div>

          {/* ── CARD 5: Realtime ── */}
          <div className="rounded-2xl bg-[#161817] border border-white/[0.08] p-6 flex flex-col justify-between relative overflow-hidden min-h-[300px] hover:border-white/[0.14] transition-colors">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                {/* Cursor/realtime icon */}
                <svg className="size-4.5 text-white opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
                </svg>
                <h3 className="text-[13px] font-semibold text-white" style={{ letterSpacing: "-0.01em" }}>Realtime</h3>
              </div>
              <p className="text-[13px] text-[#A0A0A0] leading-relaxed">
                Build multiplayer experiences with <span className="text-white font-bold">real-time data synchronization</span>.
              </p>
            </div>

            {/* Animated cursors + typing bubble */}
            <div className="mt-6 flex flex-col items-center justify-center gap-5 h-24 relative">
              {/* Typing bubble */}
              <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#0d0e0d] border border-white/[0.1] shadow-lg">
                {[...Array(3)].map((_, i) => (
                  <span
                    key={i}
                    className="size-1.5 rounded-full bg-[#A0A0A0]"
                    style={{ animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>

              {/* Two cursor SVGs */}
              <div className="flex items-center gap-8 opacity-60">
                <svg className="size-5 text-[#3ECF8E]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.5 2.25a.75.75 0 0 0-1.5 0v19.5a.75.75 0 0 0 1.28.53l3.72-3.72V20.25a.75.75 0 0 0 .75.75h1.5a.75.75 0 0 0 .75-.75v-1.69l3.72 3.72a.75.75 0 0 0 1.28-.53V2.25a.75.75 0 0 0-1.5 0v.69L10.5 6.44V2.25a.75.75 0 0 0-.75-.75H8.25a.75.75 0 0 0-.75.75v4.19L4.5 2.94V2.25z" />
                </svg>
                <svg className="size-4 text-[#A0A0A0]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.5 2.25a.75.75 0 0 0-1.5 0v19.5a.75.75 0 0 0 1.28.53l3.72-3.72V20.25a.75.75 0 0 0 .75.75h1.5a.75.75 0 0 0 .75-.75v-1.69l3.72 3.72a.75.75 0 0 0 1.28-.53V2.25a.75.75 0 0 0-1.5 0v.69L10.5 6.44V2.25a.75.75 0 0 0-.75-.75H8.25a.75.75 0 0 0-.75.75v4.19L4.5 2.94V2.25z" />
                </svg>
              </div>
            </div>

            <style jsx>{`
              @keyframes bounce {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-4px); }
              }
            `}</style>
          </div>

          {/* ── CARD 6: Vector ── */}
          <div className="rounded-2xl bg-[#161817] border border-white/[0.08] p-6 flex flex-col justify-between relative overflow-hidden min-h-[300px] hover:border-white/[0.14] transition-colors">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                {/* Cube icon */}
                <svg className="size-4.5 text-white opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
                <h3 className="text-[13px] font-semibold text-white" style={{ letterSpacing: "-0.01em" }}>Vector</h3>
              </div>
              <p className="text-[13px] text-[#A0A0A0] leading-relaxed">
                Integrate your favorite ML-models to <span className="text-white font-bold">store, index</span> and <span className="text-white font-bold">search vector embeddings</span>.
              </p>
            </div>

            {/* 3D wireframe cube + AI provider logos */}
            <div className="mt-4 flex flex-col items-center gap-4">
              {/* Cube SVG */}
              <svg viewBox="0 0 120 100" className="w-28 h-20 stroke-zinc-500 fill-none">
                {/* Front face */}
                <path d="M30 35 L60 20 L90 35 L90 65 L60 80 L30 65 Z" strokeWidth="1" />
                {/* Top face edges */}
                <path d="M60 20 L60 50" strokeWidth="0.8" />
                <path d="M30 35 L60 50" strokeWidth="0.8" />
                <path d="M90 35 L60 50" strokeWidth="0.8" />
                {/* Hidden back edges (dashed) */}
                <path d="M60 50 L60 80" strokeWidth="0.6" strokeDasharray="2 2" />
                {/* Accent dots */}
                <circle cx="60" cy="20" r="2.5" fill="#3ECF8E" stroke="none" />
                <circle cx="30" cy="35" r="2" fill="white" stroke="none" opacity="0.7" />
                <circle cx="90" cy="35" r="2" fill="white" stroke="none" opacity="0.7" />
                <circle cx="60" cy="80" r="2" fill="#A0A0A0" stroke="none" />
              </svg>

              {/* AI Provider logos text */}
              <div className="w-full space-y-1.5">
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#0d0e0d] border border-white/[0.07]">
                  {/* OpenAI icon approximation */}
                  <svg className="size-3.5 text-white opacity-80" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.032.067L9.73 19.95a4.5 4.5 0 0 1-6.13-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
                  </svg>
                  <span className="text-[12px] text-[#A0A0A0] font-medium">OpenAI</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#0d0e0d] border border-white/[0.07]">
                  <span className="text-[13px]">🤗</span>
                  <span className="text-[12px] text-[#A0A0A0] font-medium">Hugging Face</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── CARD 7: Data APIs ── */}
          <div className="rounded-2xl bg-[#161817] border border-white/[0.08] p-6 flex flex-col justify-between relative overflow-hidden min-h-[300px] hover:border-white/[0.14] transition-colors">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                {/* API / chart icon */}
                <svg className="size-4.5 text-white opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                </svg>
                <h3 className="text-[13px] font-semibold text-white" style={{ letterSpacing: "-0.01em" }}>Data APIs</h3>
              </div>
              <p className="text-[13px] text-[#A0A0A0] leading-relaxed">
                Instant ready-to-use <span className="text-white font-bold">REST APIs</span>.
              </p>
            </div>

            {/* Endpoint table */}
            <div className="mt-6 space-y-1 text-[11px]" style={{ fontFamily: "var(--font-supa-mono)" }}>
              {[
                { table: "countries", route: "/v1/countries" },
                { table: "continents", route: "/v1/continents" },
                { table: "cities", route: "/v1/cities" },
                { table: "states", route: "/v1/states" },
                { table: "country_code", route: "/v1/country_codes" },
                { table: "oceans", route: "/v1/oceans" },
              ].map((row) => (
                <div
                  key={row.table}
                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-[#0d0e0d] border border-white/[0.05]"
                >
                  <span className="text-[#666] flex items-center gap-1.5">
                    <svg className="size-3 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                    </svg>
                    {row.table}
                  </span>
                  <span className="text-[#3ECF8E] text-[10px]">{row.route}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer platform statement */}
        <div className="mt-14 text-center">
          <p className="text-sm text-[#A0A0A0]">
            <strong className="text-white font-semibold">Use one or all.</strong>{" "}
            Best of breed products. Integrated as a platform.
          </p>
        </div>

      </div>
    </section>
  );
}
