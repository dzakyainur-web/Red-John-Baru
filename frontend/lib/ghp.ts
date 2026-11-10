/**
 * Golden-Hour Recovery Packet (spec 5.1) — tipe `ghp/1` + generator teks.
 *
 * Aturan modul ini (lihat docs/spec-5.1-golden-hour-packet.txt):
 *  - Murni: tanpa React, tanpa fetch, tanpa localStorage. Semua input lewat argumen.
 *  - Tidak menyimpan apa pun. Data korban hanya hidup di state browser pemanggil.
 *  - Bahasa netral: "dugaan penipuan", "transaksi tidak diotorisasi". Tidak ada pihak
 *    yang dilabeli "penipu" di dokumen output (P5).
 */

export const GHP_SCHEMA = "ghp/1";
export const GHP_STORAGE_KEY = "ghp/1";

export type TransferCount = 1 | 2 | 3; // 3 = "lebih dari 3"
export type Channel = "whatsapp" | "telegram" | "sms" | "phone" | "marketplace" | "other";
export type Pretext = "investment" | "job" | "prize" | "refund" | "purchase" | "courier" | "other";
export type ActionStatus = "todo" | "done" | "skipped";

export type BankCode = string;

export interface GhpTransfer {
  destination_bank: BankCode;
  destination_account: string;
  destination_holder: string;
  amount_idr: number;
  source_bank: BankCode;
  transfer_at: string; // ISO-8601
  reference: string | null;
}

export interface GhpEvidence {
  filename: string;
  size_bytes: number;
  sha256: string | null; // null selama belum selesai di-hash
  added_at: string;
}

export interface GhpAction {
  key: string;
  status: ActionStatus;
  done_at: string | null;
  reference_no: string | null;
}

export interface GhpCase {
  schema: typeof GHP_SCHEMA;
  case_id: string;
  created_at: string;
  locale: "id-ID";
  timing: {
    last_transfer_at: string;
    discovered_at: string;
    packet_generated_at: string | null;
    transfer_count: TransferCount;
  };
  transfers: GhpTransfer[];
  counterparty: {
    channel: Channel | null;
    identifier: string;
    pretext: Pretext | null;
  };
  victim: {
    full_name: string;
    nik: string | null;
    phone: string;
    city: string;
  };
  narrative: {
    auto_generated: string;
    user_edited: string | null;
    user_notes: string | null;
  };
  evidence: GhpEvidence[];
  actions: GhpAction[];
}

/** Direktori institusi (public/data/institusi.json). */
export interface BankEntry {
  code: string;
  name: string;
  kind: "bank" | "bank_digital" | "ewallet";
  hotline: string | null;
  hotline_source_url: string;
  hotline_verified_at?: string | null;
  reversal_process?: string;
  reviewed_by?: string[] | null;
}
export interface InstitutionEntry {
  key: string;
  name: string;
  channel: string;
  source_url: string;
  deadline_hours: number | null;
  verified_at?: string | null;
}
export interface InstitutionDirectory {
  verified_at: string | null;
  banks: BankEntry[];
  institutions: InstitutionEntry[];
}

export const CHANNEL_LABEL: Record<Channel, string> = {
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  sms: "SMS",
  phone: "Panggilan telepon",
  marketplace: "Marketplace",
  other: "Lainnya",
};

export const PRETEXT_LABEL: Record<Pretext, string> = {
  investment: "investasi",
  job: "lowongan kerja",
  prize: "undian/hadiah",
  refund: "pengembalian dana",
  purchase: "jual-beli",
  courier: "kurir/paket",
  other: "lainnya",
};

const DISCLAIMER =
  "Dokumen ini disusun berdasarkan keterangan pelapor dan belum diverifikasi. Bukan merupakan tuduhan pidana.";

const MAX_HOTLINE_AGE_DAYS = 90;

// ─────────────────────────────────────────────────────────────────────────────
// Util kecil
// ─────────────────────────────────────────────────────────────────────────────

export function emptyCase(now: Date = new Date()): GhpCase {
  const iso = now.toISOString();
  return {
    schema: GHP_SCHEMA,
    // Dibuat saat kasus pertama kali diisi di klien (lihat wizard), bukan saat prerender.
    case_id: "",
    created_at: iso,
    locale: "id-ID",
    timing: {
      last_transfer_at: iso,
      discovered_at: iso,
      packet_generated_at: null,
      transfer_count: 1,
    },
    transfers: [
      {
        destination_bank: "",
        destination_account: "",
        destination_holder: "",
        amount_idr: 0,
        source_bank: "",
        transfer_at: iso,
        reference: null,
      },
    ],
    counterparty: { channel: null, identifier: "", pretext: null },
    victim: { full_name: "", nik: null, phone: "", city: "" },
    narrative: { auto_generated: "", user_edited: null, user_notes: null },
    evidence: [],
    actions: [],
  };
}

export function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function minutesSinceTransfer(lastTransferAt: string, now: Date = new Date()): number {
  const t = Date.parse(lastTransferAt);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((now.getTime() - t) / 60_000));
}

export function formatRupiah(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "Rp0";
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}

/** Normalisasi nomor/akun: digit saja (spec §3 `identifier_normalized`). */
export function normalizeIdentifier(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Format ISO ke waktu lokal Indonesia yang mudah dibaca di dokumen. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }) + " WIB";
}

export function formatDuration(min: number): string {
  if (min < 60) return `${min} menit`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h < 24) return m ? `${h} jam ${m} menit` : `${h} jam`;
  const d = Math.floor(h / 24);
  return m ? `${d} hari ${h % 24} jam` : `${d} hari`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Direktori: hotline hanya boleh tampil bila terverifikasi & masih segar (§5)
// ─────────────────────────────────────────────────────────────────────────────

export function bankName(code: string, dir?: InstitutionDirectory | null): string {
  return dir?.banks.find((b) => b.code === code)?.name ?? (code || "—");
}

export function hotlineAvailable(bank: BankEntry, now: Date = new Date()): boolean {
  if (!bank.hotline) return false;
  if (!bank.reviewed_by || bank.reviewed_by.length < 2) return false;
  const verified = bank.hotline_verified_at ?? null;
  if (!verified) return false;
  const ageMs = now.getTime() - Date.parse(verified);
  return ageMs >= 0 && ageMs <= MAX_HOTLINE_AGE_DAYS * 86_400_000;
}

// ─────────────────────────────────────────────────────────────────────────────
// Narratif otomatis ("bantu saya menulis")
// ─────────────────────────────────────────────────────────────────────────────

export function autoNarrative(c: GhpCase, dir?: InstitutionDirectory | null): string {
  const t = c.transfers[0];
  const parts: string[] = [];
  const when = formatDateTime(c.timing.last_transfer_at);
  const dest = t ? `${bankName(t.destination_bank, dir)}${t.destination_account ? ` a.n. ${t.destination_holder || "—"}` : ""}` : "—";
  parts.push(`Pada ${when}, saya melakukan transfer dana sebesar ${formatRupiah(t?.amount_idr ?? 0)} ke rekening ${dest}.`);
  if (c.counterparty.channel) {
    parts.push(
      `Transaksi berawal dari komunikasi melalui ${CHANNEL_LABEL[c.counterparty.channel]}${
        c.counterparty.identifier ? ` dengan akun ${c.counterparty.identifier}` : ""
      }.`,
    );
  }
  if (c.counterparty.pretext) {
    parts.push(`Pihak tersebut mengaku menawarkan ${PRETEXT_LABEL[c.counterparty.pretext]}.`);
  }
  parts.push(
    "Setelah transfer, saya menduga transaksi tersebut tidak sesuai perjanjian dan merupakan dugaan penipuan. Saya tidak dapat lagi menghubungi pihak tersebut.",
  );
  parts.push(`Saya meminta transaksi ini ditangani sebagai transaksi yang tidak saya otorisasi sesuai perjanjian awal.`);
  return parts.join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Deteksi data sensitif (OTP/PIN/password) — R4
// ─────────────────────────────────────────────────────────────────────────────

export type SensitiveHit = "otp" | "pin" | "password" | "card";

export function detectSensitive(text: string): SensitiveHit[] {
  const hits = new Set<SensitiveHit>();
  const lower = text.toLowerCase();
  if (/\botp\b|\bpasscode\b|kode\s+verifikasi|kode\s+(?:\d[\s-]?){4,8}\d/.test(lower)) hits.add("otp");
  if (/\bpin\b|kode\s+pin/.test(lower)) hits.add("pin");
  if (/password|kata\s+sandi|sandi/.test(lower)) hits.add("password");
  if (/\b(?:cvv|cvc)\b|3\s*digit\s+belakang/.test(lower)) hits.add("card");
  return [...hits];
}

/** Teks yang aman disimpan: peringatan OTP dibuang sebelum masuk localStorage/dokumen. */
export function sanitizeNotes(text: string): string {
  return text
    .replace(/\b\d{4,8}\b(?=\s*(?:adalah|itu|:)?\s*(?:kode|otp|pin))/gi, "[dihapus]")
    .replace(/\b(?:otp|pin|password|kata\s+sandi)\b(\s*[:=]?\s*)\d{4,8}/gi, "$1[dihapus]");
}

// ─────────────────────────────────────────────────────────────────────────────
// Generator dokumen
// ─────────────────────────────────────────────────────────────────────────────

function header(title: string, c: GhpCase): string {
  return [
    title,
    "=".repeat(Math.min(72, title.length)),
    `ID berkas: ${c.case_id}`,
    `Dibuat: ${formatDateTime(c.created_at)}`,
    "",
  ].join("\n");
}

function victimBlock(c: GhpCase): string {
  const v = c.victim;
  const lines = [
    "DATA PELAPOR",
    `Nama           : ${v.full_name || "—"}`,
    `Nomor HP       : ${v.phone || "—"}`,
    `Kota           : ${v.city || "—"}`,
  ];
  if (v.nik) lines.push(`NIK            : ${v.nik}`);
  return lines.join("\n");
}

function transferBlock(c: GhpCase, dir?: InstitutionDirectory | null): string {
  if (!c.transfers.length) return "DATA TRANSFER\n( belum diisi )";
  return [
    "DATA TRANSFER",
    ...c.transfers.map((t, i) =>
      [
        `#${i + 1} Tanggal       : ${formatDateTime(t.transfer_at)}`,
        `   Bank tujuan   : ${bankName(t.destination_bank, dir)}`,
        `   Rekening      : ${t.destination_account || "—"}`,
        `   Pemilik       : ${t.destination_holder || "—"}`,
        `   Nominal       : ${formatRupiah(t.amount_idr)}`,
        `   Bank pengirim : ${bankName(t.source_bank, dir)}`,
        t.reference ? `   Referensi     : ${t.reference}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    ),
  ].join("\n");
}

function counterpartyBlock(c: GhpCase): string {
  const cp = c.counterparty;
  return [
    "KANAL KONTAK",
    `Kanal          : ${cp.channel ? CHANNEL_LABEL[cp.channel] : "—"}`,
    `Akun/nomor     : ${cp.identifier || "—"}`,
    `Tawaran        : ${cp.pretext ? PRETEXT_LABEL[cp.pretext] : "—"}`,
  ].join("\n");
}

function narrativeBlock(c: GhpCase): string {
  const text = c.narrative.user_edited || c.narrative.user_notes || c.narrative.auto_generated;
  return ["RINGKASAN KRONOLOGI", text || "( belum diisi )"].join("\n");
}

function evidenceBlock(c: GhpCase): string {
  if (!c.evidence.length) return "LAMPIRAN BUKTI\n(belum ada bukti yang ditambahkan)";
  return [
    "LAMPIRAN BUKTI",
    ...c.evidence.map(
      (e, i) =>
        `${i + 1}. ${e.filename} (${e.size_bytes} byte) — SHA-256: ${e.sha256 ?? "belum dihitung"}`,
    ),
  ].join("\n");
}

export function buildBankLetter(c: GhpCase, dir?: InstitutionDirectory | null): string {
  const t = c.transfers[0];
  const bank = t ? bankName(t.destination_bank, dir) : "—";
  return [
    header("SURAT PERMOHONAN PEMBLOKIRAN REKENING & PENELUSURAN DANA", c),
    victimBlock(c),
    "",
    transferBlock(c, dir),
    "",
    counterpartyBlock(c),
    "",
    narrativeBlock(c),
    "",
    evidenceBlock(c),
    "",
    "PERMOHONAN",
    `Saya memohon kepada ${bank} untuk:`,
    "1. Memblokir rekening tujuan yang tercantum di atas.",
    "2. Menelusuri dan menahan dana yang masih berada di rekening tersebut.",
    "3. Memberikan nomor tiket/kasus untuk saya pantau.",
    "",
    "Saya menyatakan transaksi di atas dilakukan atas dasar perjanjian awal dengan pihak",
    "penerima yang tidak dipenuhi. Saya bersedia memberikan keterangan dan bukti tambahan.",
    "",
    "Hormat saya,",
    c.victim.full_name || "____________________",
    "",
    DISCLAIMER,
    "",
  ].join("\n");
}

export function buildPoliceDraft(c: GhpCase, dir?: InstitutionDirectory | null): string {
  const cp = c.counterparty;
  const terlapor = cp.identifier
    ? `akun/nomor ${cp.identifier} melalui ${cp.channel ? CHANNEL_LABEL[cp.channel] : "kanal daring"}`
    : "belum diketahui";
  return [
    header("DRAF LAPORAN KE SPKT (POLRI)", c),
    victimBlock(c),
    "",
    "URAIAN KEJADIAN",
    narrativeBlock(c),
    "",
    transferBlock(c, dir),
    "",
    "PIHAK TERLAPOR",
    `Terlapor: ${terlapor}.`,
    "",
    "BUKTI",
    evidenceBlock(c),
    "",
    "Pelapor menyampaikan laporan ini untuk ditindaklanjuti sesuai ketentuan yang berlaku.",
    "",
    DISCLAIMER,
    "",
  ].join("\n");
}

export function buildChronology(c: GhpCase, dir?: InstitutionDirectory | null): string {
  const rows: string[] = ["WAKTU | KEJADIAN | BUKTI"];
  rows.push(`${formatDateTime(c.timing.last_transfer_at)} | Transfer dana ${formatRupiah(c.transfers[0]?.amount_idr ?? 0)} ke ${bankName(c.transfers[0]?.destination_bank ?? "", dir)} | -`);
  if (c.counterparty.channel) {
    rows.push(`(sebelum transfer) | Komunikasi via ${CHANNEL_LABEL[c.counterparty.channel]}${c.counterparty.identifier ? ` (${c.counterparty.identifier})` : ""} | ${c.evidence.map((_, i) => `bukti ${i + 1}`).join(", ") || "-"}`);
  }
  rows.push(`${formatDateTime(c.timing.discovered_at)} | Menyadari dugaan penipuan | -`);
  if (c.timing.packet_generated_at) {
    rows.push(`${formatDateTime(c.timing.packet_generated_at)} | Paket laporan dibuat | manifest.json`);
  }
  return [header("KRONOLOGI KEJADIAN", c), ...rows, "", DISCLAIMER, ""].join("\n");
}

export interface ChecklistStep {
  key: string;
  offset: string; // label jam relatif
  title: string;
  detail: string;
}

/** Urutan tindakan berbasis jam (spec §6). Data, bukan fungsi waktu. */
export const CHECKLIST_STEPS: ChecklistStep[] = [
  { key: "bank_destination_block", offset: "T+0", title: "Telepon call center bank TUJUAN", detail: "Minta blokir rekening tujuan dan penahanan dana. Catat nomor tiket." },
  { key: "bank_source_block", offset: "T+0", title: "Telepon call center bank PENGIRIM", detail: "Minta blokir kartu/akun bila kredensial bocor. Catat nomor tiket." },
  { key: "iasc", offset: "T+15 menit", title: "Lapor ke IASC (kanal resmi)", detail: "Simpan nomor laporan." },
  { key: "cekrekening", offset: "T+30 menit", title: "Lapor CekRekening.id", detail: "Khusus rekening bank." },
  { key: "aduan_konten", offset: "T+1 jam", title: "Lapor Aduan Konten", detail: "Bila ada akun/APK/situs yang dipakai." },
  { key: "polisi", offset: "T+1 hari", title: "Lapor SPKT Polres", detail: "Bawa paket yang diunduh + bukti asli." },
  { key: "akun", offset: "T+1 hari", title: "Amankan akun", detail: "Ganti password, cabut sesi, aktifkan 2FA." },
  { key: "mutasi", offset: "T+3 hari", title: "Cek mutasi rekening", detail: "Bila ada transaksi lanjutan, ulangi T+0." },
];

export function buildChecklist(c: GhpCase): string {
  return [
    header("CHECKLIST PELAPORAN", c),
    "Isi kolom nomor tiket dengan tangan setelah tiap langkah selesai.",
    "",
    ...CHECKLIST_STEPS.map(
      (s, i) => `[ ] ${String(i + 1).padStart(2, "0")}. ${s.offset.padEnd(11)} ${s.title}\n     ${s.detail}\n     No. tiket: ______________________`,
    ),
    "",
    DISCLAIMER,
    "",
  ].join("\n");
}

export function buildReadme(c: GhpCase, dir?: InstitutionDirectory | null): string {
  const dest = c.transfers[0]?.destination_bank ? dir?.banks.find((b) => b.code === c.transfers[0].destination_bank) : null;
  return [
    header("BACA SAYA — PAKET LAPORAN GOLDEN HOUR", c),
    "Uang yang sudah dikirim mungkin tidak bisa kembali. Tetapi semakin cepat bank",
    "diberi tahu, semakin besar peluang dana ditahan.",
    "",
    "JANGAN hubungi pelaku lagi dan jangan beri tahu bahwa Anda sudah sadar.",
    "Simpan semua chat dan bukti transfer.",
    "",
    "ISI PAKET",
    "  01-laporan-bank.txt      Surat permohonan blokir & penelusuran dana",
    "  02-draft-laporan-polisi.txt  Draf kronologi untuk SPKT",
    "  03-kronologi.txt         Tabel waktu | kejadian | bukti",
    "  04-bukti/                File bukti asli (Anda tambahkan sendiri)",
    "  05-manifest.json         Daftar file + SHA-256",
    "  06-checklist.txt         Daftar institusi + kolom nomor tiket",
    "",
    "URUTAN TINDAKAN",
    ...CHECKLIST_STEPS.map((s) => `  ${s.offset.padEnd(11)} ${s.title}`),
    "",
    "KONTAK RESMI",
    ...(dir
      ? dir.banks
          .filter((b) => b.code === c.transfers[0]?.destination_bank || b.code === c.transfers[0]?.source_bank)
          .map((b) =>
            hotlineAvailable(b)
              ? `  ${b.name}: ${b.hotline} (sumber: ${b.hotline_source_url})`
              : `  ${b.name}: cari kanal resmi di ${b.hotline_source_url}`,
          )
      : []),
    ...(dest && !hotlineAvailable(dest) ? [] : []),
    "",
    "Kami tidak bisa menjamin dana kembali. Yang bisa dilakukan sekarang adalah",
    "mempercepat laporan resmi dan mengamankan akun Anda.",
    "",
    "Semua data di paket ini tetap di perangkat Anda. Kami tidak menyimpannya.",
    "",
    DISCLAIMER,
    "",
  ].join("\n");
}

export interface ManifestFile {
  path: string;
  sha256: string | null;
  size_bytes: number;
}

export interface GhpManifest {
  case_id: string;
  generated_at: string;
  algorithm: "sha256";
  files: ManifestFile[];
  note: string;
}

export function buildManifest(c: GhpCase, files: ManifestFile[], now: Date = new Date()): GhpManifest {
  return {
    case_id: c.case_id,
    generated_at: now.toISOString(),
    algorithm: "sha256",
    files: files.map((f) => ({ path: f.path, sha256: f.sha256, size_bytes: f.size_bytes })),
    note: "Hash dihitung di perangkat pelapor saat file ditambahkan.",
  };
}

/** Satu dokumen bertanda tangan pelapor siap unduh. */
export function buildDocuments(c: GhpCase, dir?: InstitutionDirectory | null): { filename: string; content: string }[] {
  return [
    { filename: "00-BACA-SAYA.txt", content: buildReadme(c, dir) },
    { filename: "01-laporan-bank.txt", content: buildBankLetter(c, dir) },
    { filename: "02-draft-laporan-polisi.txt", content: buildPoliceDraft(c, dir) },
    { filename: "03-kronologi.txt", content: buildChronology(c, dir) },
    { filename: "06-checklist.txt", content: buildChecklist(c) },
  ];
}

/** Hash SHA-256 file di browser. Tidak ada unggahan. */
export async function sha256Hex(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
