"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV: { href: string; label: string }[] = [
  { href: "/", label: "Game" },
  { href: "/pemindai", label: "Pemindai" },
  { href: "/lapor-cepat", label: "Lapor cepat" },
  { href: "/learn", label: "Belajar" },
  { href: "/berita", label: "Berita" },
  { href: "/act", label: "Lindungi diri" },
  { href: "/tentang-keamanan", label: "Transparansi" },
  // ponytail: panel internal tanpa auth, hapus entri ini sebelum rilis.
  { href: "/admin", label: "Admin" },
  // ponytail: halaman uji API, hapus entri ini sebelum rilis.
  { href: "/dev", label: "Dev" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigasi utama" className="-mx-1 flex gap-1 overflow-x-auto px-1">
      {NAV.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`relative inline-flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-[3px] px-2.5 text-sm transition-colors ${
              active
                ? "font-semibold text-alert-ink"
                : "text-muted hover:bg-raised hover:text-ink"
            }`}
          >
            {item.label}
            {active && (
              <span aria-hidden="true" className="absolute inset-x-2.5 -bottom-px h-[3px] bg-alert" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
