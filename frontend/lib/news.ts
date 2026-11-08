import { cacheLife } from "next/cache";
import { API_BASE } from "./api";

export type NewsItem = {
  id: string;
  title: string;
  // null untuk laporan manual admin yang tidak punya artikel sumber.
  url: string | null;
  source: string;
  published_at: string | null;
  snippet: string;
  categories: string[];
  // URL og:image hasil scraping; null untuk laporan manual / artikel tanpa gambar.
  image_url?: string | null;
};

export type NewsListOut = {
  items: NewsItem[];
  total: number;
  limit: number;
  offset: number;
  updated_at: string | null;
  configured: boolean;
};

export const FALLBACK_NEWS: NewsItem[] = [
  {
    id: "fb-1",
    title: "Waspada Modus APK Surat Undangan & Tilang ETLE: Pelaku Kuras Rekening Tabungan via SMS OTP",
    url: "https://www.kompas.com",
    source: "Kompas.com",
    published_at: "2026-11-06T08:30:00Z",
    snippet: "Bareskrim Polri dan pakar keamanan siber kembali memperingatkan warga terkait maraknya file dokumen berekstensi .APK di WhatsApp yang mencuri kode OTP dan SMS perbankan secara otomatis.",
    categories: ["malware_apk"],
  },
  {
    id: "fb-2",
    title: "Awas Kejahatan Quishing: Pelaku Ganti Stiker Barcode QRIS di Masjid dan Kafe Jakarta",
    url: "https://news.detik.com",
    source: "Detik.com",
    published_at: "2026-11-05T14:15:00Z",
    snippet: "Bank Indonesia mengimbau masyarakat untuk selalu memeriksa nama merchant (NMID) sebelum memasukkan PIN ketika memindai kode QRIS, menyusul temuan stiker palsu yang mengalihkan dana ke rekening penipu.",
    categories: ["quishing"],
  },
  {
    id: "fb-3",
    title: "Sindikat Penipuan Kerja Freelance 'Tugas Like & Subscribe' Raup Miliaran Rupiah",
    url: "https://www.antaranews.com",
    source: "Antara News",
    published_at: "2026-11-04T11:00:00Z",
    snippet: "Korban awalnya diberikan komisi puluhan ribu rupiah setelah menyelesaikan tugas menyukai video medsos, sebelum akhirnya dijebak menyetor deposit jutaan rupiah yang tidak bisa ditarik kembali.",
    categories: ["fake_job"],
  },
  {
    id: "fb-4",
    title: "Modus CS Bank Palsu di Medsos: Minta Nomor Kartu & Kode CVV dengan Dalih Kenaikan Biaya Transaksi",
    url: "https://www.cnnindonesia.com",
    source: "CNN Indonesia",
    published_at: "2026-11-03T09:45:00Z",
    snippet: "Akun palsu customer service perbankan menyasar nasabah yang menyampaikan komplain di media sosial. Korban digiring membuka situs web phishing yang mirip persis portal internet banking resmi.",
    categories: ["social_engineering"],
  },
  {
    id: "fb-5",
    title: "Satgas PASTI Blokir Ratusan Aplikasi Pinjol Ilegal yang Intimidasi dan Sedot Kontak Ponsel",
    url: "https://www.bisnis.com",
    source: "Bisnis Indonesia",
    published_at: "2026-11-02T16:20:00Z",
    snippet: "Otoritas Jasa Keuangan (OJK) bersama Satgas PASTI menghentikan operasional ratusan aplikasi pinjaman online tak berizin yang menyalahgunakan akses kontak darurat dan memeras debitur.",
    categories: ["pinjol_ilegal"],
  },
  {
    id: "fb-6",
    title: "Fenomena 'Pig Butchering': Jebakan Asmara Kencan Online Berujung Pemerasan Investasi Kripto Bodong",
    url: "https://www.tempo.co",
    source: "Tempo.co",
    published_at: "2026-11-01T13:10:00Z",
    snippet: "Pelaku membangun relasi asmara intensif selama berbulan-bulan di aplikasi kencan online sebelum memanipulasi korban untuk menyetorkan seluruh tabungan ke platform trading kripto palsu.",
    categories: ["crypto_scam"],
  },
  {
    id: "fb-7",
    title: "Peringatan Siber: Rekayasa Suara (AI Voice Cloning) Mulai Dipakai Penipu Meniru Anak Kecelakaan",
    url: "https://katadata.co.id",
    source: "Katadata",
    published_at: "2026-10-30T07:50:00Z",
    snippet: "Berbekal sampel suara singkat dari video media sosial, penipu menirukan suara anggota keluarga yang panik dan meminta orang tua segera mentransfer uang tebusan darurat.",
    categories: ["social_engineering"],
  },
  {
    id: "fb-8",
    title: "Broadcast Tautan Hadiah Kuota 100GB & Subsidi Pulsa Beredar di Grup WhatsApp Keluarga",
    url: "https://kumparan.com",
    source: "Kumparan",
    published_at: "2026-10-28T10:00:00Z",
    snippet: "Tautan berantai mengatasnamakan kementerian atau operator seluler meminta verifikasi data pribadi yang ternyata mendaftarkan korban ke langganan SMS premium berbayar.",
    categories: ["giveaway_palsu"],
  },
];

// Fallback tidak boleh memakai `new Date()`: halaman di-prerender (Cache Components)
// dan nilai yang berubah antar-render akan memicu error blocking-prerender-current-time.
const FALLBACK_UPDATED_AT: string | null = null;

// Berita dikumpulkan backend tiap 6 jam; cache 10 menit cukup.
async function newsCached(limit: number): Promise<NewsListOut> {
  "use cache";
  cacheLife({ revalidate: 600 });
  const res = await fetch(`${API_BASE}/api/news?limit=${limit}`);
  if (!res.ok) throw new Error(`/api/news ${res.status}`);
  return (await res.json()) as NewsListOut;
}

export async function fetchNews(limit = 60): Promise<NewsListOut> {
  try {
    const data = await newsCached(limit);
    if (data && data.items && data.items.length > 0) {
      return data;
    }
    return {
      items: FALLBACK_NEWS,
      total: FALLBACK_NEWS.length,
      limit,
      offset: 0,
      updated_at: FALLBACK_UPDATED_AT,
      configured: true,
    };
  } catch {
    return {
      items: FALLBACK_NEWS,
      total: FALLBACK_NEWS.length,
      limit,
      offset: 0,
      updated_at: FALLBACK_UPDATED_AT,
      configured: true,
    };
  }
}

export { CATEGORY_LABEL, CATEGORY_STYLES, formatNewsDate } from "./labels";
