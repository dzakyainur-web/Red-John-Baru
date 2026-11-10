-- Profil pengguna + role admin. Jalankan di Supabase SQL Editor setelah 006.
--
-- Role admin dibaca backend dari public.profiles.role (bukan app_metadata),
-- supaya cukup edit satu baris di Table Editor: role = 'admin' atau 'user'.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

-- Nama diambil dari metadata signup (user_metadata.full_name). Role selalu default
-- 'user' — user tidak bisa mendaftar sebagai admin.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, nullif(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name);
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill user yang sudah ada sebelum tabel ini dibuat.
insert into public.profiles (id, email, full_name)
select u.id, u.email, nullif(u.raw_user_meta_data->>'full_name', '')
from auth.users u
on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(public.profiles.full_name, excluded.full_name);

create or replace function public.profiles_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.profiles_updated_at();

alter table public.profiles enable row level security;

-- User membaca profilnya sendiri (badge admin di navbar).
-- Daftar semua user dibaca backend dengan service_role, jadi tidak perlu policy
-- "admin boleh baca semua" — policy itu akan rekursi ke tabel yang sama.
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
for select to authenticated using (auth.uid() = id);

-- Tanpa policy insert/update/delete: perubahan role hanya lewat Table Editor,
-- SQL Editor, atau backend (service_role) — user tidak bisa promote diri sendiri.

-- Bootstrap admin pertama. Trigger hanya memaksa default 'user' saat baris dibuat,
-- jadi akun yang sudah ada bisa ditandai admin di sini. Ganti email-nya, lalu
-- jalankan blok ini sekali:
-- update public.profiles set role = 'admin' where lower(email) = lower('rendyren585@gmail.com');
