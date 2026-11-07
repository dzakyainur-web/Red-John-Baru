// Konstanta label murni (tanpa "use cache"): aman diimpor komponen klien.
// Next 16 menolak file ber-"use cache" inline di dalam Client Component.

export const CATEGORY_LABEL: Record<string, string> = {
  fake_job: "Kerja palsu",
  phishing_link: "Phishing",
  giveaway_palsu: "Hadiah palsu",
  malware_apk: "Malware APK",
  pinjol_ilegal: "Pinjol ilegal",
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
