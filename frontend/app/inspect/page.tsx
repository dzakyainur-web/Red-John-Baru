"use client";

import { useState } from "react";
import {
  inspectUrl,
  probePage,
  type ProbeResult,
  type Severity,
  type UrlReport,
} from "@/lib/url-inspect";

const SEV_BORDER: Record<Severity, string> = {
  tinggi: "border-red-400",
  sedang: "border-amber-400",
  rendah: "border-zinc-300 dark:border-zinc-600",
};
const LEVEL_STYLE: Record<UrlReport["level"], string> = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};
const SAMPLES = [
  "https://bca-verifikasi.xyz/login",
  "http://192.168.10.20/otp",
  "bit.ly/abc123",
  "https://instagram.com/p/abc",
  "https://bca.co.id/",
];

export default function InspectPage() {
  const [input, setInput] = useState("");
  const [report, setReport] = useState<UrlReport | null>(null);
  const [probe, setProbe] = useState<ProbeResult | null>(null);
  const [probing, setProbing] = useState(false);

  function analyze() {
    setReport(inspectUrl(input));
    setProbe(null);
  }

  async function runProbe() {
    setProbing(true);
    setProbe(null);
    setProbe(await probePage(input));
    setProbing(false);
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold">Periksa Tautan</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Analisis alamat tanpa membukanya: domain palsu, shortlink, akhiran tidak umum, dan trik
          penyamaran. Semua berjalan di browser kamu — alamat tidak dikirim ke server kami.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {SAMPLES.map((s) => (
            <button
              key={s}
              onClick={() => { setInput(s); setReport(null); setProbe(null); }}
              className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && analyze()}
            placeholder="contoh: bca-verifikasi.xyz/login"
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            onClick={analyze}
            disabled={!input.trim()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Analisis
          </button>
        </div>
      </section>

      {report && (
        <section className="space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${LEVEL_STYLE[report.level]}`}>
              {report.level.toUpperCase()}
            </span>
            <span className="text-sm">Skor <strong>{report.score}/100</strong></span>
            {report.host && <code className="text-xs text-zinc-500">{report.host}</code>}
          </div>

          {report.findings.length > 0 ? (
            <ul className="space-y-2">
              {report.findings.map((f) => (
                <li key={f.id} className={`rounded-lg border-l-4 bg-zinc-50 p-3 dark:bg-zinc-900 ${SEV_BORDER[f.severity]}`}>
                  <p className="text-sm font-semibold">
                    {f.title} <span className="text-xs font-normal text-zinc-500">({f.severity})</span>
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{f.detail}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Tidak ada ciri mencurigakan pada alamatnya. Ini bukan jaminan aman — situs bisa saja sah
              secara alamat tapi tetap menjual barang palsu.
            </p>
          )}

          <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={runProbe}
                disabled={probing}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-zinc-700"
              >
                {probing ? "Mencoba…" : "Coba ambil isi halaman"}
              </button>
              <span className="text-xs text-zinc-500">
                Opsional. Banyak situs memblokir pembacaan dari browser lain (CORS).
              </span>
            </div>
            {probe && (
              <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-900">
                {probe.ok ? (
                  <ul className="space-y-1">
                    <li>Judul: <strong>{probe.title ?? "(tidak ada)"}</strong></li>
                    <li>Status: {probe.status} · {probe.bytes.toLocaleString("id-ID")} byte</li>
                    <li>URL akhir: <code className="text-xs">{probe.finalUrl}</code></li>
                    {probe.finalUrl !== report.normalized && (
                      <li className="text-amber-600">Dialihkan ke domain/alamat berbeda.</li>
                    )}
                    {probe.hasPasswordField && <li className="text-red-600">Halaman berisi kolom password.</li>}
                    {probe.otpMentions.length > 0 && (
                      <li className="text-red-600">Menyebut: {probe.otpMentions.join(", ")}</li>
                    )}
                    {probe.metaRefresh && (
                      <li className="text-amber-600">Meta refresh: <code className="text-xs">{probe.metaRefresh}</code></li>
                    )}
                    {probe.externalScripts > 0 && <li>{probe.externalScripts} script dari domain lain</li>}
                  </ul>
                ) : (
                  <p className="text-zinc-600 dark:text-zinc-400">{probe.reason}</p>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-zinc-500">
            Analisis alamat memakai pola; penipu bisa memakai domain yang belum dikenal daftar ini.
            Jangan pernah mengisi password/OTP di halaman yang kamu buka lewat link chat.
          </p>
        </section>
      )}
    </div>
  );
}
