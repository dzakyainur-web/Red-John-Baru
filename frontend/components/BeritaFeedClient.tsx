"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { NewsItem } from "@/lib/news";
import NewsImage from "./NewsImage";
import { CATEGORY_LABEL, CATEGORY_STYLES, formatNewsDate } from "@/lib/labels";
import { useSound } from "./SoundManager";

interface BeritaFeedClientProps {
  initialItems: NewsItem[];
  total: number;
  updatedAt: string | null;
}

// Rekomendasi tindakan instan berdasarkan kategori
const CATEGORY_TIPS: Record<string, string> = {
  malware_apk: "Jangan pernah klik file .apk di WhatsApp atau menyetujui izin 'Aksesibilitas' ponsel.",
  phishing_link: "Perhatikan domain URL dengan teliti. Hindari login akun perbankan dari tautan chat.",
  social_engineering: "Ingat: Bank & kepolisian resmi TIDAK PERNAH meminta kode OTP, PIN, atau 3 angka CVV.",
  fake_job: "Pekerjaan resmi tidak pernah memungut biaya atau meminta deposit 'tugas rating' terlebih dahulu.",
  pinjol_ilegal: "Cek legalitas pinjaman di situs resmi ojk.go.id sebelum memberikan data identitas KTP.",
  quishing: "Periksa nama merchant (NMID) pada layar aplikasi saat scan QRIS sebelum mengetikkan PIN.",
  crypto_scam: "Waspada ajakan investasi dari kenalan kencan online; platform bodong menolak penarikan modal.",
  giveaway_palsu: "Abaikan tautan hadiah kuota/uang gratis berantai; sering kali menjebak SMS premium.",
};

export default function BeritaFeedClient({ initialItems, total, updatedAt }: BeritaFeedClientProps) {
  const { playClick, playHover } = useSound();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Daftar kategori unik yang tersedia
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    initialItems.forEach((item) => {
      item.categories.forEach((c) => cats.add(c));
    });
    return Array.from(cats);
  }, [initialItems]);

  // Filter berita berdasarkan kategori dan kata kunci
  const filteredItems = useMemo(() => {
    return initialItems.filter((item) => {
      const matchCat =
        selectedCategory === "all" ||
        item.categories.includes(selectedCategory);

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.snippet.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q);

      return matchCat && matchSearch;
    });
  }, [initialItems, selectedCategory, searchQuery]);

  // Pisahkan lead (laporan utama) dan stream berita lainnya
  const [lead, ...stream] = filteredItems;

  return (
    <div className="space-y-10">
      {/* =========================================================================
          TELEMETRY & STATS BAR
          ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 font-[family-name:var(--font-geist-mono)]">
        <div className="rounded-xl bg-[#111] border border-white/10 p-3.5 sm:p-4">
          <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#FF3815] animate-pulse" />
            <span>STATUS RADAR</span>
          </div>
          <div className="text-sm sm:text-base font-bold text-white tracking-tight">AKTIF 24/7</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Pemantau media siber</div>
        </div>

        <div className="rounded-xl bg-[#111] border border-white/10 p-3.5 sm:p-4">
          <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">TOTAL LAPORAN</div>
          <div className="text-sm sm:text-base font-bold text-[#FF5533] tracking-tight">{total} ARTIKEL</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Media terpercaya nasional</div>
        </div>

        <div className="rounded-xl bg-[#111] border border-white/10 p-3.5 sm:p-4">
          <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">TREN ANCAMAN</div>
          <div className="text-sm sm:text-base font-bold text-amber-400 tracking-tight">APK &amp; QUISHING</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Risiko manipulasi tertinggi</div>
        </div>

        <div className="rounded-xl bg-[#111] border border-white/10 p-3.5 sm:p-4">
          <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">SINKRONISASI</div>
          <div className="text-sm sm:text-base font-bold text-zinc-200 tracking-tight">
            {updatedAt ? formatNewsDate(updatedAt) : "HARI INI"}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Pembaruan otomatis berkala</div>
        </div>
      </div>

      {/* =========================================================================
          SEARCH & CATEGORY FILTER CONTROL
          ========================================================================= */}
      <div className="rounded-2xl bg-[#0f0f0f] border border-white/10 p-4 sm:p-5 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kata kunci: 'APK', 'Bank', 'Undangan', 'QRIS', 'Freelance'..."
            className="w-full bg-[#181818] border border-white/10 focus:border-[#FF3815] rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm font-[family-name:var(--font-geist-mono)] text-white placeholder:text-zinc-500 outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white px-1.5 py-0.5 rounded"
            >
              &times; Hapus
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playClick();
              setSelectedCategory("all");
            }}
            onMouseEnter={playHover}
            className={`px-3 py-1.5 rounded-lg text-xs font-[family-name:var(--font-geist-mono)] tracking-wider transition-all cursor-pointer ${
              selectedCategory === "all"
                ? "bg-[#FF3815] text-black font-bold shadow-[0_0_15px_rgba(255,56,21,0.4)]"
                : "bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10"
            }`}
          >
            Semua Modus ({initialItems.length})
          </button>

          {availableCategories.map((catKey) => {
            const count = initialItems.filter((i) => i.categories.includes(catKey)).length;
            const active = selectedCategory === catKey;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => {
                  playClick();
                  setSelectedCategory(catKey);
                }}
                onMouseEnter={playHover}
                className={`px-3 py-1.5 rounded-lg text-xs font-[family-name:var(--font-geist-mono)] tracking-wider transition-all cursor-pointer ${
                  active
                    ? "bg-white text-black font-bold shadow-md"
                    : "bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10"
                }`}
              >
                {CATEGORY_LABEL[catKey] ?? catKey} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          NEWS CONTENT FEED
          ========================================================================= */}
      {lead ? (
        <div className="space-y-8">
          {/* FEATURED / LEAD ARTICLE */}
          <article className="relative overflow-hidden rounded-2xl bg-[#111111] border-2 border-[#FF3815]/40 hover:border-[#FF3815] p-6 sm:p-8 transition-all shadow-xl group">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 font-[family-name:var(--font-geist-mono)]">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF3815]/15 border border-[#FF3815]/40 text-xs font-bold text-[#FF5533]">
                <span className="size-1.5 rounded-full bg-[#FF3815] animate-ping" />
                <span>LAPORAN UTAMA // RISIKO TINGGI</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-bold text-white">
                  {lead.source}
                </span>
                <span>&bull;</span>
                {lead.published_at && (
                  <time dateTime={lead.published_at}>{formatNewsDate(lead.published_at)}</time>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,38%)] gap-6 items-start">
              <div>
                {/* Headline */}
                {lead.url ? (
                  <a
                    href={lead.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={playClick}
                    className="block text-2xl sm:text-3xl font-extrabold text-white group-hover:text-[#FF5533] transition-colors leading-tight tracking-tight font-[family-name:var(--font-display)]"
                  >
                    {lead.title}
                    <span className="inline-block ml-2 text-zinc-500 group-hover:text-[#FF5533] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                      &nearr;
                    </span>
                  </a>
                ) : (
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight font-[family-name:var(--font-display)]">
                    {lead.title}
                  </h2>
                )}

                {/* Excerpt */}
                {lead.snippet && (
                  <p className="mt-4 text-sm sm:text-base text-zinc-300 leading-relaxed font-sans max-w-4xl">
                    {lead.snippet}
                  </p>
                )}
              </div>

            <NewsImage
              key={lead.id}
              src={lead.image_url}
              alt={lead.title}
              source={lead.source}
              category={lead.categories[0]}
              className="aspect-[16/9] w-full"
            />
            </div>

            {/* Safety Tip Box for Lead Category */}
            {lead.categories[0] && CATEGORY_TIPS[lead.categories[0]] && (
              <div className="mt-6 rounded-xl bg-black/60 border border-white/10 p-3.5 sm:p-4 flex items-start gap-3">
                <span className="text-base sm:text-lg">🛡️</span>
                <div className="text-xs font-[family-name:var(--font-geist-mono)] text-zinc-300">
                  <strong className="text-white">PANDUAN PENCEGAHAN: </strong>
                  {CATEGORY_TIPS[lead.categories[0]]}
                </div>
              </div>
            )}

            {/* Footer metadata */}
            <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {lead.categories.map((c) => {
                  const style = CATEGORY_STYLES[c] || { bg: "bg-zinc-800", text: "text-zinc-300", border: "border-zinc-700" };
                  return (
                    <span
                      key={c}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-[family-name:var(--font-geist-mono)] font-bold border ${style.bg} ${style.text} ${style.border}`}
                    >
                      {CATEGORY_LABEL[c] ?? c}
                    </span>
                  );
                })}
              </div>

              {lead.url && (
                <a
                  href={lead.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-[family-name:var(--font-geist-mono)] font-bold text-[#FF5533] hover:underline"
                >
                  <span>BACA ARTIKEL ASLI DI {lead.source.toUpperCase()}</span>
                  <span>&rarr;</span>
                </a>
              )}
            </div>
          </article>

          {/* STREAM / CARDS GRID */}
          {stream.length > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xs font-[family-name:var(--font-geist-mono)] uppercase tracking-wider text-zinc-400 font-bold">
                  [ ARTIKEL &amp; TREN LAINNYA ({stream.length}) ]
                </h3>
                <span className="text-xs font-[family-name:var(--font-geist-mono)] text-zinc-500">
                  Klik untuk membuka rilis pers
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {stream.map((item) => {
                  const cat = item.categories[0];
                  const style = (cat && CATEGORY_STYLES[cat]) || {
                    bg: "bg-zinc-800",
                    text: "text-zinc-300",
                    border: "border-zinc-700",
                  };
                  const tip = cat ? CATEGORY_TIPS[cat] : null;

                  return (
                    <article
                      key={item.id}
                      className="rounded-2xl bg-[#111111] border border-white/10 hover:border-white/25 hover:bg-[#141414] p-5 sm:p-6 transition-all flex flex-col justify-between group shadow-md"
                    >
                      <div>
                        <NewsImage
                          src={item.image_url}
                          alt={item.title}
                          source={item.source}
                          category={cat}
                          className="aspect-[16/9] w-full mb-4"
                        />
                        {/* Top Meta */}
                        <div className="flex items-center justify-between gap-2 mb-3 text-[11px] font-[family-name:var(--font-geist-mono)]">
                          <span
                            className={`px-2 py-0.5 rounded font-bold border ${style.bg} ${style.text} ${style.border}`}
                          >
                            {cat ? CATEGORY_LABEL[cat] ?? cat : "Siber"}
                          </span>

                          <div className="text-zinc-400">
                            {item.published_at && (
                              <time dateTime={item.published_at}>{formatNewsDate(item.published_at)}</time>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={playClick}
                            className="block font-bold text-base sm:text-lg text-white group-hover:text-[#FF5533] leading-snug transition-colors tracking-tight font-[family-name:var(--font-display)]"
                          >
                            {item.title}
                          </a>
                        ) : (
                          <h4 className="font-bold text-base sm:text-lg text-white leading-snug tracking-tight font-[family-name:var(--font-display)]">
                            {item.title}
                          </h4>
                        )}

                        {/* Snippet */}
                        {item.snippet && (
                          <p className="mt-3 text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans line-clamp-3">
                            {item.snippet}
                          </p>
                        )}

                        {/* Quick Tip Pill */}
                        {tip && (
                          <div className="mt-3.5 p-2.5 rounded-lg bg-black/40 border border-white/5 text-[11px] font-[family-name:var(--font-geist-mono)] text-zinc-400">
                            <span className="text-[#FF5533] font-bold">Tips: </span>
                            {tip}
                          </div>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-[family-name:var(--font-geist-mono)]">
                        <span className="text-zinc-400">Sumber: <strong className="text-zinc-200">{item.source}</strong></span>

                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#FF5533] group-hover:underline flex items-center gap-1 font-semibold"
                          >
                            <span>Buka Media</span>
                            <span>&rarr;</span>
                          </a>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-[#111] border border-white/10 p-10 text-center space-y-3 font-[family-name:var(--font-geist-mono)]">
          <div className="text-3xl">🔍</div>
          <div className="text-base font-bold text-white">Tidak ada artikel yang cocok dengan pencarian</div>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Coba ganti kata kunci atau pilih kategori &quot;Semua Modus&quot; untuk melihat seluruh pantauan berita.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="mt-2 px-4 py-2 rounded-full bg-white text-black font-bold text-xs"
          >
            Reset Filter
          </button>
        </div>
      )}

      {/* =========================================================================
          EMERGENCY DEFENSE & OFFICIAL REPORTING CHANNELS
          ========================================================================= */}
      <section className="rounded-2xl bg-gradient-to-br from-[#121212] to-[#0a0a0a] border border-white/15 p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <span className="text-xs font-[family-name:var(--font-geist-mono)] text-[#FF3815] uppercase tracking-wider font-bold">
              [ SALURAN BANTUAN RESMI ]
            </span>
            <h3 className="mt-1 text-xl sm:text-2xl font-black uppercase text-white font-[family-name:var(--font-display)]">
              TERLANJUR JADI KORBAN ATAU MENEMUKAN REKENING PENIPU?
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/#game"
              className="px-4 py-2 rounded-full bg-[#FF3815] hover:bg-[#FF5533] text-black font-bold text-xs font-[family-name:var(--font-geist-mono)] tracking-wider uppercase transition-colors"
            >
              Uji Naluri di Game &rarr;
            </Link>
            <Link
              href="/pemindai"
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs font-[family-name:var(--font-geist-mono)] tracking-wider uppercase transition-colors"
            >
              Pemindai Pesan &rarr;
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-[family-name:var(--font-geist-mono)] text-xs">
          <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-1.5">
            <div className="text-zinc-400 font-bold uppercase text-[11px]">1. KEPOLISIAN SIBER</div>
            <div className="text-white font-bold text-sm">Patroli Siber Polri</div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Laporkan tindak pidana siber, pemerasan, peretasan akun, dan sindikat malware.
            </p>
            <a
              href="https://patrolisiber.id"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FF5533] hover:underline inline-block pt-1 text-[11px]"
            >
              patrolisiber.id &nearr;
            </a>
          </div>

          <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-1.5">
            <div className="text-zinc-400 font-bold uppercase text-[11px]">2. CEK REKENING BANK</div>
            <div className="text-white font-bold text-sm">CekRekening.id (Kominfo)</div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Periksa riwayat rekam jejak nomor rekening atau e-wallet sebelum Anda mentransfer uang.
            </p>
            <a
              href="https://cekrekening.id"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FF5533] hover:underline inline-block pt-1 text-[11px]"
            >
              cekrekening.id &nearr;
            </a>
          </div>

          <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-1.5">
            <div className="text-zinc-400 font-bold uppercase text-[11px]">3. KEUANGAN &amp; PINJOL</div>
            <div className="text-white font-bold text-sm">Kontak OJK 157 / Satgas PASTI</div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Pengaduan korban investasi bodong, robot trading abal-abal, dan teror pinjol ilegal.
            </p>
            <div className="text-zinc-300 pt-1 text-[11px]">Telepon: 157 &bull; WA: 081-157-157-157</div>
          </div>
        </div>
      </section>
    </div>
  );
}
