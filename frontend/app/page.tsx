"use client";

import Link from "next/link";
import AsciiHorseCanvas from "@/components/AsciiHorseCanvas";
import HeroKineticText from "@/components/HeroKineticText";
import ManifestoCard from "@/components/ManifestoCard";
import RedJohnGame from "@/components/RedJohnGame";
import SelectedWorks from "@/components/SelectedWorks";
import ThreatRadar from "@/components/ThreatRadar";
import StudioFooter from "@/components/StudioFooter";
import { useSound } from "@/components/SoundManager";

export default function HomePage() {
  const { playClick, playHover } = useSound();

  const scrollToGame = () => {
    playClick();
    const el = document.getElementById("game");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div id="top" className="min-h-screen bg-[#070707] text-white selection:bg-[#FF3815] selection:text-black">
      {/* =========================================================================
          HERO SECTION (Tampilan Pertama: Game Hook + Tombol Mulai Besar)
          ========================================================================= */}
      <section className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden px-4 sm:px-8 pt-28 pb-10">
        {/* Real-time interactive ASCII Horse Matrix Canvas */}
        <AsciiHorseCanvas interactive={true} />

        {/* Top/Center Area: Manifesto Block */}
        <div className="relative z-10 max-w-[1440px] mx-auto w-full pt-6 sm:pt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pointer-events-auto">
          {/* Spacer */}
          <div className="hidden lg:block lg:col-span-5" />

          {/* Center/Right Manifesto */}
          <div className="lg:col-span-7 flex justify-start lg:justify-center">
            <ManifestoCard />
          </div>
        </div>

        {/* Center/Callout Area: Big Hero Game CTA & Challenge Pitch */}
        <div className="relative z-10 max-w-[1440px] mx-auto w-full my-auto py-8 flex flex-col items-center text-center pointer-events-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF3815]/15 border border-[#FF3815]/40 text-xs font-[family-name:var(--font-geist-mono)] text-[#FF5533] font-bold mb-4 animate-pulse">
            <span className="size-2 rounded-full bg-[#FF3815]" />
            <span>DUEL INTELIJEN SIBER // TANTANG RED JOHN</span>
          </div>

          <h1 className="text-3xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white font-[family-name:var(--font-display)] max-w-4xl">
            SIAPKAH KAMU MENGHADAPI JEBAKAN <span className="text-[#FF3815]">RED JOHN</span>?
          </h1>

          <p className="mt-4 max-w-2xl text-xs sm:text-sm font-[family-name:var(--font-geist-mono)] text-zinc-300 leading-relaxed">
            Dalang penipuan digital Red John sedang menyebarkan rekayasa sosial, manipulasi OTP, dan malware APK. Kamu akan didampingi bot kuning <strong>Jane</strong> yang akan mengintervensi bila kamu salah mengambil langkah.
          </p>

          {/* Tombol MULAI Besar */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
            <button
              type="button"
              onClick={scrollToGame}
              onMouseEnter={playHover}
              aria-label="Mulai game duel Red John vs Jane"
              className="group relative px-10 sm:px-14 py-4 sm:py-5 rounded-full bg-[#FF3815] hover:bg-[#FF5533] text-black font-black text-base sm:text-xl font-[family-name:var(--font-geist-mono)] tracking-wider uppercase transition-all duration-300 shadow-[0_0_50px_rgba(255,56,21,0.6)] hover:shadow-[0_0_80px_rgba(255,56,21,0.9)] hover:scale-105 active:scale-95 flex items-center gap-3 cursor-pointer"
            >
              <span className="size-3 rounded-full bg-black animate-ping" />
              <span>MULAI PERMAINAN</span>
              <span className="text-2xl transition-transform duration-300 group-hover:translate-x-2">&rarr;</span>
            </button>

            <Link
              href="/pemindai"
              className="px-6 py-4 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 text-xs sm:text-sm font-[family-name:var(--font-geist-mono)] text-zinc-300 hover:text-white transition-all flex items-center gap-2"
            >
              <span>Atau Buka Pemindai Pesan</span>
              <span className="text-zinc-500">&rarr;</span>
            </Link>
          </div>

          <div className="mt-3 text-[11px] font-[family-name:var(--font-geist-mono)] text-zinc-500">
            10 Babak Cerita Berkelanjutan • Pilihan Ganda, Ya/Tidak &amp; Input Bebas • Umpan Balik Jane Bot
          </div>
        </div>

        {/* Bottom Area: Giant Brutalist Typography + Scroll Down Indicator */}
        <div className="relative z-10 max-w-[1440px] mx-auto w-full flex flex-col lg:flex-row items-end justify-between gap-8 pb-4 pointer-events-auto">
          {/* Left: Giant Orange Brutalist Display Typography */}
          <div className="w-full lg:w-auto -translate-y-4 sm:-translate-y-8 lg:-translate-y-12">
            <HeroKineticText />
          </div>

          {/* Bottom Right: Circular Scroll-down Button */}
          <div className="flex items-center gap-4 self-end mb-2">
            <button
              type="button"
              onClick={scrollToGame}
              aria-label="Gulir ke arena game"
              className="group flex size-14 items-center justify-center rounded-full bg-[#181818]/90 border border-white/15 backdrop-blur-md text-white transition-all duration-300 hover:scale-110 hover:border-[#FF3815] hover:bg-[#222] shadow-[0_0_20px_rgba(0,0,0,0.8)] cursor-pointer"
            >
              <svg
                className="size-6 transition-transform duration-300 group-hover:translate-y-1 text-white group-hover:text-[#FF3815]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ARENA GAME RED JOHN vs JANE (Langsung di Tampilan Utama)
          ========================================================================= */}
      <section id="game" className="relative z-10 py-20 px-4 sm:px-8 border-t border-white/10 bg-[#080808]">
        <div className="max-w-[1200px] mx-auto space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-[family-name:var(--font-geist-mono)] tracking-widest text-[#FF3815] uppercase font-bold">
                [ ARENA SIMULASI // RED JOHN vs JANE ]
              </span>
              <h2 className="mt-2 text-3xl sm:text-5xl font-black uppercase tracking-tight text-white font-[family-name:var(--font-display)]">
                ARENA DUEL KEPUTUSAN SIBER
              </h2>
            </div>
            <p className="max-w-md text-xs font-[family-name:var(--font-geist-mono)] text-zinc-400">
              Uji ketajaman intuisimu menghadapi 10 babak jebakan rekayasa sosial Red John. Jika kamu salah mengambil keputusan, bot Jane akan langsung mengintervensi untuk melindungimu dan menjelaskan triknya.
            </p>
          </div>

          {/* Embedded Full Interactive Game */}
          <RedJohnGame />
        </div>
      </section>

      {/* =========================================================================
          LIVE THREAT RADAR
          ========================================================================= */}
      <ThreatRadar />

      {/* =========================================================================
          QUICK LINK TO PEMINDAI ANOMALI
          ========================================================================= */}
      <section className="py-16 px-4 sm:px-8 border-t border-white/10 bg-[#0a0a0a] relative z-10">
        <div className="max-w-[1440px] mx-auto">
          <div className="rounded-2xl bg-[#111] border border-white/10 p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs font-[family-name:var(--font-geist-mono)] text-[#FF3815] uppercase tracking-wider font-bold">
                [ ALAT INVESTIGASI FORENSIK ]
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white uppercase font-[family-name:var(--font-display)]">
                DAPAT PESAN MENCURIGAKAN ASLI DI DUNIA NYATA?
              </h3>
              <p className="text-xs sm:text-sm font-[family-name:var(--font-geist-mono)] text-zinc-400 max-w-2xl">
                Buka <strong>Pemindai Anomali</strong> kami untuk memeriksa pesan SMS, WhatsApp, atau lowongan kerja dengan heuristik tanda bahaya dan machine learning lokal tanpa membocorkan privasimu.
              </p>
            </div>

            <Link
              href="/pemindai"
              className="shrink-0 px-8 py-3.5 rounded-full bg-white hover:bg-zinc-200 text-black font-extrabold text-xs font-[family-name:var(--font-geist-mono)] tracking-wider uppercase transition-all duration-200 hover:scale-105"
            >
              BUKA PEMINDAI PESAN &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SELECTED WORKS / MODULES
          ========================================================================= */}
      <SelectedWorks />

      {/* =========================================================================
          AGENCY STUDIO FOOTER
          ========================================================================= */}
      <StudioFooter />
    </div>
  );
}
