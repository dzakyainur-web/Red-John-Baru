-- Cyber Scam Radar — tabel laporan penipuan + lock harvest.
-- Jalankan manual: Supabase Dashboard -> SQL Editor -> paste seluruh file -> Run.

create table if not exists public.scam_reports (
  id text primary key,                      -- sha1(source_url)[:12]
  title text not null check (char_length(title) between 10 and 300),
  category text not null check (category in
    ('fake_job','phishing_link','giveaway_palsu','malware_apk','pinjol_ilegal')),
  description text not null check (char_length(description) between 1 and 1200),
  scammer_indicators jsonb not null default '[]'::jsonb,  -- [{"type":"url|apk|phone","value":"..."}]
  source_url text not null,
  source_media text not null,
  status text not null default 'verified'
    check (status in ('verified','pending','rejected')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  constraint scam_reports_source_url_key unique (source_url)
);

create index if not exists scam_reports_feed_idx
  on public.scam_reports (status, created_at desc);
create index if not exists scam_reports_category_idx
  on public.scam_reports (category, created_at desc);

alter table public.scam_reports enable row level security;

drop policy if exists scam_reports_anon_read on public.scam_reports;
create policy scam_reports_anon_read on public.scam_reports
  for select to anon, authenticated using (status = 'verified');
-- Tanpa policy insert/update/delete: hanya service_role (bypass RLS) yang menulis.

-- Lock lintas-replica: satu baris + TTL. Dua replica balapan -> satu menang.
create table if not exists public.news_run_lock (
  id int primary key default 1 check (id = 1),
  locked_at timestamptz not null default now()
);

create or replace function public.acquire_news_run_lock(p_ttl interval default interval '45 minutes')
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare got boolean;
begin
  insert into news_run_lock (id, locked_at) values (1, now())
  on conflict (id) do update set locked_at = now()
    where news_run_lock.locked_at < now() - p_ttl
  returning true into got;
  return coalesce(got, false);
end;
$$;

create or replace function public.release_news_run_lock()
returns void
language sql
security definer
set search_path = public
as $$
  delete from news_run_lock where id = 1;
$$;

revoke execute on function public.acquire_news_run_lock(interval) from anon, authenticated, public;
revoke execute on function public.release_news_run_lock() from anon, authenticated, public;
