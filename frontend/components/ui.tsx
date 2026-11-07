import type { ReactNode } from "react";

export type Level = "low" | "medium" | "high";

const LEVEL_LABEL: Record<Level, string> = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi",
};

const LEVEL_TONE: Record<Level, string> = {
  low: "border-safe/40 bg-safe-wash text-safe",
  medium: "border-warn/40 bg-warn-wash text-warn",
  high: "border-alert/50 bg-alert-wash text-alert-ink",
};

export function LevelBadge({ level }: { level: Level }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-[3px] border px-2.5 py-1 text-sm font-semibold ${LEVEL_TONE[level]}`}
    >
      <span aria-hidden="true" className="size-2 rounded-full bg-current" />
      Risiko {LEVEL_LABEL[level]}
    </span>
  );
}

/** Satu-satunya elemen yang boleh berani di halaman hasil. */
export function Score({ score, level }: { score: number; level: Level }) {
  return (
    <p className="flex items-baseline gap-1">
      <span
        className={`font-[family-name:var(--font-display)] text-[3.4rem] font-semibold leading-none tabular-nums ${
          level === "high" ? "text-alert" : level === "medium" ? "text-warn" : "text-safe"
        }`}
      >
        {score}
      </span>
      <span className="text-sm text-muted">/100</span>
    </p>
  );
}

const SEV_EDGE: Record<string, string> = {
  tinggi: "border-l-alert",
  sedang: "border-l-warn",
  rendah: "border-l-rule-strong",
};

export type FlagItem = {
  id: string;
  title: string;
  severity: string;
  status?: string;
  evidence?: string | null;
  explanation: string;
  advice?: string;
  note?: string | null;
};

export function FlagList({ flags }: { flags: FlagItem[] }) {
  return (
    <ul className="border-t border-rule">
      {flags.map((f) => (
        <li
          key={f.id}
          className={`border-b border-rule border-l-[3px] py-4 pl-4 ${SEV_EDGE[f.severity] ?? "border-l-rule"}`}
        >
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-semibold">{f.title}</span>
            <span className="data">
              {f.id} · {f.severity}
              {f.status ? ` · ${f.status}` : ""}
            </span>
          </p>
          {f.evidence && (
            <p className="mt-1.5 border-l-2 border-rule pl-2.5 font-[family-name:var(--font-geist-mono)] text-xs text-muted">
              {f.evidence}
            </p>
          )}
          <p className="mt-1.5 max-w-[62ch] text-sm">{f.explanation}</p>
          {f.advice && <p className="mt-1 max-w-[62ch] text-sm text-muted">{f.advice}</p>}
          {f.note && <p className="mt-1 text-xs text-warn">{f.note}</p>}
        </li>
      ))}
    </ul>
  );
}

export function PageHead({
  title,
  lead,
  aside,
}: {
  title: string;
  lead?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="border-b border-rule pb-5">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div>
          <h1 className="page-title">{title}</h1>
          {lead && <p className="lead mt-2 text-sm">{lead}</p>}
        </div>
        {aside && <div className="pb-1">{aside}</div>}
      </div>
    </header>
  );
}

export function SourceNote({ children }: { children: ReactNode }) {
  return <p className="text-xs text-muted">{children}</p>;
}

const STATUS_TONE: Record<string, string> = {
  pending: "border-warn/40 bg-warn-wash text-warn",
  verified: "border-safe/40 bg-safe-wash text-safe",
  rejected: "border-alert/50 bg-alert-wash text-alert-ink",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "PENDING",
  verified: "VERIFIED",
  rejected: "REJECTED",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-[3px] border px-2 py-0.5 font-[family-name:var(--font-geist-mono)] text-[11px] font-semibold tracking-wider ${
        STATUS_TONE[status] ?? "border-rule-strong text-muted"
      }`}
    >
      {STATUS_LABEL[status] ?? status.toUpperCase()}
    </span>
  );
}
