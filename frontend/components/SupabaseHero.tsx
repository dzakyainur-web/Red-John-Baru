"use client";

import Link from "next/link";

// Supabase exact hero clone — 2-column layout
// Typography: Manrope for heading, Inter for body/buttons
// Background: Deep dark black (#0c0d0d)

export default function SupabaseHero() {
  return (
    <section className="pt-28 sm:pt-36 pb-14 px-6 bg-[#0c0d0d] font-sans">
      <div className="max-w-[1200px] mx-auto">
        {/* 2-column layout: headline left, description right */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-16">

          {/* LEFT COLUMN: Headline + CTAs */}
          <div className="lg:max-w-[560px]">
            {/* Headline — Manrope, tight tracking, exact Supabase scale */}
            <h1
              className="text-[30px] sm:text-[36px] lg:text-[42px] font-black text-white leading-[1.12] tracking-[-0.03em] font-heading"
            >
              Kenali Modus Penipuan
              <br />
              <span className="text-red-500">Sebelum Jadi Korban</span>
            </h1>

            {/* CTA Buttons — matching exact Supabase screenshot buttons */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/pemindai"
                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-[#006239] hover:bg-[#007544] text-white font-medium text-[14px] transition-all hover:scale-[1.01] active:scale-[0.99] border border-[#007544]/40 shadow-sm"
                style={{ letterSpacing: "-0.01em" }}
              >
                Mulai Pemindaian
              </Link>
              <Link
                href="/tentang-keamanan"
                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-[#161817] border border-white/10 text-zinc-300 font-medium text-[14px] hover:border-white/20 hover:text-white hover:bg-white/[0.04] transition-all"
                style={{ letterSpacing: "-0.01em" }}
              >
                Pelajari Keamanan
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN: Description — Inter, weight 400, muted */}
          <div className="lg:max-w-[340px] lg:pt-4">
            <p
              className="text-[15px] sm:text-[16px] text-[#A0A0A0] leading-[1.65]"
              style={{ fontWeight: 400 }}
            >
              Mulai dari pemindaian pesan mencurigakan. Pelajari modus penipuan digital, ikuti simulasi kognitif, dan akses playbook mitigasi untuk melindungi diri sebelum uang atau data pribadimu hilang.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
