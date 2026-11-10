import type { Metadata } from "next";
import Link from "next/link";
import SupabaseNavbar from "@/components/SupabaseNavbar";

export const metadata: Metadata = {
  title: "Soal Berita Penipuan Hari Ini — Red John",
  description: "10 soal kuis yang disusun AI dari berita penipuan terbaru.",
};

// TODO(logika): ganti placeholder ini dengan kuis 10 soal harian dari backend
// setelah tombol generate di /admin menghasilkan soal.
export default function BeritaHariIniPage() {
  return (
    <>
      <SupabaseNavbar />
      <main className="mx-auto flex min-h-[60vh] max-w-[640px] flex-col items-center justify-center px-4 py-16 text-center text-white">
        <h1 className="text-2xl font-bold sm:text-3xl">Soal Berita Penipuan Hari Ini</h1>
        <p className="mt-3 text-sm text-white/60">
          10 soal harian dari berita penipuan terbaru belum tersedia. Soal akan muncul setelah
          admin menjalankan generate di dashboard.
        </p>
        <Link
          href="/quiz"
          className="mt-6 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium hover:bg-white/[0.06]"
        >
          ← Kembali ke kuis
        </Link>
      </main>
    </>
  );
}
