-- Panel admin Cyber Scam Radar: asal data, updated_at, pencarian cepat, arsip.
-- Prasyarat: 001_scam_reports.sql sudah dijalankan.
-- Jalankan manual: Supabase Dashboard -> SQL Editor -> paste seluruh file -> Run.

-- Laporan manual tidak punya artikel sumber.
alter table public.scam_reports alter column source_url drop not null;

alter table public.scam_reports
  add column if not exists source_type text not null default 'scraped'
    check (source_type in ('scraped', 'user_report')),
  add column if not exists updated_at timestamptz not null default now();

-- Satu kolom untuk quick search: judul + URL + IOC (rekening/WA/URL).
alter table public.scam_reports
  add column if not exists search_text text generated always as (
    title || ' ' || coalesce(source_url, '') || ' ' || scammer_indicators::text
  ) stored;

create index if not exists scam_reports_search_idx
  on public.scam_reports (search_text);
create index if not exists scam_reports_source_idx
  on public.scam_reports (source_type, status, created_at desc);

-- Feed publik tetap hanya membaca yang terverifikasi.
-- Arsip = status 'rejected'; tidak ada baris yang dihapus permanen.
