"use client";

import { useState } from "react";
import { CATEGORY_LABEL, CATEGORY_STYLES } from "@/lib/labels";

interface NewsImageProps {
  src?: string | null;
  alt: string;
  source: string;
  category?: string;
  /** Ukuran/aspek dari pemanggil, mis. `aspect-[16/10]`. */
  className?: string;
}

const FALLBACK_ACCENT = {
  bg: "bg-white/[0.06]",
  text: "text-zinc-400",
  border: "border-white/10",
};

function monogram(source: string): string {
  const host = source
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
  return (host[0] || "?").toUpperCase();
}

/** Gambar artikel dengan placeholder generatif bila kosong atau gagal dimuat. */
export default function NewsImage({
  src,
  alt,
  source,
  category,
  className = "",
}: NewsImageProps) {
  const [failed, setFailed] = useState(false);
  const accent = (category && CATEGORY_STYLES[category]) || FALLBACK_ACCENT;
  const label = (category && CATEGORY_LABEL[category]) || "Intelijen Siber";

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-[#0A0A0B] border border-white/[0.08] ${className}`}
    >
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- host gambar liar (tanpa remotePatterns)
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col justify-between p-4 select-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:28px_28px] opacity-60" />
          <div className={`absolute inset-3 rounded-lg border border-dashed ${accent.border}`} />
          <span className="absolute -right-1 -bottom-6 text-[7rem] leading-none font-mono font-bold text-white/[0.04]">
            {monogram(source)}
          </span>

          <div className="relative flex items-center justify-between font-mono text-[10px] uppercase tracking-wider">
            <span className={`px-2 py-0.5 rounded border ${accent.bg} ${accent.text} ${accent.border}`}>
              {label}
            </span>
            <span className="text-zinc-600">{failed ? "SIGNAL LOST" : "NO VISUAL"}</span>
          </div>

          <div className="relative font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            <div className="text-white/30">MEDIA VISUAL</div>
            <div className="text-zinc-400 font-semibold">{source}</div>
          </div>
        </div>
      )}
    </div>
  );
}
