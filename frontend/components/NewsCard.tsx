"use client";

import { NewsItem } from "@/lib/news";
import { NEWS_CATEGORY_NAMES, formatCardDate } from "@/lib/labels";
import { useSound } from "./SoundManager";
import ExplanatoryVisual from "./ExplanatoryVisual";

interface NewsCardProps {
  item: NewsItem;
  /** Dipanggil untuk artikel tanpa URL sumber (dibuka sebagai modal). */
  onSelect?: (item: NewsItem) => void;
  /** Atribut tambahan, mis. `aria-hidden` + `inert` pada salinan marquee. */
  rootProps?: React.HTMLAttributes<HTMLElement>;
}

/** Kartu berita bersama landing page & /berita. */
export default function NewsCard({ item, onSelect, rootProps }: NewsCardProps) {
  const { playClick } = useSound();
  const primaryCat = item.categories[0] || "general";
  const categoryName = NEWS_CATEGORY_NAMES[primaryCat] ?? primaryCat;

  return (
    <article
      {...rootProps}
      className={`group relative flex flex-col justify-between rounded-2xl p-5 sm:p-6 transition-all duration-150 ease-out hover:bg-[#161616] border border-transparent hover:border-white/[0.08] cursor-pointer min-h-[300px] ${rootProps?.className ?? ""}`}
    >
      <a
        href={item.url || "#"}
        target={item.url ? "_blank" : undefined}
        rel={item.url ? "noopener noreferrer" : undefined}
        onClick={(e) => {
          playClick();
          if (!item.url) {
            e.preventDefault();
            onSelect?.(item);
          }
        }}
        className="absolute inset-0 z-10 rounded-2xl"
      >
        <span className="sr-only">{item.title}</span>
      </a>

      <div>
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl mb-4 bg-[#0a0a0b] border border-white/[0.08] group-hover:border-white/20 transition-all">
          <ExplanatoryVisual
            category={primaryCat}
            source={item.source}
            title={item.title}
            imageUrl={item.image_url}
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-zinc-400 font-normal mb-3">
          <span>{formatCardDate(item.published_at)}</span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400">{categoryName}</span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400 font-medium">{item.source}</span>
        </div>

        <h3 className="text-xl sm:text-[22px] font-bold text-white tracking-tight leading-snug group-hover:text-zinc-100 transition-colors">
          {item.title}
        </h3>

        {item.snippet && (
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed line-clamp-3 font-normal">
            {item.snippet}
          </p>
        )}
      </div>
    </article>
  );
}
