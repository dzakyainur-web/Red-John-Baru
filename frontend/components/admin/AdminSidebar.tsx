"use client";

import React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  ShieldAlert,
  Newspaper,
  Award,
  Settings,
  PanelLeftClose,
  ChevronDown,
  ExternalLink,
  ScanSearch,
  Link2,
  GraduationCap,
  Terminal,
  type LucideIcon,
} from "lucide-react";

export type AdminTab = "dashboard" | "ancaman" | "berita" | "kuis" | "sistem";

export const ADMIN_TAB_LABEL: Record<AdminTab, string> = {
  dashboard: "Ringkasan",
  ancaman: "Ancaman & IOC",
  berita: "Berita & Broadcast",
  kuis: "Bank Soal Kuis",
  sistem: "Status Sistem",
};

type NavItem = {
  label: string;
  icon: LucideIcon;
  tab?: AdminTab;
  href?: string;
  badge?: boolean;
};

type AdminSidebarProps = {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  pendingCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
};

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "UTAMA",
    items: [
      { label: "Ringkasan", icon: LayoutDashboard, tab: "dashboard" },
      { label: "Ancaman & IOC", icon: ShieldAlert, tab: "ancaman", badge: true },
      { label: "Berita & Broadcast", icon: Newspaper, tab: "berita" },
      { label: "Bank Soal Kuis", icon: Award, tab: "kuis" },
    ],
  },
  {
    title: "HALAMAN PUBLIK",
    items: [
      { label: "Pemindai Pesan", icon: ScanSearch, href: "/pemindai" },
      { label: "Periksa Tautan", icon: Link2, href: "/inspect" },
      { label: "Feed Berita", icon: Newspaper, href: "/berita" },
      { label: "Kuis Publik", icon: GraduationCap, href: "/quiz" },
      { label: "Konsol API", icon: Terminal, href: "/dev" },
    ],
  },
  {
    title: "SISTEM",
    items: [{ label: "Status Sistem", icon: Settings, tab: "sistem" }],
  },
];

export default function AdminSidebar({
  currentTab,
  onTabChange,
  pendingCount = 0,
  isOpenMobile = false,
  onCloseMobile,
}: AdminSidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-white/[0.08] bg-[#121313] transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-5">
          {/* Brand */}
          <div className="mb-6 flex items-center justify-between px-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#3ECF8E] font-bold text-black shadow-sm shadow-[#3ECF8E]/20">
                <span className="text-xl tracking-tighter font-extrabold">R</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-white">Red John</span>
                <span className="rounded-md border border-[#3ECF8E]/30 bg-[#3ECF8E]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#3ECF8E]">
                  ADMIN
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={onCloseMobile}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-white transition-colors lg:hidden"
              title="Tutup Navigasi"
            >
              <PanelLeftClose className="size-4" />
            </button>
          </div>

          <nav className="space-y-6" aria-label="Navigasi panel admin">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title}>
                <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const itemClass =
                      "group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all";

                    if (item.href) {
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`${itemClass} text-zinc-400 hover:bg-white/[0.04] hover:text-white`}
                        >
                          <span className="flex items-center gap-3">
                            <Icon className="size-4 text-zinc-400 group-hover:text-zinc-200" />
                            <span>{item.label}</span>
                          </span>
                          <ExternalLink className="size-3 text-zinc-600" />
                        </Link>
                      );
                    }

                    const tab = item.tab!;
                    const isActive = currentTab === tab;
                    const badge = item.badge && pendingCount > 0 ? String(pendingCount) : undefined;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => {
                          onTabChange(tab);
                          onCloseMobile?.();
                        }}
                        aria-current={isActive ? "page" : undefined}
                        className={`${itemClass} ${
                          isActive
                            ? "border border-white/10 bg-white/[0.08] text-white shadow-xs"
                            : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon
                            className={`size-4 transition-colors ${
                              isActive
                                ? "text-[#3ECF8E]"
                                : "text-zinc-400 group-hover:text-zinc-200"
                            }`}
                          />
                          <span>{item.label}</span>
                        </span>
                        {badge && (
                          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400">
                            {badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer: keluar = /login (halaman itu mengakhiri sesi Supabase) */}
        <div className="border-t border-white/[0.08] p-3">
          <Link
            href="/login"
            title="Keluar dari panel admin"
            className="flex items-center justify-between rounded-xl p-2 transition-colors hover:bg-white/[0.04]"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#3ECF8E] to-emerald-600 font-bold text-black text-xs shadow-sm">
                RJ
              </span>
              <span className="min-w-0 text-left">
                <span className="block truncate text-xs font-semibold text-white">Admin</span>
                <span className="block truncate text-[11px] text-zinc-400">
                  Keluar dari akun
                </span>
              </span>
            </span>
            <ChevronDown className="size-4 shrink-0 -rotate-90 text-zinc-500" />
          </Link>
        </div>
      </aside>
    </>
  );
}
