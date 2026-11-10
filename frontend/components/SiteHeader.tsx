"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSound } from "./SoundManager";

export default function SiteHeader() {
  const pathname = usePathname();
  const { soundEnabled, toggleSound, playClick, playHover } = useSound();
  const [menuOpen, setMenuOpen] = useState(false);

  const isHome = pathname === "/";

  // These pages render SupabaseNavbar themselves
  if (pathname === "/" || pathname === "/login" || pathname === "/register" || pathname === "/quiz") {
    return null;
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 ${pathname === "/berita" ? "bg-black/80 border-b border-white/[0.08]" : "bg-[#1a1a1a]/95 border-b border-white/[0.06]"} backdrop-blur-xl px-4 sm:px-8 py-3.5 transition-all`}>
      <div className="max-w-[1340px] mx-auto flex items-center justify-between gap-6">
        {/* Left: Brand Logo + Nav Links ala HeroUI */}
        <div className="flex items-center gap-10 shrink-0">
          {!isHome && (
            <Link
              href="/"
              onClick={playClick}
              onMouseEnter={playHover}
              aria-label="Kembali ke beranda"
              className="group flex size-8 items-center justify-center rounded-full bg-white/[0.05] border border-white/10 text-zinc-400 transition-all hover:border-white/30 hover:text-white hover:bg-white/10"
              title="Kembali ke beranda"
            >
              <svg
                className="size-4 transition-transform group-hover:-translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </Link>
          )}

          {/* HeroUI-style clean Logo */}
          <Link
            href="/"
            onClick={playClick}
            className="flex items-center gap-2.5 group"
          >
            <Image
              src="/red-john-logo.png"
              alt=""
              width={215}
              height={301}
              priority
              className="h-7 w-auto drop-shadow-[0_0_12px_rgba(255,0,0,0.45)]"
            />
            <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-white group-hover:text-zinc-200 transition-colors">
              Red John
            </span>
          </Link>

          {/* Center Links ala HeroUI */}
          <nav className="hidden lg:flex items-center gap-7 text-[13px] text-zinc-400 font-sans font-medium">
            <Link
              href="/berita"
              onClick={playClick}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <span>Radar Berita</span>
            </Link>

            <Link
              href="/pemindai"
              onClick={playClick}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <span>Pemindai Pesan</span>
            </Link>

            <Link
              href="/inspect"
              onClick={playClick}
              className="hover:text-white transition-colors"
            >
              Inspeksi Tautan
            </Link>

            <Link
              href="/quiz"
              onClick={playClick}
              className="hover:text-white transition-colors"
            >
              Simulasi Kognitif
            </Link>

            <Link
              href="/act"
              onClick={playClick}
              className="hover:text-white transition-colors"
            >
              Playbook
            </Link>

            <Link
              href="/learn"
              onClick={playClick}
              className="hover:text-white transition-colors"
            >
              Intelijen
            </Link>
          </nav>
        </div>

        {/* Right side ala HeroUI: Status Pill + White Pill Button */}
        <div className="flex items-center gap-3.5 shrink-0">
          {/* Status Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-sans text-zinc-300">
            <span className="size-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="font-medium text-xs">Heuristik Lokal</span>
          </div>

          {/* Sound Toggle Pill */}
          <button
            type="button"
            onClick={toggleSound}
            onMouseEnter={playHover}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-[family-name:var(--font-geist-mono)] transition-all ${
              soundEnabled
                ? "bg-white/[0.1] border-white/30 text-white"
                : "bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20"
            }`}
            title={soundEnabled ? "Matikan audio" : "Aktifkan efek audio"}
          >
            <span className={`size-1.5 rounded-full ${soundEnabled ? "bg-white animate-pulse" : "bg-zinc-600"}`} />
            <span>Audio {soundEnabled ? "ON" : "OFF"}</span>
          </button>

          {/* HeroUI Solid White Pill "Get Started / Dashboard" */}
          <Link
            href="/admin"
            onClick={playClick}
            className="px-4 py-1.5 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-sans transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98]"
          >
            Dashboard
          </Link>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => {
              playClick();
              setMenuOpen(!menuOpen);
            }}
            aria-label="Buka/tutup menu navigasi"
            className="lg:hidden flex size-8 items-center justify-center rounded-full bg-white/[0.06] border border-white/10 text-white hover:border-white/20"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
        <div className="lg:hidden mt-3 mx-auto max-w-[1340px] rounded-2xl bg-[#1c1c1c]/98 border border-white/10 p-5 backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 shadow-2xl">
          <div className="flex flex-col gap-2">
            {[
              { href: "/berita", label: "Radar Berita" },
              { href: "/pemindai", label: "Pemindai Pesan" },
              { href: "/inspect", label: "Inspeksi Tautan" },
              { href: "/quiz", label: "Simulasi Kognitif" },
              { href: "/act", label: "Playbook" },
              { href: "/learn", label: "Intelijen" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  playClick();
                  setMenuOpen(false);
                }}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg text-sm text-zinc-300 hover:bg-white/[0.06] hover:text-white"
              >
                <span>{item.label}</span>
                <span className="text-zinc-500">&rarr;</span>
              </Link>
            ))}

            <div className="pt-3 mt-1 border-t border-white/10 flex items-center justify-between">
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-full bg-white text-black font-semibold text-xs shadow-lg"
              >
                Buka Dashboard &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
