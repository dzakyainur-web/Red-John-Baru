"use client";

import { useState } from "react";

interface ExplanatoryVisualProps {
  category: string;
  source: string;
  title: string;
  imageUrl?: string | null;
  className?: string;
}

export default function ExplanatoryVisual({
  category,
  source,
  title,
  imageUrl,
  className = "",
}: ExplanatoryVisualProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [viewMode, setViewMode] = useState<"diagram" | "photo">(
    imageUrl ? "photo" : "diagram"
  );

  const cat = (category || "").toLowerCase();

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none bg-[#090a0b] ${className}`}
    >
      {/* Jika ada imageUrl dan pengguna memilih mode photo */}
      {imageUrl && !imageFailed && viewMode === "photo" ? (
        <div className="relative size-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Badge Sumber & Tombol Lihat Diagram */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-mono">
            <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-zinc-300 border border-white/10 truncate max-w-[150px]">
              {source}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setViewMode("diagram");
              }}
              className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-medium transition-colors"
            >
              Lihat Diagram &rarr;
            </button>
          </div>
        </div>
      ) : (
        /* =========================================================================
           DIAGRAM PENJELASAN ALUR MODUS OPERANDI (BESPOKE HIGH-TECH SVG)
           ========================================================================= */
        <div className="relative size-full flex flex-col justify-between p-3.5 sm:p-4 text-white">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

          {/* DIAGRAM SESUAI KATEGORI ANCAMAN */}
          {cat === "malware_apk" ? (
            /* ─── 1. MALWARE APK ─────────────────────────────────────── */
            <div className="relative z-10 size-full flex flex-col justify-between">
              {/* Header Diagram */}
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="flex items-center gap-1.5 text-red-400 font-semibold uppercase tracking-wider">
                  <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
                  Alur Serangan Malware APK
                </span>
                <span className="text-zinc-500">CVE-ANDROID</span>
              </div>

              {/* Graphic Body */}
              <div className="my-auto py-1 grid grid-cols-3 gap-1.5 items-center text-center">
                {/* Step 1: File Palsu di WA */}
                <div className="p-2 rounded-lg bg-red-950/30 border border-red-500/30 flex flex-col items-center">
                  <div className="size-6 rounded bg-red-500/20 text-red-300 flex items-center justify-center text-xs font-bold mb-1">
                    APK
                  </div>
                  <div className="text-[10px] font-semibold text-white truncate max-w-full">
                    Undangan.apk
                  </div>
                  <div className="text-[8px] text-zinc-400">File WhatsApp</div>
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center text-red-400">
                  <span className="text-[10px] font-mono">&rarr; izin &rarr;</span>
                  <div className="text-[8px] text-zinc-400">Aksesibilitas</div>
                </div>

                {/* Step 2: Curi SMS OTP */}
                <div className="p-2 rounded-lg bg-black/60 border border-red-500/40 flex flex-col items-center">
                  <div className="size-6 rounded bg-red-500/20 text-red-400 flex items-center justify-center text-xs mb-1">
                    🔓
                  </div>
                  <div className="text-[10px] font-semibold text-red-400">
                    Curi SMS OTP
                  </div>
                  <div className="text-[8px] text-zinc-400">Kuras Saldo Bank</div>
                </div>
              </div>

              {/* Footer Banner */}
              <div className="flex items-center justify-between text-[9px] font-mono bg-red-950/40 px-2 py-1 rounded border border-red-500/20 text-red-300">
                <span>⛔ JANGAN KLIK FILE .APK DI CHAT</span>
                <span className="text-zinc-400">Anti-Sniffer</span>
              </div>
            </div>
          ) : cat === "quishing" ? (
            /* ─── 2. QUISHING (QRIS PALSU) ───────────────────────────── */
            <div className="relative z-10 size-full flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="flex items-center gap-1.5 text-cyan-400 font-semibold uppercase tracking-wider">
                  <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Modus QRIS Palsu (Quishing)
                </span>
                <span className="text-zinc-500">NMID-CHECK</span>
              </div>

              <div className="my-auto py-1 grid grid-cols-2 gap-2 text-[10px]">
                {/* QR Asli */}
                <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                  <div className="flex items-center gap-1 text-emerald-400 font-bold text-[9px]">
                    <span>✓</span> MERCI-ASLI
                  </div>
                  <div className="text-white font-medium mt-1 truncate">Masjid Nurul Huda</div>
                  <div className="text-[8px] text-zinc-400">NMID Terverifikasi</div>
                </div>

                {/* QR Ditimpa Palsu */}
                <div className="p-2 rounded-lg bg-red-950/30 border border-red-500/40">
                  <div className="flex items-center gap-1 text-red-400 font-bold text-[9px]">
                    <span>✖</span> DITIMPA STIKER
                  </div>
                  <div className="text-red-300 font-medium mt-1 truncate">Rekening Pribadi</div>
                  <div className="text-[8px] text-red-400">Uang Masuk Penipu</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[9px] font-mono bg-cyan-950/40 px-2 py-1 rounded border border-cyan-500/20 text-cyan-300">
                <span>🔍 COCOKKAN NAMA MERCHANT SAAT SCAN</span>
                <span className="text-zinc-400">Periksa PIN</span>
              </div>
            </div>
          ) : cat === "fake_job" ? (
            /* ─── 3. KERJA FREELANCE PALSU ───────────────────────────── */
            <div className="relative z-10 size-full flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="flex items-center gap-1.5 text-blue-400 font-semibold uppercase tracking-wider">
                  <span className="size-1.5 rounded-full bg-blue-400 animate-pulse" />
                  Jebakan Tugas Komisi & Deposit
                </span>
                <span className="text-zinc-500">TASK-SCAM</span>
              </div>

              <div className="my-auto py-1 space-y-1 text-[9px] font-mono">
                <div className="flex items-center justify-between p-1.5 rounded bg-emerald-950/30 border border-emerald-500/20">
                  <span className="text-zinc-300">1. Like Video Medsos</span>
                  <span className="text-emerald-400 font-bold">+Rp50.000 (Pancingan)</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-amber-950/30 border border-amber-500/20">
                  <span className="text-zinc-300">2. Tugas VIP Reward</span>
                  <span className="text-amber-400 font-bold">Wajib Depo Rp5 Juta</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-red-950/40 border border-red-500/30">
                  <span className="text-red-300 font-bold">3. Tarik Saldo</span>
                  <span className="text-red-400 font-bold">DITOLAK / DIBLOKIR</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[9px] font-mono bg-blue-950/40 px-2 py-1 rounded border border-blue-500/20 text-blue-300">
                <span>⚠️ KERJA RESMI TIDAK PERNAH MEMINTA DEPOSIT</span>
              </div>
            </div>
          ) : cat === "social_engineering" ? (
            /* ─── 4. REKAYASA SOSIAL & OTP ───────────────────────────── */
            <div className="relative z-10 size-full flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="flex items-center gap-1.5 text-orange-400 font-semibold uppercase tracking-wider">
                  <span className="size-1.5 rounded-full bg-orange-400 animate-pulse" />
                  Pencurian Kredensial via Telepon
                </span>
                <span className="text-zinc-500">SOC-ENG</span>
              </div>

              <div className="my-auto py-1 grid grid-cols-2 gap-2 text-center text-[10px]">
                <div className="p-2 rounded-lg bg-orange-950/30 border border-orange-500/30 flex flex-col items-center">
                  <div className="text-xs mb-1">📞</div>
                  <div className="text-orange-300 font-semibold text-[9px]">CS Bank Palsu</div>
                  <div className="text-[8px] text-zinc-400">&quot;Ada Transaksi Liar!&quot;</div>
                </div>

                <div className="p-2 rounded-lg bg-red-950/40 border border-red-500/40 flex flex-col items-center">
                  <div className="text-xs mb-1">🛡️</div>
                  <div className="text-red-400 font-semibold text-[9px]">Minta Kode OTP/CVV</div>
                  <div className="text-[8px] text-zinc-400">JANGAN PERNAH DIBERI</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[9px] font-mono bg-orange-950/40 px-2 py-1 rounded border border-orange-500/20 text-orange-300">
                <span>🔐 BANK RESMI TIDAK PERNAH MINTA OTP</span>
              </div>
            </div>
          ) : cat === "pinjol_ilegal" ? (
            /* ─── 5. PINJOL ILEGAL ───────────────────────────────────── */
            <div className="relative z-10 size-full flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="flex items-center gap-1.5 text-purple-400 font-semibold uppercase tracking-wider">
                  <span className="size-1.5 rounded-full bg-purple-400 animate-pulse" />
                  Penyalahgunaan Izin &amp; Teror
                </span>
                <span className="text-zinc-500">OJK-WATCH</span>
              </div>

              <div className="my-auto py-1 grid grid-cols-3 gap-1.5 text-center text-[9px]">
                <div className="p-1.5 rounded bg-purple-950/30 border border-purple-500/20">
                  <div className="font-bold text-purple-300">Sedot Kontak</div>
                  <div className="text-[8px] text-zinc-400">Akses HP Penuh</div>
                </div>
                <div className="p-1.5 rounded bg-purple-950/30 border border-purple-500/20">
                  <div className="font-bold text-amber-400">Bunga 100%</div>
                  <div className="text-[8px] text-zinc-400">Biaya Fiktif</div>
                </div>
                <div className="p-1.5 rounded bg-red-950/40 border border-red-500/30">
                  <div className="font-bold text-red-400">Teror Kontak</div>
                  <div className="text-[8px] text-zinc-400">Intimidasi</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[9px] font-mono bg-purple-950/40 px-2 py-1 rounded border border-purple-500/20 text-purple-300">
                <span>🛑 CEK LEGALITAS RESMI DI OJK.GO.ID</span>
              </div>
            </div>
          ) : cat === "crypto_scam" ? (
            /* ─── 6. KRIPTO BODONG (PIG BUTCHERING) ──────────────────── */
            <div className="relative z-10 size-full flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="flex items-center gap-1.5 text-rose-400 font-semibold uppercase tracking-wider">
                  <span className="size-1.5 rounded-full bg-rose-400 animate-pulse" />
                  Pig Butchering (Asmara Kripto)
                </span>
                <span className="text-zinc-500">PIG-BUTCHER</span>
              </div>

              <div className="my-auto py-1 flex items-center justify-between gap-1 text-[9px] font-mono text-center">
                <div className="flex-1 p-1.5 rounded bg-rose-950/30 border border-rose-500/20">
                  <div className="text-rose-300">Dating App</div>
                  <div className="text-[8px] text-zinc-400">Bangun Relasi</div>
                </div>
                <span className="text-zinc-500">&rarr;</span>
                <div className="flex-1 p-1.5 rounded bg-rose-950/30 border border-rose-500/20">
                  <div className="text-emerald-400">Profit Fiktif</div>
                  <div className="text-[8px] text-zinc-400">Web Trading Palsu</div>
                </div>
                <span className="text-zinc-500">&rarr;</span>
                <div className="flex-1 p-1.5 rounded bg-red-950/40 border border-red-500/30">
                  <div className="text-red-400">Dana Lenyap</div>
                  <div className="text-[8px] text-zinc-400">WD Ditolak</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[9px] font-mono bg-rose-950/40 px-2 py-1 rounded border border-rose-500/20 text-rose-300">
                <span>💔 WASPADA INVESTASI DARI KENALAN KENCAN</span>
              </div>
            </div>
          ) : cat === "giveaway_palsu" ? (
            /* ─── 7. HADIAH PALSU & SUBSIDI ──────────────────────────── */
            <div className="relative z-10 size-full flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold uppercase tracking-wider">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Jebakan Tautan Hadiah &amp; Kuota
                </span>
                <span className="text-zinc-500">PHISH-GIFT</span>
              </div>

              <div className="my-auto py-1 grid grid-cols-2 gap-2 text-[9px]">
                <div className="p-2 rounded bg-emerald-950/30 border border-emerald-500/20">
                  <div className="font-bold text-emerald-300">Klaim Kuota 100GB</div>
                  <div className="text-[8px] text-zinc-400">Broadcast Grup WA</div>
                </div>
                <div className="p-2 rounded bg-red-950/40 border border-red-500/30">
                  <div className="font-bold text-red-400">SMS Berbayar</div>
                  <div className="text-[8px] text-zinc-400">Sedot Pulsa Otomatis</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[9px] font-mono bg-emerald-950/40 px-2 py-1 rounded border border-emerald-500/20 text-emerald-300">
                <span>🎁 ABAIKAN TAUTAN SUBSIDI / HADIAH BERANTAI</span>
              </div>
            </div>
          ) : (
            /* ─── 8. PHISHING LINK & UMUM ────────────────────────────── */
            <div className="relative z-10 size-full flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="flex items-center gap-1.5 text-amber-400 font-semibold uppercase tracking-wider">
                  <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Inspeksi Domain URL Web Phishing
                </span>
                <span className="text-zinc-500">URL-CHECK</span>
              </div>

              <div className="my-auto py-1 space-y-1.5 text-[9px] font-mono">
                <div className="p-1.5 rounded bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-between">
                  <span className="text-emerald-300 truncate">https://bank-resmi.co.id</span>
                  <span className="text-emerald-400 font-bold shrink-0">[✓ RESMI]</span>
                </div>
                <div className="p-1.5 rounded bg-red-950/40 border border-red-500/30 flex items-center justify-between">
                  <span className="text-red-300 truncate">https://bank-tarif-baru.xyz</span>
                  <span className="text-red-400 font-bold shrink-0">[✖ PALSU]</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[9px] font-mono bg-amber-950/40 px-2 py-1 rounded border border-amber-500/20 text-amber-300">
                <span>🔎 TELITI NAMA DOMAIN SEBELUM LOGIN</span>
              </div>
            </div>
          )}

          {/* Tombol kembali ke foto jika imageUrl tersedia */}
          {imageUrl && !imageFailed && (
            <div className="absolute top-2 right-2 z-20">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setViewMode("photo");
                }}
                className="px-2 py-0.5 rounded bg-black/60 hover:bg-black/90 border border-white/20 text-[10px] font-mono text-zinc-300 transition-colors"
              >
                Foto Media &rarr;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
