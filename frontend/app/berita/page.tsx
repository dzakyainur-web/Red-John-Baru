import type { Metadata } from "next";
import { fetchNews } from "@/lib/news";
import BeritaFeedClient from "@/components/BeritaFeedClient";

export const metadata: Metadata = {
  title: "Radar Berita & Intelijen Penipuan Siber — Red John",
  description:
    "Pantauan tren modus operandi penipuan digital, malware Android APK, quishing QRIS, dan rekayasa sosial dari media terpercaya Indonesia.",
};

export default async function BeritaPage() {
  const { items, total, updated_at } = await fetchNews();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <header className="border-b border-white/10 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF3815]/15 border border-[#FF3815]/40 text-xs font-[family-name:var(--font-geist-mono)] text-[#FF5533] font-bold">
              <span className="size-2 rounded-full bg-[#FF3815] animate-ping" />
              <span>RADAR INTELIJEN // MEDIA &amp; LAPORAN LAPANGAN</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white font-[family-name:var(--font-display)]">
              KABAR &amp; TREN PENIPUAN DIGITAL
            </h1>
          </div>

          <div className="text-right font-[family-name:var(--font-geist-mono)] text-xs text-zinc-400">
            <div className="text-zinc-500">SUMBER: KOMPAS, DETIK, CNN, ANTARA, TEMPO</div>
            <div className="text-white font-bold mt-1">PEMBARUAN SETIAP 6 JAM</div>
          </div>
        </div>

        <p className="mt-4 text-xs sm:text-sm text-zinc-300 font-[family-name:var(--font-geist-mono)] max-w-3xl leading-relaxed">
          Kompilasi artikel berita dan investigasi modus penipuan online terbaru di Indonesia. Dilengkapi analisis bahaya dan rekomendasi tindakan praktis agar kamu dan keluargamu tidak menjadi korban manipulasi digital berikutnya.
        </p>

        {/* Dynamic Glowing Accent Bar */}
        <div className="mt-6 h-[2px] bg-gradient-to-r from-[#FF3815] via-[#FF5533] to-transparent" />
      </header>

      {/* Interactive News Feed & Search Component */}
      <BeritaFeedClient
        initialItems={items}
        total={total}
        updatedAt={updated_at}
      />
    </div>
  );
}
