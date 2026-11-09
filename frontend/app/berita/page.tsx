import type { Metadata } from "next";
import { fetchNews } from "@/lib/news";
import BeritaFeedClient from "@/components/BeritaFeedClient";

export const metadata: Metadata = {
  title: "Blog — Radar Intelijen & Berita Penipuan Siber",
  description:
    "Pantauan tren modus operandi penipuan digital, malware Android APK, quishing QRIS, dan rekayasa sosial dari media terpercaya Indonesia.",
};

export default async function BeritaPage() {
  const { items, total, updated_at } = await fetchNews(100);

  return (
    <BeritaFeedClient
      initialItems={items}
      total={total}
      updatedAt={updated_at}
    />
  );
}
