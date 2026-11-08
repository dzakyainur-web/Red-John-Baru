import type { Metadata } from "next";
import ScamTerminal from "@/components/ScamTerminal";
import { PageHead, SourceNote } from "@/components/ui";

export const metadata: Metadata = {
  title: "Pemindai Anomali Pesan — Red John",
  description:
    "Deteksi anomali dan manipulasi pesan mencurigakan secara real-time. Memeriksa urgensi palsu, pencurian OTP, nomor rekening pribadi, dan file APK berbahaya.",
};

export default function PemindaiPage() {
  return (
    <div className="space-y-8">
      <PageHead
        title="Pemindai Anomali Pesan"
        lead="Tempel pesan teks, SMS, chat WhatsApp/Telegram, email, atau instruksi mencurigakan di bawah. Sistem menganalisis indikator rekayasa sosial, manipulasi OTP, dan modus ancaman digital secara langsung tanpa menyimpan datamu."
      />

      <section aria-label="Terminal Pemindai Anomali" className="space-y-6">
        <ScamTerminal />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-rule text-xs text-muted">
        <div className="p-4 rounded-xl bg-surface border border-rule space-y-1">
          <div className="font-bold text-ink uppercase tracking-wider text-[11px]">
            🔒 PRIVASI TINGKAT TINGGI
          </div>
          <p>
            Teks yang diperiksa hanya diproses di memori runtime dan langsung dibuang. Tidak ada data pribadi atau pesan percakapan yang disimpan.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-rule space-y-1">
          <div className="font-bold text-ink uppercase tracking-wider text-[11px]">
            ⚡ INFERENSI LOKAL &amp; HYBRID
          </div>
          <p>
            Memadukan 10 aturan heuristik tanda bahaya yang dapat dijelaskan (explainable rules) serta model machine learning lokal.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-rule space-y-1">
          <div className="font-bold text-ink uppercase tracking-wider text-[11px]">
            🛡️ BUKAN JAMINAN MUTLAK
          </div>
          <p>
            Penipu terus memperbarui taktik mereka. Bila suatu pesan terasa janggal walau skor risikonya rendah, selalu lakukan verifikasi silang.
          </p>
        </div>
      </div>

      <SourceNote>
        Analisis teks dilakukan menggunakan heuristik berbasis aturan dan model klasifikasi lokal. Tidak melibatkan pengiriman data ke layanan pihak ketiga.
      </SourceNote>
    </div>
  );
}
