"use client";

import Link from "next/link";

export default function SupabaseHero() {
  return (
    <section className="relative pt-36 sm:pt-44 pb-20 px-4 sm:px-8 overflow-hidden text-center">
      {/* Unkey-style subtle multi-color mesh glows */}
      <div 
        className="pointer-events-none absolute -top-40 left-1/4 w-[500px] h-[400px] opacity-20 -z-10 blur-[140px] rounded-full"
        style={{
          background: "radial-gradient(circle, #38BDF8 0%, rgba(56, 189, 248, 0.2) 60%, transparent 80%)"
        }}
      />
      <div 
        className="pointer-events-none absolute -top-40 right-1/4 w-[500px] h-[400px] opacity-20 -z-10 blur-[140px] rounded-full"
        style={{
          background: "radial-gradient(circle, #A855F7 0%, rgba(168, 85, 247, 0.2) 60%, transparent 80%)"
        }}
      />

      <div className="max-w-[1000px] mx-auto w-full flex flex-col items-center relative z-10">
        {/* Top Badge ala Unkey: Gradient border & pulsing green dot */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 hover:border-[#38BDF8]/40 transition-all text-xs font-sans text-zinc-300 mb-8 backdrop-blur-md group">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-[#10B981]" />
          </span>
          <span className="text-zinc-400 font-mono text-[11px] tracking-wider uppercase">[ PLATFORM INTELIJEN SIBER ]</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-200 group-hover:text-white transition-colors">Deteksi Heuristik Mandiri</span>
        </div>

        {/* Unkey-style Radiant Gradient Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-black tracking-tight font-sans text-white leading-[1.08] max-w-4xl">
          Deteksi Rekayasa Sosial, <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-white via-[#38BDF8] to-[#A855F7] bg-clip-text text-transparent">
            Tangkal Penipuan Digital.
          </span>
        </h1>

        {/* Narrative Subtitle with subtle colored highlights */}
        <p className="mt-5 text-base sm:text-lg text-zinc-400 font-sans leading-relaxed max-w-2xl">
          Platform pertahanan terbuka untuk memetakan gelombang rekayasa sosial, sindikat{" "}
          <span className="text-[#38BDF8] font-medium">malware Android (.APK)</span>, quishing{" "}
          <span className="text-[#F59E0B] font-medium">QRIS palsu</span>, dan pencurian OTP di Indonesia secara waktu nyata dengan{" "}
          <span className="text-[#10B981] font-medium">100% privasi bebas telemetri</span>.
        </p>

        {/* Action Buttons Pair ala Unkey */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/pemindai"
            className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-white hover:bg-zinc-100 text-black font-semibold text-sm transition-all shadow-[0_0_25px_rgba(56,189,248,0.25)] hover:shadow-[0_0_35px_rgba(56,189,248,0.45)] hover:scale-[1.02] active:scale-[0.98]"
          >
            Buka Pemindai Pesan
          </Link>

          <a
            href="#modul"
            className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.12] hover:border-[#38BDF8]/40 font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98] backdrop-blur-md"
          >
            <span>Lihat Semua Modul</span>
            <span className="text-[#38BDF8]">&rarr;</span>
          </a>
        </div>

        {/* Coverage Strip — modus yang dipantau, bukan klaim afiliasi */}
        <div className="mt-16 sm:mt-20 pt-8 border-t border-white/[0.06] w-full flex flex-col items-center">
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-5">
            MODUS YANG DIPANTAU
          </span>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:gap-10 text-xs sm:text-sm font-semibold tracking-wider text-zinc-400 uppercase font-mono">
            <span className="hover:text-white transition-colors cursor-default">Phishing Link</span>
            <span className="text-zinc-700">•</span>
            <span className="hover:text-white transition-colors cursor-default">Malware APK</span>
            <span className="text-zinc-700">•</span>
            <span className="hover:text-white transition-colors cursor-default">Quishing QRIS</span>
            <span className="text-zinc-700">•</span>
            <span className="hover:text-white transition-colors cursor-default">Pencurian OTP</span>
            <span className="text-zinc-700">•</span>
            <span className="hover:text-white transition-colors cursor-default">Lowongan Palsu</span>
            <span className="text-zinc-700">•</span>
            <span className="hover:text-white transition-colors cursor-default">Pinjol Ilegal</span>
          </div>
        </div>
      </div>
    </section>
  );
}
