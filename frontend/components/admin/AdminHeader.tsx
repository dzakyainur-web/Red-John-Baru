"use client";

import React from "react";
import Link from "next/link";
import { Search, Bell, ExternalLink, Menu } from "lucide-react";

type AdminHeaderProps = {
  currentTabLabel?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenMobileSidebar: () => void;
  onOpenPending: () => void;
  unreadCount?: number;
  // Pencarian hanya relevan untuk tabel ancaman; sembunyikan di tab lain.
  showSearch?: boolean;
};

export default function AdminHeader({
  currentTabLabel = "Dashboard",
  searchQuery,
  onSearchChange,
  onOpenMobileSidebar,
  onOpenPending,
  unreadCount = 0,
  showSearch = true,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between gap-3 border-b border-white/[0.08] bg-[#0c0d0d]/85 px-4 backdrop-blur-md sm:px-8">
      {/* Left: Mobile hamburger & Breadcrumbs */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="rounded-lg p-2 text-zinc-400 hover:bg-white/[0.06] hover:text-white lg:hidden transition-colors"
          title="Buka Menu"
        >
          <Menu className="size-5" />
        </button>

        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 items-center gap-2 text-sm text-zinc-400"
        >
          <Link href="/admin" className="text-zinc-500 hover:text-zinc-200 transition-colors">
            Admin
          </Link>
          <span className="text-zinc-600">›</span>
          <span className="truncate font-medium text-white">{currentTabLabel}</span>
        </nav>
      </div>

      {/* Right: pencarian ancaman, antrian pending, tautan situs publik */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {showSearch && (
          <div className="relative hidden sm:block">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
              <Search className="size-4" />
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari ancaman / IOC..."
              className="h-9 w-44 rounded-xl border border-white/10 bg-[#161817] pl-9 pr-3 text-xs text-white placeholder:text-zinc-500 focus:border-[#3ECF8E]/60 focus:bg-[#1a1c1b] focus:outline-none focus:ring-1 focus:ring-[#3ECF8E]/40 transition-all md:w-64"
            />
          </div>
        )}

        <button
          type="button"
          onClick={onOpenPending}
          className="relative rounded-xl border border-white/10 bg-[#161817] p-2 text-zinc-400 hover:bg-white/[0.06] hover:text-white transition-colors"
          title={`${unreadCount} ancaman menunggu verifikasi`}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[#0c0d0d]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10 hover:text-white transition-colors"
        >
          <span className="hidden sm:inline">Buka Situs</span>
          <ExternalLink className="size-3.5 text-zinc-400" />
        </Link>
      </div>
    </header>
  );
}
