import { describe, expect, test } from "bun:test";
import {
  autoNarrative,
  buildDocuments,
  buildManifest,
  detectSensitive,
  emptyCase,
  formatRupiah,
  hotlineAvailable,
  minutesSinceTransfer,
  normalizeIdentifier,
  sanitizeNotes,
  type BankEntry,
  type GhpCase,
  type InstitutionDirectory,
} from "./ghp";

const DIR: InstitutionDirectory = {
  verified_at: null,
  banks: [
    { code: "bca", name: "BCA", kind: "bank", hotline: null, hotline_source_url: "https://www.bca.co.id/" },
    { code: "mandiri", name: "Bank Mandiri", kind: "bank", hotline: "14000", hotline_source_url: "https://www.bankmandiri.co.id/", reviewed_by: ["a", "b"], hotline_verified_at: "2026-11-01" },
    { code: "bri", name: "BRI", kind: "bank", hotline: "14017", hotline_source_url: "https://bri.co.id/", reviewed_by: ["a", "b"], hotline_verified_at: "2025-01-01" },
  ],
  institutions: [],
};

function filled(): GhpCase {
  const c = emptyCase(new Date("2026-11-10T10:00:00+07:00"));
  c.case_id = "test-case";
  c.timing.discovered_at = "2026-11-10T10:12:00+07:00";
  c.transfers[0] = {
    destination_bank: "bca",
    destination_account: "1234567890",
    destination_holder: "Pihak Penerima",
    amount_idr: 2500000,
    source_bank: "mandiri",
    transfer_at: "2026-11-10T09:58:00+07:00",
    reference: null,
  };
  c.timing.last_transfer_at = c.transfers[0].transfer_at;
  c.counterparty = { channel: "whatsapp", identifier: "+62 812-3456-7890", pretext: "investment" };
  c.victim = { full_name: "Budi", nik: null, phone: "0812000000", city: "Bandung" };
  c.evidence = [{ filename: "bukti.png", size_bytes: 1234, sha256: "ab".repeat(32), added_at: c.created_at }];
  return c;
}

describe("waktu & format", () => {
  test("minutesSinceTransfer", () => {
    const now = new Date("2026-11-10T10:00:00+07:00");
    expect(minutesSinceTransfer("2026-11-10T09:30:00+07:00", now)).toBe(30);
    expect(minutesSinceTransfer("bukan tanggal", now)).toBe(0);
    expect(minutesSinceTransfer("2026-11-10T11:00:00+07:00", now)).toBe(0);
  });

  test("formatRupiah", () => {
    expect(formatRupiah(2500000)).toBe("Rp2.500.000");
    expect(formatRupiah(0)).toBe("Rp0");
  });

  test("normalizeIdentifier hanya huruf/angka", () => {
    expect(normalizeIdentifier("+62 812-ABCD")).toBe("62812abcd");
  });
});

describe("hotlineAvailable", () => {
  const now = new Date("2026-11-10T00:00:00Z");
  const base = DIR.banks[0];
  test("null selalu tersembunyi", () => {
    expect(hotlineAvailable(base, now)).toBe(false);
  });
  test("butuh 2 reviewer", () => {
    const b: BankEntry = { ...base, hotline: "1500888", reviewed_by: ["a"], hotline_verified_at: "2026-11-01" };
    expect(hotlineAvailable(b, now)).toBe(false);
  });
  test("lebih dari 90 hari disembunyikan", () => {
    expect(hotlineAvailable(DIR.banks[2], now)).toBe(false);
  });
  test("terverifikasi & segar tampil", () => {
    expect(hotlineAvailable(DIR.banks[1], now)).toBe(true);
  });
});

describe("detectSensitive", () => {
  test("menangkap OTP/PIN/password", () => {
    expect(detectSensitive("kode 482913 saya kirim ya")).toContain("otp");
    expect(detectSensitive("PIN ATM saya 123456")).toContain("pin");
    expect(detectSensitive("password saya admin")).toContain("password");
    expect(detectSensitive("transfer biasa saja")).toEqual([]);
  });
  test("sanitizeNotes membuang angka setelah kata kunci", () => {
    expect(sanitizeNotes("otp: 482913").includes("482913")).toBe(false);
  });
});

describe("autoNarrative", () => {
  test("memakai bahasa netral dan data transfer", () => {
    const text = autoNarrative(filled(), DIR);
    expect(text).toContain("Rp2.500.000");
    expect(text).toContain("BCA");
    expect(text).toContain("dugaan penipuan");
  });
});

describe("generator dokumen", () => {
  test("semua dokumen memuat disclaimer & tidak melabeli pihak sebagai 'penipu'", () => {
    const docs = buildDocuments(filled(), DIR);
    expect(docs.length >= 5).toBe(true);
    for (const d of docs) {
      expect(d.content).toContain("Bukan merupakan tuduhan pidana");
      expect(d.content.toLowerCase().includes("penipu ")).toBe(false);
      expect(/penipu(?!an)/.test(d.content)).toBe(false);
    }
  });

  test("surat bank meminta blokir & penelusuran", () => {
    const letter = buildDocuments(filled(), DIR).find((d) => d.filename === "01-laporan-bank.txt")!;
    expect(letter.content).toContain("Memblokir rekening tujuan");
    expect(letter.content).toContain("1234567890");
    expect(letter.content).toContain("Budi");
  });

  test("hotline di README mengikuti aturan verifikasi", () => {
    const readme = buildDocuments(filled(), DIR).find((d) => d.filename === "00-BACA-SAYA.txt")!;
    expect(readme.content).toContain("Bank Mandiri: 14000");
    expect(readme.content.includes("1500888")).toBe(false);
    expect(readme.content).toContain("cari kanal resmi di https://www.bca.co.id/");
  });
});

describe("buildManifest", () => {
  test("mempertahankan hash null apa adanya, tidak mengarang", () => {
    const m = buildManifest(filled(), [
      { path: "04-bukti/bukti.png", sha256: "ab".repeat(32), size_bytes: 1234 },
      { path: "04-bukti/lain.pdf", sha256: null, size_bytes: 99 },
    ]);
    expect(m.algorithm).toBe("sha256");
    expect(m.files[1].sha256).toBeNull();
    expect(m.note).toContain("Hash dihitung di perangkat pelapor");
  });
});
