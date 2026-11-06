"use client";

import Link from "next/link";
import { useState } from "react";
import { useSound } from "./SoundManager";

interface WorkItem {
  id: string;
  number: string;
  title: string;
  category: string;
  description: string;
  tag: string;
  href: string;
  status: string;
}

const WORKS: WorkItem[] = [
  {
    id: "radar",
    number: "01",
    title: "FRAUD TREND RADAR",
    category: "THREAT INTELLIGENCE",
    description:
      "Automated RSS aggregation and heuristic trend detection clustering emerging scam campaigns across Indonesia.",
    tag: "LIVE RSS / NLP",
    href: "/berita",
    status: "ACTIVE RADAR",
  },
  {
    id: "inspect",
    number: "02",
    title: "NEURAL LINK PARSER",
    category: "FORENSIC ENGINE",
    description:
      "Deep URL dissection verifying homoglyph attacks, punycode spoofing, suspicious TLDs, and malicious redirect hops.",
    tag: "HOMOGLYPH CHECK",
    href: "/inspect",
    status: "REALTIME",
  },
  {
    id: "learn",
    number: "03",
    title: "DECEPTION DECODER",
    category: "COGNITIVE DEFENSE",
    description:
      "Interactive threat simulations training users to spot micro-cues in urgent social engineering messages.",
    tag: "SIMULATION / INTEL",
    href: "/learn",
    status: "TRAINING LAB",
  },
  {
    id: "act",
    number: "04",
    title: "COUNTERMEASURE MATRIX",
    category: "INCIDENT RESPONSE",
    description:
      "Emergency triage playbook: banking lockouts, SIM recovery, official police report channels, and digital evidence gathering.",
    tag: "PLAYBOOK / TRIAGE",
    href: "/act",
    status: "EMERGENCY READY",
  },
];

export default function SelectedWorks() {
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const { playClick, playHover } = useSound();

  return (
    <section className="py-24 border-t border-white/10 relative z-10">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-wrap items-baseline justify-between gap-4 mb-16">
          <div>
            <span className="text-xs font-[family-name:var(--font-geist-mono)] tracking-widest text-[#FF3815] uppercase font-bold">
              [ CAPABILITIES // ARCHITECTURE ]
            </span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight text-white font-[family-name:var(--font-display)] uppercase">
              SELECTED MODULES
            </h2>
          </div>
          <p className="max-w-md text-xs sm:text-sm font-[family-name:var(--font-geist-mono)] text-zinc-400">
            ENGINEERED AGAINST MODERN DECEPTION. ZERO COMPROMISE PRIVACY. ALL HEURISTICS RUN CLIENT-SIDE OR DEDICATED INFERENCE.
          </p>
        </div>

        {/* Works List / Interactive Brutalist Rows */}
        <div className="divide-y divide-white/10">
          {WORKS.map((work) => (
            <Link
              key={work.id}
              href={work.href}
              onClick={playClick}
              onMouseEnter={() => {
                setActiveHover(work.id);
                playHover();
              }}
              onMouseLeave={() => setActiveHover(null)}
              className="group block py-10 transition-all duration-300 hover:bg-white/[0.02] px-2 sm:px-4"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Number & Category */}
                <div className="lg:col-span-3 flex items-baseline gap-4">
                  <span className="font-[family-name:var(--font-geist-mono)] text-sm text-[#FF3815] font-bold">
                    {work.number}
                  </span>
                  <span className="font-[family-name:var(--font-geist-mono)] text-xs tracking-widest text-zinc-500 uppercase">
                    {work.category}
                  </span>
                </div>

                {/* Title */}
                <div className="lg:col-span-4">
                  <h3 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-white group-hover:text-[#FF3815] transition-colors font-[family-name:var(--font-display)] flex items-center gap-3">
                    <span>{work.title}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xl text-[#FF3815]">
                      &rarr;
                    </span>
                  </h3>
                </div>

                {/* Description */}
                <div className="lg:col-span-3">
                  <p className="text-xs sm:text-sm font-[family-name:var(--font-geist-mono)] text-zinc-400 leading-relaxed">
                    {work.description}
                  </p>
                </div>

                {/* Badges / CTA */}
                <div className="lg:col-span-2 flex items-center justify-end gap-3">
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-[family-name:var(--font-geist-mono)] text-zinc-400 group-hover:border-[#FF3815]/40 group-hover:text-zinc-200 transition-colors">
                    {work.tag}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
