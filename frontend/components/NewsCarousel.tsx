"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { NewsItem } from "@/lib/news";
import NewsImage from "./NewsImage";
import { CATEGORY_LABEL, CATEGORY_STYLES, formatNewsDate } from "@/lib/labels";
import { useSound } from "./SoundManager";

interface NewsCarouselProps {
  items: NewsItem[];
  total: number;
  updatedAt: string | null;
}

const CATEGORY_TIPS: Record<string, string> = {
  malware_apk: "Jangan pernah mengunduh file .apk dari WhatsApp atau menyetujui izin Aksesibilitas Android.",
  quishing: "Selalu cocokkan nama merchant NMID di layar saat scan QRIS sebelum mengetikkan PIN.",
  fake_job: "Pekerjaan freelance resmi tidak pernah memungut biaya deposit atau komisi tugas berbayar.",
  social_engineering: "Bank resmi tidak pernah meminta kode OTP, nomor CVV kartu, atau PIN ATM via chat/telepon.",
  pinjol_ilegal: "Verifikasi izin legalitas penyelenggara pinjol di kontak resmi OJK 157 atau ojk.go.id.",
  crypto_scam: "Waspada ajakan investasi kripto dari teman kencan online; saldo palsu tidak dapat dicairkan.",
  giveaway_palsu: "Hindari tautan survei berhadiah gratis; berisiko mendaftarkan nomor ke SMS berbayar.",
  phishing_link: "Periksa keaslian domain URL sebelum memasukkan username dan password perbankan.",
};

export default function NewsCarousel({ items, total, updatedAt }: NewsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { playClick, playHover } = useSound();
  const touchStartX = useRef<number | null>(null);

  const activeItem = items[currentIndex] || items[0];

  // Auto-slide every 6 seconds if not paused
  useEffect(() => {
    if (isPaused || items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, items.length]);

  const goToPrev = () => {
    playClick();
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const goToNext = () => {
    playClick();
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const goToIndex = (index: number) => {
    playClick();
    setCurrentIndex(index);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
    touchStartX.current = null;
  };

  if (!activeItem) return null;

  const activeCat = activeItem.categories[0] || "malware_apk";
  const catStyle = CATEGORY_STYLES[activeCat] || {
    bg: "bg-white/[0.06]",
    text: "text-zinc-200",
    border: "border-white/10",
  };
  const activeTip = CATEGORY_TIPS[activeCat];

  return (
    <section
      id="news-radar"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative z-10 py-20 px-4 sm:px-8 border-t border-white/[0.06] bg-[#0c0d0d]"
    >
      <div className="max-w-[1340px] mx-auto space-y-8">
        {/* Section Header & Telemetry ala HeroUI */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.06] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-white" />
              </span>
              <span className="text-xs font-mono tracking-wider text-zinc-300 uppercase font-semibold">
                [ LIVE FEEDS // RADAR BERITA TERVERIFIKASI ]
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white font-sans">
              Pantauan Modus Penipuan Digital
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-sans text-zinc-400">
            <div>
              <span>Pembaruan: </span>
              <span className="text-white font-semibold">{updatedAt ? formatNewsDate(updatedAt) : "HARI INI"}</span>
              <span className="text-zinc-600 mx-2">|</span>
              <span className="text-white font-semibold">{total} Artikel Terpantau</span>
            </div>

            <Link
              href="/berita"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white transition-all text-xs font-medium"
            >
              <span>Arsip Berita</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Featured Main Carousel Card ala HeroUI Glass Card */}
        <div className="relative rounded-3xl bg-[#161817] border border-white/[0.08] p-7 sm:p-10 shadow-2xl overflow-hidden group">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/[0.04] blur-3xl pointer-events-none" />

          {/* Top Row: Slide Counter + Source + Category */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/[0.08] border border-white/10 text-white font-semibold">
                LAPORAN {String(currentIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
              </span>

              <span
                className={`px-3 py-1 rounded-full font-semibold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
              >
                {CATEGORY_LABEL[activeCat] ?? activeCat}
              </span>
            </div>

            <div className="flex items-center gap-3 text-zinc-400 font-sans text-xs">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span>Media Terverifikasi: </span>
                <strong className="text-white">{activeItem.source}</strong>
              </span>
              <span>&bull;</span>
              {activeItem.published_at && (
                <time dateTime={activeItem.published_at}>{formatNewsDate(activeItem.published_at)}</time>
              )}
            </div>
          </div>

          {/* Headline + Gambar Artikel */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,38%)] gap-6 lg:gap-8 items-start">
            <div className="space-y-4">
              {activeItem.url ? (
                <a
                  href={activeItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={playClick}
                  className="block text-2xl sm:text-4xl font-bold text-white hover:text-zinc-200 transition-colors leading-snug tracking-tight font-sans"
                >
                  {activeItem.title}
                  <span className="inline-block ml-2 text-zinc-500 group-hover:text-white text-xl">&nearr;</span>
                </a>
              ) : (
                <h3 className="text-2xl sm:text-4xl font-bold text-white leading-snug tracking-tight font-sans">
                  {activeItem.title}
                </h3>
              )}

              {/* Snippet / Description */}
              {activeItem.snippet && (
                <p className="text-sm sm:text-base text-zinc-400 font-sans leading-relaxed max-w-3xl">
                  {activeItem.snippet}
                </p>
              )}
            </div>

            <NewsImage
              key={activeItem.id}
              src={activeItem.image_url}
              alt={activeItem.title}
              source={activeItem.source}
              category={activeCat}
              className="aspect-[16/10] w-full order-first lg:order-last"
            />
          </div>

          {/* Quick Prevention Tip Callout */}
          {activeTip && (
            <div className="mt-8 rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 sm:p-5 flex items-start gap-3.5 max-w-3xl lg:max-w-[calc(62%-2rem)]">
              <div className="p-2 rounded-xl bg-white/[0.08] border border-white/10 text-white shrink-0">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                  PANDUAN INTERVENSI SIBER:
                </div>
                <div className="text-xs sm:text-sm text-zinc-400 mt-1 font-sans leading-relaxed">
                  {activeTip}
                </div>
              </div>
            </div>
          )}

          {/* Action Row & Carousel Navigation Buttons */}
          <div className="mt-8 pt-6 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {activeItem.url && (
                <a
                  href={activeItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]"
                >
                  BACA ARTIKEL DI {activeItem.source.toUpperCase()} &nearr;
                </a>
              )}

              <Link
                href="/berita"
                className="px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-xs font-sans text-white transition-all"
              >
                Arsip Modus &rarr;
              </Link>
            </div>

            {/* Prev / Next Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToPrev}
                onMouseEnter={playHover}
                aria-label="Berita sebelumnya"
                className="size-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-white transition-all cursor-pointer"
                title="Laporan Sebelumnya"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>

              {/* Progress Dots */}
              <div className="flex items-center gap-1.5 px-2">
                {items.slice(0, 8).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => goToIndex(idx)}
                    aria-label={`Buka slide ${idx + 1}`}
                    className={`transition-all rounded-full cursor-pointer ${
                      idx === currentIndex
                        ? "w-5 h-1.5 bg-white"
                        : "size-1.5 bg-zinc-700 hover:bg-zinc-500"
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={goToNext}
                onMouseEnter={playHover}
                aria-label="Berita selanjutnya"
                className="size-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-white transition-all cursor-pointer"
                title="Laporan Selanjutnya"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Thumbnail Navigation Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {items.slice(0, 4).map((item, idx) => {
            const isActive = idx === currentIndex;
            const cat = item.categories[0] || "malware_apk";
            const style = CATEGORY_STYLES[cat] || {
              bg: "bg-white/[0.05]",
              text: "text-zinc-300",
              border: "border-white/10",
            };

            return (
              <div
                key={item.id}
                onClick={() => goToIndex(idx)}
                className={`rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? "bg-[#141416] border border-white/40 shadow-lg shadow-white/5"
                    : "bg-[#161817] border border-white/[0.06] hover:border-white/20 hover:bg-[#121214]"
                }`}
              >
                <NewsImage
                  src={item.image_url}
                  alt={item.title}
                  source={item.source}
                  category={cat}
                  className="aspect-[16/9] w-full mb-3"
                />
                <div>
                  <div className="flex items-center justify-between gap-1 text-[10px] font-mono mb-2">
                    <span className={`px-2 py-0.5 rounded-full font-semibold border ${style.bg} ${style.text} ${style.border}`}>
                      {CATEGORY_LABEL[cat] ?? cat}
                    </span>
                    <span className="text-zinc-500 font-medium">{item.source}</span>
                  </div>

                  <h4 className="text-xs font-semibold text-white line-clamp-2 leading-snug font-sans">
                    {item.title}
                  </h4>
                </div>

                <div className="mt-3 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-sans text-zinc-500">
                  <span>{item.published_at ? formatNewsDate(item.published_at) : ""}</span>
                  {isActive ? (
                    <span className="text-white font-semibold">● Aktif</span>
                  ) : (
                    <span>Lihat &rarr;</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
