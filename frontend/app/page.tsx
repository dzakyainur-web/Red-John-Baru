"use client";

import { useEffect, useState } from "react";
import {
  checkMessage,
  fetchExamples,
  CONTEXTS,
  type CheckResult,
  type Context,
  type Example,
} from "@/lib/api";

const RISK_STYLE: Record<CheckResult["risk_level"], string> = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};
const SEVERITY_STYLE: Record<string, string> = {
  tinggi: "border-red-400",
  sedang: "border-amber-400",
  rendah: "border-zinc-300 dark:border-zinc-700",
};

export default function CheckPage() {
  const [text, setText] = useState("");
  const [context, setContext] = useState<Context>("umum");
  const [examples, setExamples] = useState<Example[]>([]);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchExamples().then(setExamples).catch(() => {});
  }, []);

  async function submit() {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      setResult(await checkMessage(text, context));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  function copySummary() {
    if (!result) return;
    const summary = `Hasil cek GuardianAI: risiko ${result.risk_level.toUpperCase()} (skor ${result.score}/100). ${result.disclaimer}`;
    navigator.clipboard.writeText(summary).then(() => setCopied(true));
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold">Cek Pesan Mencurigakan</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Tempel pesan, tautan, atau profil yang terasa aneh. Kami analisis pakai aturan + model ML lokal.
        </p>
      </section>

      {examples.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Coba contoh:</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button
                key={ex.id}
                onClick={() => { setText(ex.text); setContext("umum"); setResult(null); }}
                className={`rounded-full border px-3 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                  ex.label === "scam"
                    ? "border-red-300 text-red-700 dark:border-red-800 dark:text-red-300"
                    : "border-green-300 text-green-700 dark:border-green-800 dark:text-green-300"
                }`}
              >
                {ex.category} ({ex.label})
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          maxLength={5000}
          placeholder="Tempel pesan di sini…"
          className="w-full rounded-lg border border-zinc-300 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="context" className="text-sm text-zinc-600 dark:text-zinc-400">Sumber:</label>
          <select
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value as Context)}
            className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {CONTEXTS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={submit}
            disabled={loading || !text.trim()}
            className="ml-auto rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {loading ? "Memeriksa…" : "Periksa Pesan"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </section>

      {result && (
        <section className="space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${RISK_STYLE[result.risk_level]}`}>
              Risiko {result.risk_level.toUpperCase()}
            </span>
            <span className="text-sm">Skor: <strong>{result.score}/100</strong></span>
            <span className="text-xs text-zinc-500">
              aturan {Math.round(result.rule_score * 100)}% · ML{" "}
              {result.ml_score == null ? "—" : `${Math.round(result.ml_score * 100)}%`}
            </span>
            <button
              onClick={copySummary}
              className="ml-auto rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {copied ? "Tersalin ✓" : "Salin ringkasan"}
            </button>
          </div>

          {result.flags.length > 0 ? (
            <ul className="space-y-3">
              {result.flags.map((f) => (
                <li key={f.id} className={`rounded-lg border-l-4 bg-zinc-50 p-3 dark:bg-zinc-900 ${SEVERITY_STYLE[f.severity]}`}>
                  <p className="text-sm font-semibold">
                    {f.title}{" "}
                    <span className="font-normal text-xs text-zinc-500">
                      ({f.severity}, {f.status})
                    </span>
                  </p>
                  {f.evidence && <p className="mt-1 text-xs italic text-zinc-600 dark:text-zinc-400">Bukti: “{f.evidence}”</p>}
                  <p className="mt-1 text-sm">{f.explanation}</p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">👉 {f.advice}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Tidak ada tanda bahaya yang terdeteksi. Tetap waspada — pesan tanpa tanda bahaya belum tentu aman.</p>
          )}

          {result.ml && (
            <details className="text-sm">
              <summary className="cursor-pointer font-medium">Detail model ML (v{result.ml.model_version})</summary>
              <p className="mt-2">Probabilitas penipuan: {Math.round(result.ml.fraud_probability * 100)}%</p>
              <ul className="mt-1 list-inside list-disc text-xs text-zinc-600 dark:text-zinc-400">
                {result.ml.top_features.map((t) => (
                  <li key={t.feature}>{t.feature}: {t.weight.toFixed(3)}</li>
                ))}
              </ul>
            </details>
          )}

          {result.recommended_scenarios.length > 0 && (
            <p className="text-sm">
              Pelajari skenario terkait: {result.recommended_scenarios.join(", ")} — lihat tab{" "}
              <a href="/learn" className="underline">Belajar</a>.
            </p>
          )}

          <p className="border-t border-zinc-200 pt-3 text-xs text-zinc-500 dark:border-zinc-800">{result.disclaimer}</p>
        </section>
      )}
    </div>
  );
}
