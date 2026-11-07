"use client";

import { useEffect, useState } from "react";
import {
  INDICATOR_TYPES,
  THREAT_CATEGORIES,
  type Indicator,
  type Threat,
  type ThreatCategory,
  type ThreatInput,
} from "@/lib/threats";
import { CATEGORY_LABEL } from "@/lib/labels";

type Props = {
  threat: Threat | null;
  onClose: () => void;
  onCreate: (input: ThreatInput) => Promise<void>;
  onUpdate: (id: string, input: ThreatInput) => Promise<void>;
};

const MAX_IOCS = 20;

type Draft = {
  title: string;
  category: ThreatCategory;
  description: string;
  source_url: string;
  indicators: Indicator[];
};

const EMPTY: Draft = {
  title: "",
  category: "phishing_link",
  description: "",
  source_url: "",
  indicators: [],
};

function toDraft(threat: Threat | null): Draft {
  if (!threat) return EMPTY;
  return {
    title: threat.title,
    category: threat.category,
    description: threat.description,
    source_url: threat.source_url ?? "",
    indicators: threat.scammer_indicators,
  };
}

const field =
  "w-full rounded-[3px] border border-rule-strong bg-raised px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-alert";

export default function ThreatModal({ threat, onClose, onCreate, onUpdate }: Props) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(threat));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function setIndicator(index: number, patch: Partial<Indicator>) {
    setDraft((d) => ({
      ...d,
      indicators: d.indicators.map((ioc, i) => (i === index ? { ...ioc, ...patch } : ioc)),
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const input: ThreatInput = {
      title: draft.title.trim(),
      category: draft.category,
      description: draft.description.trim(),
      source_url: draft.source_url.trim() || null,
      scammer_indicators: draft.indicators
        .map((ioc) => ({ type: ioc.type, value: ioc.value.trim() }))
        .filter((ioc) => ioc.value.length > 0),
    };
    try {
      if (threat) await onUpdate(threat.id, input);
      else await onCreate(input);      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  const titleTooShort = draft.title.trim().length < 10;
  const descriptionEmpty = draft.description.trim().length === 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={threat ? "Edit ancaman" : "Tambah ancaman"}
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8"
    >
      <form
        onSubmit={submit}
        className="card w-full max-w-2xl space-y-4 rounded-xl"
        style={{ background: "var(--surface)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="section-title">{threat ? "Edit ancaman" : "Tambah ancaman manual"}</h2>
            <p className="data mt-1">
              {threat
                ? `ID ${threat.id} · status ${threat.status}`
                : "Langsung VERIFIED dan tampil di feed publik."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted hover:text-ink"
            aria-label="Tutup"
          >
            TUTUP ✕
          </button>
        </div>

        <label className="block space-y-1">
          <span className="data">Judul modus (10–300)</span>
          <input
            required
            minLength={10}
            maxLength={300}
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            className={field}
            placeholder="Modus penipuan undian berkedok kurir"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="data">Kategori</span>
            <select
              value={draft.category}
              onChange={(e) =>
                setDraft((d) => ({ ...d, category: e.target.value as ThreatCategory }))
              }
              className={field}
            >
              {THREAT_CATEGORIES.filter((c) => c !== "all").map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c] ?? c}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="data">URL sumber (opsional)</span>
            <input
              type="url"
              value={draft.source_url}
              onChange={(e) => setDraft((d) => ({ ...d, source_url: e.target.value }))}
              className={field}
              placeholder="https://…"
            />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="data">Deskripsi narasi</span>
          <textarea
            required
            rows={4}
            maxLength={1200}
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            className={field}
            placeholder="Bagaimana pelaku menghubungi korban, apa yang diminta…"
          />
          <span className="data">{draft.description.length}/1200</span>
        </label>

        <fieldset className="space-y-2">
          <legend className="data">Indikator kompromi (IOC)</legend>
          {draft.indicators.length === 0 && (
            <p className="text-xs text-muted">
              Belum ada. URL akan didefang dan nomor telepon dinormalisasi ke +62 oleh server.
            </p>
          )}
          {draft.indicators.map((ioc, index) => (
            <div key={index} className="flex flex-wrap items-center gap-2">
              <select
                aria-label={`Tipe IOC ${index + 1}`}
                value={ioc.type}
                onChange={(e) =>
                  setIndicator(index, { type: e.target.value as Indicator["type"] })
                }
                className={`${field} w-auto`}
              >
                {INDICATOR_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                aria-label={`Nilai IOC ${index + 1}`}
                value={ioc.value}
                maxLength={300}
                onChange={(e) => setIndicator(index, { value: e.target.value })}
                className={`${field} flex-1`}
                placeholder={
                  ioc.type === "url"
                    ? "https://situs-penipu.xyz/login"
                    : ioc.type === "phone"
                      ? "0812-3456-7890"
                      : ioc.type === "apk"
                        ? "penipu-mod.apk"
                        : "1234567890 (bank)"
                }
              />
              <button
                type="button"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    indicators: d.indicators.filter((_, i) => i !== index),
                  }))
                }
                className="text-xs text-alert-ink hover:underline"
              >
                hapus
              </button>
            </div>
          ))}
          {draft.indicators.length < MAX_IOCS && (
            <button
              type="button"
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  indicators: [...d.indicators, { type: "url", value: "" }],
                }))
              }
              className="btn min-h-9 px-3 text-xs"
            >
              + IOC
            </button>
          )}
        </fieldset>

        {error && (
          <p className="border-l-2 border-l-alert pl-3 text-sm text-alert-ink">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-rule pt-4">
          <button type="button" onClick={onClose} className="btn">
            Batal
          </button>
          <button
            type="submit"
            disabled={saving || titleTooShort || descriptionEmpty}
            className="btn btn-primary"
          >
            {saving ? "Menyimpan…" : threat ? "Simpan perubahan" : "Tambah ancaman"}
          </button>
        </div>
      </form>
    </div>
  );
}
