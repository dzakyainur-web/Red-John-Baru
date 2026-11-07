import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORY_LABEL, fetchNews, formatNewsDate } from "@/lib/news";

export const metadata: Metadata = {
  title: "Kabar penipuan digital — GuardianAI",
  description:
    "Berita penipuan digital dari media Indonesia, dikumpulkan tiap hari. Baca judulnya di sini, buka artikel aslinya untuk cerita lengkap.",
};

export default async function BeritaPage() {
  const { items, total, updated_at } = await fetchNews();
  const [lead, ...stream] = items;
  const updated = formatNewsDate(updated_at);

  return (
    <div className="news-page space-y-8">
      <header className="border-b border-rule pb-6">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <h1 className="page-title max-w-[15ch]">Kabar penipuan digital</h1>
          <div className="pb-1 text-sm text-muted">
            {updated && <p>Diperbarui {updated}</p>}
            <p className="data">{total} berita terkumpul</p>
          </div>
        </div>
        <p className="lead mt-3 text-sm">
          Dikumpulkan otomatis dari media Indonesia tiap 6 jam. Judul membuka artikel aslinya; isi
          tidak kami salin.
        </p>
        <div className="mt-5 h-[3px] bg-alert" />
      </header>

      {lead ? (
        <>
          <article className="border-l-[3px] border-l-alert pl-5">
            {lead.url ? (
              <a
                href={lead.url}
                target="_blank"
                rel="noopener noreferrer"
                className="news-display block text-[1.7rem] leading-tight text-ink decoration-alert decoration-2 underline-offset-4 hover:underline sm:text-[2.1rem]"
              >
                {lead.title}
              </a>
            ) : (
              <p className="news-display block text-[1.7rem] leading-tight text-ink sm:text-[2.1rem]">
                {lead.title}
              </p>
            )}
            {lead.snippet && <p className="mt-3 max-w-[62ch] text-sm text-muted">{lead.snippet}</p>}
            <p className="mt-3 flex flex-wrap items-center gap-x-2 text-xs text-muted">
              <span className="font-semibold text-ink">{lead.source}</span>
              <span aria-hidden="true" className="text-alert">
                ·
              </span>
              <span>{CATEGORY_LABEL[lead.categories[0]] ?? lead.categories[0]}</span>
              {lead.published_at && (
                <>
                  <span aria-hidden="true" className="text-alert">
                    ·
                  </span>
                  <time dateTime={lead.published_at}>{formatNewsDate(lead.published_at)}</time>
                </>
              )}
            </p>
          </article>

          {stream.length > 0 && (
            <section aria-label="Berita lainnya" className="border-t border-rule">
              {stream.map((item) => (
                <article
                  key={item.id}
                  className="grid gap-x-5 gap-y-1 border-b border-rule py-4 sm:grid-cols-[10rem_1fr]"
                >
                  <div className="text-xs leading-relaxed text-muted">
                    <p className="font-semibold text-ink">{item.source}</p>
                    {item.published_at && <p>{formatNewsDate(item.published_at)}</p>}
                  </div>
                  <div>
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block font-semibold leading-snug decoration-alert underline-offset-4 hover:text-alert-ink hover:underline"
                      >
                        {item.title}
                      </a>
                    ) : (
                      <p className="block font-semibold leading-snug">{item.title}</p>
                    )}
                    {item.snippet && (
                      <p className="mt-1 line-clamp-2 max-w-[62ch] text-sm text-muted">{item.snippet}</p>
                    )}
                    <p className="data mt-1.5">
                      {item.categories.map((c) => CATEGORY_LABEL[c] ?? c).join(" · ")}
                    </p>
                  </div>
                </article>
              ))}
            </section>
          )}
        </>
      ) : (
        <div className="border-t border-rule pt-6">
          <p className="font-semibold">Belum ada berita terkumpul.</p>
          <p className="mt-1 text-sm text-muted">
            Pengumpul berita berjalan otomatis tiap 6 jam. Coba muat ulang halaman ini nanti.
          </p>
        </div>
      )}

      <footer className="space-y-4 border-t-[3px] border-t-alert pt-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-[20rem] font-[family-name:var(--font-display)] text-lg leading-snug tracking-tight">
            Kenali polanya sebelum kena yang asli.
          </p>
          <Link href="/learn" className="btn btn-primary">
            Latihan skenario
          </Link>
        </div>
        <p className="text-xs text-muted">
          Ringkasan diambil dari media Indonesia lewat API kami. Hak cipta tetap milik penerbit;
          baca artikel aslinya di situs mereka.
        </p>
      </footer>
    </div>
  );
}
