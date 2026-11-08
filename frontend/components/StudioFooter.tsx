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
    <footer className="border-t border-white/[0.06] bg-[#000000] pt-16 pb-12 relative z-10 font-sans">
      <div className="max-w-[1340px] mx-auto px-4 sm:px-8">
        {/* Giant brand lettering ala HeroUI footer */}
        <div className="mb-14 flex items-center gap-6 sm:gap-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/red-john-logo.png"
            alt=""
            width={215}
            height={301}
            className="h-28 sm:h-40 w-auto opacity-90 drop-shadow-[0_0_30px_rgba(255,0,0,0.35)]"
          />
          <div className="select-none overflow-hidden">
            <div className="text-[clamp(2.8rem,10vw,9rem)] font-black uppercase tracking-tighter leading-none text-white/[0.05] hover:text-white/[0.1] transition-colors font-[family-name:var(--font-display)]">
              RED JOHN
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/[0.06] text-xs text-zinc-400">
          <div>
            <div className="text-white font-bold mb-3 uppercase tracking-wider text-[11px] font-mono">
              TENTANG SISTEM
            </div>
            <p className="leading-relaxed">
              Intelijen penipuan mandiri, heuristik forensik, dan mesin pemantau manipulasi siber yang dirancang untuk ekosistem digital Indonesia modern.
            </p>
          </div>

          <div>
            <div className="text-white font-bold mb-3 uppercase tracking-wider text-[11px] font-mono">
              MODUL UTAMA
            </div>
            <ul className="space-y-2">
              <li>
                <Link href="/pemindai" className="hover:text-white transition-colors">
                  &bull; Pemindai Anomali Pesan (SMS &amp; WA)
                </Link>
              </li>
              <li>
                <Link href="/inspect" className="hover:text-white transition-colors">
                  &bull; Forensik Tautan &amp; Homoglyph
                </Link>
              </li>
              <li>
                <Link href="/berita" className="hover:text-white transition-colors">
                  &bull; Radar Feeds Berita Terkini
                </Link>
              </li>
              <li>
                <Link href="/#game" className="hover:text-white transition-colors">
                  &bull; Simulasi Kognitif: Red John vs Jane
                </Link>
              </li>
              <li>
                <Link href="/act" className="hover:text-white transition-colors">
                  &bull; Playbook Mitigasi Darurat
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-white font-bold mb-3 uppercase tracking-wider text-[11px] font-mono">
              TRANSPARANSI &amp; ETIKA
            </div>
            <p className="leading-relaxed mb-3">
              Tanpa penyimpanan telemetri data. Tidak ada pesan pribadi, URL sensitif, atau nomor kontak yang dikoleksi ke server pihak ketiga.
            </p>
            <Link
              href="/tentang-keamanan"
              className="text-white hover:text-zinc-300 transition-colors inline-flex items-center gap-1 font-semibold"
            >
              <span>Arsitektur Privasi Klien</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div>
            <div className="text-white font-bold mb-3 uppercase tracking-wider text-[11px] font-mono">
              STATUS SISTEM &amp; WAKTU
            </div>
            <div className="text-lg text-white font-bold mb-2 font-mono">
              {timeStr || "12:00:00 WIB"}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-300 mb-1 font-mono">
              <span className="size-2 rounded-full bg-white animate-pulse" />
              <span>SINKRONISASI AKTIF</span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              SIMPUL: JAKARTA (-6.2088° S, 106.8456° E)<br />
              ENGINE: HEURISTIK LOKAL
            </p>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-wrap items-center justify-between gap-4 text-[11px] text-zinc-500 font-sans">
          <div>
            &copy; {year} RED JOHN &bull; PLATFORM INTELIJEN SIBER INDONESIA. HAK CIPTA DILINDUNGI.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-zinc-400">BEBAS TELEMETRI &amp; PELACAKAN</span>
            <span className="size-1 rounded-full bg-zinc-600" />
            <a href="#top" className="text-zinc-400 hover:text-white transition-colors">
              KEMBALI KE ATAS &uarr;
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
