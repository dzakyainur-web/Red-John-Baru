-- Discord bot: channel berita + antrian "post berita acak" dari panel admin web.
-- Prasyarat: 004_discord_bot.sql sudah dijalankan.
-- Jalankan manual: Supabase Dashboard -> SQL Editor -> paste seluruh file -> Run.
-- Aman dijalankan ulang (idempotent).

-- Channel tujuan berita yang dibagikan dari panel /admin.
alter table public.discord_guild_config
  add column if not exists news_channel_id text;

-- Outbox job untuk bot. Bot tidak punya akses DB: backend menaruh job di sini,
-- bot meng-claim via API lalu melapor selesai/gagal.
create table if not exists public.discord_bot_events (
  id bigint generated always as identity primary key,
  guild_id text not null,
  kind text not null default 'news_broadcast'
    check (kind in ('news_broadcast')),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'done', 'failed')),
  -- Kolom "error" dipakai untuk melaporkan kegagalan; sukses = null.
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Claim hanya menyapu job pending -> index parsial kecil.
create index if not exists discord_bot_events_pending_idx
  on public.discord_bot_events (id)
  where status = 'pending';

-- Cek "sudah ada job pending untuk guild ini" (cegah klik ganda).
create index if not exists discord_bot_events_guild_pending_idx
  on public.discord_bot_events (guild_id, created_at desc)
  where status = 'pending';

alter table public.discord_bot_events enable row level security;
-- Tanpa policy anon/authenticated: hanya service_role (backend) yang mengakses.

-- Claim atomik satu job pending. FOR UPDATE SKIP LOCKED -> dua bot yang polling
-- bersamaan tidak mendapat job yang sama.
create or replace function public.claim_discord_event()
returns setof public.discord_bot_events
language sql
security definer
set search_path = public
as $$
  update public.discord_bot_events
     set status = 'processing',
         updated_at = now()
   where id = (
     select id
       from public.discord_bot_events
      where status = 'pending'
      order by id
      limit 1
      for update skip locked
   )
  returning *;
$$;

-- Jangan bisa dipanggil lewat anon/authenticated key.
revoke all on function public.claim_discord_event() from public, anon, authenticated;
