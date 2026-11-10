"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Newspaper,
  GraduationCap,
  BookOpen,
  RotateCcw,
} from "lucide-react";

import AdminSidebar, { ADMIN_TAB_LABEL, type AdminTab } from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import StatCard from "./StatCard";
import RecentThreatsCard from "./RecentThreatsCard";
import ThreatModal from "./ThreatModal";
import ThreatTable from "./ThreatTable";
import RandomNewsPanel from "./RandomNewsPanel";
import QuizAdminClient from "@/components/quiz/admin/QuizAdminClient";

import {
  EMPTY_FILTERS,
  STATUS_LABEL,
  THREAT_STATUSES,
  archiveThreat,
  createThreat,
  listThreats,
  updateThreat,
  type Threat,
  type ThreatFilters,
  type ThreatInput,
} from "@/lib/threats";
import { fetchRandomNews } from "@/lib/random-news";
import { listAdminQuestions } from "@/lib/quiz";
import { supabase } from "@/lib/supabase";
import { API_BASE, fetchHealth, type Health } from "@/lib/api";

const panel =
  "rounded-2xl border border-white/[0.08] bg-[#161817] p-5 sm:p-6 shadow-lg space-y-4";

export default function AdminDashboardClient() {
  const [currentTab, setCurrentTab] = useState<AdminTab>("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ThreatFilters>(EMPTY_FILTERS);
  const [items, setItems] = useState<Threat[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ threat: Threat | null } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Ringkasan dashboard. Hitungan status diambil terpisah dari daftar terfilter,
  // supaya badge sidebar tetap benar saat tabel difilter.
  const [counts, setCounts] = useState<{ pending: number; verified: number } | null>(null);
  const [newsTotal, setNewsTotal] = useState<number | null>(null);
  const [quizTotal, setQuizTotal] = useState<number | null>(null);
  const [health, setHealth] = useState<Health | null>(null);

  // Pencarian header -> filter tabel (debounce 300 ms).
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((f) => (f.q === search ? f : { ...f, q: search }));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Daftar ancaman — dipakai dashboard & tab ancaman.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
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

  // Jumlah per status (tanpa filter tabel).
  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      listThreats({ ...EMPTY_FILTERS, status: "pending" }, 1, 0),
      listThreats({ ...EMPTY_FILTERS, status: "verified" }, 1, 0),
    ])
      .then(([p, v]) => {
        if (!cancelled) setCounts({ pending: p.total, verified: v.total });
      })
      .catch(() => {
        if (!cancelled) setCounts(null);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Ringkasan: berita + kesehatan backend saat dashboard/sistem, bank soal saat kuis.
  useEffect(() => {
    let cancelled = false;
    if (currentTab === "dashboard" || currentTab === "berita") {
      void fetchRandomNews(1)
        .then((d) => !cancelled && setNewsTotal(d.total))
        .catch(() => !cancelled && setNewsTotal(null));
    }
    if (currentTab === "dashboard" || currentTab === "sistem") {
      void fetchHealth()
        .then((h) => !cancelled && setHealth(h))
        .catch(() => !cancelled && setHealth(null));
    }
    if (currentTab === "dashboard" || currentTab === "kuis") {
      // Bank soal butuh token sesi Supabase, sama seperti /quiz/admin.
      void (async () => {
        try {
          const session = supabase ? (await supabase.auth.getSession()).data.session : null;
          if (!session) throw new Error("tanpa sesi");
          const rounds = await listAdminQuestions(session.access_token);
          if (!cancelled) setQuizTotal(rounds.filter((r) => r.is_active).length);
        } catch {
          if (!cancelled) setQuizTotal(null);
        }
      })();
    }
    return () => {
      cancelled = true;
    };
  }, [currentTab]);

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

  function handleRefresh() {
    setReloadKey((k) => k + 1);
  }

  function handleArchive(threat: Threat) {
    if (
      !window.confirm(
        `Arsipkan "${threat.title}"?\n\nData tidak dihapus permanen — status menjadi REJECTED dan bisa dipulihkan.`
      )
    ) {
      return;
    }
    void mutate(threat.id, () => archiveThreat(threat.id));
  }

  const pendingCount =
    counts?.pending ?? items.filter((t) => t.status === "pending").length;
  const verifiedCount =
    counts?.verified ?? items.filter((t) => t.status === "verified").length;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#0c0d0d] text-white selection:bg-[#3ECF8E] selection:text-black antialiased font-sans">
      <AdminSidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        pendingCount={pendingCount}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          currentTabLabel={ADMIN_TAB_LABEL[currentTab]}
          searchQuery={search}
          onSearchChange={setSearch}
          showSearch={currentTab === "dashboard" || currentTab === "ancaman"}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenPending={() => setCurrentTab("ancaman")}
          unreadCount={pendingCount}
        />

        <main className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
          {error && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300"
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/30 px-2.5 py-1 font-semibold hover:bg-red-500/20"
              >
                <RotateCcw className="size-3.5" /> Coba lagi
              </button>
            </div>
          )}

          {/* TAB: DASHBOARD */}
          {currentTab === "dashboard" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
                <p className="mt-1 text-sm text-zinc-400">
                  Ringkasan antrian triage ancaman, bank berita, dan kesehatan backend.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Ancaman Pending"
                  value={loading ? "…" : pendingCount}
                  icon={ShieldAlert}
                  iconColor="text-amber-400"
                  iconBg="bg-amber-500/10 border-amber-500/20"
                  badgeText="Antrian"
                  badgeColor="bg-amber-500/10 text-amber-400 border-amber-500/20"
                  subtitle="Menunggu verifikasi admin"
                />
                <StatCard
                  title="Terverifikasi"
                  value={loading ? "…" : verifiedCount}
                  icon={ShieldCheck}
                  badgeText={`${total} total`}
                  subtitle="Tampil di feed publik"
                />
                <StatCard
                  title="Berita Terverifikasi"
                  value={newsTotal ?? "—"}
                  icon={Newspaper}
                  iconColor="text-blue-400"
                  iconBg="bg-blue-500/10 border-blue-500/20"
                  badgeText="News feed"
                  badgeColor="bg-blue-500/10 text-blue-400 border-blue-500/20"
                  subtitle="Siap disiarkan ke Discord"
                />
                <StatCard
                  title="Soal Kuis Aktif"
                  value={quizTotal ?? "—"}
                  icon={GraduationCap}
                  iconColor="text-purple-400"
                  iconBg="bg-purple-500/10 border-purple-500/20"
                  badgeText="Bank soal"
                  badgeColor="bg-purple-500/10 text-purple-400 border-purple-500/20"
                  subtitle="Tersedia di /quiz"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2">
                  <RecentThreatsCard
                    threats={items.slice(0, 5)}
                    busyId={busyId}
                    onViewAll={() => setCurrentTab("ancaman")}
                    onEdit={(t) => setModal({ threat: t })}
                    onApprove={(t) =>
                      void mutate(t.id, () => updateThreat(t.id, { status: "verified" }))
                    }
                    onArchive={handleArchive}
                  />
                </div>

                <div className={`${panel} h-fit`}>
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <h2 className="text-sm font-semibold text-white">Kesehatan backend</h2>
                    <button
                      type="button"
                      onClick={() => {
                        setHealth(null);
                        void fetchHealth()
                          .then(setHealth)
                          .catch(() => setHealth(null));
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white"
                    >
                      <RotateCcw className="size-3.5" /> Cek ulang
                    </button>
                  </div>
                  <dl className="space-y-2.5 text-xs">
                    <div className="flex justify-between gap-3">
                      <dt className="text-zinc-400">Status API</dt>
                      <dd className="font-semibold">
                        {health === null ? (
                          <span className="text-zinc-500">Tidak terjangkau</span>
                        ) : health.status === "ok" ? (
                          <span className="text-[#3ECF8E]">OK</span>
                        ) : (
                          <span className="text-amber-400">Degraded</span>
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-zinc-400">Model ML</dt>
                      <dd className="font-medium text-white">
                        {health?.model_version ?? (health ? "Tidak dimuat" : "—")}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-zinc-400">Berita di database</dt>
                      <dd className="font-medium text-white">
                        {newsTotal === null ? "—" : `${newsTotal} item`}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-zinc-400">Antrian pending</dt>
                      <dd className="font-medium text-white">{pendingCount}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ANCAMAN & IOC */}
          {currentTab === "ancaman" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">Ancaman & IOC</h1>
                  <p className="mt-1 text-sm text-zinc-400">
                    Verifikasi laporan komunitas, harvester, dan laporan manual sebelum tampil di
                    feed publik.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10"
                  >
                    <RotateCcw className="size-3.5" /> Segarkan
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal({ threat: null })}
                    className="rounded-xl bg-[#3ECF8E] px-4 py-2 text-xs font-bold text-black hover:bg-[#35b87e] transition-colors"
                  >
                    + Tambah ancaman
                  </button>
                </div>
              </div>

              {/* Filter status — sejalan dengan query backend */}
              <div className="flex flex-wrap gap-1.5">
                {THREAT_STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, status }))}
                    aria-pressed={filters.status === status}
                    className={`min-w-[7.5rem] rounded-md border px-4 py-1.5 text-xs font-semibold transition-colors ${
                      filters.status === status
                        ? "border-[#3ECF8E]/40 bg-[#3ECF8E]/10 text-[#3ECF8E]"
                        : "border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {status === "all" ? "Semua" : STATUS_LABEL[status]}
                  </button>
                ))}
                {search && (
                  <span className="inline-flex items-center rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400">
                    Pencarian: “{search}”
                  </span>
                )}
              </div>

              {loading ? (
                <p className={panel}>Memuat ancaman…</p>
              ) : (
                <ThreatTable
                  threats={items}
                  busyId={busyId}
                  onApprove={(t) =>
                    void mutate(t.id, () => updateThreat(t.id, { status: "verified" }))
                  }
                  onRestore={(t) =>
                    void mutate(t.id, () => updateThreat(t.id, { status: "pending" }))
                  }
                  onEdit={(t) => setModal({ threat: t })}
                  onArchive={handleArchive}
                />
              )}
            </div>
          )}

          {/* TAB: BERITA & BROADCAST */}
          {currentTab === "berita" && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Berita & Broadcast Discord
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
                  Tinjau sampel berita terverifikasi lalu siarkan ke channel berita server Discord.
                </p>
              </div>
              <div className={panel}>
                <RandomNewsPanel />
              </div>
              <div className={`${panel} flex flex-wrap items-center justify-between gap-3`}>
                <p className="text-xs text-zinc-400">
                  Feed publik <code className="text-zinc-200">/berita</code> memakai berita hasil
                  harvester yang sudah terverifikasi.
                </p>
                <a
                  href="/berita"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10"
                >
                  <BookOpen className="size-3.5" /> Buka feed publik
                </a>
              </div>
            </div>
          )}

          {/* TAB: KUIS & BANK SOAL */}
          {currentTab === "kuis" && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Kuis & Bank Soal</h1>
                <p className="mt-1 text-sm text-zinc-400">
                  Kelola soal yang tampil di <code className="text-zinc-200">/quiz</code>. Login
                  memakai sesi Supabase yang sama dengan panel ini.
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-[#161817] p-4 sm:p-6 shadow-lg">
                <QuizAdminClient embedded />
              </div>
            </div>
          )}

          {/* TAB: SISTEM / PENGATURAN */}
          {currentTab === "sistem" && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Pengaturan & Status Sistem
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
                  Konfigurasi API, model deteksi, dan integrasi Discord.
                </p>
              </div>
              <div className={panel}>
                <h2 className="text-sm font-semibold text-white">Backend & integrasi</h2>
                <dl className="max-w-xl space-y-3 text-xs">
                  <div className="flex flex-wrap justify-between gap-2 border-b border-white/[0.08] pb-2">
                    <dt className="text-zinc-400">Backend API URL</dt>
                    <dd className="font-mono font-medium text-white">{API_BASE}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2 border-b border-white/[0.08] pb-2">
                    <dt className="text-zinc-400">Status / model ML</dt>
                    <dd className="font-medium">
                      {health === null ? (
                        <span className="text-zinc-500">Tidak terjangkau</span>
                      ) : (
                        <span
                          className={
                            health.status === "ok" ? "text-[#3ECF8E]" : "text-amber-400"
                          }
                        >
                          {health.status} · {health.model_version ?? "tanpa model"}
                        </span>
                      )}
                    </dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2 border-b border-white/[0.08] pb-2">
                    <dt className="text-zinc-400">Tautan operasional</dt>
                    <dd className="flex flex-wrap gap-3 font-medium">
                      <a href="/dev" className="text-[#3ECF8E] hover:underline">
                        Konsol API
                      </a>
                      <a href="/quiz" className="text-[#3ECF8E] hover:underline">
                        Kuis publik
                      </a>
                      <a href="/inspect" className="text-[#3ECF8E] hover:underline">
                        Pemeriksa URL
                      </a>
                      <a href="/pemindai" className="text-[#3ECF8E] hover:underline">
                        Pemindai pesan
                      </a>
                    </dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="text-zinc-400">Integrasi Discord</dt>
                    <dd className="text-zinc-300">
                      Siaran & konfigurasi channel server dikelola bot (Agent-RJ).
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal Tambah / Edit Ancaman */}
      {modal && (
        <ThreatModal
          key={modal.threat?.id ?? "new"}
          threat={modal.threat}
          onClose={() => setModal(null)}
          onCreate={async (input: ThreatInput) => {
            await createThreat(input);
            handleRefresh();
          }}
          onUpdate={async (id, input) => {
            await updateThreat(id, input);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}
