import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORY_LABEL, NEWS_ITEMS, NEWS_UPDATED_AT, formatNewsDate } from "@/lib/news";

export const metadata: Metadata = {
  title: "Kabar penipuan digital — GuardianAI",
  description:
    "Berita penipuan digital dari media Indonesia, dikumpulkan tiap hari. Baca judulnya di sini, buka artikel aslinya untuk cerita lengkap.",
};

export default function BeritaPage() {
  const [lead, ...stream] = NEWS_ITEMS;
  const updated = formatNewsDate(NEWS_UPDATED_AT);

  return (
    <div className="news-page -mx-4 -mt-6 bg-[var(--news-paper)] text-[var(--news-ink)] sm:-mx-6">
      <div className="mx-auto max-w-2xl px-4 pb-14 pt-10 sm:px-6 sm:pt-14">
        <header>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
            <h1 className="news-display max-w-[13ch] text-[2.4rem] sm:text-[3.2rem]">
              Kabar penipuan digital
            </h1>
            <p className="pb-1 text-sm leading-relaxed text-[var(--news-muted)]">
              {updated && <span className="block">Diperbarui {updated}</span>}
              <span className="block">{NEWS_ITEMS.length} berita</span>
            </p>
          </div>

          <p className="mt-4 max-w-lg text-[1.02rem] leading-[1.7] text-[var(--news-muted)]">
            Dikumpulkan dari media Indonesia, tanpa disalin. Semua judul membuka artikel aslinya.
          </p>

          <div className="mt-6 h-[3px] bg-[var(--news-red)]" />
        </header>

        {lead ? (
          <>
            <Lead item={lead} />
            {stream.length > 0 && <Stream items={stream} />}
          </>
        ) : (
          <EmptyState />
        )}

        <Colophon />
      </div>
    </div>
  );
}

function Lead({ item }: { item: (typeof NEWS_ITEMS)[number] }) {
  return (
    <article className="border-l-[3px] border-[var(--news-red)] py-8 pl-5 sm:pl-6">
      <p className="text-sm font-semibold text-[var(--news-red-ink)]">Baru masuk</p>

      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="news-display mt-2 block text-[1.75rem] leading-[1.15] text-[var(--news-red-ink)] hover:underline hover:decoration-2 hover:underline-offset-4 sm:text-[2.2rem]"
      >
        {item.title}
      </a>

      {item.snippet && (
        <p className="mt-3 max-w-xl text-[0.97rem] leading-[1.7] text-[var(--news-muted)]">
          {item.snippet}
        </p>
      )}

      <Byline item={item} />
    </article>
  );
}

function Stream({ items }: { items: typeof NEWS_ITEMS }) {
  return (
    <section>
      <h2 className="sr-only">Berita lainnya</h2>
      {items.map((item) => (
        <article
          key={item.id}
          className="grid grid-cols-[4.75rem_1fr] gap-x-4 border-t border-[var(--news-rule)] py-5 sm:grid-cols-[6.5rem_1fr] sm:gap-x-6"
        >
          <div className="pt-0.5 text-[0.82rem] leading-snug text-[var(--news-muted)]">
            <p className="font-semibold text-[var(--news-ink)]">{item.source}</p>
            <p className="mt-0.5">{formatNewsDate(item.published_at)}</p>
          </div>

          <div>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[1.05rem] font-semibold leading-snug hover:text-[var(--news-red-ink)] hover:underline hover:decoration-1 hover:underline-offset-4"
            >
              {item.title}
            </a>
            {item.snippet && (
              <p className="mt-1.5 line-clamp-2 text-[0.88rem] leading-relaxed text-[var(--news-muted)]">
                {item.snippet}
              </p>
            )}
            <p className="mt-2 text-[0.82rem] text-[var(--news-red-ink)]">
              {item.categories.map((c) => CATEGORY_LABEL[c] ?? c).join(" · ")}
            </p>
          </div>
        </article>
      ))}
    </section>
  );
}

function Byline({ item }: { item: (typeof NEWS_ITEMS)[number] }) {
  const date = formatNewsDate(item.published_at);
  return (
    <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.85rem] text-[var(--news-muted)]">
      <span className="font-semibold text-[var(--news-ink)]">{item.source}</span>
      {date && (
        <>
          <Dot />
          <time dateTime={item.published_at ?? undefined}>{date}</time>
        </>
      )}
      <Dot />
      <span>{item.categories.map((c) => CATEGORY_LABEL[c] ?? c).join(" · ")}</span>
    </p>
  );
}

function Dot() {
  return (
    <span aria-hidden="true" className="text-[var(--news-red)]">
      ·
    </span>
  );
}

function EmptyState() {
  return (
    <div className="mt-8 border-t border-[var(--news-rule)] pt-8">
      <p className="text-lg font-semibold">Belum ada berita terkumpul.</p>
      <p className="mt-2 text-[0.97rem] leading-relaxed text-[var(--news-muted)]">
        Jalankan{" "}
        <code className="rounded bg-[var(--news-red-wash)] px-1.5 py-0.5 font-mono text-sm text-[var(--news-red-ink)]">
          python tools/news_fetch.py
        </code>{" "}
        lalu muat ulang halaman ini.
      </p>
    </div>
  );
}

function Colophon() {
  return (
    <footer className="mt-10">
      <div className="h-[3px] bg-[var(--news-red)]" />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-[16rem] text-[1.05rem] leading-snug">
          Kenali polanya dulu, sebelum kena yang asli.
        </p>
        <Link
          href="/learn"
          className="inline-flex items-center rounded-md bg-[var(--news-red)] px-5 py-3 text-sm font-semibold text-[var(--news-on-red)] transition-colors hover:bg-[var(--news-red-ink)]"
        >
          Buka latihan
        </Link>
      </div>
      <p className="mt-6 text-[0.8rem] leading-relaxed text-[var(--news-muted)]">
        Ringkasan diambil dari RSS resmi media. Hak cipta tetap milik penerbit masing-masing;
        baca artikel aslinya di situs mereka.
      </p>
    </footer>
  );
}
