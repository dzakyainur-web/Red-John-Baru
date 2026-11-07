"use client";

import { useEffect, useMemo, useState } from "react";
import {
  EMPTY_FILTERS,
  THREAT_CATEGORIES,
  THREAT_SOURCES,
  THREAT_STATUSES,
  archiveThreat,
  createThreat,
  listThreats,
  updateThreat,
  type Threat,
  type ThreatCategoryFilter,
  type ThreatFilters,
  type ThreatInput,
  type ThreatSourceFilter,
  type ThreatStatusFilter,
} from "@/lib/threats";
import { CATEGORY_LABEL } from "@/lib/labels";
import { API_BASE } from "@/lib/api";
import { PageHead } from "@/components/ui";
import ThreatTable from "@/components/admin/ThreatTable";
import ThreatModal from "@/components/admin/ThreatModal";

const STATUS_TAB_LABEL: Record<ThreatStatusFilter, string> = {
  all: "Semua",
  pending: "Pending",
  verified: "Verified",
  rejected: "Arsip",
};

const SOURCE_LABEL: Record<ThreatSourceFilter, string> = {
  all: "Semua sumber",
  scraped: "Scraped",
  user_report: "Laporan masyarakat",
};

const select = "rounded-[3px] border border-rule-strong bg-raised px-2.5 py-2 text-sm";

export default function AdminPage() {
  const [filters, setFilters] = useState<ThreatFilters>(EMPTY_FILTERS);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Threat[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ threat: Threat | null } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Debounce search 300 ms supaya tidak membanjiri API tiap ketikan.
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((f) => (f.q === search ? f : { ...f, q: search }));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await listThreats(filters);
        if (cancelled) return;
        setItems(data.items);
        setTotal(data.total);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setItems([]);
        setTotal(0);
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filters, reloadKey]);

  async function mutate(id: string, action: () => Promise<Threat>) {
    setBusyId(id);
    try {
      await action();
      setReloadKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  function reload() {
    setLoading(true);
    setReloadKey((k) => k + 1);
  }

  function archive(threat: Threat) {
    if (
      !window.confirm(
        `Arsipkan "${threat.title}"?\n\nData tidak dihapus permanen — status menjadi REJECTED dan bisa dipulihkan.`,
      )
    ) {
      return;
    }
    void mutate(threat.id, () => archiveThreat(threat.id));
  }

  const activeFilters = useMemo(
    () =>
      filters.status !== "all" || filters.source_type !== "all" || filters.category !== "all",
    [filters],
  );

  return (
    <div className="space-y-7">
      <PageHead
        title="Cyber Scam Radar"
        lead="Triage laporan penipuan: setujui, sunting, arsipkan."
        aside={
          <button type="button" onClick={() => setModal({ threat: null })} className="btn btn-primary">
            + Tambah
          </button>
        }
      />

      <p className="border-l-2 border-l-warn pl-3 font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-wider text-warn">
        Tanpa autentikasi — panel internal. Hapus akses sebelum rilis.
      </p>

      <section className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Filter status" className="flex flex-wrap gap-1">
          {THREAT_STATUSES.map((status) => {
            const active = filters.status === status;
            return (
              <button
                key={status}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilters((f) => ({ ...f, status }))}
                className={`rounded-[3px] border px-3 py-1.5 font-[family-name:var(--font-geist-mono)] text-xs uppercase tracking-wider transition-colors ${
                  active
                    ? "border-alert bg-alert text-on-alert"
                    : "border-rule-strong text-muted hover:border-alert hover:text-ink"
                }`}
              >
                {STATUS_TAB_LABEL[status]}
              </button>
            );
          })}
        </div>

        <select
          aria-label="Filter sumber"
          value={filters.source_type}
          onChange={(e) =>
            setFilters((f) => ({ ...f, source_type: e.target.value as ThreatSourceFilter }))
          }
          className={select}
        >
          {THREAT_SOURCES.map((s) => (
            <option key={s} value={s}>
              {SOURCE_LABEL[s]}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter kategori"
          value={filters.category}
          onChange={(e) =>
            setFilters((f) => ({ ...f, category: e.target.value as ThreatCategoryFilter }))
          }
          className={select}
        >
          {THREAT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "Semua kategori" : (CATEGORY_LABEL[c] ?? c)}
            </option>
          ))}
        </select>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxLength={120}
          placeholder="Cari judul, URL, nomor penipu…"
          aria-label="Cari ancaman"
          className={`${select} min-w-[14rem] flex-1`}
        />

        {activeFilters && (
          <button
            type="button"
            onClick={() => setFilters({ ...EMPTY_FILTERS, q: filters.q })}
            className="text-xs text-muted hover:text-ink"
          >
            reset filter
          </button>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="data">
          {loading ? "memuat…" : `${items.length} dari ${total} ancaman`}
          {filters.q && ` · q="${filters.q}"`}
        </p>
        <button type="button" onClick={reload} className="btn min-h-9 px-3 text-xs">
          Muat ulang
        </button>
      </div>

      {error && (
        <div className="border-l-2 border-l-alert pl-3 text-sm text-alert-ink">
          <p>{error}</p>
          <p className="mt-1 text-xs text-muted">
            Backend harus hidup di {API_BASE || "(API_BASE kosong)"} — cek
            NEXT_PUBLIC_API_BASE_URL di frontend/.env.local.
          </p>
        </div>
      )}

      {!loading && items.length === 0 && !error ? (
        <p className="border-t border-rule pt-5 text-sm text-muted">
          Tidak ada ancaman yang cocok dengan filter ini.
        </p>
      ) : (
        <ThreatTable
          threats={items}
          busyId={busyId}
          onApprove={(t) => void mutate(t.id, () => updateThreat(t.id, { status: "verified" }))}
          onRestore={(t) => void mutate(t.id, () => updateThreat(t.id, { status: "verified" }))}
          onEdit={(t) => setModal({ threat: t })}
          onArchive={archive}
        />
      )}

      {modal && (
        <ThreatModal
          key={modal.threat?.id ?? "new"}
          threat={modal.threat}
          onClose={() => setModal(null)}
          onCreate={async (input: ThreatInput) => {
            await createThreat(input);
            reload();
          }}
          onUpdate={async (id, input) => {
            await updateThreat(id, input);
            reload();
          }}
        />
      )}
    </div>
  );
}
