"use client";

/**
 * Golden-Hour Recovery Packet — wizard 6 layar (spec 5.1 F1–F4).
 *
 * Prinsip yang dijaga:
 *  - Tidak ada request jaringan saat mengisi form. Satu-satunya fetch adalah
 *    institusi.json (statis) saat halaman dibuka.
 *  - Tidak ada endpoint simpan. Data hanya di localStorage perangkat korban.
 *  - Nomor hotline hanya tampil bila lolos hotlineAvailable() (§5).
 *  - Bahasa tidak menuduh; tidak pernah menjanjikan dana kembali.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CHECKLIST_STEPS,
  CHANNEL_LABEL,
  PRETEXT_LABEL,
  autoNarrative,
  buildDocuments,
  buildManifest,
  detectSensitive,
  emptyCase,
  formatDuration,
  hotlineAvailable,
  minutesSinceTransfer,
  randomId,
  sanitizeNotes,
  sha256Hex,
  GHP_STORAGE_KEY,
  type Channel,
  type GhpCase,
  type InstitutionDirectory,
  type Pretext,
  type TransferCount,
} from "@/lib/ghp";

const INSTITUSI_URL = "/data/institusi.json";

const inputCls =
  "w-full min-h-12 rounded-lg border border-white/20 bg-white/[0.06] px-3 py-2.5 text-base text-white placeholder:text-zinc-500 focus:border-white/60 focus:outline-none";
const labelCls = "block text-sm font-medium text-zinc-200";
const cardCls = "rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 space-y-4";
const optTag = <span className="text-xs font-normal text-zinc-500">(opsional)</span>;

type Screen = 0 | 1 | 2 | 3 | 4 | 5;

function loadStored(): GhpCase | null {
  try {
    const raw = localStorage.getItem(GHP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GhpCase>;
    if (parsed?.schema !== "ghp/1") return null;
    return { ...emptyCase(), ...parsed } as GhpCase;
  } catch {
    return null;
  }
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function GoldenHourWizard() {
  // Cache Components: nilai waktu/random dilarang muncul di HTML prerender. Kasus
  // kosong dulu di HTML statis, lalu isian tersimpan (localStorage) menyusul saat
  // mount. Ini setState-di-effect yang memang perlu (localStorage & fetch hanya ada
  // di klien), jadi aturan set-state-in-effect dimatikan khusus effect ini.
  const [hydrated, setHydrated] = useState(false);
  const [screen, setScreen] = useState<Screen>(0);
  const [c, setC] = useState<GhpCase>(() => emptyCase(new Date(0)));
  const [dir, setDir] = useState<InstitutionDirectory | null>(null);
  const [dirError, setDirError] = useState(false);
  const [now, setNow] = useState(0);
  const [sensitive, setSensitive] = useState<string[]>([]);
  const [hashError, setHashError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const stored = loadStored();
    const nowIso = new Date().toISOString();
    if (stored) {
      setC(stored.case_id ? stored : { ...stored, case_id: randomId() });
    } else {
      // Prerender memakai tanggal epoch; sekarang (di klien) diganti waktu sebenarnya.
      const fresh = { ...emptyCase(), case_id: randomId() };
      fresh.created_at = nowIso;
      fresh.timing = { ...fresh.timing, last_transfer_at: nowIso, discovered_at: nowIso };
      fresh.transfers[0].transfer_at = nowIso;
      setC(fresh);
    }
    setNow(Date.now());
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    let cancelled = false;
    fetch(INSTITUSI_URL)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<InstitutionDirectory>;
      })
      .then((d) => !cancelled && setDir(d))
      .catch(() => !cancelled && setDirError(true));
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      cancelled = true;
      clearInterval(tick);
    };
  }, []);

  // Simpan (debounce 300 ms) ke localStorage — hanya setelah isian tersimpan dimuat.
  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(GHP_STORAGE_KEY, JSON.stringify(c));
      } catch {
        /* mode privat / penuh — data tetap hidup di sesi ini */
      }
    }, 300);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [c, hydrated]);

  const minutes = minutesSinceTransfer(c.timing.last_transfer_at, new Date(now));
  const t0 = c.transfers[0];
  const t0Bank = dir?.banks.find((b) => b.code === t0?.destination_bank) ?? null;
  const srcBank = dir?.banks.find((b) => b.code === t0?.source_bank) ?? null;

  function update(patch: Partial<GhpCase>) {
    setC((prev) => ({ ...prev, ...patch }));
  }
  function updateT0(patch: Partial<GhpCase["transfers"][number]>) {
    setC((prev) => ({ ...prev, transfers: [{ ...prev.transfers[0], ...patch }, ...prev.transfers.slice(1)] }));
  }

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setHashError(null);
    const next = await Promise.all(
      [...files].map(async (f) => {
        let sha: string | null = null;
        try {
          sha = await sha256Hex(f);
        } catch {
          setHashError("Sebagian file tidak bisa di-hash di browser ini. File tetap bisa dilampirkan tanpa hash.");
        }
        return { filename: f.name, size_bytes: f.size, sha256: sha, added_at: new Date().toISOString() };
      }),
    );
    setC((prev) => ({ ...prev, evidence: [...prev.evidence, ...next] }));
  }

  function onNotesChange(value: string) {
    const hits = detectSensitive(value);
    setSensitive(hits);
    // Isian sensitif tidak pernah disimpan ke state/dokumen (§8, R4).
    const safe = hits.length ? sanitizeNotes(value) : value;
    update({ narrative: { ...c.narrative, user_notes: safe } });
  }

  function finish() {
    const next: GhpCase = {
      ...c,
      timing: { ...c.timing, packet_generated_at: new Date().toISOString() },
      narrative: { ...c.narrative, auto_generated: autoNarrative(c, dir) },
    };
    setC(next);
    setScreen(5);
  }

  function downloadAll() {
    if (!c.timing.packet_generated_at) return;
    const docs = buildDocuments(c, dir);
    const manifest = buildManifest(
      c,
      [
        ...docs.map((d) => ({ path: d.filename, sha256: null, size_bytes: new Blob([d.content]).size })),
        ...c.evidence.map((e) => ({ path: `04-bukti/${e.filename}`, sha256: e.sha256, size_bytes: e.size_bytes })),
      ],
    );
    const all = [...docs, { filename: "05-manifest.json", content: JSON.stringify(manifest, null, 2) }];
    for (const f of all) {
      const url = URL.createObjectURL(new Blob([f.content], { type: "text/plain;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = f.filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  function resetAll() {
    if (!confirm("Hapus semua data paket ini dari perangkat Anda? Tindakan ini tidak bisa dibatalkan.")) return;
    try {
      localStorage.removeItem(GHP_STORAGE_KEY);
    } catch {
      /* abaikan */
    }
    setC({ ...emptyCase(), case_id: randomId() });
    setSensitive([]);
    setScreen(0);
  }

  const canNext: Record<Screen, boolean> = useMemo(
    () => ({
      0: true,
      1: Boolean(c.timing.last_transfer_at),
      2: Boolean(t0?.destination_bank && t0?.amount_idr > 0),
      3: true,
      4: Boolean(c.victim.full_name.trim() && c.victim.phone.trim() && c.victim.city.trim()),
      5: true,
    }),
    [c, t0],
  );

  const docs = screen === 5 ? buildDocuments(c, dir) : [];

  // ── Chrome lintas layar ────────────────────────────────────────────────────
  const progress = screen === 5 ? 100 : Math.round((screen / 5) * 100);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 sm:px-6">
      {screen > 0 && screen < 5 && (
        <div className="sticky top-0 z-10 -mx-4 mb-6 bg-[#0c0d0d]/95 px-4 pb-3 pt-3 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="flex items-center justify-between text-sm text-zinc-300">
            <button type="button" onClick={() => setScreen((s) => (s - 1) as Screen)} className="min-h-11 px-2 font-medium text-white underline underline-offset-4">
              &larr; Kembali
            </button>
            <span>
              Langkah {screen} dari 5 &middot; {progress}%
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#3ECF8E] transition-all" style={{ width: `${Math.max(progress, 4)}%` }} />
          </div>
        </div>
      )}

      {/* ───────── LAYAR 0 — DARURAT ───────── */}
      {screen === 0 && (
        <div className="space-y-6 pt-8">
          <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">Uang sudah terlanjur dikirim?</h1>
          <p className="text-lg leading-relaxed text-zinc-200">
            Uang yang sudah dikirim mungkin tidak bisa kembali. Tetapi semakin cepat bank diberi tahu, semakin besar
            peluang dana ditahan. Lakukan langkah pertama dalam 5 menit ke depan.
          </p>
          <button type="button" onClick={() => setScreen(1)} className="btn btn-primary min-h-16 w-full text-lg">
            Saya sudah transfer ke pihak yang menipu
          </button>
          <div className="space-y-1 text-center text-base">
            <button type="button" onClick={() => setScreen(1)} className="inline min-h-11 text-zinc-200 underline underline-offset-4">
              Belum transfer, saya sedang dihubungi
            </button>
            <br />
            <button type="button" onClick={() => setScreen(1)} className="inline min-h-11 text-zinc-200 underline underline-offset-4">
              Saya hanya ingin melapor
            </button>
          </div>
          <div className="rounded-xl border border-amber-300/40 bg-amber-300/10 p-4 text-base text-amber-100">
            <strong className="block text-amber-50">Jangan kirim uang lagi.</strong>
            Jangan beri tahu pihak tersebut bahwa Anda sudah sadar. Jangan hubungi lagi dan simpan semua chat serta bukti
            transfer.
          </div>
          <p className="text-sm leading-relaxed text-zinc-400">
            Kami tidak bisa menjamin dana kembali. Yang bisa dilakukan sekarang adalah mempercepat laporan resmi dan
            mengamankan akun Anda. Semua data yang Anda isi tetap di perangkat Anda — kami tidak menyimpannya.
          </p>
          {hydrated && c.transfers[0]?.amount_idr > 0 && (
            <p className="rounded-lg border border-white/10 p-3 text-sm text-zinc-300">
              Ada paket yang belum selesai di perangkat ini.{" "}
              <button type="button" onClick={() => setScreen(5)} className="font-semibold text-white underline underline-offset-4">
                Lanjutkan
              </button>
            </p>
          )}
        </div>
      )}

      {/* ───────── LAYAR 1 — WAKTU ───────── */}
      {screen === 1 && (
        <section className="space-y-5">
          <h1 className="text-2xl font-bold text-white">Kapan terakhir transfer?</h1>
          <div className={cardCls}>
            <label className={labelCls} htmlFor="last-transfer">
              Waktu transfer terakhir
            </label>
            <input
              id="last-transfer"
              type="datetime-local"
              value={toLocalInput(c.timing.last_transfer_at)}
              onChange={(e) => {
                const iso = e.target.value ? new Date(e.target.value).toISOString() : "";
                setC((prev) => ({
                  ...prev,
                  timing: { ...prev.timing, last_transfer_at: iso },
                  transfers: [{ ...prev.transfers[0], transfer_at: iso }, ...prev.transfers.slice(1)],
                }));
              }}
              className={inputCls}
            />
            <p className="text-2xl font-bold text-[#3ECF8E]">Sudah {formatDuration(minutes)} sejak transfer</p>
          </div>
          <fieldset className={cardCls}>
            <legend className={labelCls}>Berapa kali transfer?</legend>
            {([1, 2, 3] as TransferCount[]).map((n) => (
              <label key={n} className="flex min-h-11 cursor-pointer items-center gap-3 text-base text-zinc-100">
                <input
                  type="radio"
                  name="count"
                  checked={c.timing.transfer_count === n}
                  onChange={() => setC((prev) => ({ ...prev, timing: { ...prev.timing, transfer_count: n } }))}
                  className="size-5"
                />
                {n === 1 ? "1 kali" : n === 2 ? "2–3 kali" : "Lebih dari 3 kali"}
              </label>
            ))}
          </fieldset>
          <NextButton onClick={() => setScreen(2)} disabled={!canNext[1]} />
        </section>
      )}

      {/* ───────── LAYAR 2 — BANK ───────── */}
      {screen === 2 && (
        <section className="space-y-5">
          <h1 className="text-2xl font-bold text-white">Ke mana uangnya dikirim?</h1>
          {dirError && (
            <p role="alert" className="rounded-lg border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-100">
              Direktori bank gagal dimuat. Anda tetap bisa mengisi nama bank secara manual di catatan, lalu cari kanal
              resmi bank tersebut di situs resminya.
            </p>
          )}
          <div className={cardCls}>
            <label className={labelCls} htmlFor="dest-bank">
              Bank / e-wallet tujuan
            </label>
            <select id="dest-bank" value={t0.destination_bank} onChange={(e) => updateT0({ destination_bank: e.target.value })} className={inputCls}>
              <option value="">— pilih —</option>
              {dir?.banks.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                  {b.kind === "ewallet" ? " (e-wallet)" : ""}
                </option>
              ))}
            </select>
            <label className={labelCls} htmlFor="dest-account">
              Nomor rekening / akun tujuan
            </label>
            <input
              id="dest-account"
              inputMode="numeric"
              value={t0.destination_account}
              onChange={(e) => updateT0({ destination_account: e.target.value.replace(/[^\d]/g, "") })}
              className={`${inputCls} font-mono`}
            />
            <label className={labelCls} htmlFor="dest-holder">
              Nama pemilik yang tertera
            </label>
            <input id="dest-holder" value={t0.destination_holder} onChange={(e) => updateT0({ destination_holder: e.target.value })} className={inputCls} />
            <label className={labelCls} htmlFor="amount">
              Nominal
            </label>
            <input
              id="amount"
              inputMode="numeric"
              value={t0.amount_idr ? t0.amount_idr.toLocaleString("id-ID") : ""}
              onChange={(e) => updateT0({ amount_idr: Number(e.target.value.replace(/\D/g, "")) || 0 })}
              placeholder="2.500.000"
              className={inputCls}
            />
            <label className={labelCls} htmlFor="src-bank">
              Bank pengirim (rekening Anda)
            </label>
            <select id="src-bank" value={t0.source_bank} onChange={(e) => updateT0({ source_bank: e.target.value })} className={inputCls}>
              <option value="">— pilih —</option>
              {dir?.banks.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          {t0Bank && <BankContact bank={t0Bank} role="tujuan" />}
          {srcBank && srcBank.code !== t0Bank?.code && <BankContact bank={srcBank} role="pengirim" />}
          <NextButton onClick={() => setScreen(3)} disabled={!canNext[2]} />
        </section>
      )}

      {/* ───────── LAYAR 3 — KANAL & BUKTI ───────── */}
      {screen === 3 && (
        <section className="space-y-5">
          <h1 className="text-2xl font-bold text-white">Bagaimana Anda dihubungi?</h1>
          <div className={cardCls}>
            <label className={labelCls} htmlFor="channel">
              Kanal kontak
            </label>
            <select
              id="channel"
              value={c.counterparty.channel ?? ""}
              onChange={(e) => setC((prev) => ({ ...prev, counterparty: { ...prev.counterparty, channel: (e.target.value || null) as Channel | null } }))}
              className={inputCls}
            >
              <option value="">— pilih —</option>
              {(Object.keys(CHANNEL_LABEL) as Channel[]).map((k) => (
                <option key={k} value={k}>
                  {CHANNEL_LABEL[k]}
                </option>
              ))}
            </select>
            <label className={labelCls} htmlFor="identifier">
              Nomor / akun pihak tersebut
            </label>
            <input
              id="identifier"
              value={c.counterparty.identifier}
              onChange={(e) => setC((prev) => ({ ...prev, counterparty: { ...prev.counterparty, identifier: e.target.value } }))}
              className={inputCls}
            />
            <label className={labelCls} htmlFor="pretext">
              Apa yang dijanjikan?
            </label>
            <select
              id="pretext"
              value={c.counterparty.pretext ?? ""}
              onChange={(e) => setC((prev) => ({ ...prev, counterparty: { ...prev.counterparty, pretext: (e.target.value || null) as Pretext | null } }))}
              className={inputCls}
            >
              <option value="">— pilih —</option>
              {(Object.keys(PRETEXT_LABEL) as Pretext[]).map((k) => (
                <option key={k} value={k}>
                  {PRETEXT_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
          <div className={cardCls}>
            <label className={labelCls} htmlFor="evidence">
              Bukti (screenshot, bukti transfer) {optTag}
            </label>
            <input
              id="evidence"
              type="file"
              multiple
              onChange={(e) => addFiles(e.target.files)}
              className="block w-full text-sm text-zinc-300 file:mr-3 file:min-h-11 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:text-sm file:font-medium file:text-white"
            />
            <p className="text-sm text-zinc-400">File tidak diunggah. Hanya hash SHA-256 yang dihitung di perangkat Anda.</p>
            {hashError && <p role="alert" className="text-sm text-amber-200">{hashError}</p>}
            {c.evidence.length > 0 && (
              <ul className="space-y-1 text-sm text-zinc-300">
                {c.evidence.map((e, i) => (
                  <li key={`${e.filename}-${i}`} className="break-all">
                    {e.filename}{" "}
                    <button
                      type="button"
                      onClick={() => setC((prev) => ({ ...prev, evidence: prev.evidence.filter((_, j) => j !== i) }))}
                      className="text-red-300 underline underline-offset-4"
                    >
                      hapus
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={cardCls}>
            <label className={labelCls} htmlFor="notes">
              Catatan kronologi singkat {optTag}
            </label>
            <textarea
              id="notes"
              rows={4}
              value={c.narrative.user_notes ?? ""}
              onChange={(e) => onNotesChange(e.target.value)}
              className={`${inputCls} resize-y`}
            />
            {sensitive.length > 0 && (
              <p role="alert" className="rounded-lg border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-100">
                Terdeteksi kata seperti OTP/PIN/password. Jangan tulis itu di sini — angka yang mengikutinya sudah dihapus
                dan tidak disimpan.
              </p>
            )}
            <button
              type="button"
              onClick={() => setC((prev) => ({ ...prev, narrative: { ...prev.narrative, user_notes: autoNarrative(prev, dir) } }))}
              className="btn min-h-11"
            >
              Bantu saya menulis
            </button>
          </div>
          <NextButton onClick={() => setScreen(4)} disabled={!canNext[3]} />
        </section>
      )}

      {/* ───────── LAYAR 4 — DATA PRIBADI ───────── */}
      {screen === 4 && (
        <section className="space-y-5">
          <h1 className="text-2xl font-bold text-white">Data untuk laporan</h1>
          <p className="rounded-lg border border-white/10 p-3 text-sm text-zinc-300">
            Data ini hanya ada di perangkat Anda dan di dokumen yang Anda unduh sendiri. Jangan minta atau berikan OTP,
            PIN, atau password kepada siapa pun — termasuk ke halaman ini.
          </p>
          <div className={cardCls}>
            <label className={labelCls} htmlFor="full-name">
              Nama lengkap
            </label>
            <input id="full-name" value={c.victim.full_name} onChange={(e) => setC((prev) => ({ ...prev, victim: { ...prev.victim, full_name: e.target.value } }))} className={inputCls} />
            <label className={labelCls} htmlFor="nik">
              NIK {optTag}
            </label>
            <input
              id="nik"
              inputMode="numeric"
              value={c.victim.nik ?? ""}
              onChange={(e) => setC((prev) => ({ ...prev, victim: { ...prev.victim, nik: e.target.value.replace(/\D/g, "") || null } }))}
              className={`${inputCls} font-mono`}
            />
            <label className={labelCls} htmlFor="phone">
              Nomor HP
            </label>
            <input id="phone" inputMode="tel" value={c.victim.phone} onChange={(e) => setC((prev) => ({ ...prev, victim: { ...prev.victim, phone: e.target.value } }))} className={inputCls} />
            <label className={labelCls} htmlFor="city">
              Kota
            </label>
            <input id="city" value={c.victim.city} onChange={(e) => setC((prev) => ({ ...prev, victim: { ...prev.victim, city: e.target.value } }))} className={inputCls} />
          </div>
          <NextButton onClick={finish} disabled={!canNext[4]} label="Buat paket laporan" />
        </section>
      )}

      {/* ───────── LAYAR 5 — PAKET SIAP ───────── */}
      {screen === 5 && (
        <section className="space-y-6 pt-6">
          <h1 className="text-3xl font-bold text-white">Paket laporan siap</h1>
          <div className="rounded-xl border border-amber-300/40 bg-amber-300/10 p-4 text-base text-amber-100">
            <strong className="block text-lg text-amber-50">Lakukan sekarang: telepon bank tujuan.</strong>
            Minta pemblokiran rekening tujuan dan penelusuran dana. Catat nomor tiketnya. Ini tidak menjamin dana
            kembali, tetapi mempercepat penanganan.
          </div>
          {(t0Bank || srcBank) && (
            <div className="space-y-3">
              {t0Bank && <BankContact bank={t0Bank} role="tujuan" />}
              {srcBank && srcBank.code !== t0Bank?.code && <BankContact bank={srcBank} role="pengirim" />}
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={downloadAll} className="btn btn-primary min-h-12">
              Unduh paket laporan
            </button>
            <button type="button" onClick={() => window.print()} className="btn min-h-12">
              Cetak / simpan PDF
            </button>
          </div>
          <div id="ghp-docs" className="space-y-4">
            {docs.map((d) => (
              <details key={d.filename} className="rounded-xl border border-white/10 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-white">{d.filename}</summary>
                <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-zinc-300">{d.content}</pre>
              </details>
            ))}
          </div>
          {c.evidence.length > 0 && (
            <p className="text-sm text-zinc-400">
              {c.evidence.length} file bukti tercatat (hash SHA-256). Salin file aslinya ke folder <code>04-bukti/</code>{" "}
              sebelum dibawa ke bank atau polisi.
            </p>
          )}
          <Checklist key={c.case_id} actions={c.actions} onChange={(actions) => update({ actions })} />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setScreen(0)} className="btn min-h-11">
              Mulai laporan baru
            </button>
            <button type="button" onClick={resetAll} className="btn min-h-11 border-red-400/50 text-red-200">
              Hapus semua data dari perangkat ini
            </button>
          </div>
          <p className="text-xs leading-relaxed text-zinc-500">
            Jangan pakai perangkat yang mungkin dipasangi aplikasi dari pihak tersebut. Jika ragu, buka dokumen ini di
            perangkat lain. Dokumen beralamat sah hanya dari kanal resmi Red John — jangan pakai tautan pendek.
          </p>
        </section>
      )}
    </div>
  );
}

function NextButton({ onClick, disabled, label = "Lanjut" }: { onClick: () => void; disabled: boolean; label?: string }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="btn btn-primary min-h-14 w-full text-lg disabled:opacity-50">
      {label}
    </button>
  );
}

function BankContact({ bank, role }: { bank: NonNullable<InstitutionDirectory["banks"][number]>; role: "tujuan" | "pengirim" }) {
  const tel = hotlineAvailable(bank);
  return (
    <div className="rounded-xl border border-white/15 bg-white/[0.05] p-4">
      <p className="text-sm text-zinc-300">Bank {role}</p>
      <p className="text-lg font-bold text-white">{bank.name}</p>
      {tel ? (
        <a href={`tel:${bank.hotline}`} className="btn btn-primary mt-3 min-h-12 w-full text-base">
          Telepon {bank.name} — {bank.hotline}
        </a>
      ) : (
        <>
          <p className="mt-2 text-sm text-zinc-300">
            Nomor call center belum terverifikasi, jadi tidak ditampilkan. Cari kanal resmi di situs bank:
          </p>
          <a href={bank.hotline_source_url} target="_blank" rel="noopener noreferrer" className="btn mt-2 min-h-11 break-all">
            Buka situs resmi {bank.name}
          </a>
        </>
      )}
      {role === "tujuan" && (
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Sebutkan &ldquo;transaksi tidak diotorisasi&rdquo; dan minta blokir rekening tujuan serta penelusuran dana.
        </p>
      )}
    </div>
  );
}

function Checklist({ actions, onChange }: { actions: GhpCase["actions"]; onChange: (a: GhpCase["actions"]) => void }) {
  const get = (key: string) => actions.find((a) => a.key === key);
  const nextIdx = CHECKLIST_STEPS.findIndex((s) => get(s.key)?.status !== "done" && get(s.key)?.status !== "skipped");
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-white">Checklist institusi</h2>
      <ol className="space-y-2">
        {CHECKLIST_STEPS.map((s, i) => {
          const a = get(s.key);
          const status = a?.status ?? "todo";
          const isNext = i === nextIdx;
          const set = (patch: Partial<NonNullable<typeof a>>) => {
            const base = { key: s.key, status: "todo" as const, done_at: null, reference_no: null, ...(a ?? {}), ...patch };
            onChange([...actions.filter((x) => x.key !== s.key), base]);
          };
          return (
            <li
              key={s.key}
              className={`rounded-xl border p-3 ${
                isNext ? "border-[#3ECF8E] bg-[#3ECF8E]/10" : status === "todo" ? "border-white/10 opacity-70" : "border-white/10"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{s.offset}</p>
              <p className="text-base font-semibold text-white">{s.title}</p>
              <p className="text-sm text-zinc-300">{s.detail}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {(["todo", "done", "skipped"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => set({ status: st, done_at: st === "done" ? new Date().toISOString() : null })}
                    className={`min-h-11 rounded-full border px-3 text-sm ${status === st ? "border-white bg-white text-black" : "border-white/20 text-zinc-200"}`}
                  >
                    {st === "todo" ? "Belum" : st === "done" ? "Selesai" : "Lewati"}
                  </button>
                ))}
                <input
                  aria-label={`Nomor tiket ${s.title}`}
                  placeholder="No. tiket"
                  value={a?.reference_no ?? ""}
                  onChange={(e) => set({ status: status === "todo" ? "done" : status, reference_no: e.target.value })}
                  className={`${inputCls} min-h-11 max-w-40 flex-1 text-sm`}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
