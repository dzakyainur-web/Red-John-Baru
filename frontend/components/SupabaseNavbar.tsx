"use client";

import Link from "next/link";
import { useState } from "react";

// Supabase exact navbar clone
// Ref: supabase.com landing page

export default function SupabaseNavbar() {
  const [productOpen, setProductOpen] = useState(false);
  const [devOpen, setDevOpen] = useState(false);
  const [solOpen, setSolOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0c0d0d]/95 backdrop-blur-md border-b border-white/[0.06]">
      <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between gap-6">

        {/* LEFT: Logo */}
        <div className="flex items-center gap-8 shrink-0">
          <Link href="/" className="flex items-center gap-2 group" aria-label="Red John Home">
            {/* Supabase-style lightning bolt icon */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 109 113"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9372L63.7076 110.284Z"
                fill="#3ECF8E"
              />
              <path
                d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9372L63.7076 110.284Z"
                fill="url(#paint0_linear)"
                fillOpacity="0.2"
              />
              <path
                d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4177L45.317 2.07103Z"
                fill="#3ECF8E"
              />
              <defs>
                <linearGradient id="paint0_linear" x1="53.9738" y1="40.0627" x2="94.1635" y2="66.2458" gradientUnits="userSpaceOnUse">
                  <stop stopColor="white" />
                  <stop offset="1" stopColor="white" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-[15px] font-semibold text-white tracking-[-0.02em]" style={{ fontFamily: "var(--font-supa-heading)" }}>
              Red John
            </span>
          </Link>

          {/* CENTER NAV LINKS */}
          <nav className="hidden lg:flex items-center gap-1 text-[13px] text-[#A0A0A0]" style={{ fontFamily: "var(--font-supa-body)", fontWeight: 400 }}>
            {/* Product dropdown */}
            <div className="relative">
              <button
                onClick={() => { setProductOpen(!productOpen); setDevOpen(false); setSolOpen(false); }}
                className="flex items-center gap-1 px-3 py-1.5 rounded hover:text-white hover:bg-white/[0.06] transition-colors font-[450]"
              >
                Product
                <svg className="size-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                </svg>
              </button>
              {productOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 rounded-lg bg-[#161817] border border-white/[0.1] shadow-2xl py-1 z-50">
                  {[
                    { label: "Database", href: "/pemindai" },
                    { label: "Authentication", href: "/pemindai" },
                    { label: "Edge Functions", href: "/inspect" },
                    { label: "Realtime", href: "/berita" },
                    { label: "Storage", href: "/" },
                    { label: "Vector", href: "/" },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setProductOpen(false)}
                      className="block px-4 py-2 text-[13px] text-[#A0A0A0] hover:text-white hover:bg-white/[0.05] transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Developers dropdown */}
            <div className="relative">
              <button
                onClick={() => { setDevOpen(!devOpen); setProductOpen(false); setSolOpen(false); }}
                className="flex items-center gap-1 px-3 py-1.5 rounded hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                Developers
                <svg className="size-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                </svg>
              </button>
              {devOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 rounded-lg bg-[#161817] border border-white/[0.1] shadow-2xl py-1 z-50">
                  {[
                    { label: "Docs", href: "/learn" },
                    { label: "API Reference", href: "/dev" },
                    { label: "Status", href: "/" },
                    { label: "GitHub", href: "/" },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setDevOpen(false)}
                      className="block px-4 py-2 text-[13px] text-[#A0A0A0] hover:text-white hover:bg-white/[0.05] transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Solutions dropdown */}
            <div className="relative">
              <button
                onClick={() => { setSolOpen(!solOpen); setProductOpen(false); setDevOpen(false); }}
                className="flex items-center gap-1 px-3 py-1.5 rounded hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                Solutions
                <svg className="size-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                </svg>
              </button>
              {solOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 rounded-lg bg-[#161817] border border-white/[0.1] shadow-2xl py-1 z-50">
                  {[
                    { label: "Startups", href: "/" },
                    { label: "Enterprise", href: "/" },
                    { label: "Healthcare", href: "/" },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setSolOpen(false)}
                      className="block px-4 py-2 text-[13px] text-[#A0A0A0] hover:text-white hover:bg-white/[0.05] transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/tentang-keamanan" className="px-3 py-1.5 rounded hover:text-white hover:bg-white/[0.06] transition-colors">
              Pricing
            </Link>
            <Link href="/learn" className="px-3 py-1.5 rounded hover:text-white hover:bg-white/[0.06] transition-colors">
              Docs
            </Link>
            <Link href="/berita" className="px-3 py-1.5 rounded hover:text-white hover:bg-white/[0.06] transition-colors">
              Blog
            </Link>
          </nav>
        </div>

        {/* RIGHT: GitHub counter + Dashboard + Globe avatar */}
        <div className="flex items-center gap-3 shrink-0">
          {/* GitHub stars counter */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 text-[13px] text-[#A0A0A0] hover:text-white transition-colors"
            aria-label="GitHub Stars"
          >
            {/* GitHub icon */}
            <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span className="font-medium text-[13px]" style={{ fontFamily: "var(--font-supa-body)" }}>114.7K</span>
          </a>

          {/* Dashboard button — Supabase style: outline pill */}
          <Link
            href="/admin"
            className="px-3.5 py-1.5 rounded-md border border-white/10 bg-[#161817] text-white text-[13px] font-medium hover:border-white/20 hover:bg-white/[0.05] transition-all"
          >
            Dashboard
          </Link>

          {/* Globe / avatar icon */}
          <button
            type="button"
            aria-label="Language / region"
            className="hidden sm:flex size-7 items-center justify-center rounded-full bg-[#161817] border border-white/10 text-[#A0A0A0] hover:text-white hover:bg-white/[0.12] transition-all"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
          </button>

          {/* Mobile menu button */}
          <button
            type="button"
            aria-label="Menu"
            className="lg:hidden flex size-8 items-center justify-center rounded-full bg-white/[0.06] border border-white/[0.1] text-white hover:border-white/20"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Click-outside overlay */}
      {(productOpen || devOpen || solOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setProductOpen(false); setDevOpen(false); setSolOpen(false); }}
        />
      )}
    </header>
  );
}
