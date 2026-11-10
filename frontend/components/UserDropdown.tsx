"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";

export interface UserDropdownProps {
  className?: string;
  defaultOpen?: boolean;
  showNotifications?: boolean;
  showCart?: boolean;
}

export default function UserDropdown({
  className = "",
  defaultOpen = false,
  showNotifications = false,
  showCart = false,
}: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
          </svg>
        </button>
      )}

      {/* ─── Shopping Cart with Badge (Optional) ─── */}
      {showCart && (
        <button
          type="button"
          aria-label="Keranjang belanja (2 barang)"
          className="group relative flex size-9 items-center justify-center rounded-full text-zinc-300 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer"
        >
          <svg
            className="size-[21px] transition-transform group-hover:scale-105"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
            />
          </svg>
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-[#E7272F] text-[10px] font-bold text-white shadow-sm ring-2 ring-[#0c0d0d] leading-none">
            2
          </span>
        </button>
      )}

      {/* ─── Subtle Vertical Divider Line (Only shown when icons present) ─── */}
      {(showNotifications || showCart) && (
        <div className="h-6 w-px bg-white/15 mx-0.5" aria-hidden="true" />
      )}

      {/* ─── User Profile Pill Button (Dropdown Trigger) ─── */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-haspopup="true"
          aria-expanded={isOpen}
          className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-white text-slate-800 border border-slate-200/90 hover:bg-slate-50 shadow-sm active:scale-[0.98] transition-all cursor-pointer select-none"
        >
          {/* Circular Avatar */}
          <div className="relative size-7 rounded-full overflow-hidden shrink-0 border border-slate-200/60 bg-slate-100">
            <Image
              src="/avatar-jekee.png"
              alt="Avatar jekee"
              width={28}
              height={28}
              className="size-full object-cover"
              priority
            />
          </div>

          {/* User Name */}
          <span className="text-[13px] font-semibold text-slate-800 tracking-tight leading-none">
            jekee
          </span>

          {/* Member Badge */}
          <span className="px-2 py-0.5 rounded-[5px] bg-[#EBF0F6] text-[#475569] text-[11px] font-medium leading-none tracking-tight">
            Member
          </span>

          {/* Chevron Indicator: Points Up when open, Down when closed */}
          <svg
            className={`size-3.5 text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-slate-600" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {/* ─── Dropdown Card (Floating popup ala Gambar 2) ─── */}
        {isOpen && (
          <div
            className="absolute top-full right-0 mt-2.5 w-[300px] rounded-2xl bg-white border border-slate-200/80 shadow-[0_20px_45px_-10px_rgba(0,0,0,0.25)] p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right text-slate-800"
            role="menu"
            aria-orientation="vertical"
          >
            {/* Header: User Profile Card */}
            <div className="rounded-xl bg-[#F8FAFC] border border-slate-150/80 p-3 flex items-center gap-3">
              {/* Larger Avatar */}
              <div className="relative size-11 rounded-full overflow-hidden shrink-0 border border-slate-200 shadow-sm bg-slate-100">
                <Image
                  src="/avatar-jekee.png"
                  alt="Avatar jekee"
                  width={44}
                  height={44}
                  className="size-full object-cover"
                />
              </div>

              {/* User Details */}
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-bold text-slate-900 leading-tight">
                  jekee
                </div>
                <div className="text-[11px] text-slate-500 font-mono tracking-tight leading-tight mt-0.5 truncate">
                  dzakyrahman121@gmail.com
                </div>

                {/* Status Pill: Pelanggan Aktif */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E6F7F2] border border-[#B1E6D8] text-[#059669] text-[10.5px] font-semibold mt-1.5">
                  <span className="size-1.5 rounded-full bg-[#10B981]" />
                  <span>Pelanggan Aktif</span>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="mt-1.5 space-y-0.5">
              {/* 1. Pesanan Saya */}
              <button
                type="button"
                role="menuitem"
                className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors text-left group cursor-pointer"
              >
                <div className="size-9 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
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
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 13.5a3 3 0 006 0"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                    Pesanan Saya
                  </div>
                  <div className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5">
                    Riwayat & status pesanan
                  </div>
                </div>
              </button>

              {/* 2. Poin Saya */}
              <button
                type="button"
                role="menuitem"
                className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors text-left group cursor-pointer"
              >
                <div className="size-9 rounded-xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {/* Coins Icon */}
                  <svg
                    className="size-4.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="8" cy="15" r="5" className="fill-[#FFFBEB]" />
                    <circle cx="8" cy="15" r="2.2" />
                    <path d="M10.8 9.5a5 5 0 1 1 6.7 6.7" />
                    <path d="M14 12a2.2 2.2 0 0 0-1.8-1.8" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-slate-800 leading-tight group-hover:text-amber-600 transition-colors">
                    Poin Saya
                  </div>
                  <div className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5">
                    Saldo & riwayat poin
                  </div>
                </div>
              </button>

              {/* 3. Jelajahi Katalog */}
              <button
                type="button"
                role="menuitem"
                className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors text-left group cursor-pointer"
              >
                <div className="size-9 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
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
                  <div className="text-[13px] font-semibold text-slate-800 leading-tight group-hover:text-emerald-600 transition-colors">
                    Jelajahi Katalog
                  </div>
                  <div className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5">
                    Lihat semua koleksi buku
                  </div>
                </div>
              </button>
            </div>

            {/* Divider line */}
            <div className="my-1.5 border-t border-slate-100" />

            {/* 4. Keluar dari Akun */}
            <button
              type="button"
              role="menuitem"
              className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-red-50/80 active:bg-red-100/60 transition-colors text-left group cursor-pointer"
            >
              <div className="size-9 rounded-xl bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
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
                <div className="text-[13px] font-semibold text-[#EF4444] leading-tight group-hover:text-red-700 transition-colors">
                  Keluar dari Akun
                </div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
