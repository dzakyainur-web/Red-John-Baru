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
import { X, Plus, Trash2 } from "lucide-react";

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
  "w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-[#3ECF8E] focus:bg-[#111211] focus:outline-none focus:ring-1 focus:ring-[#3ECF8E]/40 transition-all";

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
      else await onCreate(input);
      onClose();
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
      aria-label={threat ? "Edit ancaman / buku" : "Tambah ancaman / buku"}
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-6"
    >
      <form
        onSubmit={submit}
        className="w-full max-w-2xl space-y-5 rounded-2xl border border-white/10 bg-[#161817] p-6 sm:p-7 shadow-2xl text-white transition-all"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <h2 className="text-lg font-bold text-white">
              {threat ? "Edit Entri / Ancaman" : "Tambah Buku / Laporan Ancaman"}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              {threat
                ? `ID: ${threat.id} · Status saat ini: ${threat.status.toUpperCase()}`
                : "Entri baru akan diverifikasi dan tersimpan di database Supabase."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Tutup"
          >
            <X className="size-4" />
          </button>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-zinc-300">Judul / Nama Modus (10–300 karakter)</span>
          <input
            required
            minLength={10}
            maxLength={300}
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            className={field}
            placeholder="Contoh: Modus penipuan undian berkedok kurir paket"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-zinc-300">Kategori Modus</span>
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
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-zinc-300">URL Sumber / Tautan Berita</span>
            <input
              type="url"
              value={draft.source_url}
              onChange={(e) => setDraft((d) => ({ ...d, source_url: e.target.value }))}
              className={field}
              placeholder="https://news.detik.com/..."
            />
          </label>
        </div>

        <label className="block space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-zinc-300">
            <span>Deskripsi / Narasi Detail</span>
            <span className="text-zinc-500 font-normal">{draft.description.length}/1200</span>
          </div>
          <textarea
            required
            rows={4}
            maxLength={1200}
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            className={field}
            placeholder="Jelaskan alur pelaku menghubungi korban, pesan yang dikirimkan, kerugian..."
          />
        </label>

        <fieldset className="space-y-2.5">
          <legend className="text-xs font-semibold text-zinc-300">Indikator Kompromi (IOC)</legend>
          {draft.indicators.length === 0 && (
            <p className="text-xs text-zinc-500 italic">
              Belum ada IOC. Tambahkan URL, nomor rekening, nomor WhatsApp, atau file APK.
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
                        : "1234567890 (bank BCA)"
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
                className="rounded-lg p-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                title="Hapus IOC"
              >
                <Trash2 className="size-4" />
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Plus className="size-3.5" />
              <span>Tambah Indikator</span>
            </button>
          )}
        </fieldset>

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2.5 border-t border-white/[0.08] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving || titleTooShort || descriptionEmpty}
            className="rounded-xl bg-[#3ECF8E] px-4 py-2.5 text-xs font-semibold text-black shadow-sm hover:bg-[#4adeaa] disabled:opacity-40 transition-colors"
          >
            {saving ? "Menyimpan…" : threat ? "Simpan Perubahan" : "Simpan Entri"}
          </button>
        </div>
      </form>
    </div>
  );
}
