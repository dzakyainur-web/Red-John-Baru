import { describe, expect, test } from "bun:test";
import { inspectUrl, levenshtein, parseUrl } from "./url-inspect";

const ids = (raw: string) => new Set(inspectUrl(raw).findings.map((f) => f.id));

describe("levenshtein", () => {
  test("distance dasar", () => {
    expect(levenshtein("bca", "bca")).toBe(0);
    expect(levenshtein("bca", "bcn")).toBe(1);
    expect(levenshtein("", "abc")).toBe(3);
  });
});

describe("parseUrl", () => {
  test("menambah skema bila tidak ada", () => {
    expect(parseUrl("contoh.com")?.hostname).toBe("contoh.com");
  });
  test("menolak skema selain http/https", () => {
    expect(parseUrl("javascript:alert(1)")).toBeNull();
    expect(parseUrl("ftp://contoh.com")).toBeNull();
  });
  test("menolak string tanpa domain", () => {
    expect(parseUrl("halo dunia")).toBeNull();
  });
});

describe("inspectUrl", () => {
  const cases: [string, string[]][] = [
    ["https://bca.co.id/", []],
    ["https://instagram.com/p/abc", []],
    ["http://contoh.com/login", ["U01"]],
    ["http://192.168.10.20/otp", ["U01", "U02"]],
    ["bit.ly/abc123", ["U04"]],
    ["https://bca-verifikasi.xyz/login", ["U05", "U06"]],
    ["https://bca.co.id.evil.example/", ["U06"]],
    ["https://bni-login.com/", ["U06"]],
    ["https://user:pass@contoh.com/", ["U07"]],
    ["https://contoh.com:8080/", ["U08"]],
    ["https://a.b.c.d.contoh.com/", ["U09"]],
    ["https://contoh.com/x?url=https://evil.example", ["U10"]],
  ];

  for (const [raw, expected] of cases) {
    test(raw, () => {
      const got = ids(raw);
      for (const id of expected) expect(got.has(id)).toBe(true);
      if (expected.length === 0) expect(got.size).toBe(0);
    });
  }

  test("skor naik untuk domain meniru bank", () => {
    expect(inspectUrl("https://bca-verifikasi.xyz/login").level).toBe("high");
    expect(inspectUrl("https://bca.co.id/").level).toBe("low");
  });

  test("input tak terbaca tidak melempar", () => {
    const report = inspectUrl("halo dunia");
    expect(report.host).toBeNull();
    expect(report.findings[0].id).toBe("U00");
  });
});
