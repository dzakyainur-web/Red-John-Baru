"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function StudioFooter() {
  const [timeStr, setTimeStr] = useState("");
  const [year, setYear] = useState("2026");

  useEffect(() => {
    setYear(String(new Date().getFullYear()));
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          timeZone: "Asia/Jakarta",
        }) + " WIB"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="border-t border-white/10 bg-black pt-20 pb-12 relative z-10 font-[family-name:var(--font-geist-mono)]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
        {/* Giant brand lettering */}
        <div className="mb-16 select-none overflow-hidden">
          <div className="text-[clamp(3.5rem,13vw,12rem)] font-black uppercase tracking-tighter leading-none text-zinc-900 hover:text-zinc-800 transition-colors font-[family-name:var(--font-display)]">
            ORANGE HORSE
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-16 border-b border-white/10 text-xs text-zinc-400">
          <div>
            <div className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">
              ABOUT THE SYSTEM
            </div>
            <p className="leading-relaxed">
              Autonomous scam intelligence, forensic heuristics, and deception awareness engine designed for modern digital ecosystems.
            </p>
          </div>

          <div>
            <div className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">
              DIRECTORY
            </div>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  &bull; Message Inspector
                </Link>
              </li>
              <li>
                <Link href="/inspect" className="hover:text-white transition-colors">
                  &bull; Link Homoglyph Check
                </Link>
              </li>
              <li>
                <Link href="/berita" className="hover:text-white transition-colors">
                  &bull; Modus Trend Monitor
                </Link>
              </li>
              <li>
                <Link href="/learn" className="hover:text-white transition-colors">
                  &bull; Scam Education Modules
                </Link>
              </li>
              <li>
                <Link href="/act" className="hover:text-white transition-colors">
                  &bull; Emergency Action Playbook
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">
              TRANSPARENCY & ETHICS
            </div>
            <p className="leading-relaxed mb-3">
              Zero telemetry data storage. No private messages or phone numbers are ever recorded or sold.
            </p>
            <Link
              href="/tentang-keamanan"
              className="text-[#FF5533] underline underline-offset-4 hover:text-[#FF3815]"
            >
              Security & Data Architecture &rarr;
            </Link>
          </div>

          <div>
            <div className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">
              SYSTEM CLOCK & NODES
            </div>
            <div className="text-lg text-white font-bold mb-2">
              {timeStr || "12:00:00 WIB"}
            </div>
            <p className="text-[11px] text-zinc-500">
              COORDINATES: -6.2088° S, 106.8456° E<br />
              ENGINE: v2.4 HYBRID INFERENCE
            </p>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-wrap items-center justify-between gap-4 text-[11px] text-zinc-600">
          <div>
            &copy; {year} ORANGE HORSE &bull; GUARDIAN SCAM INTELLIGENCE. ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-4">
            <span>BUILT WITH PRECISION &amp; CRAFT</span>
            <span className="size-1 rounded-full bg-zinc-600" />
            <a href="#top" className="text-zinc-400 hover:text-white">
              BACK TO TOP &uarr;
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
