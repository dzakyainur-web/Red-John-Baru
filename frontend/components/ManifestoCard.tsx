"use client";

import { useState } from "react";

export default function ManifestoCard() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative z-10 font-[family-name:var(--font-geist-mono)] text-[clamp(0.7rem,1.2vw,0.85rem)] leading-relaxed tracking-wider text-zinc-300 transition-colors duration-200"
    >
      <div className="flex items-start">
        <span className="text-zinc-500 mr-2 text-sm select-none font-bold">[</span>
        <div className="space-y-0.5">
          <p className="font-medium text-white/90">
            WE SHAPE BOLD IDENTITIES AND DIGITAL
          </p>
          <p className="font-medium text-white/80">
            EXPERIENCES FOR BRANDS THAT VALUE
          </p>
          <p className="font-medium text-white/80">
            CLEAR THINKING, TIMELESS CRAFT,
          </p>
          <div className="flex items-center justify-between gap-4">
            <p className="font-medium text-white/80">AND IDEAS BUILT TO LAST.</p>
            <span className="text-zinc-500 text-sm select-none font-bold">]</span>
          </div>
        </div>
      </div>

      {/* Subtle indicator tag */}
      <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500">
        <span className="inline-block size-1.5 rounded-full bg-[#FF3815] animate-pulse" />
        <span>STUDIO BRIEF &bull; 2026</span>
      </div>
    </div>
  );
}
