export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type Flag = {
  id: string;
  title: string;
  severity: "tinggi" | "sedang" | "rendah";
  status: "hit" | "partial";
  evidence: string | null;
  explanation: string;
  advice: string;
  note: string | null;
};

export type CheckResult = {
  risk_level: "low" | "medium" | "high";
  score: number;
  rule_score: number;
  ml_score: number | null;
  flags: Flag[];
  ml: {
    fraud_probability: number;
    model_version: string;
    top_features: { feature: string; weight: number }[];
  } | null;
  recommended_scenarios: string[];
  disclaimer: string;
};

export type Example = {
  id: string;
  label: "scam" | "legit";
  category: string;
  text: string;
};

const CONTEXTS = ["umum", "dm", "sms", "email", "lowongan"] as const;
export type Context = (typeof CONTEXTS)[number];
export { CONTEXTS };

export async function checkMessage(text: string, context: Context): Promise<CheckResult> {
  const res = await fetch(`${API_BASE}/api/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, context }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gagal memeriksa pesan (${res.status}) ${detail.slice(0, 200)}`);
  }
  return res.json();
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Gagal memuat ${path} (${res.status})`);
  return res.json();
}

export type Health = {
  status: "ok" | "degraded";
  ml_loaded: boolean;
  model_version: string | null;
};

export const fetchExamples = () => getJson<Example[]>("/api/examples");
export const fetchHealth = () => getJson<Health>("/health");
export const fetchModelStatus = () =>
  getJson<{ ml_loaded: boolean; model_version: string | null }>("/api/model/status");
