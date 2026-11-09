import Link from "next/link";
import SupabaseNavbar from "@/components/SupabaseNavbar";
import SupabaseHero from "@/components/SupabaseHero";
import BentoFeatures from "@/components/BentoFeatures";
import NewsCarousel from "@/components/NewsCarousel";
import RedJohnGame from "@/components/RedJohnGame";
import SelectedWorks from "@/components/SelectedWorks";
import StudioFooter from "@/components/StudioFooter";
import { fetchNews } from "@/lib/news";

export default async function HomePage() {
  const { items, total, updated_at } = await fetchNews();

  return (
    <div id="top" className="min-h-screen bg-[#0c0d0d] text-white selection:bg-white selection:text-black">

      {/* =========================================================================
          SUPABASE NAVBAR — Fixed top, solid #1a1a1a, exact clone
          ========================================================================= */}
      <SupabaseNavbar />

      {/* =========================================================================
          SUPABASE HERO — 2-column layout (headline left | description right)
          ========================================================================= */}
      <SupabaseHero />

      {/* =========================================================================
          SUPABASE BENTO FEATURES GRID — 7 cards exact clone
          Row 1: Postgres | Auth | Edge Functions
          Row 2: Storage | Realtime | Vector | Data APIs
          ========================================================================= */}
      <BentoFeatures />

      {/* =========================================================================
          FEEDS BERITA RADAR INTELIJEN TERKINI
          ========================================================================= */}
      <div className="bg-[#0c0d0d]">
        <NewsCarousel
          items={items}
          total={total}
          updatedAt={updated_at}
        />
      </div>

      {/* =========================================================================
          LABORATORIUM SIMULASI KOGNITIF: RED JOHN vs JANE
          ========================================================================= */}
      <section id="game" className="relative z-10 py-20 px-4 sm:px-8 border-t border-white/[0.06] bg-[#0c0d0d]">
        <div className="max-w-[1200px] mx-auto space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-mono tracking-wider text-[#A855F7] uppercase font-semibold">
                [ ARENA LATIHAN // 10 BABAK ]
              </span>
              <h2 className="mt-2 text-2xl sm:text-4xl font-bold uppercase tracking-tight text-white font-sans">
                Uji Nalarmu Melawan Red John
              </h2>
            </div>
            <p className="max-w-md text-xs sm:text-sm font-sans text-zinc-400 leading-relaxed">
              Uji ketajaman intuisimu menghadapi 10 babak rekayasa sosial Red John. Bot Jane akan mengintervensi langsung bila kamu salah mengambil keputusan dan menjelaskan trik manipulasi di baliknya.
            </p>
          </div>

          {/* Embedded Full Interactive Game in sleek container */}
          <div className="rounded-3xl bg-[#161817] border border-white/[0.08] p-5 sm:p-9 shadow-2xl">
            <RedJohnGame />
          </div>
        </div>
      </section>

      {/* =========================================================================
          DIRECTORY OF ALL CAPABILITIES / WORKS
          ========================================================================= */}
      <SelectedWorks />

      {/* =========================================================================
          CLOSING CTA
          ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-8 border-t border-white/[0.06] bg-[#0c0d0d]">
        <div className="max-w-[1200px] mx-auto rounded-3xl bg-[#161817] border border-white/[0.08] px-6 py-14 sm:px-14 text-center relative overflow-hidden">
          <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 size-[420px] rounded-full bg-[#3ECF8E]/8 blur-[120px]" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white font-sans">
              Cek satu pesan sekarang. Butuh 10 detik.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-400 font-sans leading-relaxed">
              Tempel SMS, chat WhatsApp, atau tautan yang mencurigakan. Analisis berjalan di perangkatmu, tidak ada yang dikirim ke server.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/pemindai"
                className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-[#3ECF8E] hover:bg-[#4adeaa] text-black font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Periksa Pesan
              </Link>
              <Link
                href="/inspect"
                className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.12] font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Periksa Tautan
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          STUDIO FOOTER
          ========================================================================= */}
      <StudioFooter />
    </div>
  );
}
