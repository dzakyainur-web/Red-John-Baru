// Konstanta label murni (tanpa "use cache"): aman diimpor komponen klien.
// Next 16 menolak file ber-"use cache" inline di dalam Client Component.

export const CATEGORY_LABEL: Record<string, string> = {
  fake_job: "Kerja Palsu",
  phishing_link: "Phishing & Web",
  giveaway_palsu: "Hadiah Palsu",
  malware_apk: "Malware APK",
  pinjol_ilegal: "Pinjol & Investasi",
  social_engineering: "Rekayasa Sosial & OTP",
  quishing: "QRIS Palsu (Quishing)",
  crypto_scam: "Investasi Kripto Bodong",
};

// Label yang tampil di kartu berita (/berita + landing).
export const NEWS_CATEGORY_NAMES: Record<string, string> = {
  all: "All",
  engineering: "Engineering",
  security: "Security",
  malware_apk: "Malware APK",
  quishing: "Quishing QRIS",
  social_engineering: "Rekayasa Sosial",
  phishing_link: "Phishing Web",
  fake_job: "Kerja Freelance",
  pinjol_ilegal: "Pinjol Ilegal",
  crypto_scam: "Kripto Bodong",
  giveaway_palsu: "Hadiah Palsu",
  general: "General",
  press: "Press",
};

export function formatCardDate(value: string | null): string {
  if (!value) return "Terbaru";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Terbaru";
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

export const CATEGORY_STYLES:Record<string, { bg: string; text: string; border: string }> = {
  malware_apk: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/30",
  },
  phishing_link: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
  social_engineering: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/30",
  },
  fake_job: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  pinjol_ilegal: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
  giveaway_palsu: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  quishing: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
  },
  crypto_scam: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/30",
  },
};

// Tanggal absolut (bukan "x hari lalu") supaya render server == klien.
const DATE_FORMAT = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

export function formatNewsDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : DATE_FORMAT.format(date);
}
