import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist_Mono, Public_Sans } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import PageShell from "@/components/PageShell";
import { SoundProvider } from "@/components/SoundManager";
import "./globals.css";

const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});
const publicSans = Public_Sans({ variable: "--font-body", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Orange Horse — Game Duel Red John & Intelijen Penipuan Siber",
  description:
    "Game simulasi interaktif melawan dalang siber Red John didampingi bot Jane, dilengkapi pemindai anomali pesan dan forensik tautan digital.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${geistMono.variable} ${bricolage.variable} ${publicSans.variable} h-full antialiased dark`}
    >
      <body className="flex min-h-full flex-col bg-[#070707] text-white selection:bg-[#FF3815] selection:text-black">
        <SoundProvider>
          <SiteHeader />
          <PageShell>{children}</PageShell>
        </SoundProvider>
      </body>
    </html>
  );
}
