"use client";

import { useEffect, useState } from "react";
import {
  API_BASE,
  CONTEXTS,
  checkMessage,
  fetchExamples,
  fetchHealth,
  fetchModelStatus,
  type CheckResult,
  type Context,
  type Example,
  type Health,
} from "@/lib/api";

type LogEntry = { label: string; status: number; ms: number; body: unknown };

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
const btn =
  "rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800";

export default function DevConsolePage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [modelStatus, setModelStatus] = useState<string>("—");
  const [examples, setExamples] = useState<Example[]>([]);
  const [text, setText] = useState("");
  const [context, setContext] = useState<Context>("umum");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    fetchHealth().then(setHealth).catch((e) => setError(String(e)));
    fetchExamples().then(setExamples).catch(() => {});
  }, []);

  function record(label: string, status: number, ms: number, body: unknown) {
    setLog((prev) => [{ label, status, ms, body }, ...prev].slice(0, 30));
  }

  async function raw(method: "GET" | "POST", path: string, payload?: unknown) {
    const t0 = performance.now();
    let status = 0;
    let body: unknown;
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: payload === undefined ? undefined : { "Content-Type": "application/json" },
        body: payload === undefined ? undefined : JSON.stringify(payload),
      });
      status = res.status;
      const textBody = await res.text();
      try {
        body = JSON.parse(textBody);
      } catch {
        body = textBody;
      }
    } catch (e) {
      body = { error: String(e) };
    }
    record(`${method} ${path}`, status, Math.round(performance.now() - t0), body);
  }

  async function submit() {
    setLoading(true);
    setError(null);
    const t0 = performance.now();
    try {
      const res = await checkMessage(text, context);
      setResult(res);
      record("POST /api/check", 200, Math.round(performance.now() - t0), res);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold">Dev Console — Uji API Backend</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Halaman uji semua endpoint. API base: <code className="text-xs">{API_BASE}</code>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1. Health &amp; model</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button className={btn} onClick={() => fetchHealth().then((h) => { setHealth(h); record("GET /health", 200, 0, h); }).catch((e) => setError(String(e)))}>
            GET /health
          </button>
          <button className={btn} onClick={() => fetchModelStatus().then((m) => { setModelStatus(JSON.stringify(m)); record("GET /api/model/status", 200, 0, m); }).catch((e) => setError(String(e)))}>
            GET /api/model/status
          </button>
          {health && (
            <span className="text-sm">
              status{" "}
              <strong className={health.status === "ok" ? "text-green-600" : "text-amber-600"}>{health.status}</strong>
              {" · "}model {health.ml_loaded ? `dimuat (${health.model_version})` : "TIDAK dimuat → rules-only"}
            </span>
          )}
        </div>
        <pre className="rounded-lg bg-zinc-100 p-3 text-xs dark:bg-zinc-900">model/status: {modelStatus}</pre>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">2. POST /api/check</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Klik contoh untuk mengisi teks:</p>
        <div className="flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex.id}
              onClick={() => { setText(ex.text); setResult(null); setError(null); }}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                ex.label === "scam"
                  ? "border-red-300 text-red-700 dark:border-red-800 dark:text-red-300"
                  : "border-green-300 text-green-700 dark:border-green-800 dark:text-green-300"
              }`}
            >
              {ex.category} ({ex.label})
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          maxLength={5000}
          placeholder="Tempel pesan di sini…"
          className="w-full rounded-lg border border-zinc-300 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="ctx" className="text-sm text-zinc-600 dark:text-zinc-400">Konteks</label>
          <select
            id="ctx"
            value={context}
            onChange={(e) => setContext(e.target.value as Context)}
            className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {CONTEXTS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="text-xs text-zinc-500">{text.length}/5000</span>
          <button
            onClick={submit}
            disabled={loading || !text.trim()}
            className="ml-auto rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {loading ? "Memeriksa…" : "Periksa"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">3. Uji validasi &amp; error</h2>
        <div className="flex flex-wrap gap-2">
          <button className={btn} onClick={() => raw("POST", "/api/check", { text: "   " })}>
            teks kosong → 422?
          </button>
          <button className={btn} onClick={() => raw("POST", "/api/check", { text: "a".repeat(6000) })}>
            teks 6000 char → 422?
          </button>
          <button className={btn} onClick={() => raw("POST", "/api/check", {})}>
            body tanpa text → 422?
          </button>
          <button className={btn} onClick={() => raw("POST", "/api/check", { text: "halo", context: "telegram" })}>
            context tak dikenal → ?
          </button>
          <button className={btn} onClick={() => raw("GET", "/api/tidak-ada")}>
            endpoint tidak ada → 404?
          </button>
        </div>
      </section>

      {result && (
        <section className="space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${RISK_STYLE[result.risk_level]}`}>
              {result.risk_level.toUpperCase()}
            </span>
            <span className="text-sm">Skor <strong>{result.score}/100</strong></span>
            <span className="text-xs text-zinc-500">
              aturan {Math.round(result.rule_score * 100)}% · ML{" "}
              {result.ml_score == null ? "—" : `${Math.round(result.ml_score * 100)}%`}
            </span>
            <button onClick={() => setShowRaw((v) => !v)} className="ml-auto rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700">
              {showRaw ? "Sembunyikan JSON" : "Lihat JSON"}
            </button>
          </div>
          {showRaw && (
            <pre className="overflow-auto rounded-lg bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
          <ul className="space-y-2">
            {result.flags.map((f) => (
              <li key={f.id} className={`rounded-lg border-l-4 bg-zinc-50 p-3 dark:bg-zinc-900 ${SEVERITY_STYLE[f.severity]}`}>
                <p className="text-sm font-semibold">
                  {f.id} · {f.title}{" "}
                  <span className="text-xs font-normal text-zinc-500">({f.severity}, {f.status})</span>
                </p>
                {f.evidence && <p className="mt-1 text-xs italic text-zinc-600 dark:text-zinc-400">“{f.evidence}”</p>}
                <p className="mt-1 text-sm">{f.explanation}</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">→ {f.advice}</p>
                {f.note && <p className="mt-1 text-xs text-amber-600">{f.note}</p>}
              </li>
            ))}
          </ul>
          {result.ml && (
            <details className="text-sm">
              <summary className="cursor-pointer font-medium">ML v{result.ml.model_version} · p={result.ml.fraud_probability}</summary>
              <ul className="mt-1 list-inside list-disc text-xs text-zinc-600 dark:text-zinc-400">
                {result.ml.top_features.map((t) => (
                  <li key={t.feature}>{t.feature}: {t.weight.toFixed(3)}</li>
                ))}
              </ul>
            </details>
          )}
          <p className="text-xs text-zinc-500">Skenario terkait: {result.recommended_scenarios.join(", ") || "—"}</p>
          <p className="border-t border-zinc-200 pt-3 text-xs text-zinc-500 dark:border-zinc-800">{result.disclaimer}</p>
        </section>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">4. Log request</h2>
          <button className={btn} onClick={() => setLog([])}>Bersihkan</button>
        </div>
        {log.length === 0 ? (
          <p className="text-sm text-zinc-500">Kosong.</p>
        ) : (
          <ul className="space-y-2">
            {log.map((entry, i) => (
              <li key={i} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                <p className="font-mono text-xs">
                  <span className={entry.status >= 200 && entry.status < 300 ? "text-green-600" : "text-red-600"}>
                    {entry.status || "ERR"}
                  </span>{" "}
                  {entry.label} · {entry.ms} ms
                </p>
                <pre className="mt-1 max-h-40 overflow-auto text-xs text-zinc-600 dark:text-zinc-400">
                  {JSON.stringify(entry.body, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
