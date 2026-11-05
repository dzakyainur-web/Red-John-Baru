"use client";

import { useEffect, useState } from "react";

const CHECKLIST_KEY = "guardianai-checklist";

const CHECKLIST = [
  { id: "2fa", label: "Aktifkan 2FA di akun penting (WA, IG, email, m-banking)" },
  { id: "sessions", label: "Cek & hapus sesi login perangkat asing" },
  { id: "otp", label: "Biasakan: OTP/PIN tidak pernah dibagikan ke siapa pun" },
  { id: "privacy", label: "Atur privacy settings — batasi info publik (nomor, alamat)" },
  { id: "updates", label: "Perbarui OS & aplikasi secara rutin" },
  { id: "backup", label: "Backup data penting (foto, kontak)" },
];

const REPORT_GUIDES = [
  {
    case: "OTP / akun bobol",
    steps: ["Blokir kartu/akun lewat aplikasi bank", "Hubungi call center resmi bank", "Ganti password & logout semua sesi"],
    links: [
      { label: "Cek kontak resmi bank di OJK", href: "https://ojk.go.id" },
    ],
  },
  {
    case: "Penipuan uang (transfer)",
    steps: ["Lapor bank untuk pembekuan rekening tujuan", "Simpan bukti transfer & chat", "Lapor ke komisi apresiasi/kepolisian"],
    links: [
      { label: "aduankonten.id (Kominfo)", href: "https://aduankonten.id" },
      { label: "Lapor Polisi Online", href: "https://lapor.polri.go.id" },
    ],
  },
  {
    case: "Phishing / akun sosmed",
    steps: ["Ganti password dari aplikasi resmi (bukan link)", "Aktifkan 2FA", "Laporkan akun/link ke platform"],
    links: [
      { label: "Lapor konten aduankonten.id", href: "https://aduankonten.id" },
    ],
  },
];

const CASES = [
  { id: "otp", label: "Pencurian OTP/akun" },
  { id: "uang", label: "Penipuan uang/investasi" },
  { id: "kerja", label: "Scam lowongan kerja" },
  { id: "giveaway", label: "Giveaway/phishing palsu" },
];

const TEMPLATES: Record<string, string> = {
  otp: "Hei {teman}! Hati-hati ya: penipu sering pura-pura jadi teman/bank dan minta kode OTP. OTP itu kunci akun — jangan pernah dikasih ke siapa pun. Kalau ragu, telepon langsung orangnya di nomor lama. 🙏",
  uang: "Hei {teman}! Hati-hati sama tawaran investasi 'profit pasti/dijamin' atau minta transfer ke rekening pribadi. Investasi asli selalu ada risiko. Cek legalitasnya di situs OJK dulu ya sebelum nabung. 💸",
  kerja: "Hei {teman}! Hati-hati lowongan 'gaji besar, WFH, tanpa pengalaman' yang minta bayar biaya training atau foto KTP. Perusahaan resmi nggak pernah minta uang dari pelamar. Cek dulu legalitasnya ya! 🙏",
  giveaway: "Hei {teman}! Kalau ada DM 'kamu menang giveaway, bayar ongkir/isi data kartu' — itu scam. Hadiah asli nggak minta bayaran. Verifikasi lewat akun resmi kreatornya ya! 🎁",
};

export default function ActPage() {
  const [checked, setChecked] = useState<string[]>([]);
  const [kasing, setKasing] = useState("otp");
  const [teman, setTeman] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKLIST_KEY);
      if (raw) setChecked(JSON.parse(raw));
    } catch {}
  }, []);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  const draft = TEMPLATES[kasing].replaceAll("{teman}", teman.trim() || "kamu");
  const progress = Math.round((checked.length / CHECKLIST.length) * 100);

  function share() {
    navigator.clipboard.writeText(draft).then(() => setCopied(true));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Lindungi Diri & Peringatkan Orang Lain</h1>
      </div>

      {/* Checklist */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Security Checklist <span className="text-sm font-normal text-zinc-500">({progress}% selesai)</span>
        </h2>
        <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div className="h-2 rounded-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <ul className="space-y-2">
          {CHECKLIST.map((item) => (
            <li key={item.id}>
              <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
                <input type="checkbox" checked={checked.includes(item.id)} onChange={() => toggle(item.id)} className="size-4" />
                {item.label}
              </label>
            </li>
          ))}
        </ul>
        <p className="text-xs text-zinc-500">Progress tersimpan di perangkat kamu (localStorage), tanpa data pribadi.</p>
      </section>

      {/* Panduan pelaporan */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Panduan Pelaporan</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {REPORT_GUIDES.map((g) => (
            <div key={g.case} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="font-semibold">{g.case}</p>
              <ol className="mt-2 list-decimal list-inside space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                {g.steps.map((s) => <li key={s}>{s}</li>)}
              </ol>
              <div className="mt-3 flex flex-wrap gap-2">
                {g.links.map((l) => (
                  <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
                     className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                    {l.label} ↗
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Generator peringatan */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Peringatkan Teman</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Buat draf pesan peringatan untuk dibagikan. Semuanya dibuat di perangkatmu — tidak ada yang dikirim ke server.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={kasing}
            onChange={(e) => { setKasing(e.target.value); setCopied(false); }}
            className="rounded border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            aria-label="Jenis kasus"
          >
            {CASES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <input
            value={teman}
            onChange={(e) => setTeman(e.target.value)}
            placeholder="Nama panggilan teman (opsional)"
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <textarea readOnly value={draft} rows={4}
          className="w-full rounded-lg border border-zinc-300 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        <div className="flex flex-wrap gap-2">
          <button onClick={share}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
            {copied ? "Tersalin ✓" : "Salin pesan"}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(draft)}`}
            target="_blank" rel="noopener noreferrer"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700">
            Bagikan via WhatsApp ↗
          </a>
        </div>
      </section>
    </div>
  );
}
