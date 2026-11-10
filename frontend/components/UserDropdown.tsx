"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useMemo } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  Avatar as ShadcnAvatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

export interface UserDropdownProps {
  className?: string;
  defaultOpen?: boolean;
  showNotifications?: boolean;
  showCart?: boolean;
}

// Avatar lokal untuk pengguna tanpa avatar_url. Dipilih deterministik dari
// seed (id/email) supaya satu pengguna selalu dapat gambar yang sama,
// dengan rotasi "ganti-ganti" ringan agar tidak semua orang identik.
const AVATAR_POOL = [
  "/avatars/1.png",
  "/avatars/2.png",
  "/avatars/3.png",
  "/avatars/4.png",
  "/avatars/5.png",
  "/avatars/6.png",
  "/avatars/7.png",
  "/avatars/8.png",
] as const;

function hashSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// Urutan gambar pengguna tidak sama dengan urutan seed, jadi seed mirip
// (mis. "user1", "user2") tetap mendapat variasi.
function poolIndex(seed: string) {
  const h = hashSeed(seed);
  return (h + Math.floor(h / AVATAR_POOL.length) * 7) % AVATAR_POOL.length;
}

function localAvatarFor(seed: string) {
  return AVATAR_POOL[poolIndex(seed)];
}

const NAME_KEYS = ["full_name", "name", "display_name", "username"] as const;

// Role dibaca dari public.profiles (bukan app_metadata) — sumber yang sama dengan
// yang diperiksa backend, jadi badge tidak bisa "lebih admin" dari hak akses asli.
// RLS hanya mengizinkan user membaca barisnya sendiri.
async function fetchRole(userId: string): Promise<"admin" | "user"> {
  if (!supabase) return "user";
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return "user";
  return data.role === "admin" ? "admin" : "user";
}

function resolveName(user: User) {
  const meta = user.user_metadata ?? {};
  for (const key of NAME_KEYS) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return user.email?.split("@")[0] ?? "Pengguna";
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function Avatar({
  user,
  name,
  className,
}: {
  user: User;
  name: string;
  className?: string;
}) {
  const src =
    (user.user_metadata?.avatar_url as string | undefined) ??
    localAvatarFor(user.id || user.email || name || "user");

  return (
    <ShadcnAvatar className={cn("size-full rounded-full", className)}>
      <AvatarImage src={src} alt={`Avatar ${name}`} className="object-cover" />
      <AvatarFallback className="rounded-full bg-zinc-800 text-[10px] font-semibold text-zinc-200">
        {initialsOf(name) || "?"}
      </AvatarFallback>
    </ShadcnAvatar>
  );
}

export default function UserDropdown({
  className = "",
  defaultOpen = false,
  showNotifications = false,
  showCart = false,
}: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"admin" | "user">("user");
  // Sudah "loaded" sejak awal bila Supabase tidak dikonfigurasi.
  const [loaded, setLoaded] = useState(() => !supabase);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keep the profile in sync with the active Supabase session.
  // `loaded` tetap false sampai getSession selesai agar UI tidak berkedip ke "Tamu".
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setLoaded(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoaded(true);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  // Ambil role sekali per sesi, dan lagi saat user berganti.
  const userId = user?.id;
  useEffect(() => {
    let active = true;
    if (!userId) {
      setRole("user");
      return;
    }
    void fetchRole(userId)
      .then((r) => active && setRole(r))
      .catch(() => active && setRole("user"));
    return () => {
      active = false;
    };
  }, [userId]);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const profile = useMemo(() => {
    if (!user) return null;
    const name = resolveName(user);
    const admin = role === "admin";
    return {
      name,
      email: user.email ?? "",
      admin,
      statusLabel: admin ? "Admin" : "Pelanggan Aktif",
    };
  }, [user, role]);

  return (
    <div
      className={`relative flex items-center gap-2.5 shrink-0 ${className}`}
      ref={dropdownRef}
    >
      {/* ─── Notification Bell (Optional) ─── */}
      {showNotifications && (
        <button
          type="button"
          aria-label="Notifikasi"
          className="group relative flex size-9 items-center justify-center rounded-full text-zinc-300 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer"
        >
          <svg
            className="size-[20px] transition-transform group-hover:scale-105"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
            />
          </svg>
        </button>
      )}

      {/* ─── Cart (Optional) ─── */}
      {showCart && (
        <button
          type="button"
          aria-label="Keranjang"
          className="group relative flex size-9 items-center justify-center rounded-full text-zinc-300 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer"
        >
          <svg
            className="size-[20px] transition-transform group-hover:scale-105"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
            />
          </svg>
        </button>
      )}

      {/* ─── Subtle Vertical Divider Line (Only shown when icons present) ─── */}
      {(showNotifications || showCart) && (
        <div className="h-6 w-px bg-white/15 mx-0.5" aria-hidden="true" />
      )}

      {/* ─── User Profile Pill Button (Dropdown Trigger - dark theme matching landing page) ─── */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-haspopup="true"
          aria-expanded={isOpen}
          className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-[#161817] text-white border border-white/10 hover:border-white/25 hover:bg-white/[0.06] shadow-sm active:scale-[0.98] transition-all cursor-pointer select-none ${
            isOpen ? "border-white/25 bg-white/[0.08]" : ""
          }`}
        >
          {/* Circular Avatar */}
          <div className="relative size-7 rounded-full overflow-hidden shrink-0 border border-white/15 bg-zinc-800">
            {user && profile ? (
              <Avatar user={user} name={profile.name} />
            ) : (
              <div className="size-full bg-zinc-800" />
            )}
          </div>

          {/* User Name */}
          <span className="text-[13px] font-semibold text-white tracking-tight leading-none">
            {!loaded ? "…" : profile ? profile.name : "Tamu"}
          </span>

          {/* Role Badge */}
          {profile && (
            <span className="px-2 py-0.5 rounded-[5px] bg-white/[0.08] border border-white/10 text-zinc-300 text-[11px] font-medium leading-none tracking-tight">
              {profile.admin ? "Admin" : "Member"}
            </span>
          )}

          {/* Chevron Indicator: Points Up when open, Down when closed */}
          <svg
            className={`size-3.5 text-zinc-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-white" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {/* ─── Dropdown Card (Dark theme matching landing page #161817 / #0c0d0d) ─── */}
        {isOpen && (
          <div
            className="absolute top-full right-0 mt-2.5 w-[300px] rounded-2xl bg-[#161817] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.7)] p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right text-white"
            role="menu"
            aria-orientation="vertical"
          >
            {profile && user ? (
              <>
                {/* Header: User Profile Card */}
                <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-3 flex items-center gap-3">
                  {/* Larger Avatar */}
                  <div className="relative size-11 rounded-full overflow-hidden shrink-0 border border-white/15 shadow-sm bg-zinc-800">
                    <Avatar user={user} name={profile.name} />
                  </div>

                  {/* User Details */}
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold text-white leading-tight truncate">
                      {profile.name}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono tracking-tight leading-tight mt-0.5 truncate">
                      {profile.email}
                    </div>

                    {/* Status Pill */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10.5px] font-semibold mt-1.5 ${
                        profile.admin
                          ? "bg-[#FF3815]/15 border-[#FF3815]/30 text-[#FF8A70]"
                          : "bg-[#10B981]/15 border-[#10B981]/30 text-[#34D399]"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full animate-pulse ${
                          profile.admin ? "bg-[#FF3815]" : "bg-[#10B981]"
                        }`}
                      />
                      <span>{profile.statusLabel}</span>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="mt-1.5 space-y-0.5">
                  {profile.admin ? (
                    <>
                      {/* Admin: Dashboard */}
                      <Link
                        href="/admin"
                        role="menuitem"
                        onClick={() => setIsOpen(false)}
                        className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors text-left group cursor-pointer"
                      >
                        <div className="size-9 rounded-xl bg-[#FF3815]/15 border border-[#FF3815]/25 text-[#FF8A70] flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-[#FF3815]/25 transition-all">
                          {/* Layout grid icon */}
                          <svg
                            className="size-4.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <rect x="3.75" y="3.75" width="7" height="7" rx="1.5" />
                            <rect x="13.25" y="3.75" width="7" height="7" rx="1.5" />
                            <rect x="3.75" y="13.25" width="7" height="7" rx="1.5" />
                            <rect x="13.25" y="13.25" width="7" height="7" rx="1.5" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-semibold text-zinc-200 leading-tight group-hover:text-[#FF8A70] transition-colors">
                            Dashboard Admin
                          </div>
                          <div className="text-[11px] text-zinc-400 font-normal leading-tight mt-0.5">
                            Kelola ancaman & berita
                          </div>
                        </div>
                      </Link>

                      {/* Admin: Kelola Bank Soal */}
                      <Link
                        href="/quiz/admin"
                        role="menuitem"
                        onClick={() => setIsOpen(false)}
                        className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors text-left group cursor-pointer"
                      >
                        <div className="size-9 rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-violet-500/25 transition-all">
                          {/* Question / list icon */}
                          <svg
                            className="size-4.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h11.25M8.25 12h11.25M8.25 17.25h11.25" />
                            <circle cx="4.5" cy="6.75" r="1.1" fill="currentColor" stroke="none" />
                            <circle cx="4.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
                            <circle cx="4.5" cy="17.25" r="1.1" fill="currentColor" stroke="none" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-semibold text-zinc-200 leading-tight group-hover:text-violet-400 transition-colors">
                            Kelola Bank Soal
                          </div>
                          <div className="text-[11px] text-zinc-400 font-normal leading-tight mt-0.5">
                            Soal simulasi kognitif
                          </div>
                        </div>
                      </Link>

                      {/* Admin: Radar Berita */}
                      <Link
                        href="/berita"
                        role="menuitem"
                        onClick={() => setIsOpen(false)}
                        className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors text-left group cursor-pointer"
                      >
                        <div className="size-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-emerald-500/25 transition-all">
                          {/* Radar / broadcast icon */}
                          <svg
                            className="size-4.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <circle cx="12" cy="12" r="2" />
                            <path strokeLinecap="round" d="M12 12 18.4 5.6M16.24 16.24a6 6 0 0 0 0-8.49M7.76 7.76a6 6 0 0 0 0 8.49" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-semibold text-zinc-200 leading-tight group-hover:text-emerald-400 transition-colors">
                            Radar Berita
                          </div>
                          <div className="text-[11px] text-zinc-400 font-normal leading-tight mt-0.5">
                            Pantau ancaman terbaru
                          </div>
                        </div>
                      </Link>
                    </>
                  ) : (
                    <>
                      {/* 1. Pesanan Saya */}
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors text-left group cursor-pointer"
                      >
                        <div className="size-9 rounded-xl bg-blue-500/15 border border-blue-500/25 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-blue-500/25 transition-all">
                          {/* Shopping Bag Icon with handle & pocket */}
                          <svg
                            className="size-4.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
                            />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-semibold text-zinc-200 leading-tight group-hover:text-blue-400 transition-colors">
                            Pesanan Saya
                          </div>
                          <div className="text-[11px] text-zinc-400 font-normal leading-tight mt-0.5">
                            Riwayat transaksi
                          </div>
                        </div>
                      </button>

                      {/* 2. Poin Saya */}
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors text-left group cursor-pointer"
                      >
                        <div className="size-9 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-amber-500/25 transition-all">
                          {/* Coin / sparkle icon */}
                          <svg
                            className="size-4.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <circle cx="12" cy="12" r="8.25" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v7.5M9.75 10.5h3.375a1.875 1.875 0 0 1 0 3.75H9.75" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-semibold text-zinc-200 leading-tight group-hover:text-amber-400 transition-colors">
                            Poin Saya
                          </div>
                          <div className="text-[11px] text-zinc-400 font-normal leading-tight mt-0.5">
                            Saldo & riwayat poin
                          </div>
                        </div>
                      </button>

                      {/* 3. Jelajahi Katalog */}
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors text-left group cursor-pointer"
                      >
                        <div className="size-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-emerald-500/25 transition-all">
                          {/* Compass exploration icon */}
                          <svg
                            className="size-4.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <circle cx="12" cy="12" r="9" />
                            <polygon
                              points="15.5,8.5 13.5,14 8.5,15.5 10.5,10"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-semibold text-zinc-200 leading-tight group-hover:text-emerald-400 transition-colors">
                            Jelajahi Katalog
                          </div>
                          <div className="text-[11px] text-zinc-400 font-normal leading-tight mt-0.5">
                            Lihat semua koleksi buku
                          </div>
                        </div>
                      </button>
                    </>
                  )}
                </div>

                {/* Divider line */}
                <div className="my-1.5 border-t border-white/[0.08]" />

                {/* 4. Keluar dari Akun */}
                <Link
                  href="/login"
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-red-500/10 active:bg-red-500/15 transition-colors text-left group cursor-pointer"
                >
                  <div className="size-9 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-red-500/25 transition-all">
                    {/* Logout icon */}
                    <svg
                      className="size-4.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                      />
                      <polyline
                        points="16 17 21 12 16 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <line
                        x1="21"
                        y1="12"
                        x2="9"
                        y2="12"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-red-400 leading-tight group-hover:text-red-300 transition-colors">
                      Keluar dari Akun
                    </div>
                  </div>
                </Link>
              </>
            ) : loaded ? (
              /* Guest: belum ada sesi Supabase */
              <div className="p-3">
                <div className="text-[13px] font-semibold text-white">Belum masuk</div>
                <div className="text-[11px] text-zinc-400 leading-tight mt-0.5">
                  Masuk untuk melihat profil dan riwayat akun.
                </div>
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="mt-3 flex items-center justify-center rounded-full bg-white py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition-colors"
                >
                  Masuk
                </Link>
              </div>
            ) : (
              <div className="p-3 text-[12px] text-zinc-400">Memuat profil…</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
