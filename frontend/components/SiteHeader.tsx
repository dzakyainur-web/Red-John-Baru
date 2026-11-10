"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSound } from "./SoundManager";
import UserDropdown from "./UserDropdown";

export default function SiteHeader() {
  const pathname = usePathname();
  const { soundEnabled, toggleSound, playClick, playHover } = useSound();
  const [menuOpen, setMenuOpen] = useState(false);

  const isHome = pathname === "/";

  // These pages render SupabaseNavbar themselves
  if (
    pathname === "/" ||
    pathname === "/pemindai" ||
    pathname === "/lapor-cepat" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/darurat" ||
    pathname.startsWith("/quiz") ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 h-16 ${pathname === "/berita" ? "bg-black/80 border-b border-white/[0.08]" : "bg-[#1a1a1a]/95 border-b border-white/[0.06]"} backdrop-blur-xl px-6 sm:px-8 transition-all`}>
      <div className="max-w-[1340px] mx-auto h-full flex items-center justify-between gap-8">
        {/* Left: Brand Logo + Nav Links ala HeroUI */}
        <div className="flex items-center gap-8 shrink-0">
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
            <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-red-500 group-hover:text-red-400 transition-colors">
              Red John
            </span>
          </Link>

          {/* Center Links ala HeroUI */}
          <nav className="hidden lg:flex items-center gap-1 text-[13px] text-zinc-400 font-sans font-medium">
            <Link
              href="/berita"
              onClick={playClick}
              className="px-3.5 py-2 rounded hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-1"
            >
              <span>Radar Berita</span>
            </Link>

            <Link
              href="/pemindai"
              onClick={playClick}
              className="px-3.5 py-2 rounded hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-1"
            >
              <span>Pemindai Pesan</span>
            </Link>

            <Link
              href="/lapor-cepat"
              onClick={playClick}
              className="px-3.5 py-2 rounded hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              Lapor cepat
            </Link>

            <Link
              href="/quiz"
              onClick={playClick}
              className="px-3.5 py-2 rounded hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              Simulasi Kognitif
            </Link>

            <Link
              href="/act"
              onClick={playClick}
              className="px-3.5 py-2 rounded hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              Playbook
            </Link>

            <Link
              href="/learn"
              onClick={playClick}
              className="px-3.5 py-2 rounded hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              Intelijen
            </Link>
          </nav>
        </div>

        {/* Right side ala HeroUI: Status Pill + White Pill Button */}
        <div className="flex items-center gap-4 shrink-0">
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

          {/* Discord icon button */}
          <button
            type="button"
            className="hidden sm:flex items-center justify-center size-9 rounded-full text-zinc-400 hover:text-[#5865F2] hover:bg-white/[0.08] transition-colors cursor-pointer"
            aria-label="Discord Community"
            title="Discord"
          >
            <svg className="size-[21px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
          </button>

          {/* User profile dropdown (Gambar 2): Bell + Cart (badge 2) + Divider + User Pill & Dropdown */}
          <UserDropdown />

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
        <div className="lg:hidden mt-2 mx-auto max-w-[1340px] rounded-2xl bg-[#1c1c1c]/98 border border-white/10 p-5 backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 shadow-2xl">
          <div className="flex flex-col gap-2">
            {[
              { href: "/berita", label: "Radar Berita" },
              { href: "/pemindai", label: "Pemindai Pesan" },
              { href: "/lapor-cepat", label: "Lapor cepat" },
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
