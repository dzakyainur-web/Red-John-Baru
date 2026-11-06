import type { Metadata } from "next";
import { PageHead } from "@/components/ui";

export const metadata: Metadata = {
  title: "Transparansi & keamanan — GuardianAI",
  description: "Cara kerja, keterbatasan, dan perlakuan data GuardianAI.",
};

const FACTS = [
  {
    title: "Cara skor dihitung",
    body: "Dua lapisan digabung: aturan yang bisa dijelaskan (permintaan OTP, tekanan waktu, minta transfer, tautan mirip bank) dan model ML kecil yang berjalan di server ini. Bobot bawaan 60% aturan, 40% model. Skor ≥70 risiko tinggi, ≥40 sedang.",
  },
  {
    title: "Keterbatasan",
    body: "Model dilatih dari dataset sintetis tim, bukan kasus nyata, jadi bisa salah dua arah. Penipu terus mengubah pola. Pesan tanpa tanda bahaya tidak otomatis aman.",
  },
  {
    title: "Data yang diperlakukan",
    body: "Teks yang diperiksa diproses di memori permintaan dan tidak disimpan maupun di-log. Tidak ada akun, database, atau API pihak ketiga. Checklist di halaman Lindungi Diri hanya tersimpan di localStorage browser kamu.",
  },
];

export default function TransparansiPage() {
  return (
    <article className="prose-page space-y-8">
      <PageHead
        title="Transparansi dan keamanan"
        lead="Cara kerja, batas kemampuan, dan perlakuan data — dibuka apa adanya, tanpa klaim berlebihan."
      />

      <div className="border-t border-rule">
        {FACTS.map((f) => (
          <section key={f.title} className="border-b border-rule py-5">
            <h2 className="section-title">{f.title}</h2>
            <p className="mt-2 text-sm text-muted">{f.body}</p>
          </section>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="section-title">Lapor ke jalur resmi</h2>
        <ul className="space-y-2 text-sm">
          {[
            ["Konten penipuan", "aduankonten.id", "https://aduankonten.id"],
            ["Transaksi perbankan", "call center resmi bank + OJK", "https://ojk.go.id"],
            ["Tindak pidana", "lapor.polri.go.id", "https://lapor.polri.go.id"],
          ].map(([label, name, href]) => (
            <li key={href} className="flex flex-wrap gap-x-2 border-b border-rule pb-2">
              <span className="w-40 shrink-0 text-muted">{label}</span>
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-alert-ink underline decoration-alert-line underline-offset-4 hover:decoration-alert">
                {name}
              </a>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted">
          Buka tautan resmi dari sumbernya sendiri, bukan dari tautan yang dikirim orang lain.
        </p>
      </section>
    </article>
  );
}
