-- Gambar utama artikel (og:image) untuk card berita.
-- Prasyarat: 001_scam_reports.sql sudah dijalankan.
-- Jalankan manual: Supabase Dashboard -> SQL Editor -> paste seluruh file -> Run.

-- URL gambar (http/https) hasil scraping. NULL untuk laporan manual atau artikel
-- yang tidak punya og:image. Sengaja TIDAK ikut search_text (generated di 002).
alter table public.scam_reports add column if not exists image_url text;
