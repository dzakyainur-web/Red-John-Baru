"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { NewsItem } from "@/lib/news";
import { NEWS_CATEGORY_NAMES as CATEGORY_NAMES, formatCardDate } from "@/lib/labels";
import { useSound } from "./SoundManager";
import ExplanatoryVisual from "./ExplanatoryVisual";
import NewsCard from "./NewsCard";

interface BeritaFeedClientProps {
  initialItems: NewsItem[];
  total: number;
  updatedAt: string | null;
}

// ─── Tips Pencegahan Instan Tiap Kategori ───────────────────────────────────
const CATEGORY_TIPS: Record<string, string> = {
  malware_apk: "Jangan pernah mengunduh berkas .apk di WhatsApp atau menyetujui izin Aksesibilitas Android.",
  quishing: "Selalu cocokkan nama merchant NMID di layar aplikasi saat memindai QRIS sebelum mengetikkan PIN.",
  fake_job: "Pekerjaan freelance resmi tidak pernah memungut biaya deposit atau meminta transfer tugas komisi.",
  social_engineering: "Bank resmi TIDAK PERNAH meminta kode OTP SMS, PIN ATM, atau 3 digit kode CVV di kartu debit/kredit.",
  pinjol_ilegal: "Verifikasi legalitas penyelenggara pinjol di portal resmi ojk.go.id atau kontak OJK 157.",
  crypto_scam: "Waspada ajakan investasi dari kenalan kencan online (pig butchering); aset tidak akan bisa ditarik.",
  giveaway_palsu: "Hindari tautan subsidi/hadiah gratis berantai; sering kali menjebak pendaftaran SMS premium.",
  phishing_link: "Periksa kembali URL domain situs sebelum memasukkan username, kata sandi, dan data akun keuangan.",
};

export default function BeritaFeedClient({ initialItems }: BeritaFeedClientProps) {
  const { playClick, playHover } = useSound();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copyToast, setCopyToast] = useState(false);
  const [activeModalItem, setActiveModalItem] = useState<NewsItem | null>(null);

  // Kategori unik dari artikel yang tersedia
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    initialItems.forEach((item) => {
      item.categories.forEach((c) => cats.add(c));
    });
    return Array.from(cats);
  }, [initialItems]);

  // Filter berita berdasarkan kategori dan pencarian
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

  // Salin URL Feed RSS ke Clipboard
  const handleCopyRss = () => {
    playClick();
    const rssUrl = typeof window !== "undefined" ? `${window.location.origin}/api/news` : "/api/news";
    navigator.clipboard?.writeText(rssUrl);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2500);
  };

  return (
    <div className="w-full text-white font-sans">
      {/* =========================================================================
          VERCEL BLOG HEADER
          ========================================================================= */}
      <div className="mb-8 sm:mb-10">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white font-sans">
          Blog
        </h1>
      </div>

      {/* =========================================================================
          CATEGORY FILTER TABS & SEARCH BAR (EXACT VERCEL BLOG BAR)
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6 mb-10">
        {/* Category Pills (Horizontal scrollable) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 -mx-2 px-2">
          {/* Pill "All" */}
          <button
            type="button"
            onClick={() => {
              playClick();
              setSelectedCategory("all");
            }}
            onMouseEnter={playHover}
            className={`rounded-full px-3.5 py-1 text-sm font-medium transition-colors shrink-0 cursor-pointer ${
              selectedCategory === "all"
                ? "bg-[#222222] text-white border border-white/10"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            All
          </button>

          {/* Dynamic Available Categories */}
          {availableCategories.map((catKey) => {
            const active = selectedCategory === catKey;
            const label = CATEGORY_NAMES[catKey] ?? catKey;

            return (
              <button
                key={catKey}
                type="button"
                onClick={() => {
                  playClick();
                  setSelectedCategory(catKey);
                }}
                onMouseEnter={playHover}
                className={`rounded-full px-3.5 py-1 text-sm transition-colors shrink-0 cursor-pointer ${
                  active
                    ? "bg-[#222222] text-white font-medium border border-white/10"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Right side: Search Bar + RSS Button */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
          {/* Search Input Box */}
          <div className="relative flex items-center">
            <svg
              className="absolute left-3 size-3.5 text-zinc-500 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-36 sm:w-48 bg-transparent border border-zinc-800/90 focus:border-zinc-500 rounded-full pl-8 pr-3 py-1 text-xs sm:text-sm text-white placeholder:text-zinc-500 outline-none transition-all"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 text-xs text-zinc-500 hover:text-white"
                title="Hapus pencarian"
              >
                &times;
              </button>
            )}
          </div>

          {/* RSS Feed Button */}
          <button
            type="button"
            onClick={handleCopyRss}
            onMouseEnter={playHover}
            className="size-8 rounded-full border border-zinc-800/90 hover:border-zinc-600 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Salin tautan RSS Feed"
          >
            <svg
              className="size-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="6.18" cy="17.82" r="2.18" />
              <path d="M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.46-4.44-9.9-9.9-9.9z" />
            </svg>
          </button>
        </div>
      </div>

      {/* =========================================================================
          VERCEL BLOG CARDS GRID (3-COLUMN RESPONSIVE)
          ========================================================================= */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredItems.map((item) => (
            <NewsCard key={item.id} item={item} onSelect={setActiveModalItem} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-white/10 p-12 text-center space-y-3">
          <div className="text-zinc-500 text-sm">Tidak ada artikel yang cocok dengan pencarian</div>
          <button
            type="button"
            onClick={() => {
              playClick();
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="text-xs text-white hover:underline mt-2 font-medium"
          >
            Reset filter pencarian &rarr;
          </button>
        </div>
      )}

      {/* =========================================================================
          OFFICIAL ASSISTANCE & REPORTING CHANNELS (SLEEK VERCEL DARK THEME)
          ========================================================================= */}
      <section className="mt-20 pt-10 border-t border-white/[0.08] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Saluran Bantuan &amp; Pengaduan Siber Resmi
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Bila Anda menemukan transaksi mencurigakan atau menjadi korban rekayasa sosial, hubungi otoritas berikut:
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/quiz"
              onClick={playClick}
              className="text-xs font-medium text-zinc-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-full px-4 py-2 transition-all"
            >
              Uji Nalar di Game &rarr;
            </Link>
            <Link
              href="/pemindai"
              onClick={playClick}
              className="text-xs font-medium text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-full px-4 py-2 transition-all"
            >
              Pemindai Pesan &rarr;
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="https://patrolisiber.id"
            target="_blank"
            rel="noopener noreferrer"
            onClick={playClick}
            className="group block p-5 rounded-xl bg-[#111111] border border-white/[0.06] hover:border-white/20 transition-all"
          >
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
              1. Kepolisian Siber
            </div>
            <div className="text-sm font-semibold text-white group-hover:text-zinc-200">
              Patroli Siber Polri &nearr;
            </div>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Pelaporan tindak pidana siber, penipuan online, malware APK, dan peretasan rekening.
            </p>
          </a>

          <a
            href="https://cekrekening.id"
            target="_blank"
            rel="noopener noreferrer"
            onClick={playClick}
            className="group block p-5 rounded-xl bg-[#111111] border border-white/[0.06] hover:border-white/20 transition-all"
          >
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
              2. Rekening &amp; E-Wallet
            </div>
            <div className="text-sm font-semibold text-white group-hover:text-zinc-200">
              CekRekening.id (Kominfo) &nearr;
            </div>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Periksa riwayat rekam jejak nomor rekening atau e-wallet sebelum Anda mentransfer uang.
            </p>
          </a>

          <div className="p-5 rounded-xl bg-[#111111] border border-white/[0.06]">
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
              3. Keuangan &amp; Pinjol
            </div>
            <div className="text-sm font-semibold text-white">
              Kontak OJK 157 / Satgas PASTI
            </div>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Pengaduan investasi ilegal dan teror pinjol. Telepon: 157 &bull; WhatsApp: 081-157-157-157.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          TOAST NOTIFICATION (RSS URL COPIED)
          ========================================================================= */}
      {copyToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#1e1e1e] border border-white/20 text-xs text-white shadow-2xl flex items-center gap-2">
          <span className="text-emerald-400 font-bold">✓</span>
          <span>Tautan RSS Feed berhasil disalin ke clipboard</span>
        </div>
      )}

      {/* =========================================================================
          DETAIL MODAL (FOR ARTICLES WITHOUT EXTERNAL URL)
          ========================================================================= */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#161616] border border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                {formatCardDate(activeModalItem.published_at)} &bull; {activeModalItem.source}
              </span>
              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                className="text-zinc-400 hover:text-white text-lg p-1"
              >
                &times;
              </button>
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight leading-snug">
              {activeModalItem.title}
            </h3>

            {/* Gambar Penjelasan di Modal */}
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-[#090a0b] border border-white/10">
              <ExplanatoryVisual
                category={activeModalItem.categories[0] || "general"}
                source={activeModalItem.source}
                title={activeModalItem.title}
                imageUrl={activeModalItem.image_url}
              />
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">
              {activeModalItem.snippet}
            </p>

            {activeModalItem.categories[0] && CATEGORY_TIPS[activeModalItem.categories[0]] && (
              <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 text-xs text-zinc-300">
                <strong className="text-white">Panduan Pencegahan: </strong>
                {CATEGORY_TIPS[activeModalItem.categories[0]]}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                className="px-4 py-1.5 rounded-full bg-white text-black font-semibold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
