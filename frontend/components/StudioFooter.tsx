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
              TENTANG SISTEM
            </div>
            <p className="leading-relaxed">
              Intelijen penipuan mandiri, heuristik forensik, dan mesin pemantau manipulasi siber yang dirancang untuk ekosistem digital modern.
            </p>
          </div>

          <div>
            <div className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">
              DIREKTORI
            </div>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  &bull; Game Red John vs Jane
                </Link>
              </li>
              <li>
                <Link href="/pemindai" className="hover:text-white transition-colors">
                  &bull; Pemindai Anomali Pesan
                </Link>
              </li>
              <li>
                <Link href="/inspect" className="hover:text-white transition-colors">
                  &bull; Forensik Tautan &amp; Homoglyph
                </Link>
              </li>
              <li>
                <Link href="/berita" className="hover:text-white transition-colors">
                  &bull; Pemantau Tren Modus
                </Link>
              </li>
              <li>
                <Link href="/learn" className="hover:text-white transition-colors">
                  &bull; Lab Pembelajaran &amp; Skenario
                </Link>
              </li>
              <li>
                <Link href="/act" className="hover:text-white transition-colors">
                  &bull; Buku Panduan Darurat
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">
              TRANSPARANSI &amp; ETIKA
            </div>
            <p className="leading-relaxed mb-3">
              Tanpa penyimpanan telemetri data. Tidak ada pesan pribadi atau nomor telepon yang disimpan atau diperjualbelikan.
            </p>
            <Link
              href="/tentang-keamanan"
              className="text-[#FF5533] underline underline-offset-4 hover:text-[#FF3815]"
            >
              Arsitektur Keamanan &amp; Data &rarr;
            </Link>
          </div>

          <div>
            <div className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">
              WAKTU SISTEM &amp; SIMPUL
            </div>
            <div className="text-lg text-white font-bold mb-2">
              {timeStr || "12:00:00 WIB"}
            </div>
            <p className="text-[11px] text-zinc-500">
              KOORDINAT: -6.2088° S, 106.8456° E<br />
              ENGINE: INFERENSI HIBRIDA v2.4
            </p>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-wrap items-center justify-between gap-4 text-[11px] text-zinc-600">
          <div>
            &copy; {year} ORANGE HORSE &bull; INTELIJEN KEAMANAN GUARDIAN. HAK CIPTA DILINDUNGI.
          </div>
          <div className="flex items-center gap-4">
            <span>DIRANCANG DENGAN PRESISI &amp; KEHATI-HATIAN</span>
            <span className="size-1 rounded-full bg-zinc-600" />
            <a href="#top" className="text-zinc-400 hover:text-white">
              KEMBALI KE ATAS &uarr;
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
