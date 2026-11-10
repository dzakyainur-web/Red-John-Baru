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
    id: "game",
    number: "01",
    title: "DUEL INTELIJEN: RED JOHN vs JANE",
    category: "GAME SIMULASI & KOGNITIF",
    description:
      "Game simulasi interaktif menghadapi tipu daya Red John dengan pendampingan bot Jane yang mengintervensi saat pilihanmu berisiko.",
    tag: "SIMULASI KOGNITIF",
    href: "/quiz",
    status: "ARENA AKTIF",
  },
  {
    id: "pemindai",
    number: "02",
    title: "PEMINDAI ANOMALI PESAN",
    category: "CORE INFERENCE ENGINE",
    description:
      "Analisis mendalam teks SMS, WhatsApp, dan lowongan kerja mencurigakan berbasis aturan heuristik tanda bahaya dan deteksi APK lokal.",
    tag: "HEURISTIK LOKAL",
    href: "/pemindai",
    status: "SIAP PAKAI",
  },
  {
    id: "lapor-cepat",
    number: "03",
    title: "LAPOR TAUTAN CEPAT",
    category: "CEK SEBELUM KLIK",
    description:
      "Bedah mendalam URL untuk mendeteksi homoglyph, penipuan punycode, TLD mencurigakan, dan rantai pengalihan bahaya.",
    tag: "LAPOR CEPAT",
    href: "/lapor-cepat",
    status: "WAKTU NYATA",
  },
  {
    id: "radar",
    number: "04",
    title: "RADAR TREN PENIPUAN",
    category: "INTELIJEN ANCAMAN",
    description:
      "Agregasi otomatis RSS dan deteksi tren heuristik untuk memetakan gelombang modus penipuan di Indonesia.",
    tag: "AUTO-SYNC 6 JAM",
    href: "/berita",
    status: "RADAR AKTIF",
  },
  {
    id: "act",
    number: "05",
    title: "MATRIKS MITIGASI DARURAT",
    category: "TANGGAP INSIDEN",
    description:
      "Buku saku tanggap darurat: pemblokiran rekening bank, pemulihan kartu SIM, kanal lapor resmi kepolisian, dan pengamanan bukti digital.",
    tag: "PLAYBOOK DARURAT",
    href: "/act",
    status: "SIAP DARURAT",
  },
];

export default function SelectedWorks() {
  const [, setActiveHover] = useState<string | null>(null);
  const { playClick, playHover } = useSound();

  return (
    <section className="py-20 border-t border-white/[0.06] bg-[#0c0d0d] relative z-10">
      <div className="max-w-[1340px] mx-auto px-4 sm:px-8">
        {/* Section Header ala HeroUI */}
        <div className="flex flex-wrap items-baseline justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-mono tracking-wider text-zinc-400 uppercase font-semibold">
              [ ARSITEKTUR PLATFORM // SEMUA MODUL ]
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-bold tracking-tight text-white font-sans uppercase">
              Direktori Modul Lengkap
            </h2>
          </div>
          <p className="max-w-md text-xs sm:text-sm font-sans text-zinc-400">
            Dirancang untuk menangkal manipulasi digital tanpa kompromi privasi. Semua heuristik berjalan aman di sisi klien.
          </p>
        </div>

        {/* Works List / HeroUI sleek rows */}
        <div className="divide-y divide-white/[0.06]">
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
              className="group block py-6 transition-all duration-200 hover:bg-white/[0.03] px-4 rounded-2xl"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                {/* Number & Category */}
                <div className="lg:col-span-3 flex items-baseline gap-3">
                  <span className="font-mono text-sm text-zinc-400 font-bold">
                    {work.number}
                  </span>
                  <span className="font-mono text-xs tracking-wider text-zinc-500 uppercase">
                    {work.category}
                  </span>
                </div>

                {/* Title */}
                <div className="lg:col-span-4">
                  <h3 className="text-base sm:text-lg font-bold uppercase tracking-tight text-white group-hover:text-zinc-200 transition-colors font-sans flex items-center gap-2">
                    <span>{work.title}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-base text-white">
                      &rarr;
                    </span>
                  </h3>
                </div>

                {/* Description */}
                <div className="lg:col-span-3">
                  <p className="text-xs sm:text-sm font-sans text-zinc-400 leading-relaxed">
                    {work.description}
                  </p>
                </div>

                {/* Badges / CTA */}
                <div className="lg:col-span-2 flex items-center justify-end gap-3">
                  <span className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-[11px] font-mono text-zinc-300 group-hover:border-white/25 group-hover:text-white transition-colors">
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
