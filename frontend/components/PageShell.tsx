"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import StudioFooter from "./StudioFooter";

export default function PageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome =
    pathname === "/" ||
    pathname === "/pemindai" ||
    pathname === "/lapor-cepat" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/darurat" ||
    pathname.startsWith("/admin");

  if (isHome) {
    return <>{children}</>;
  }

  const isBerita = pathname === "/berita";
  const isQuiz = pathname.startsWith("/quiz");
  const darkBg = isBerita || isQuiz ? "bg-[#0c0d0d]" : "bg-[#1a1a1a]";

  return (
    <div className={`min-h-screen ${darkBg} text-white flex flex-col justify-between`}>
      <div className={`${isBerita ? "max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24" : "shell pt-24 pb-16"} flex-1`}>
        {/* Subtle breadcrumb / back header (for non-berita pages) */}
        {!isBerita && !isQuiz && (
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
