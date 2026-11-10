"use client";

import type { Threat } from "@/lib/threats";
import { SOURCE_LABEL } from "@/lib/threats";
import { CATEGORY_LABEL, formatNewsDate } from "@/lib/labels";
import { StatusBadge } from "@/components/ui";

type Props = {
  threats: Threat[];
  busyId: string | null;
  onApprove: (threat: Threat) => void;
  onRestore: (threat: Threat) => void;
  onEdit: (threat: Threat) => void;
  onArchive: (threat: Threat) => void;
};

const actionBtn =
  "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-40";

export default function ThreatTable({
  threats,
  busyId,
  onApprove,
  onRestore,
  onEdit,
  onArchive,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#161817] shadow-lg">
      <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            <th className="py-3 px-4">Status</th>
            <th className="py-3 pr-4">Modus & Deskripsi</th>
            <th className="hidden py-3 pr-4 md:table-cell">Kategori</th>
            <th className="hidden py-3 pr-4 md:table-cell">Sumber</th>
            <th className="hidden py-3 pr-4 lg:table-cell">Indikator / IOC</th>
            <th className="hidden py-3 pr-4 lg:table-cell">Tanggal</th>
            <th className="py-3 pr-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">
          {threats.map((t) => {
            const busy = busyId === t.id;
            return (
              <tr key={t.id} className="align-top hover:bg-white/[0.03] transition-colors">
                <td className="py-3.5 px-4">
                  <StatusBadge status={t.status} />
                </td>
                <td className="max-w-[28rem] py-3.5 pr-4">
                  <p className="font-semibold text-white leading-snug">{t.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-400 leading-relaxed">
                    {t.description}
                  </p>
                  {t.source_url && (
                    <a
                      href={t.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 block truncate text-[11px] font-medium text-[#3ECF8E] hover:underline"
                    >
                      {t.source_url}
                    </a>
                  )}
                  <p className="mt-1 text-[11px] text-zinc-500 md:hidden">
                    {CATEGORY_LABEL[t.category] ?? t.category} · {SOURCE_LABEL[t.source_type]}
                  </p>
                </td>
                <td className="hidden py-3.5 pr-4 text-xs font-medium text-zinc-300 md:table-cell">
                  {CATEGORY_LABEL[t.category] ?? t.category}
                </td>
                <td className="hidden py-3.5 pr-4 text-xs text-zinc-400 md:table-cell">
                  <span className="font-medium text-zinc-200">{SOURCE_LABEL[t.source_type]}</span>
                  <span className="block truncate text-[11px] text-zinc-500">{t.source_media}</span>
                </td>
                <td className="hidden py-3.5 pr-4 lg:table-cell">
                  <span className="inline-flex items-center rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-xs font-semibold text-zinc-300">
                    {t.scammer_indicators.length} IOC
                  </span>
                  {t.scammer_indicators.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5">
                      {t.scammer_indicators.slice(0, 2).map((ioc) => (
                        <li
                          key={`${ioc.type}:${ioc.value}`}
                          className="max-w-[14rem] truncate font-[family-name:var(--font-geist-mono)] text-[11px] text-zinc-400"
                          title={`${ioc.type}: ${ioc.value}`}
                        >
                          <span className="text-zinc-500">{ioc.type}:</span> {ioc.value}
                        </li>
                      ))}
                      {t.scammer_indicators.length > 2 && (
                        <li className="text-[11px] text-zinc-500">
                          +{t.scammer_indicators.length - 2} lagi
                        </li>
                      )}
                    </ul>
                  )}
                </td>
                <td className="hidden py-3.5 pr-4 text-xs text-zinc-500 lg:table-cell">
                  {formatNewsDate(t.created_at)}
                </td>
                <td className="py-3.5 pr-4 text-right">
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {t.status === "pending" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onApprove(t)}
                        className={`${actionBtn} bg-[#3ECF8E]/10 text-[#3ECF8E] hover:bg-[#3ECF8E]/20 border border-[#3ECF8E]/30`}
                      >
                        Setujui
                      </button>
                    )}
                    {t.status === "rejected" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onRestore(t)}
                        className={`${actionBtn} bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30`}
                      >
                        Pulihkan
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onEdit(t)}
                      className={`${actionBtn} border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10`}
                    >
                      Edit
                    </button>
                    {t.status !== "rejected" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onArchive(t)}
                        className={`${actionBtn} bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30`}
                      >
                        Arsipkan
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
