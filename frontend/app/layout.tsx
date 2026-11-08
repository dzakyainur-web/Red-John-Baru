import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist_Mono, JetBrains_Mono, Public_Sans } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import PageShell from "@/components/PageShell";
import { SoundProvider } from "@/components/SoundManager";
import "./globals.css";

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
const publicSans = Public_Sans({ variable: "--font-body", subsets: ["latin"], display: "swap" });

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
      className={`${geistMono.variable} ${jetbrainsMono.variable} ${bricolage.variable} ${publicSans.variable} h-full antialiased dark`}
    >
      <body className="flex min-h-full flex-col bg-[#000000] text-white selection:bg-white selection:text-black font-sans">
        <SoundProvider>
          <SiteHeader />
          <PageShell>{children}</PageShell>
        </SoundProvider>
      </body>
    </html>
  );
}
