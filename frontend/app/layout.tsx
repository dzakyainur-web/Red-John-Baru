import type { Metadata } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Geist_Mono, Public_Sans } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Judul berita: grotesk berkarakter, tetap ramah untuk pembaca awam.
const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});
// Teks isi: plain, x-height besar, enak dibaca di ponsel.
const publicSans = Public_Sans({ variable: "--font-body", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "GuardianAI",
  description: "Cek pesan mencurigakan, belajar kenali scam, dan ambil langkah aman.",
};

const NAV = [
  { href: "/", label: "Cek Pesan" },
  { href: "/inspect", label: "Periksa Tautan" },
  { href: "/learn", label: "Belajar" },
  { href: "/berita", label: "Berita" },
  { href: "/act", label: "Lindungi Diri" },
  { href: "/tentang-keamanan", label: "Transparansi" },
  // ponytail: halaman uji API, hapus entri ini sebelum rilis.
  { href: "/dev", label: "Dev" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistMono.variable} ${bricolage.variable} ${publicSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <header className="border-b border-zinc-200 dark:border-zinc-800">
          <nav className="mx-auto flex max-w-3xl flex-wrap items-center gap-4 px-4 py-3">
            <Link href="/" className="font-bold tracking-tight">GuardianAI</Link>
            <div className="flex flex-wrap gap-3 text-sm">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
        <footer className="border-t border-zinc-200 px-4 py-4 text-center text-xs text-zinc-500 dark:border-zinc-800">
          Alat bantu edukasi — bukan alat deteksi 100% akurat. Tidak ada data yang disimpan.
        </footer>
      </body>
    </html>
  );
}
