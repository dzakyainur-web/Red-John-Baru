"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSound } from "./SoundManager";

export default function SiteHeader() {
  const pathname = usePathname();
  const { soundEnabled, toggleSound, playClick, playHover } = useSound();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "OVERVIEW" },
    { href: "/#engine", label: "SCANNER" },
    { href: "/berita", label: "RADAR" },
    { href: "/inspect", label: "INSPECT" },
    { href: "/learn", label: "INTEL" },
    { href: "/act", label: "PLAYBOOK" },
    { href: "/login", label: "MASUK" },
  ];

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-5 transition-all">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between">
        {/* Left: Circular Arrow Back/Home Button */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            onClick={playClick}
            onMouseEnter={playHover}
            aria-label="Kembali ke beranda"
            className="group relative flex size-11 items-center justify-center rounded-full bg-[#181818]/80 border border-white/10 backdrop-blur-md text-white transition-all duration-200 hover:scale-105 hover:border-white/30 hover:bg-[#222]"
          >
            <svg
              className="size-5 transition-transform duration-200 group-hover:-translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </Link>

          {/* Quick status pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm text-[11px] font-[family-name:var(--font-geist-mono)] text-zinc-400">
            <span className="size-1.5 rounded-full bg-[#FF3815] animate-ping" />
            <span>CORE ACTIVE</span>
          </div>
        </div>

        {/* Center: Brand Typography */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          <Link
            href="/"
            onClick={playClick}
            className="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-light tracking-wider text-white hover:opacity-80 transition-opacity flex items-center"
          >
            <span>Orange Horse</span>
            <sup className="text-xs ml-0.5 font-sans font-normal text-zinc-400">&reg;</sup>
          </Link>
        </div>

        {/* Right: Sound Toggle + Menu */}
        <div className="flex items-center gap-3">
          {/* Sound Synthesizer Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            onMouseEnter={playHover}
            className={`hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-[family-name:var(--font-geist-mono)] transition-all ${
              soundEnabled
                ? "bg-[#FF3815]/15 border-[#FF3815]/40 text-[#FF5533]"
                : "bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
            }`}
            title={soundEnabled ? "Mute audio" : "Enable futuristic sound FX"}
          >
            <span className="size-1.5 rounded-full bg-current" />
            <span>SOUND: {soundEnabled ? "ON" : "OFF"}</span>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#141414]/80 border border-white/10 backdrop-blur-md px-2 py-1 rounded-full">
            {navLinks.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={playClick}
                  onMouseEnter={playHover}
                  className={`px-3 py-1 rounded-full text-xs font-[family-name:var(--font-geist-mono)] font-medium tracking-wider transition-colors ${
                    active
                      ? "bg-white text-black font-semibold"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => {
              playClick();
              setMenuOpen(!menuOpen);
            }}
            aria-label="Toggle navigation menu"
            className="lg:hidden flex size-11 items-center justify-center rounded-full bg-[#181818]/80 border border-white/10 backdrop-blur-md text-white hover:border-white/30"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="lg:hidden mt-3 mx-auto max-w-[1440px] rounded-2xl bg-[#0e0e0e]/95 border border-white/10 p-5 backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col gap-2">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  playClick();
                  setMenuOpen(false);
                }}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-[family-name:var(--font-geist-mono)] text-zinc-300 hover:bg-white/5 hover:text-white"
              >
                <span>{item.label}</span>
                <span className="text-zinc-600">&rarr;</span>
              </Link>
            ))}

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-[family-name:var(--font-geist-mono)] text-zinc-500">AUDIO SYNTH</span>
              <button
                type="button"
                onClick={toggleSound}
                className="text-xs font-[family-name:var(--font-geist-mono)] text-[#FF5533]"
              >
                TOGGLE: {soundEnabled ? "ON" : "OFF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
