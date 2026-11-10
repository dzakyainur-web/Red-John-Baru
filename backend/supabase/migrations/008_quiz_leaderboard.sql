-- Leaderboard kuis harian: skor per pengguna per periode + antrean pengumuman bot.
-- Prasyarat: 005_discord_news_broadcast.sql + 007_profiles.sql.
-- Jalankan manual: Supabase Dashboard -> SQL Editor -> paste seluruh file -> Run.
-- Aman dijalankan ulang (idempotent).
--
-- "Hari kuis" = jendela [D 21:00, D+1 21:00) WIB. Tidak ada job reset: hari baru
-- kosong dengan sendirinya karena skor disimpan dengan kolom `day`.

-- Outbox bot: job baru `leaderboard` membawa payload JSON siap-post.
alter table public.discord_bot_events drop constraint if exists discord_bot_events_kind_check;
alter table public.discord_bot_events add constraint discord_bot_events_kind_check
  check (kind in ('news_broadcast', 'leaderboard'));
alter table public.discord_bot_events add column if not exists payload jsonb;
alter table public.discord_bot_events add column if not exists dedupe_key text;

-- Index BIASA, bukan partial: on_conflict=dedupe_key tidak bisa inference pada
-- partial index (42P10). NULL dianggap berbeda, jadi baris news lama aman.
create unique index if not exists discord_bot_events_dedupe_idx
  on public.discord_bot_events (dedupe_key);

-- Satu baris per (user, periode, soal). Replay soal yang sama tidak menambah poin;
-- skor tersimpan selalu yang tertinggi (greatest saat upsert).
create table if not exists public.quiz_daily_scores (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  question_id text not null,
  points integer not null check (points > 0),
  created_at timestamptz not null default now(),
  unique (user_id, day, question_id)
);
create index if not exists quiz_daily_scores_day_idx
  on public.quiz_daily_scores (day, user_id);

alter table public.quiz_daily_scores enable row level security;
-- Tanpa policy anon/authenticated: hanya service_role (backend) yang mengakses.

-- Catat skor satu soal. Atomik: insert atau naikkan ke nilai tertinggi.
create or replace function public.record_quiz_score(
  p_user uuid, p_day date, p_question text, p_points integer
)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.quiz_daily_scores (user_id, day, question_id, points)
  values (p_user, p_day, p_question, p_points)
  on conflict (user_id, day, question_id) do update
    set points = greatest(public.quiz_daily_scores.points, excluded.points)
  returning points;
$$;

-- Papan peringkat satu periode. Nama dari profiles; email penuh tidak pernah keluar.
create or replace function public.quiz_daily_leaderboard(p_day date, p_limit integer default 20)
returns table (place integer, user_id uuid, name text, points integer, solved integer)
language sql
stable
security definer
set search_path = public
as $$
  -- Kolom keluaran bernama `place`, bukan `rank`: nama itu akan menutupi fungsi
  -- window rank() di dalam badan fungsi.
  select rank() over (order by sum(s.points) desc, min(s.created_at))::integer as place,
         s.user_id,
         coalesce(nullif(p.full_name, ''), split_part(p.email, '@', 1), 'Agen'),
         sum(s.points)::integer,
         count(*)::integer
    from public.quiz_daily_scores s
    left join public.profiles p on p.id = s.user_id
   where s.day = p_day
   group by s.user_id, p.full_name, p.email
   order by 4 desc, 1
   limit greatest(1, least(coalesce(p_limit, 20), 50));
$$;

-- Jangan bisa dipanggil lewat anon/authenticated key.
revoke all on function public.record_quiz_score(uuid, date, text, integer)
  from public, anon, authenticated;
revoke all on function public.quiz_daily_leaderboard(date, integer)
  from public, anon, authenticated;
