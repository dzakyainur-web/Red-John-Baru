"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import StudioFooter from "./StudioFooter";

export default function PageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "/login" || pathname === "/register";

  if (isHome) {
    return <>{children}</>;
  }

  const isBerita = pathname === "/berita";

  return (
    <div className={`min-h-screen ${isBerita ? "bg-black" : "bg-[#1a1a1a]"} text-white flex flex-col justify-between`}>
      <div className={`${isBerita ? "max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24" : "shell pt-28 pb-20"} flex-1`}>
        {/* Subtle breadcrumb / back header (for non-berita pages) */}
        {!isBerita && (
          <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-[family-name:var(--font-geist-mono)] text-zinc-400 hover:text-white transition-colors"
            >
              <span>&larr;</span>
              <span>KEMBALI KE BERANDA UTAMA</span>
            </Link>
            <span className="text-xs font-[family-name:var(--font-geist-mono)] text-[#FF3815] uppercase tracking-wider">
              [ LINGKUNGAN AMAN ]
            </span>
          </div>
        )}

        {children}
      </div>

      <StudioFooter />
    </div>
  );
}
