"use client";

import { useState, useSyncExternalStore } from "react";
import { PageHead, SourceNote } from "@/components/ui";

const CHECKLIST_KEY = "guardianai-checklist";
const EMPTY: string[] = [];

/* Checklist tersimpan di localStorage. useSyncExternalStore dipakai supaya render
   server ([]) dan klien (isi tersimpan) tidak bentrok, tanpa setState di effect. */
const listeners = new Set<() => void>();
let cache: string[] | null = null;

function readChecked(): string[] {
  if (cache) return cache;
  try {
    const raw = JSON.parse(localStorage.getItem(CHECKLIST_KEY) ?? "[]");
    cache = Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  } catch {
    cache = [];
  }
  return cache;
}

function writeChecked(next: string[]) {
  cache = next;
  try {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
  } catch {
    /* mode privat / storage penuh — centang tetap jalan di sesi ini */
  }
  for (const cb of listeners) cb();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function useChecked() {
  return useSyncExternalStore(subscribe, readChecked, () => EMPTY);
}

const CHECKLIST = [
  { id: "2fa", label: "Aktifkan 2FA di akun penting (WhatsApp, Instagram, email, m-banking)" },
  { id: "sessions", label: "Cek dan keluarkan sesi login dari perangkat asing" },
  { id: "otp", label: "Biasakan: OTP dan PIN tidak pernah dibagikan ke siapa pun" },
  { id: "privacy", label: "Batasi info publik — nomor, alamat, tanggal lahir" },
  { id: "updates", label: "Perbarui OS dan aplikasi secara rutin" },
  { id: "backup", label: "Cadangkan data penting (foto, kontak)" },
];

const REPORT_GUIDES = [
  {
    case: "OTP atau akun dibobol",
    steps: [
      "Blokir kartu/akun lewat aplikasi bank",
      "Hubungi call center resmi bank dari nomor di kartu atau situs resmi",
      "Ganti password dan keluarkan semua sesi login",
    ],
    links: [{ label: "Kontak bank di OJK", href: "https://ojk.go.id" }],
  },
  {
    case: "Penipuan uang atau transfer",
    steps: [
      "Minta bank membekukan rekening tujuan",
      "Simpan bukti transfer dan percakapan",
      "Laporkan ke kepolisian setempat",
    ],
    links: [
      { label: "aduankonten.id", href: "https://aduankonten.id" },
      { label: "Lapor Polisi Online", href: "https://lapor.polri.go.id" },
    ],
  },
  {
    case: "Phishing atau akun media sosial",
    steps: [
      "Ganti password dari aplikasi resmi, bukan dari tautan",
      "Aktifkan 2FA",
      "Laporkan akun atau tautan ke platform",
    ],
    links: [{ label: "aduankonten.id", href: "https://aduankonten.id" }],
  },
];

const CASES = [
  { id: "otp", label: "Pencurian OTP atau akun" },
  { id: "uang", label: "Penipuan uang atau investasi" },
  { id: "kerja", label: "Scam lowongan kerja" },
  { id: "giveaway", label: "Giveaway atau phishing palsu" },
];

const TEMPLATES: Record<string, string> = {
  otp: "Hei {teman}, hati-hati ya. Penipu sering pura-pura jadi teman atau bank dan minta kode OTP. OTP itu kunci akun, jangan pernah dikasih ke siapa pun. Kalau ragu, telepon langsung orangnya di nomor lama.",
  uang: "Hei {teman}, hati-hati dengan tawaran investasi yang menjanjikan profit pasti atau minta transfer ke rekening pribadi. Investasi asli selalu punya risiko. Cek legalitasnya di situs OJK dulu sebelum menyetor dana.",
  kerja: "Hei {teman}, hati-hati lowongan gaji besar yang minta biaya training atau foto KTP di awal. Perusahaan resmi tidak memungut biaya dari pelamar. Pastikan nama dan alamat kantornya bisa diverifikasi.",
  giveaway: "Hei {teman}, kalau ada DM bilang kamu menang giveaway lalu minta bayar ongkir atau isi data kartu, itu scam. Hadiah asli tidak minta bayaran dari pemenang. Cek dulu di akun resmi kreatornya.",
};

export default function ActPage() {
  const checked = useChecked();
  const [kasing, setKasing] = useState("otp");
  const [teman, setTeman] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const draft = TEMPLATES[kasing].replaceAll("{teman}", teman.trim() || "kamu");
  const progress = Math.round((checked.length / CHECKLIST.length) * 100);

  function toggle(id: string) {
    writeChecked(checked.includes(id) ? checked.filter((x) => x !== id) : [...checked, id]);
  }

  async function copy() {
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  }

  return (
    <div className="space-y-10">
      <PageHead
        title="Lindungi diri dan peringatkan orang lain"
        lead="Tiga langkah yang bisa dikerjakan hari ini. Semua di halaman ini berjalan di browser — tidak ada yang dikirim ke backend."
      />

      <section aria-labelledby="checklist-heading" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="checklist-heading" className="section-title">
            Checklist keamanan
          </h2>
          <p className="data tabular-nums">{progress}% selesai</p>
        </div>
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Kemajuan checklist"
          className="h-1.5 w-full bg-rule"
        >
          <div className="h-full bg-alert transition-[width]" style={{ width: `${progress}%` }} />
        </div>
        <ul className="border-t border-rule">
          {CHECKLIST.map((item) => {
            const on = checked.includes(item.id);
            return (
              <li key={item.id}>
                <label className="flex min-h-[3rem] cursor-pointer items-start gap-3 border-b border-rule px-1 py-3 text-sm transition-colors hover:bg-raised">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(item.id)}
                    className="mt-0.5 size-4 shrink-0 accent-[var(--alert)]"
                  />
                  <span className={on ? "text-muted line-through decoration-rule-strong" : ""}>{item.label}</span>
                </label>
              </li>
            );
          })}
        </ul>
        <SourceNote>Kemajuan hanya tersimpan di perangkat ini, tanpa akun dan tanpa data pribadi.</SourceNote>
      </section>

      <section aria-labelledby="report-heading" className="space-y-4">
        <h2 id="report-heading" className="section-title">
          Kalau sudah terlanjur
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {REPORT_GUIDES.map((g) => (
            <div key={g.case} className="panel flex flex-col p-4">
              <p className="font-semibold">{g.case}</p>
              <ol className="mt-2 flex-1 space-y-1.5 text-sm text-muted">
                {g.steps.map((s, i) => (
                  <li key={s} className="flex gap-2">
                    <span aria-hidden="true" className="data shrink-0 pt-0.5 text-alert">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-3 flex flex-wrap gap-2">
                {g.links.map((l) => (
                  <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="chip font-normal">
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="warn-heading" className="space-y-4">
        <h2 id="warn-heading" className="section-title">
          Peringatkan teman
        </h2>
        <p className="lead text-sm">
          Buat draf peringatan, lalu salin atau kirim lewat WhatsApp. Draf dibuat di perangkatmu.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="sm:w-64">
            <label htmlFor="kasus" className="mb-1 block text-xs text-muted">
              Jenis kasus
            </label>
            <select
              id="kasus"
              value={kasing}
              onChange={(e) => {
                setKasing(e.target.value);
                setCopied(false);
              }}
              className="field"
            >
              {CASES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="teman" className="mb-1 block text-xs text-muted">
              Nama panggilan teman (opsional)
            </label>
            <input
              id="teman"
              value={teman}
              onChange={(e) => {
                setTeman(e.target.value);
                setCopied(false);
              }}
              placeholder="mis. Dita"
              className="field"
            />
          </div>
        </div>
        <textarea readOnly value={draft} rows={4} aria-label="Draf pesan peringatan" className="field resize-y" />
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={copy} className="btn btn-primary">
            {copied ? "Pesan tersalin" : "Salin pesan"}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(draft)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
          >
            Buka di WhatsApp
          </a>
          {copyError && (
            <p role="alert" className="text-sm text-alert-ink">
              Browser menolak akses clipboard — salin teksnya manual.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
