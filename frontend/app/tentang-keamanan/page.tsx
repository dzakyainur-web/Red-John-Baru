export const metadata = {
  title: "Transparansi & Keamanan — GuardianAI",
};

export default function TransparansiPage() {
  return (
    <article className="space-y-6 text-sm leading-relaxed">
      <div>
        <h1 className="text-2xl font-bold">Transparansi & Keamanan</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Cara kerja, keterbatasan, dan perlakuan data GuardianAI — dibuka apa adanya.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Cara kerja analisis</h2>
        <p>
          GuardianAI menggabungkan dua lapisan: <strong>aturan (rule-based)</strong> — pola teks
          mencurigakan seperti permintaan OTP, tekanan mendesak, minta transfer, tautan palsu — dan
          <strong> model ML kecil yang berjalan lokal</strong> di server kami, dilatih dari dataset
          sintetis terbatas. Skor akhir adalah gabungan keduanya.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Keterbatasan</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Model dilatih dari dataset sintetis, bukan kasus nyata — bisa salah (false positive/negative).</li>
          <li>Penipu terus mengubah pola; aturan &amp; model bisa tertinggal.</li>
          <li>Pesan tanpa tanda bahaya <strong>tidak otomatis aman</strong>.</li>
          <li>Hasil analisis adalah alat bantu berpikir, bukan bukti atau keputusan final.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Perlakuan data</h2>
        <p>
          Teks yang kamu periksa diproses di memori server dan <strong>tidak disimpan atau di-log</strong>.
          Tidak ada akun, tidak ada database, tidak ada API pihak ketiga/LLM. Checklist di halaman
          &ldquo;Lindungi Diri&rdquo; hanya tersimpan di browser kamu (localStorage).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Sumber pelaporan resmi</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Aduan konten: aduankonten.id (Kominfo)</li>
          <li>Perbankan: call center resmi bank (nomor di website/kartu resmi) &amp; OJK</li>
          <li>Kriminal: Lapor Polisi Online (lapor.polri.go.id)</li>
        </ul>
        <p className="text-xs text-zinc-500">Verifikasi tautan resmi sebelum dipakai — lakukan dari sumber resminya.</p>
      </section>
    </article>
  );
}
