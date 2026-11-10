"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import UserDropdown from "./UserDropdown";

// Supabase exact navbar clone
// Ref: supabase.com landing page

export const NAV_LINKS = [
  { href: "/pemindai", label: "Pemindai Pesan" },
  { href: "/lapor-cepat", label: "Lapor Cepat" },
  { href: "/quiz", label: "Simulasi Kognitif" },
  { href: "/berita", label: "Radar Berita" },
  { href: "/act", label: "Playbook" },
  { href: "/learn", label: "Intelijen" },
  { href: "/tentang-keamanan", label: "Transparansi" },
];

export default function SupabaseNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0c0d0d]/95 backdrop-blur-md border-b border-white/[0.06]">
      <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between gap-6">

        {/* LEFT: Logo */}
        <div className="flex items-center gap-8 shrink-0">
          <Link href="/" className="flex items-center gap-2 group" aria-label="Red John Home">
            {/* Red John logo */}
            <Image
              src="/red-john-logo.png"
              alt=""
              width={215}
              height={301}
              priority
              className="h-6 w-auto drop-shadow-[0_0_10px_rgba(255,0,0,0.45)]"
            />
            <span className="text-[15px] font-semibold text-red-500 tracking-[-0.02em]" style={{ fontFamily: "var(--font-supa-heading)" }}>
              Red John
            </span>
          </Link>

          {/* CENTER NAV LINKS */}
          <nav className="hidden lg:flex items-center gap-1 text-[13px] text-[#A0A0A0]" style={{ fontFamily: "var(--font-supa-body)", fontWeight: 400 }}>
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 rounded hover:text-white hover:bg-white/[0.06] transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* RIGHT: GitHub counter + Dashboard + Globe avatar */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Discord icon button */}
          <button
            type="button"
            className="flex items-center justify-center size-9 rounded-full text-[#A0A0A0] hover:text-[#5865F2] hover:bg-white/[0.08] transition-colors cursor-pointer"
            aria-label="Discord Community"
            title="Discord"
          >
            {/* Discord icon */}
            <svg className="size-[21px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
          </button>

          {/* GitHub icon button */}
          <button
            type="button"
            className="flex items-center justify-center size-9 rounded-full text-[#A0A0A0] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer mr-2"
            aria-label="GitHub"
            title="GitHub"
          >
            {/* GitHub icon */}
            <svg className="size-[21px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </button>

          {/* User profile dropdown: Pill & Dropdown (tanpa keranjang & notifikasi) */}
          <UserDropdown showNotifications={false} showCart={false} />

          {/* Mobile menu button */}
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex size-8 items-center justify-center rounded-full bg-white/[0.06] border border-white/[0.1] text-white hover:border-white/20 transition-colors"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden mx-4 mt-2 mb-4 rounded-2xl bg-[#161817] border border-white/10 p-5 backdrop-blur-2xl shadow-2xl animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col gap-2">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg text-sm text-[#A0A0A0] hover:bg-white/[0.06] hover:text-white transition-colors"
              >
                <span>{item.label}</span>
                <span className="text-red-500">&rarr;</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Click-outside overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </header>
  );
}
