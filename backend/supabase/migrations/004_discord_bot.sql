-- Discord Bot Agent-RJ: identitas pelapor + konfigurasi per server.
-- Prasyarat: 001, 002, 003 sudah dijalankan.
-- Jalankan manual: Supabase Dashboard -> SQL Editor -> paste seluruh file -> Run.

-- Laporan dari Discord/website: siapa pelapornya, bukan sekadar "laporan-admin".
alter table public.scam_reports
  add column if not exists reporter_platform text
    check (reporter_platform in ('discord', 'web')),
  add column if not exists reporter_id text,
  add column if not exists reporter_name text;

-- /report status mencari satu laporan milik pelapor tertentu.
create index if not exists scam_reports_reporter_idx
  on public.scam_reports (reporter_platform, reporter_id, created_at desc);

-- Konfigurasi per Discord Guild. Dibaca/ditulis backend (service_role) saja.
create table if not exists public.discord_guild_config (
  guild_id text primary key,
  alert_channel_id text,
  protection_enabled boolean not null default true,
  notification_categories text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.discord_guild_config enable row level security;
-- Tanpa policy anon/authenticated: hanya service_role (backend) yang mengakses.
