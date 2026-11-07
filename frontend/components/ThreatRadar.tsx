"use client";

import Link from "next/link";

const THREATS = [
  { modus: "APK KURIR / UNDANGAN", threat: "KRITIS", vector: "Malware Android (.apk)", icon: "⚠️" },
  { modus: "CS BANK TELEGRAM", threat: "TINGGI", vector: "Rekayasa Sosial / Pencurian OTP", icon: "🔴" },
  { modus: "PIG BUTCHERING", threat: "TINGGI", vector: "Kripto / Platform Bodong", icon: "⚡" },
  { modus: "LOWONGAN FREELANCE LIKE", threat: "WASPADA", vector: "Tugas Palsu / Ponzi Deposit", icon: "🛑" },
  { modus: "QUISHING (KODE QR)", threat: "WASPADA", vector: "Pencurian Kredensial", icon: "🔍" },
];

export default function ThreatRadar() {
  return (
    <section className="py-16 border-t border-white/10 bg-[#090909] relative z-10 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="relative flex size-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF3815] opacity-75" />
            <span className="relative inline-flex rounded-full size-2.5 bg-[#FF3815]" />
          </span>
          <span className="text-xs font-[family-name:var(--font-geist-mono)] tracking-widest text-zinc-300 uppercase font-bold">
            RADAR ANCAMAN // PANTAUAN MODUS AKTIF
          </span>
        </div>

        <Link
          href="/berita"
          className="text-xs font-[family-name:var(--font-geist-mono)] text-[#FF5533] hover:underline flex items-center gap-1"
        >
          <span>LIHAT SEMUA RADAR</span>
          <span>&rarr;</span>
        </Link>
      </div>

      {/* Marquee ticker */}
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar max-w-[1440px] mx-auto px-4 sm:px-8">
        {THREATS.map((t, idx) => (
          <div
            key={idx}
            className="flex-none min-w-[280px] sm:min-w-[320px] rounded-xl bg-black/50 border border-white/10 p-4 font-[family-name:var(--font-geist-mono)] hover:border-white/20 transition-all"
          >
            <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-2">
              <span>{t.icon} TINGKAT: {t.threat}</span>
              <span className="text-[#FF3815]">DIPANTAU</span>
            </div>
            <div className="text-sm font-bold text-white uppercase tracking-tight mb-1">
              {t.modus}
            </div>
            <div className="text-xs text-zinc-400">
              {t.vector}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
