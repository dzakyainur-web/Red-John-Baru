/**
 * Analisis URL sisi klien — tanpa jaringan, tanpa pihak ketiga.
 *
 * Semua pemeriksaan di sini bekerja pada string URL saja. Probe halaman
 * (`probePage`) opsional dan akan gagal untuk situs yang tidak mengirim
 * header CORS — itu keterbatasan browser, bukan bug.
 */

export type Severity = "tinggi" | "sedang" | "rendah";

export type Finding = {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
};

export type UrlReport = {
  input: string;
  normalized: string | null;
  host: string | null;
  findings: Finding[];
  score: number;
  level: "low" | "medium" | "high";
};

export const OFFICIAL_DOMAINS = [
  "bca.co.id",
  "bri.co.id",
  "mandiri.co.id",
  "bni.co.id",
  "btn.co.id",
  "bi.go.id",
  "ojk.go.id",
  "kominfo.go.id",
  "telkomsel.com",
  "whatsapp.com",
  "instagram.com",
  "tiktok.com",
];

export const SHORTLINK_HOSTS = new Set([
  "bit.ly", "bitly.com", "tinyurl.com", "t.co", "goo.gl", "cutt.ly", "shorturl.at",
  "s.id", "rebrand.ly", "is.gd", "rb.gy", "tiny.cc", "linktr.ee", "ow.ly", "buff.ly",
]);

export const SUSPICIOUS_TLDS = new Set([
  "xyz", "top", "click", "online", "site", "icu", "buzz", "rest", "loan", "win",
  "gq", "cf", "tk", "ml", "zip", "mov", "shop",
]);

const REDIRECT_PARAMS = ["url", "next", "redirect", "redirect_uri", "target", "dest", "continue", "goto"];

// Satu temuan tinggi = medium (45); tinggi + sedang = 70 = high.
const WEIGHT: Record<Severity, number> = { tinggi: 45, sedang: 25, rendah: 8 };

/** Levenshtein klasik — cukup untuk membandingkan label domain pendek. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

export function parseUrl(input: string): URL | null {
  const raw = input.trim();
  if (!raw) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".") && !/^\d+\.\d+\.\d+\.\d+$/.test(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

function isIpLiteral(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":");
}

function typosquat(host: string): { official: string; how: string } | null {
  for (const official of OFFICIAL_DOMAINS) {
    if (host === official || host.endsWith(`.${official}`)) continue;
    const base = official.split(".")[0];
    const folded = host.replace(/-/g, "");
    if (folded.includes(base)) return { official, how: `mengandung nama "${base}" di luar domain resmi` };
    for (const label of host.split(".")) {
      if (label === base || label.length < 3) continue;
      const distance = levenshtein(label, base);
      const limit = base.length > 4 ? 2 : 1;
      if (distance <= limit) {
        return { official, how: `label "${label}" mirip "${base}" (jarak ${distance})` };
      }
    }
  }
  return null;
}

export function inspectUrl(input: string): UrlReport {
  const url = parseUrl(input);
  if (!url) {
    return {
      input,
      normalized: null,
      host: null,
      findings: [{
        id: "U00",
        severity: "rendah",
        title: "Bukan URL yang bisa dibaca",
        detail: "Masukkan alamat seperti contoh.com atau https://contoh.com/login.",
      }],
      score: 0,
      level: "low",
    };
  }

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  const tld = host.split(".").pop() ?? "";
  const findings: Finding[] = [];
  const add = (id: string, severity: Severity, title: string, detail: string) =>
    findings.push({ id, severity, title, detail });

  if (url.protocol === "http:") {
    add("U01", "sedang", "Tidak memakai HTTPS",
      "Isi halaman bisa dibaca/diubah di jalan. Situs resmi tidak lagi memakai http:// untuk login.");
  }
  if (isIpLiteral(host)) {
    add("U02", "tinggi", "Alamat IP langsung",
      "Situs resmi memakai nama domain. Alamat IP dipakai untuk menyembunyikan siapa pemiliknya.");
  }
  if (host.startsWith("xn--") || host.includes(".xn--")) {
    add("U03", "tinggi", "Domain punycode",
      "Huruf aslinya bukan Latin — sering dipakai meniru domain resmi secara visual.");
  }
  if (SHORTLINK_HOSTS.has(host)) {
    add("U04", "sedang", "Shortlink",
      `Tujuan asli ${host} baru terlihat setelah dibuka. Ketik sendiri alamat situs resminya.`);
  } else if (SUSPICIOUS_TLDS.has(tld) && !host.endsWith(".shop.id")) {
    add("U05", "sedang", `Akhiran .${tld} tidak umum`,
      "Domain murah yang sering dipakai untuk kampanye phishing jangka pendek.");
  }
  const squat = typosquat(host);
  if (squat) {
    add("U06", "tinggi", `Meniru domain ${squat.official}`, `Domain ini ${squat.how}.`);
  }
  if (url.username || url.password) {
    add("U07", "tinggi", "URL berisi kredensial",
      "Format user:password@host dipakai untuk menyamarkan tujuan sebenarnya.");
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    add("U08", "sedang", `Port tidak lazim (:${url.port})`,
      "Situs publik hampir selalu di 80/443. Port lain menandakan server tak biasa.");
  }
  const labels = host.split(".");
  if (labels.length >= 5) {
    add("U09", "sedang", "Subdomain terlalu banyak",
      `${labels.length - 2} subdomain dipakai agar bagian penting nama domain tidak terlihat di HP.`);
  }
  for (const [key, value] of url.searchParams) {
    if (REDIRECT_PARAMS.includes(key.toLowerCase()) && /^https?:\/\//i.test(value)) {
      add("U10", "sedang", "Parameter pengalihan",
        `?${key}= berisi alamat lain — halaman asal bisa melempar kamu ke situs mana pun.`);
      break;
    }
  }
  if (url.pathname.length > 60 && (url.pathname.match(/\//g) ?? []).length > 4) {
    add("U11", "rendah", "Path sangat panjang",
      "Path berlapis sering dipakai untuk meniru tampilan dan membuat URL sulit diperiksa.");
  }
  if (host.length > 30) {
    add("U12", "rendah", "Domain panjang",
      "Nama domain panjang dengan banyak tanda hubung sering dipakai menyamarkan brand.");
  }

  const score = Math.min(100, findings.reduce((sum, f) => sum + WEIGHT[f.severity], 0));
  const level = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
  return { input, normalized: url.toString(), host, findings, score, level };
}

export type ProbeResult =
  | { ok: false; reason: string }
  | {
      ok: true;
      finalUrl: string;
      status: number;
      contentType: string | null;
      bytes: number;
      title: string | null;
      hasPasswordField: boolean;
      otpMentions: string[];
      metaRefresh: string | null;
      externalScripts: number;
    };

/**
 * Coba ambil halaman dari browser. Gagal untuk situs tanpa header CORS —
 * browser tidak mengizinkan membaca respons lintas origin. Tidak ada proxy.
 */
export async function probePage(rawUrl: string, timeoutMs = 6000): Promise<ProbeResult> {
  const url = parseUrl(rawUrl);
  if (!url) return { ok: false, reason: "URL tidak valid." };
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      mode: "cors",
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    const name = e instanceof Error ? e.name : String(e);
    return {
      ok: false,
      reason: name === "TimeoutError"
        ? `Tidak ada jawaban dalam ${timeoutMs / 1000} detik.`
        : "Browser memblokir pembacaan halaman ini (situs tidak mengirim header CORS). " +
          "Analisis URL di atas tetap berlaku; isi halaman tidak bisa diperiksa tanpa proxy server.",
    };
  }

  let text = "";
  try {
    text = (await res.text()).slice(0, 200_000);
  } catch {
    return { ok: false, reason: "Respons tidak bisa dibaca (CORS atau isi bukan teks)." };
  }

  const title = text.match(/<title[^>]*>([^<]{1,200})<\/title>/i)?.[1]?.trim() ?? null;
  const hasPasswordField = /<input[^>]+type\s*=\s*["']?password/i.test(text);
  const otpMentions = ["otp", "kode verifikasi", "pin", "m-banking", "one-time"].filter((k) =>
    text.toLowerCase().includes(k),
  );
  const metaRefresh = text.match(/<meta[^>]+http-equiv\s*=\s*["']?refresh["']?[^>]*content\s*=\s*["']([^"']+)/i)?.[1] ?? null;
  const host = url.hostname;
  const externalScripts = new Set(
    Array.from(text.matchAll(/<script[^>]+src\s*=\s*["']([^"']+)/gi))
      .map((m) => m[1])
      .filter((src) => {
        try {
          return new URL(src, url).hostname !== host;
        } catch {
          return false;
        }
      }),
  ).size;

  return {
    ok: true,
    finalUrl: res.url || url.toString(),
    status: res.status,
    contentType: res.headers.get("content-type"),
    bytes: text.length,
    title,
    hasPasswordField,
    otpMentions,
    metaRefresh,
    externalScripts,
  };
}
