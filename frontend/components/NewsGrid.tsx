"use client";

import { NewsItem } from "@/lib/news";
import { formatNewsDate } from "@/lib/labels";
import NewsCard from "./NewsCard";

interface NewsGridProps {
  items: NewsItem[];
  total: number;
  updatedAt: string | null;
}

const ROW_SIZE = 6;

/**
 * Satu baris marquee. Track berisi dua salinan identik, jadi geser -50%
 * menyambung mulus. Salinan kedua `aria-hidden` + `inert` supaya pembaca
 * layar dan keyboard tidak melihat kartu ganda.
 */
function MarqueeRow({
  items,
  reverse,
  duration,
}: {
  items: NewsItem[];
  reverse?: boolean;
  duration: number;
}) {
  return (
    <div className="marquee-edge overflow-hidden">
      <div
        className={`flex w-max ${reverse ? "marquee-track-reverse" : "marquee-track"}`}
        style={{ ["--marquee-duration" as string]: `${duration}s` }}
      >
        {[0, 1].map((copy) => (
          <div
            key={copy}
            className="flex shrink-0 gap-5 pr-5"
            aria-hidden={copy === 1 || undefined}
            inert={copy === 1 || undefined}
          >
            {items.map((item) => (
              <NewsCard
                key={`${copy}-${item.id}`}
                item={item}
                rootProps={{ className: "w-[300px] sm:w-[340px] shrink-0" }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NewsGrid({ items, total, updatedAt }: NewsGridProps) {
  if (items.length === 0) return null;

  const rowOne = items.slice(0, ROW_SIZE);
  // Baris 2 melanjutkan sisa item; bila habis, ulang dari awal agar tetap terisi.
  const rowTwo = items.length > ROW_SIZE
    ? items.slice(ROW_SIZE, ROW_SIZE * 2)
    : items.slice(0, ROW_SIZE).reverse();
  // Butuh minimal 2 kartu per baris agar loop terlihat; pakai ulang item bila kurang.
  const fill = (row: NewsItem[]) =>
    row.length >= 2 ? row : [...row, ...items].slice(0, 2);

  // Label header mengikuti media sumber artikel yang benar-benar tampil.
  // Laporan manual admin ("laporan-admin") bukan media, jadi tidak dihitung.
  const sources = Array.from(
    new Set(
      items
        .map((item) => item.source)
        .filter((source) => source.toLowerCase() !== "laporan-admin"),
    ),
  );
  const shownSources = sources.slice(0, 3).join(" · ");
  const moreSources = sources.length > 3 ? ` +${sources.length - 3} MEDIA LAIN` : "";

  return (
    <section
      id="news-radar"
      className="relative z-10 py-20 border-t border-white/[0.06] bg-[#0c0d0d]"
    >
      <div className="max-w-[1340px] mx-auto space-y-8 px-4 sm:px-8">
        {/* Section Header & Telemetry */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.06] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-white" />
              </span>
              <span className="text-xs font-mono tracking-wider text-zinc-300 uppercase font-semibold">
                [ LIVE FEEDS{shownSources ? ` // ${shownSources.toUpperCase()}${moreSources}` : ""} ]
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white font-sans">
              Pantauan Modus Penipuan Digital
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-sans text-zinc-400">
            <div>
              <span>Diperbarui otomatis tiap 6 jam</span>
              <span className="text-zinc-600 mx-2">|</span>
              <span>Terakhir: </span>
              <span className="text-white font-semibold">{updatedAt ? formatNewsDate(updatedAt) : "HARI INI"}</span>
              <span className="text-zinc-600 mx-2">|</span>
              <span className="text-white font-semibold">{total} Artikel Terpantau</span>
            </div>
          </div>
        </div>
      </div>

      {/* Marquee dua baris: baris 1 ke kiri, baris 2 ke kanan. Hover = pause. */}
      <div className="space-y-5">
        <MarqueeRow items={fill(rowOne)} duration={70} />
        <MarqueeRow items={fill(rowTwo)} reverse duration={85} />
      </div>
    </section>
  );
}
