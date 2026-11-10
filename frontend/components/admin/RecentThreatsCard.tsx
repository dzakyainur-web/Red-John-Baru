"use client";

import React from "react";
import type { Threat } from "@/lib/threats";
import { SOURCE_LABEL } from "@/lib/threats";
import { CATEGORY_LABEL, formatNewsDate } from "@/lib/labels";
import { StatusBadge } from "@/components/ui";
import { Check, Archive, Eye, ChevronRight } from "lucide-react";

type RecentThreatsCardProps = {
  threats: Threat[];
  onViewAll: () => void;
  onEdit: (threat: Threat) => void;
  onApprove: (threat: Threat) => void;
  onArchive: (threat: Threat) => void;
  busyId: string | null;
};

export default function RecentThreatsCard({
  threats,
  onViewAll,
  onEdit,
  onApprove,
  onArchive,
  busyId,
}: RecentThreatsCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#161817] p-5 sm:p-6 shadow-sm">
      <div className="flex items-start justify-between pb-4">
        <div>
          <h2 className="text-base font-bold tracking-tight text-white">Ancaman Terbaru</h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            Laporan komunitas & harvester yang menunggu tindakan
          </p>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="group inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <span>Lihat Semua</span>
          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {threats.length === 0 ? (
          <div className="py-10 text-center text-xs text-zinc-500">
            Belum ada ancaman di antrian.
          </div>
        ) : (
          threats.slice(0, 5).map((t) => {
            const isBusy = busyId === t.id;
            return (
              <div
                key={t.id}
                className="group -mx-3 flex flex-col gap-3 rounded-xl px-3 py-3.5 transition-colors hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-[11px] font-semibold text-white">
                    {t.scammer_indicators.length}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={t.status} />
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                        {CATEGORY_LABEL[t.category] ?? t.category}
                      </span>
                    </div>
                    <p className="mt-1.5 truncate text-xs font-semibold text-white">{t.title}</p>
                    <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                      {SOURCE_LABEL[t.source_type]} · {t.source_media || "Tanpa media"} ·{" "}
                      {t.scammer_indicators.length} IOC
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                  <p className="text-[11px] text-zinc-500">
                    {formatNewsDate(t.created_at || t.published_at) || "—"}
                  </p>
                  <div className="flex items-center gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => onEdit(t)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                      title="Lihat / Edit"
                    >
                      <Eye className="size-3.5" />
                    </button>
                    {t.status === "pending" && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onApprove(t)}
                        className="rounded-lg p-1.5 text-[#3ECF8E] hover:bg-[#3ECF8E]/10 transition-colors disabled:opacity-40"
                        title="Verifikasi"
                      >
                        <Check className="size-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onArchive(t)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-40"
                      title="Arsipkan"
                    >
                      <Archive className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
