"use client";

import Link from "next/link";
import AsciiHorseCanvas from "@/components/AsciiHorseCanvas";
import HeroKineticText from "@/components/HeroKineticText";
import ManifestoCard from "@/components/ManifestoCard";
import ScamTerminal from "@/components/ScamTerminal";
import SelectedWorks from "@/components/SelectedWorks";
import ThreatRadar from "@/components/ThreatRadar";
import StudioFooter from "@/components/StudioFooter";

export default function HomePage() {
  const scrollToEngine = () => {
    const el = document.getElementById("engine");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div id="top" className="min-h-screen bg-[#070707] text-white selection:bg-[#FF3815] selection:text-black">
      {/* =========================================================================
          HERO SECTION (Matches exact visual from https://motionsites.ai/?prompt=orange-horse)
          ========================================================================= */}
      <section className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden px-4 sm:px-8 pt-28 pb-10">
        {/* Real-time interactive ASCII Horse Matrix Canvas */}
        <AsciiHorseCanvas interactive={true} />

        {/* Top/Center Area: Manifesto Block */}
        <div className="relative z-10 max-w-[1440px] mx-auto w-full pt-8 sm:pt-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pointer-events-auto">
          {/* Spacer */}
          <div className="hidden lg:block lg:col-span-5" />

          {/* Center/Right Manifesto */}
          <div className="lg:col-span-7 flex justify-start lg:justify-center">
            <ManifestoCard />
          </div>
        </div>

        {/* Bottom Area: Giant Brutalist Typography + Scroll Down Button */}
        <div className="relative z-10 max-w-[1440px] mx-auto w-full flex flex-col lg:flex-row items-end justify-between gap-8 pb-4 pointer-events-auto">
          {/* Left: Giant Orange Brutalist Display Typography */}
          <div className="w-full lg:w-auto">
            <HeroKineticText />
          </div>

          {/* Bottom Right: Circular Scroll-down Button */}
          <div className="flex items-center gap-4 self-end">
            <button
              type="button"
              onClick={scrollToEngine}
              aria-label="Scroll ke live scanner"
              className="group flex size-14 items-center justify-center rounded-full bg-[#181818]/90 border border-white/15 backdrop-blur-md text-white transition-all duration-300 hover:scale-110 hover:border-[#FF3815] hover:bg-[#222] shadow-[0_0_20px_rgba(0,0,0,0.8)]"
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
          LIVE SCAM INTELLIGENCE SCANNER SECTION ("THE ENGINE")
          ========================================================================= */}
      <section id="engine" className="relative z-10 py-24 px-4 sm:px-8 border-t border-white/10 bg-[#080808]">
        <div className="max-w-[1100px] mx-auto space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-[family-name:var(--font-geist-mono)] tracking-widest text-[#FF3815] uppercase font-bold">
                [ SCANNER CORE // REALTIME INFERENCE ]
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white font-[family-name:var(--font-display)]">
                DETEKSI ANOMALI PESAN MENCURIGAKAN
              </h2>
            </div>
            <p className="max-w-md text-xs font-[family-name:var(--font-geist-mono)] text-zinc-400">
              Tempel pesan teks, SMS, lowongan freelance, atau instruksi mencurigakan. Sistem mendeteksi urgensi buatan, nomor rekening mentor, manipulasi OTP, dan APK berbahaya.
            </p>
          </div>

          <ScamTerminal />
        </div>
      </section>

      {/* =========================================================================
          LIVE THREAT RADAR
          ========================================================================= */}
      <ThreatRadar />

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
