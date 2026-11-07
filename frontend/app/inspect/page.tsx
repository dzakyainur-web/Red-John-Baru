"use client";

import { useState } from "react";
import { inspectUrl, probePage, type ProbeResult, type Severity, type UrlReport } from "@/lib/url-inspect";
import { PageHead, SourceNote } from "@/components/ui";

const SEV_EDGE: Record<Severity, string> = {
  tinggi: "border-l-alert",
  sedang: "border-l-warn",
  rendah: "border-l-rule-strong",
};
const LEVEL_TONE: Record<UrlReport["level"], string> = {
  low: "text-safe",
  medium: "text-warn",
  high: "text-alert",
};
const SAMPLES = [
  "https://bca-verifikasi.xyz/login",
  "http://192.168.10.20/otp",
  "bit.ly/abc123",
  "https://bca.co.id/",
];

export default function InspectPage() {
  const [input, setInput] = useState("");
  const [report, setReport] = useState<UrlReport | null>(null);
  const [probe, setProbe] = useState<ProbeResult | null>(null);
  const [probing, setProbing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function analyze() {
    setError(null);
    setProbe(null);
    setReport(inspectUrl(input));
  }

  async function runProbe() {
    setProbing(true);
    setProbe(null);
    try {
      setProbe(await probePage(input));
    } finally {
      setProbing(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHead
        title="Periksa tautan"
        lead="Baca alamatnya dulu sebelum diklik: domain tiruan, shortlink, akhiran murah, dan trik penyamaran. Semua berjalan di browser — alamat tidak dikirim ke backend."
      />

      <section aria-labelledby="url-heading" className="space-y-3">
        <h2 id="url-heading" className="section-title">
          Alamat yang dicurigai
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && analyze()}
            placeholder="contoh: bca-verifikasi.xyz/login"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-labelledby="url-heading"
            className="field font-[family-name:var(--font-geist-mono)] text-sm"
          />
          <button onClick={analyze} disabled={!input.trim()} className="btn btn-primary shrink-0">
            Analisis alamat
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setInput(s);
                setReport(null);
                setProbe(null);
              }}
              className="chip font-[family-name:var(--font-geist-mono)] font-normal"
            >
              {s}
            </button>
          ))}
        </div>
        {error && (
          <p role="alert" className="text-sm text-alert-ink">
            {error}
          </p>
        )}
      </section>

      {report && (
        <section aria-labelledby="report-heading" className="rise space-y-5">
          <div className="rule-accent" />
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <div>
              <h2 id="report-heading" className="section-title">
                Hasil alamat
              </h2>
              {report.host ? (
                <p className="mt-1 break-all font-[family-name:var(--font-geist-mono)] text-sm">{report.host}</p>
              ) : (
                <p className="mt-1 text-sm text-muted">Alamat tidak bisa diurai.</p>
              )}
            </div>
            <p className="flex items-baseline gap-1">
              <span
                className={`font-[family-name:var(--font-display)] text-5xl font-semibold leading-none tabular-nums ${LEVEL_TONE[report.level]}`}
              >
                {report.score}
              </span>
              <span className="text-sm text-muted">/100 skor risiko</span>
            </p>
          </div>

          {report.findings.length > 0 ? (
            <ul className="border-t border-rule">
              {report.findings.map((f) => (
                <li
                  key={f.id}
                  className={`border-b border-rule border-l-[3px] py-3.5 pl-4 ${SEV_EDGE[f.severity]}`}
                >
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-semibold">{f.title}</span>
                    <span className="data">
                      {f.id} · {f.severity}
                    </span>
                  </p>
                  <p className="mt-1 max-w-[62ch] text-sm text-muted">{f.detail}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="border-l-[3px] border-l-safe bg-safe-wash px-3 py-2 text-sm text-safe">
              Tidak ada ciri mencurigakan pada alamatnya. Bukan jaminan aman — situs bisa sah secara
              alamat tapi tetap menjual barang palsu.
            </p>
          )}

          <div className="space-y-3 border-t border-rule pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={runProbe} disabled={probing} className="btn btn-sm">
                {probing ? "Mencoba ambil…" : "Coba ambil isi halaman"}
              </button>
              <p className="text-xs text-muted">
                Opsional. Banyak situs memblokir pembacaan lintas origin (CORS).
              </p>
            </div>
            {probe && (
              <div className="panel p-4 text-sm">
                {probe.ok ? (
                  <dl className="space-y-1.5">
                    <Row label="Judul" value={probe.title ?? "(tidak ada)"} />
                    <Row label="Status" value={`${probe.status} · ${probe.bytes.toLocaleString("id-ID")} byte`} />
                    <Row label="URL akhir" value={probe.finalUrl} mono />
                    {probe.finalUrl !== report.normalized && (
                      <p className="border-l-[3px] border-l-warn bg-warn-wash px-2.5 py-1.5 text-warn">
                        Dialihkan ke alamat lain.
                      </p>
                    )}
                    {probe.hasPasswordField && (
                      <p className="border-l-[3px] border-l-alert bg-alert-wash px-2.5 py-1.5 text-alert-ink">
                        Halaman berisi kolom password.
                      </p>
                    )}
                    {probe.otpMentions.length > 0 && (
                      <p className="border-l-[3px] border-l-alert bg-alert-wash px-2.5 py-1.5 text-alert-ink">
                        Menyebut: {probe.otpMentions.join(", ")}
                      </p>
                    )}
                    {probe.metaRefresh && <Row label="Meta refresh" value={probe.metaRefresh} mono />}
                    {probe.externalScripts > 0 && (
                      <Row label="Script luar" value={`${probe.externalScripts} domain lain`} />
                    )}
                  </dl>
                ) : (
                  <p className="text-muted">{probe.reason}</p>
                )}
              </div>
            )}
          </div>

          <SourceNote>
            Analisis memakai pola; penipu bisa memakai domain baru yang belum dikenal. Jangan pernah
            mengisi password atau OTP di halaman yang dibuka dari tautan chat.
          </SourceNote>
        </section>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-wrap gap-x-3 border-b border-rule pb-1.5 last:border-b-0">
      <dt className="w-24 shrink-0 text-xs text-muted">{label}</dt>
      <dd className={`min-w-0 break-all ${mono ? "font-[family-name:var(--font-geist-mono)] text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
