import type { Metadata } from "next";
import GoldenHourWizard from "@/components/GoldenHourWizard";

export const metadata: Metadata = {
  title: "Darurat transfer — paket laporan | Red John",
  description:
    "Wizard 5 menit untuk membuat paket laporan blokir rekening dan draft laporan polisi. Semua data tetap di perangkat Anda.",
};

export default function DaruratPage() {
  return (
    <>
      <div className="mx-auto w-full max-w-2xl px-4 pt-4 sm:px-6">
        <nav aria-label="Navigasi darurat" className="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-400">
          <span className="font-semibold text-white">Paket pemulihan golden-hour</span>
          <a href="/lapor-cepat" className="min-h-11 content-center underline underline-offset-4 hover:text-white">
            Lapor tautan mencurigakan
          </a>
        </nav>
      </div>
      <GoldenHourWizard />
    </>
  );
}
