import type { Metadata } from "next";
import {
  Inter,
  Manrope,
  Geist_Mono,
  JetBrains_Mono,
  Source_Code_Pro,
  Bricolage_Grotesque,
  Public_Sans,
} from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import PageShell from "@/components/PageShell";
import { SoundProvider } from "@/components/SoundManager";
import "./globals.css";

// ─── Supabase-exact fonts ───────────────────────────────────────────────────
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  // Inter is a variable font; expose all weights for `font-weight: 450` trick
  axes: ["opsz"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

// ─── Legacy Red John fonts (kept for non-landing pages) ────────────────────
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});
const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});
const publicSans = Public_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Red John — Platform Intelijen Siber & Forensik Digital",
  description:
    "Sistem pertahanan terbuka untuk mendeteksi rekayasa sosial, malware Android APK, quishing QRIS palsu, dan pencurian OTP di Indonesia secara real-time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={[
        inter.variable,
        manrope.variable,
        sourceCodePro.variable,
        geistMono.variable,
        jetbrainsMono.variable,
        bricolage.variable,
        publicSans.variable,
        "h-full antialiased dark",
      ].join(" ")}
    >
      <body className="flex min-h-full flex-col bg-[#0c0d0d] text-white selection:bg-white selection:text-black font-sans">
        <SoundProvider>
          <SiteHeader />
          <PageShell>{children}</PageShell>
        </SoundProvider>
      </body>
    </html>
  );
}
