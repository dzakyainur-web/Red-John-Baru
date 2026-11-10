-- Bank soal Red John. Jalankan setelah migrasi 001–005.
create table if not exists public.quiz_questions (
  id text primary key,
  round_number integer not null unique check (round_number > 0),
  chapter_title text not null check (char_length(chapter_title) between 1 and 200),
  title text not null check (char_length(title) between 3 and 300),
  kind text not null check (kind in ('multiple_choice', 'binary', 'text_input')),
  threat_type text not null,
  story_context text not null,
  red_john_message text not null,
  red_john_note text,
  red_john_taunt text,
  jane_clue text not null,
  choices jsonb,
  text_config jsonb,
  debrief jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quiz_kind_payload check (
    (kind = 'text_input' and text_config is not null and choices is null)
    or (kind <> 'text_input' and text_config is null and jsonb_array_length(choices) between 2 and 5)
  ),
  constraint quiz_binary_choices check (kind <> 'binary' or jsonb_array_length(choices) = 2)
);
create index if not exists quiz_questions_active_idx on public.quiz_questions (is_active, round_number);

create or replace function public.quiz_questions_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists quiz_questions_updated_at on public.quiz_questions;
create trigger quiz_questions_updated_at before update on public.quiz_questions
for each row execute function public.quiz_questions_updated_at();

alter table public.quiz_questions enable row level security;
drop policy if exists quiz_questions_public_read on public.quiz_questions;
create policy quiz_questions_public_read on public.quiz_questions
for select to anon, authenticated using (is_active = true);
-- Tidak ada policy mutasi: hanya service_role setelah backend memverifikasi admin.
