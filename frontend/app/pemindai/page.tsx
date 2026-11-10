import type { Metadata } from "next";
import Link from "next/link";
import SupabaseNavbar from "@/components/SupabaseNavbar";
import StudioFooter from "@/components/StudioFooter";
import ScamTerminal from "@/components/ScamTerminal";

export const metadata: Metadata = {
  title: "Pemindai Anomali Pesan — Red John",
  description:
    "Deteksi rekayasa sosial, pencurian OTP, manipulasi rekening, dan file malware APK secara langsung. 100% inferensi privat tanpa menyimpan pesan.",
};

export default function PemindaiPage() {
  return (
    <div id="top" className="min-h-screen bg-[#0c0d0d] text-white selection:bg-white selection:text-black font-sans">
      {/* =========================================================================
          SUPABASE NAVBAR — Exact clone of Landing Page header
          ========================================================================= */}
      <SupabaseNavbar />

      {/* =========================================================================
          HERO SECTION — 2-Column Landing Page Hero Layout
          ========================================================================= */}
      <section className="pt-28 sm:pt-36 pb-12 px-6 bg-[#0c0d0d] font-sans relative overflow-hidden">
        {/* Subtle radial emerald blur */}
        <div className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 size-[580px] rounded-full bg-[#3ECF8E]/6 blur-[140px]" />

        <div className="max-w-[1200px] mx-auto relative z-10">
          {/* 2-column layout: headline left | description & checklist right */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-16">
            {/* LEFT COLUMN: Badge + Headline + Threat Categories */}
            <div className="lg:max-w-[620px]">
              {/* Badge pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161817] border border-white/[0.08] text-xs font-medium text-zinc-300 mb-6">
                <span className="size-2 rounded-full bg-[#3ECF8E] animate-pulse" />
                <span>Forensik Rekayasa Sosial &amp; Penipuan Digital</span>
              </div>

              {/* Headline — Manrope, exact landing page scale */}
              <h1 className="text-[40px] sm:text-[54px] lg:text-[62px] font-black text-white leading-[1.08] tracking-[-0.03em] font-heading">
                Pindai pesan.
                <br />
                <span className="text-[#3ECF8E]">Cegah penipuan.</span>
              </h1>

              {/* Threat tags pills */}
              <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-[#A0A0A0]">
                <span className="text-zinc-500 font-mono text-[11px] uppercase mr-1">
                  Cakupan Deteksi:
                </span>
                {["OTP CS Bank", "Resi Kurir .APK", "Investasi Bodong", "Phishing WhatsApp", "Quishing QRIS"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300"
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Description & Checklist (matching Bento & Hero) */}
            <div className="lg:max-w-[400px] lg:pt-3 space-y-5">
              <p className="text-[15px] sm:text-[16px] text-[#A0A0A0] leading-[1.65]">
                Tempel chat WhatsApp, SMS, Telegram, atau instruksi mencurigakan. Sistem membedah indikator manipulasi psikologis, pemaksaan OTP, dan ancaman berkas secara instan.
              </p>

              {/* Value proposition checklist */}
              <ul className="space-y-2.5 text-[14px] text-zinc-300">
                <li className="flex items-center gap-2.5">
                  <span className="size-5 rounded-full bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 text-[#3ECF8E] flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                  <span><strong>100% On-Device:</strong> Teks tidak disimpan ke basis data</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="size-5 rounded-full bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 text-[#3ECF8E] flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                  <span><strong>Explainable:</strong> Disertai kutipan bukti &amp; alasan logis</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="size-5 rounded-full bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 text-[#3ECF8E] flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                  <span><strong>Rekomendasi Taktis:</strong> Langkah mitigasi jika terlanjur</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MAIN SCANNER CONSOLE SECTION
          ========================================================================= */}
      <section className="pb-16 px-6 bg-[#0c0d0d] relative z-10">
        <div className="max-w-[1200px] mx-auto">
          <ScamTerminal />
        </div>
      </section>

      {/* =========================================================================
          BENTO THREAT VECTORS GRID — 4 Cards (similar to BentoFeatures Row 2)
          ========================================================================= */}
      <section className="py-16 px-6 bg-[#0c0d0d] border-t border-white/[0.06] font-sans">
        <div className="max-w-[1200px] mx-auto space-y-8">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-[#3ECF8E] mb-2">
              VEKTOR REKAYASA SOSIAL INDONESIA
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-heading">
              Empat Pola Serangan yang Sering Menjerat Korban
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: OTP Theft */}
            <div className="rounded-2xl bg-[#161817] border border-white/[0.08] p-6 flex flex-col justify-between hover:border-white/[0.14] transition-all">
              <div className="space-y-3">
                <div className="size-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-lg">
                  🔑
                </div>
                <h3 className="text-base font-semibold text-white">
                  Pencurian OTP &amp; PIN
                </h3>
                <p className="text-xs text-[#A0A0A0] leading-relaxed">
                  Pelaku menyamar sebagai CS bank, dompet digital, atau marketplace meminta kode 6 digit untuk membatalkan transaksi palsu.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-white/[0.06] text-[11px] font-mono text-zinc-400">
                Deteksi: Urgensi pembatalan transaksi
              </div>
            </div>

            {/* Card 2: Malware APK */}
            <div className="rounded-2xl bg-[#161817] border border-white/[0.08] p-6 flex flex-col justify-between hover:border-white/[0.14] transition-all">
              <div className="space-y-3">
                <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-lg">
                  📦
                </div>
                <h3 className="text-base font-semibold text-white">
                  Malware Berkedok .APK
                </h3>
                <p className="text-xs text-[#A0A0A0] leading-relaxed">
                  Berkas berbahaya dikirim lewat chat WhatsApp dengan nama samaran seperti surat tilang ETLE, undangan resepsi, atau resi paket.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-white/[0.06] text-[11px] font-mono text-zinc-400">
                Deteksi: Ekstensi berkas berbahaya
              </div>
            </div>

            {/* Card 3: Fake Urgency */}
            <div className="rounded-2xl bg-[#161817] border border-white/[0.08] p-6 flex flex-col justify-between hover:border-white/[0.14] transition-all">
              <div className="space-y-3">
                <div className="size-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center text-lg">
                  ⏱️
                </div>
                <h3 className="text-base font-semibold text-white">
                  Manipulasi Urgensi Panik
                </h3>
                <p className="text-xs text-[#A0A0A0] leading-relaxed">
                  Ancaman akun diblokir dalam 24 jam, denda pajak, atau kerabat tertimpa musibah agar korban segera mentransfer dana tanpa berpikir.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-white/[0.06] text-[11px] font-mono text-zinc-400">
                Deteksi: Batas waktu sempit &amp; intimidasi
              </div>
            </div>

            {/* Card 4: Quishing & Phishing */}
            <div className="rounded-2xl bg-[#161817] border border-white/[0.08] p-6 flex flex-col justify-between hover:border-white/[0.14] transition-all">
              <div className="space-y-3">
                <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#3ECF8E] flex items-center justify-center text-lg">
                  🌐
                </div>
                <h3 className="text-base font-semibold text-white">
                  Quishing &amp; Homoglyph
                </h3>
                <p className="text-xs text-[#A0A0A0] leading-relaxed">
                  Tautan login tiruan dengan karakter mirip domain asli (misal bca-klik.xyz) atau kode QR stiker palsu di tempat umum.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-white/[0.06] text-[11px] font-mono text-zinc-400">
                Deteksi: Domain spoofing &amp; link janggal
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PRIVACY & ARCHITECTURE BENTO GRID — 3 Cards (Row 1 Style)
          ========================================================================= */}
      <section className="py-16 px-6 bg-[#0c0d0d] font-sans">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bento 1: 100% Privacy */}
            <div className="rounded-2xl bg-[#161817] border border-white/[0.08] p-7 space-y-4 hover:border-white/[0.14] transition-all">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 text-[#3ECF8E] flex items-center justify-center text-sm font-bold">
                  🔒
                </div>
                <h3 className="text-base font-semibold text-white">
                  Privasi Mutlak Tanpa Telemetri
                </h3>
              </div>
              <p className="text-xs text-[#A0A0A0] leading-relaxed">
                Teks yang Anda periksa hanya diproses di memori runtime mesin analisis dan langsung dibuang setelah skor selesai dihitung. Tidak ada pesan pribadi, nomor telepon, atau obrolan chat yang direkam atau disimpan di basis data mana pun.
              </p>
              <div className="pt-2 text-[12px] text-[#3ECF8E] font-medium">
                Zero-Knowledge Processing &rarr;
              </div>
            </div>

            {/* Bento 2: Hybrid Detection */}
            <div className="rounded-2xl bg-[#161817] border border-white/[0.08] p-7 space-y-4 hover:border-white/[0.14] transition-all">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 text-[#3ECF8E] flex items-center justify-center text-sm font-bold">
                  ⚡
                </div>
                <h3 className="text-base font-semibold text-white">
                  Mesin Hibrida Multilapis
                </h3>
              </div>
              <p className="text-xs text-[#A0A0A0] leading-relaxed">
                Memadukan 10+ aturan heuristik deterministik berbasis korpus ribuan kasus penipuan siber riil di Indonesia dengan model klasifikasi probabilitas TF-IDF untuk mendeteksi variasi kata samar atau plesetan baru.
              </p>
              <div className="pt-2 text-[12px] text-[#3ECF8E] font-medium">
                Explainable Heuristics Engine &rarr;
              </div>
            </div>

            {/* Bento 3: Integrated Defense */}
            <div className="rounded-2xl bg-[#161817] border border-white/[0.08] p-7 space-y-4 hover:border-white/[0.14] transition-all">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 text-[#3ECF8E] flex items-center justify-center text-sm font-bold">
                  🛡️
                </div>
                <h3 className="text-base font-semibold text-white">
                  Ekosistem Pertahanan Terintegrasi
                </h3>
              </div>
              <p className="text-xs text-[#A0A0A0] leading-relaxed">
                Hasil deteksi langsung terhubung dengan Simulasi Kuis Kriminal untuk melatih insting waspada, Playbook Penanganan Darurat untuk langkah pelaporan rekening, serta Radar Berita Modus Terkini.
              </p>
              <div className="pt-2 text-[12px] text-[#3ECF8E] font-medium">
                Modul Mitigasi Komprehensif &rarr;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CLOSING CTA — Exact clone of Landing Page CTA Banner
          ========================================================================= */}
      <section className="relative z-10 py-16 px-4 sm:px-8 border-t border-white/[0.06] bg-[#0c0d0d]">
        <div className="max-w-[1200px] mx-auto rounded-3xl bg-[#161817] border border-white/[0.08] px-6 py-14 sm:px-14 text-center relative overflow-hidden shadow-2xl">
          {/* Subtle green ambient blur */}
          <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 size-[420px] rounded-full bg-[#3ECF8E]/8 blur-[120px]" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white font-heading">
              Latih naluri waspada menghadapi manipulasi siber.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-400 font-sans leading-relaxed">
              Uji refleksmu menghadapi skenario penipuan nyata di Indonesia melalui Kuis Kriminal Otomatis, atau telusuri tautan mencurigakan di modul lapor cepat.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/quiz"
                className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-[#3ECF8E] hover:bg-[#4adeaa] text-black font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(62,207,142,0.3)]"
              >
                Mulai Kuis Kriminal &rarr;
              </Link>
              <Link
                href="/lapor-cepat"
                className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.12] font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Lapor cepat
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          STUDIO FOOTER
          ========================================================================= */}
      <StudioFooter />
    </div>
  );
}
