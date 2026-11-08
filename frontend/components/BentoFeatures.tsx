"use client";

import Link from "next/link";

export default function BentoFeatures() {
  return (
    <section id="modul" className="pb-24 px-4 sm:px-8 bg-[#000000]">
      <div className="max-w-[1340px] mx-auto">
        {/* Section Title ala Unkey */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs text-zinc-300 font-mono uppercase tracking-wider mb-3">
            <span className="size-1.5 rounded-full bg-[#38BDF8]" />
            Infrastruktur Intelijen Terpadu
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-sans">
            Modular. Presisi. Tanpa Telemetri.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400 font-sans">
            Setiap instrumen dirancang independen dengan inferensi mandiri untuk memverifikasi ancaman siber secara instan.
          </p>
        </div>

        {/* =========================================================================
            ROW 1: 3 LARGE CARDS (Unkey Style with purposeful color accents)
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          {/* Card 1: Radar Berita (Emerald Accent) */}
          <div className="rounded-3xl bg-[#0C0C0E] border border-white/[0.08] hover:border-[#10B981]/40 p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden min-h-[360px] group transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.7)]">
            {/* Subtle Top Ambient Glow */}
            <div className="absolute -top-16 -right-16 size-48 rounded-full bg-[#10B981]/10 blur-2xl pointer-events-none group-hover:bg-[#10B981]/15 transition-all" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4 text-white">
                <div className="size-10 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/25 flex items-center justify-center text-[#10B981] group-hover:scale-105 transition-transform">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7c0-2-1.5-3-3.5-3h-9C5.5 4 4 5 4 7zm0 5c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3M4 7c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-sans">
                    Radar Berita &amp; Modus
                  </h3>
                  <span className="text-[11px] font-mono text-[#10B981] uppercase tracking-wider">Live Feeds RSS</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed max-w-[280px]">
                Kurasi otomatis ratusan berita penipuan perbankan, malware APK, dan kebocoran data di Indonesia yang disinkronisasi setiap 6 jam.
              </p>
            </div>

            {/* Bottom-left checkmarks + Right-side wireframe */}
            <div className="mt-8 flex items-end justify-between relative z-10">
              <ul className="space-y-2 text-xs text-zinc-300 font-sans">
                <li className="flex items-center gap-2">
                  <span className="text-[#10B981] font-bold">✓</span>
                  <span>Sinkronisasi Tiap 6 Jam</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#10B981] font-bold">✓</span>
                  <span>Kurasi Media Kredibel</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#10B981] font-bold">✓</span>
                  <span>Deteksi Tren Anomali</span>
                </li>
              </ul>
            </div>

            {/* Blueprint Wireframe Graphic with emerald ping */}
            <div className="absolute right-1 -bottom-2 w-48 h-48 pointer-events-none opacity-30 group-hover:opacity-50 transition-opacity">
              <svg viewBox="0 0 200 200" fill="none" className="w-full h-full stroke-zinc-500">
                <circle cx="100" cy="100" r="80" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="100" cy="100" r="55" strokeWidth="1" />
                <circle cx="100" cy="100" r="30" strokeWidth="1" strokeDasharray="2 2" />
                <path d="M100 20 V180 M20 100 H180" strokeWidth="0.8" />
                <circle cx="100" cy="100" r="4" fill="#10B981" className="animate-pulse" />
              </svg>
            </div>
          </div>

          {/* Card 2: Pemindai Pesan & SMS (Amber / Flame Accent) */}
          <div className="rounded-3xl bg-[#0C0C0E] border border-white/[0.08] hover:border-[#F59E0B]/40 p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden min-h-[360px] group transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.7)]">
            {/* Subtle Top Ambient Glow */}
            <div className="absolute -top-16 -right-16 size-48 rounded-full bg-[#F59E0B]/10 blur-2xl pointer-events-none group-hover:bg-[#F59E0B]/15 transition-all" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4 text-white">
                <div className="size-10 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/25 flex items-center justify-center text-[#F59E0B] group-hover:scale-105 transition-transform">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-sans">
                    Pemindai Pesan &amp; SMS
                  </h3>
                  <span className="text-[11px] font-mono text-[#F59E0B] uppercase tracking-wider">Heuristik NLP</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed">
                Deteksi rekayasa sosial, tawaran kerja freelance bodong, dan kurir paket palsu lewat analisis aturan lokal tanpa kirim data ke server.
              </p>
            </div>

            {/* Mock User/Email Pills with Amber Warnings */}
            <div className="mt-8 space-y-2 relative z-10">
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-zinc-300 truncate">
                  undangan_nikah.apk
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-zinc-300 truncate">
                  otp-bca882@gmail.com
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-zinc-300 truncate">
                  komisi_freelance.link
                </div>
                <div className="p-2.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] truncate flex items-center justify-between font-semibold">
                  <span>[APK MALWARE]</span>
                  <span className="size-2 rounded-full bg-[#F59E0B] animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Forensik Tautan (Electric Cyan Accent) */}
          <div className="rounded-3xl bg-[#0C0C0E] border border-white/[0.08] hover:border-[#38BDF8]/40 p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden min-h-[360px] group transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.7)]">
            {/* Subtle Top Ambient Glow */}
            <div className="absolute -top-16 -right-16 size-48 rounded-full bg-[#38BDF8]/10 blur-2xl pointer-events-none group-hover:bg-[#38BDF8]/15 transition-all" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4 text-white">
                <div className="size-10 rounded-2xl bg-[#38BDF8]/10 border border-[#38BDF8]/25 flex items-center justify-center text-[#38BDF8] group-hover:scale-105 transition-transform">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-sans">
                    Forensik Tautan
                  </h3>
                  <span className="text-[11px] font-mono text-[#38BDF8] uppercase tracking-wider">Homoglyph &amp; Punycode</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed">
                Bedah URL mencurigakan tanpa deployment untuk membongkar domain bank tiruan dan aksara Punycode tersembunyi.
              </p>
            </div>

            {/* Terminal Pill + 3D Wireframe Globe with Cyan Glow */}
            <div className="mt-6 space-y-4 relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-xs font-mono text-zinc-200">
                <span className="text-[#38BDF8]">$</span>
                <span>inspect</span>
                <span className="text-[#38BDF8]/90">--url bca-id.com</span>
              </div>

              {/* 3D Wireframe Globe Sphere */}
              <div className="h-28 w-full flex items-center justify-center relative overflow-hidden">
                <svg viewBox="0 0 240 120" className="w-full h-full stroke-zinc-600/50">
                  <ellipse cx="120" cy="110" rx="100" ry="80" strokeWidth="1" fill="none" />
                  <ellipse cx="120" cy="110" rx="70" ry="55" strokeWidth="0.8" fill="none" />
                  <ellipse cx="120" cy="110" rx="40" ry="30" strokeWidth="0.8" fill="none" />
                  <path d="M20 110 Q120 40 220 110" strokeWidth="1" fill="none" />
                  <path d="M40 110 Q120 70 200 110" strokeWidth="0.8" fill="none" />
                  <circle cx="120" cy="40" r="3" fill="#38BDF8" className="animate-pulse" />
                  <circle cx="80" cy="75" r="2.5" fill="#FFFFFF" />
                  <circle cx="160" cy="80" r="2.5" fill="#38BDF8" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            ROW 2: 4 COMPACT CARDS (Unkey Style with Violet/Emerald/Amber Accents)
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 4: Simulasi Red John (Violet Accent) */}
          <div className="rounded-3xl bg-[#0C0C0E] border border-white/[0.08] hover:border-[#A855F7]/40 p-6 flex flex-col justify-between relative overflow-hidden min-h-[290px] group transition-all duration-300">
            <div>
              <div className="flex items-center gap-2.5 mb-2.5 text-white">
                <div className="size-8 rounded-xl bg-[#A855F7]/10 border border-[#A855F7]/25 flex items-center justify-center text-[#A855F7]">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-white font-sans">
                  Simulasi Kognitif
                </h4>
              </div>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Hadapi 10 skenario manipulasi psikologis Red John didampingi bot Jane.
              </p>
            </div>

            {/* Matrix Nodes Grid in Purple Glow */}
            <div className="mt-6 grid grid-cols-4 gap-2 pt-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-[#A855F7]/40 flex items-center justify-center text-zinc-500 group-hover:text-[#A855F7] transition-colors">
                  <span className="text-[11px] font-mono">0{i+1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 5: Realtime Threat Stream (Emerald Accent) */}
          <div className="rounded-3xl bg-[#0C0C0E] border border-white/[0.08] hover:border-[#10B981]/40 p-6 flex flex-col justify-between relative overflow-hidden min-h-[290px] group transition-all duration-300">
            <div>
              <div className="flex items-center gap-2.5 mb-2.5 text-white">
                <div className="size-8 rounded-xl bg-[#10B981]/10 border border-[#10B981]/25 flex items-center justify-center text-[#10B981]">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-white font-sans">
                  Aliran Realtime
                </h4>
              </div>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Pelacakan gelombang modus kejahatan siber waktu nyata tanpa jeda.
              </p>
            </div>

            {/* Active Radar Pill */}
            <div className="mt-6 h-24 rounded-2xl bg-white/[0.02] border border-white/[0.05] relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:12px_12px] opacity-40" />
              <div className="relative z-10 px-3.5 py-1.5 rounded-full bg-white/[0.08] border border-[#10B981]/30 text-xs text-white flex items-center gap-2 shadow-lg backdrop-blur-md">
                <span className="size-2 rounded-full bg-[#10B981] animate-ping" />
                <span className="font-medium text-[#10B981]">Radar Aktif 24/7</span>
              </div>
            </div>
          </div>

          {/* Card 6: Heuristik & AI Lokal (Cyan & Violet Accent) */}
          <div className="rounded-3xl bg-[#0C0C0E] border border-white/[0.08] hover:border-[#38BDF8]/40 p-6 flex flex-col justify-between relative overflow-hidden min-h-[290px] group transition-all duration-300">
            <div>
              <div className="flex items-center gap-2.5 mb-2.5 text-white">
                <div className="size-8 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/25 flex items-center justify-center text-[#38BDF8]">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-white font-sans">
                  Heuristik Mandiri
                </h4>
              </div>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Model inferensi lokal langsung di browser tanpa pelacakan data pribadi.
              </p>
            </div>

            {/* 3D Wireframe Cube with Cyan & Purple Nodes */}
            <div className="mt-4 flex flex-col items-center justify-center h-24 relative">
              <svg viewBox="0 0 100 80" className="w-20 h-16 stroke-zinc-400 fill-none">
                <path d="M50 10 L80 25 L80 55 L50 70 L20 55 L20 25 Z" strokeWidth="1" />
                <path d="M50 10 L50 70 M50 40 L80 25 M50 40 L20 25" strokeWidth="0.8" />
                <circle cx="35" cy="30" r="2" fill="#38BDF8" />
                <circle cx="65" cy="35" r="2" fill="#A855F7" />
                <circle cx="50" cy="55" r="2" fill="#FFFFFF" />
              </svg>
              <span className="text-[10px] text-[#38BDF8] font-mono mt-1">100% Client-Side Privacy</span>
            </div>
          </div>

          {/* Card 7: Playbook Mitigasi (Amber & Emerald Accent) */}
          <div className="rounded-3xl bg-[#0C0C0E] border border-white/[0.08] hover:border-[#F59E0B]/40 p-6 flex flex-col justify-between relative overflow-hidden min-h-[290px] group transition-all duration-300">
            <div>
              <div className="flex items-center gap-2.5 mb-2.5 text-white">
                <div className="size-8 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/25 flex items-center justify-center text-[#F59E0B]">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-white font-sans">
                  Mitigasi Darurat
                </h4>
              </div>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Protokol respons instan blokir rekening bank dan kanal resmi kepolisian.
              </p>
            </div>

            {/* Endpoints Table Flow with colored status tags */}
            <div className="mt-4 space-y-1.5 font-mono text-[10px] text-zinc-400">
              <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                <span>Rekening Bank</span>
                <span className="text-[#F59E0B] font-semibold">→ Blokir</span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                <span>Kartu SIM</span>
                <span className="text-zinc-300 font-medium">→ Operator</span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                <span>Bukti Chat</span>
                <span className="text-[#10B981] font-medium">→ Lapor</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Platform Statement */}
        <div className="mt-14 text-center">
          <p className="text-sm sm:text-base text-zinc-400 font-sans">
            <strong className="text-white font-medium">Gunakan satu atau semua.</strong> Setiap modul dirancang mandiri dan terintegrasi sebagai satu platform pertahanan siber.
          </p>
        </div>
      </div>
    </section>
  );
}
