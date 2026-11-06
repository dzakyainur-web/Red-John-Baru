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
} from "@/lib/api";
import { FlagList, PageHead, Score, LevelBadge } from "@/components/ui";

type LogEntry = { label: string; status: number; ms: number; body: unknown };

const btn = "btn btn-sm";

const ROUTES = [
  { method: "POST", path: "/api/check", note: "body {text, context} → CheckResponse" },
  { method: "GET", path: "/api/examples", note: "ExampleOut[]" },
  { method: "GET", path: "/api/model/status", note: "{ml_loaded, model_version}" },
  { method: "GET", path: "/health", note: "HealthResponse" },
];

export default function DevConsolePage() {
  const [health, setHealth] = useState<string>("—");
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
      const rawBody = await res.text();
      try {
        body = JSON.parse(rawBody);
      } catch {
        body = rawBody;
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
    <div className="space-y-9">
      <PageHead
        title="Dev console"
        lead={
          <>
            Uji keempat route backend. Base URL:{" "}
            <code className="font-[family-name:var(--font-geist-mono)] text-xs">{API_BASE}</code>
          </>
        }
      />

      <section className="space-y-3">
        <h2 className="section-title">Route yang tersedia</h2>
        <ul className="border-t border-rule">
          {ROUTES.map((r) => (
            <li key={r.path} className="flex flex-wrap gap-x-3 border-b border-rule py-2 text-sm">
              <span className={`w-12 shrink-0 font-[family-name:var(--font-geist-mono)] text-xs ${r.method === "POST" ? "text-alert" : "text-muted"}`}>
                {r.method}
              </span>
              <code className="font-[family-name:var(--font-geist-mono)] text-xs">{r.path}</code>
              <span className="text-xs text-muted">{r.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="section-title">Health &amp; model</h2>
        <div className="flex flex-wrap gap-2">
          <button
            className={btn}
            onClick={() =>
              fetchHealth()
                .then((h) => {
                  setHealth(`${h.status} · ml_loaded=${h.ml_loaded} · model=${h.model_version ?? "—"}`);
                  record("GET /health", 200, 0, h);
                })
                .catch((e) => setError(String(e)))
            }
          >
            GET /health
          </button>
          <button
            className={btn}
            onClick={() =>
              fetchModelStatus()
                .then((m) => {
                  setModelStatus(JSON.stringify(m));
                  record("GET /api/model/status", 200, 0, m);
                })
                .catch((e) => setError(String(e)))
            }
          >
            GET /api/model/status
          </button>
        </div>
        <p className="data">health: {health}</p>
        <p className="data">model/status: {modelStatus}</p>
      </section>

      <section className="space-y-3">
        <h2 className="section-title">POST /api/check</h2>
        <div className="flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex.id}
              className="chip"
              onClick={() => {
                setText(ex.text);
                setResult(null);
                setError(null);
              }}
            >
              {ex.category}
              <span className="font-normal text-muted">{ex.label}</span>
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          maxLength={5000}
          placeholder="Tempel pesan…"
          className="field"
        />
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="ctx" className="text-sm text-muted">
            context
          </label>
          <select id="ctx" value={context} onChange={(e) => setContext(e.target.value as Context)} className="field w-auto">
            {CONTEXTS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <span className="data">{text.length}/5000</span>
          <button onClick={submit} disabled={loading || !text.trim()} className="btn btn-primary btn-sm ml-auto">
            {loading ? "Memeriksa…" : "Periksa"}
          </button>
        </div>
        {error && <p className="text-sm text-alert-ink">{error}</p>}
      </section>

      <section className="space-y-3">
        <h2 className="section-title">Uji validasi</h2>
        <div className="flex flex-wrap gap-2">
          <button className={btn} onClick={() => raw("POST", "/api/check", { text: "   " })}>
            teks kosong
          </button>
          <button className={btn} onClick={() => raw("POST", "/api/check", { text: "a".repeat(6000) })}>
            teks 6000 char
          </button>
          <button className={btn} onClick={() => raw("POST", "/api/check", {})}>
            body tanpa text
          </button>
          <button className={btn} onClick={() => raw("POST", "/api/check", { text: "halo", context: "telegram" })}>
            context tak dikenal
          </button>
          <button className={btn} onClick={() => raw("GET", "/api/tidak-ada")}>
            route tidak ada
          </button>
        </div>
      </section>

      {result && (
        <section className="space-y-4">
          <div className="rule-accent" />
          <div className="flex flex-wrap items-center gap-4">
            <LevelBadge level={result.risk_level} />
            <Score score={result.score} level={result.risk_level} />
            <span className="data">
              rule {Math.round(result.rule_score * 100)}% · ml{" "}
              {result.ml_score == null ? "—" : `${Math.round(result.ml_score * 100)}%`}
            </span>
            <button onClick={() => setShowRaw((v) => !v)} className="btn btn-sm ml-auto">
              {showRaw ? "Sembunyikan JSON" : "Lihat JSON"}
            </button>
          </div>
          {showRaw && (
            <pre className="overflow-auto border border-rule bg-raised p-3 font-[family-name:var(--font-geist-mono)] text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
          {result.flags.length > 0 && <FlagList flags={result.flags} />}
          <p className="data">skenario: {result.recommended_scenarios.join(", ") || "—"}</p>
          <p className="border-t border-rule pt-3 text-xs text-muted">{result.disclaimer}</p>
        </section>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Log request</h2>
          <button className={btn} onClick={() => setLog([])}>
            Bersihkan
          </button>
        </div>
        {log.length === 0 ? (
          <p className="text-sm text-muted">Kosong.</p>
        ) : (
          <ul className="border-t border-rule">
            {log.map((entry, i) => (
              <li key={i} className="border-b border-rule py-2.5">
                <p className="data">
                  <span className={entry.status >= 200 && entry.status < 300 ? "text-safe" : "text-alert-ink"}>
                    {entry.status || "ERR"}
                  </span>{" "}
                  {entry.label} · {entry.ms} ms
                </p>
                <pre className="mt-1 max-h-40 overflow-auto font-[family-name:var(--font-geist-mono)] text-xs text-muted">
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
