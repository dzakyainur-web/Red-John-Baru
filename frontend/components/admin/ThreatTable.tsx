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

const action =
  "font-[family-name:var(--font-geist-mono)] text-[11px] font-semibold tracking-wider underline-offset-4 hover:underline disabled:opacity-40 disabled:no-underline";

export default function ThreatTable({
  threats,
  busyId,
  onApprove,
  onRestore,
  onEdit,
  onArchive,
}: Props) {
  return (
    <div className="overflow-x-auto border-t border-rule">
      <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-rule text-[11px] uppercase tracking-wider text-muted">
            <th className="py-2 pr-3 font-semibold">Status</th>
            <th className="py-2 pr-3 font-semibold">Modus</th>
            <th className="hidden py-2 pr-3 font-semibold md:table-cell">Kategori</th>
            <th className="hidden py-2 pr-3 font-semibold md:table-cell">Sumber</th>
            <th className="hidden py-2 pr-3 font-semibold lg:table-cell">IOC</th>
            <th className="hidden py-2 pr-3 font-semibold lg:table-cell">Tanggal</th>
            <th className="py-2 text-right font-semibold">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {threats.map((t) => {
            const busy = busyId === t.id;
            return (
              <tr key={t.id} className="border-b border-rule align-top">
                <td className="py-3 pr-3">
                  <StatusBadge status={t.status} />
                </td>
                <td className="max-w-[30rem] py-3 pr-3">
                  <p className="font-semibold leading-snug">{t.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted">{t.description}</p>
                  {t.source_url && (
                    <a
                      href={t.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="data mt-1 block truncate hover:text-alert-ink"
                    >
                      {t.source_url}
                    </a>
                  )}
                  <p className="data mt-1 md:hidden">
                    {CATEGORY_LABEL[t.category] ?? t.category} · {SOURCE_LABEL[t.source_type]}
                  </p>
                </td>
                <td className="hidden py-3 pr-3 text-xs md:table-cell">
                  {CATEGORY_LABEL[t.category] ?? t.category}
                </td>
                <td className="hidden py-3 pr-3 text-xs text-muted md:table-cell">
                  {SOURCE_LABEL[t.source_type]}
                  <span className="block truncate">{t.source_media}</span>
                </td>
                <td className="hidden py-3 pr-3 lg:table-cell">
                  <span className="data">{t.scammer_indicators.length}</span>
                  {t.scammer_indicators.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {t.scammer_indicators.slice(0, 2).map((ioc) => (
                        <li
                          key={`${ioc.type}:${ioc.value}`}
                          className="max-w-[14rem] truncate font-[family-name:var(--font-geist-mono)] text-[11px] text-muted"
                          title={`${ioc.type}: ${ioc.value}`}
                        >
                          {ioc.value}
                        </li>
                      ))}
                      {t.scammer_indicators.length > 2 && (
                        <li className="text-[11px] text-muted">
                          +{t.scammer_indicators.length - 2} lagi
                        </li>
                      )}
                    </ul>
                  )}
                </td>
                <td className="hidden py-3 pr-3 text-xs text-muted lg:table-cell">
                  {formatNewsDate(t.created_at)}
                </td>
                <td className="py-3 text-right">
                  <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                    {t.status === "pending" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onApprove(t)}
                        className={`${action} text-safe`}
                      >
                        [ APPROVE ]
                      </button>
                    )}
                    {t.status === "rejected" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onRestore(t)}
                        className={`${action} text-safe`}
                      >
                        [ RESTORE ]
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onEdit(t)}
                      className={`${action} text-ink`}
                    >
                      [ EDIT ]
                    </button>
                    {t.status !== "rejected" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onArchive(t)}
                        className={`${action} text-alert-ink`}
                      >
                        [ ARCHIVE ]
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
