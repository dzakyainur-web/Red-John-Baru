# Backend Red John

API FastAPI untuk menilai pesan mencurigakan (**rules yang dapat dijelaskan + model ML lokal**
TF-IDF + Logistic Regression), plus scraper berita penipuan, bank soal kuis, dan outbox bot Discord.
Tidak ada panggilan LLM pada jalur penilaian; teks diproses di memori dan tidak disimpan.

## Menjalankan

```bash
uv sync
cp .env.example .env      # lalu isi nilainya (lihat tabel Environment)
uv run main.py            # API saja  → http://localhost:8000/docs
uv run scraper.py         # service scraper (scheduler) — proses terpisah
```

`main.py` **tidak** menjalankan scraper; jalankan `scraper.py` di terminal/container lain. Untuk
deploy satu container, set `NEWS_SCHEDULER=true` agar API ikut menjalankan scheduler.

`backend/.env` dibaca otomatis oleh `app/config.py` (tanpa dependency tambahan), jadi
`uv run main.py`, `uv run scraper.py`, `uvicorn main:app`, dan CLI harvester semuanya memakai
nilai yang sama. Variabel yang sudah ada di environment shell **menang** — di Railway cukup isi
Variables dashboard; file `.env` tidak perlu ikut ke image produksi.

## Environment

| Variabel | Default | Wajib | Keterangan |
|---|---|---|---|
| `SUPABASE_URL` | — | ✅ | Project URL (`https://<ref>.supabase.co`). Tanpa ini `/api/news` balas `configured: false` dan fitur DB mati |
| `SUPABASE_SERVICE_ROLE_KEY` | — | ✅ | service_role secret. Bypass RLS — **jangan** dipakai di frontend/bot |
| `APP_ENV` | `development` | prod: `production` | Di `production`, endpoint bot tanpa key → `503` |
| `DISCORD_BOT_API_KEY` | kosong | prod: ✅ | Rahasia service-to-service (`X-API-Key`). Dipakai juga oleh bot (`REDJOHN_API_KEY`) dan route handler frontend |
| `GUARDIANAI_CORS_ORIGINS` | `http://localhost:3000` | ✅ | Origin frontend, pisah koma. Contoh: `https://redjohn.app` |
| `NEWS_SCHEDULER` | `false` | — | `true` = proses API ikut menjalankan scraper terjadwal |
| `NEWS_RUN_ON_START` | `false` | — | Jalankan sekali saat boot, tidak menunggu interval |
| `NEWS_INTERVAL_HOURS` | `6` | — | Jarak antar harvest |
| `NEWS_BROADCAST_SCHEDULER` | `false` | — | `true` = broadcast 5 berita acak pukul 05:00/13:00/20:00 WITA; aktifkan di satu proses |
| `LEADERBOARD_SCHEDULER` | `false` | — | `true` = cron pengumuman klasemen kuis ke Discord tiap `LEADERBOARD_HOUR` WIB |
| `LEADERBOARD_HOUR` | `21` | — | Jam WIB pengumuman **sekaligus** reset periode klasemen |
| `OPENROUTER_API_KEY` | kosong | — | Untuk generate soal AI (belum terpakai di kode). Rahasia |
| `OPENROUTER_MODEL` | — | — | Model default generator soal (belum terpakai di kode) |
| `PORT` | `8000` | hosting | Dibaca `CMD` Dockerfile |

Tidak ada env admin. Admin kuis ditentukan `public.profiles.role` (migrasi 007) — ubah lewat
Supabase Table Editor, tanpa restart backend.

## Endpoint

Semua di bawah prefix `/api` kecuali health.

| Metode | Path | Auth | Keterangan |
|---|---|---|---|
| POST | `/check` | — | Body `{"text", "context"}` → skor risiko, tanda bahaya, probabilitas ML |
| POST | `/scan/{kind}` | `X-API-Key` | `kind` = `url`, `domain`, `text`, `phone`, `bank`, `email`. Body `{"target", "source"}` |
| GET | `/examples` | — | Contoh pesan fiktif untuk tombol "Coba contoh" |
| GET | `/news` | — | Berita penipuan (`limit`, `offset`, `category`, `source`, `q`) |
| GET | `/news/random` | — | Berita acak (`limit`) untuk broadcast panel `/admin` |
| GET/POST | `/threats` | — | Daftar / tambah ancaman manual (internal, tanpa auth) |
| PATCH/DELETE | `/threats/{id}` | — | Ubah / arsipkan (soft delete → `rejected`) |
| GET | `/model/status` | — | Status model ML |
| POST | `/reports` | `X-API-Key` | Laporan publik. Selalu `pending`, `source_media` = platform pelapor |
| GET | `/reports/{id}?reporter_id=&platform=` | `X-API-Key` | Status laporan milik pelapor |
| GET/PATCH | `/discord/config/{guild_id}` | `X-API-Key` | Konfigurasi bot per guild |
| GET | `/discord/alert-channels` | `X-API-Key` | Guild yang punya channel alert (polling bot) |
| GET | `/discord/news-channels` | `X-API-Key` | Guild dengan channel berita (target klasemen) |
| POST | `/discord/broadcast` | `X-API-Key` + Bearer admin | Enqueue job "post 5 berita acak". `409` bila masih pending, `429` bila kena rate limit |
| POST | `/discord/outbox/claim` | `X-API-Key` | Bot ambil job berikutnya (`204` bila kosong) |
| POST | `/discord/outbox/{id}/finish` | `X-API-Key` | Bot lapor hasil (`204`) |
| GET | `/quiz/questions` | — | Soal aktif versi publik (tanpa kunci jawaban) |
| POST | `/quiz/questions/{id}/answer` | opsional `Authorization` | Nilai jawaban + `points_awarded`; tercatat ke klasemen bila login |
| GET | `/quiz/leaderboard?limit=20` | — | Klasemen periode berjalan + `resets_at` |
| GET/POST | `/quiz/admin/questions` | `Authorization` (admin) | CRUD soal admin |
| PATCH/DELETE | `/quiz/admin/questions/{id}` | `Authorization` (admin) | Edit / arsipkan soal |
| GET | `/health` | — | `ok` / `degraded` (model tidak termuat) |

Teks hanya diproses di memori request; tidak disimpan dan tidak di-log.

### Auth Discord Bot

`/scan/*`, `/reports*`, dan `/discord/*` memerlukan header `X-API-Key` sama dengan
`DISCORD_BOT_API_KEY`. Bila key kosong: `APP_ENV=development` → endpoint terbuka (warning di
log), `APP_ENV=production` → `503`. Endpoint frontend/admin tidak terpengaruh.

### Auth admin kuis

Endpoint `/quiz/admin/*` membaca token Bearer Supabase lalu memeriksa `public.profiles.role`.
Pemeriksaan yang sama juga berlaku untuk `/discord/broadcast`.

## Broadcast berita Discord

`NEWS_BROADCAST_SCHEDULER=true` mengantrikan 5 berita acak untuk setiap guild yang memiliki
channel berita/alert pada 05:00, 13:00, dan 20:00 WITA (`Asia/Makassar`). `dedupe_key`
mencegah satu slot dikirim ulang saat scheduler restart/catch-up. Bot harus berjalan untuk
mengambil outbox dan memposting embed. Aktifkan scheduler hanya di satu proses backend.
Berita dapat berulang antar-slot karena pemilihan tetap acak.

## Migrasi SQL

Dijalankan **manual** di Supabase → SQL Editor, berurutan, masing-masing sekali:

```
supabase/migrations/001_scam_reports.sql
supabase/migrations/002_threat_admin.sql
supabase/migrations/003_news_image.sql
supabase/migrations/004_discord_bot.sql          (bot Discord)
supabase/migrations/005_discord_news_broadcast.sql (bot Discord)
supabase/migrations/006_quiz_questions.sql       (kuis)
supabase/migrations/007_profiles.sql             (kuis/login)
supabase/migrations/008_quiz_leaderboard.sql     (klasemen harian)
```

Kode yang memanggil tabel/RPC yang belum ada (mis. kuis) mengembalikan `503` dengan pesan
"Jalankan migrasi …", bukan crash.

### Alur laporan

Laporan dari website maupun Discord selalu masuk sebagai `pending`. Admin meninjau di `/admin`
lalu memilih verified/rejected.

## News harvester

Parser Playwright async untuk Detik, Kompas, dan Liputan6. Tiap artikel → judul, kutipan ≤1200
karakter, IOC (defanged), satu kategori modus, dan URL gambar (`og:image`). Upsert ke
`scam_reports` dengan dedupe `source_url`.

> Upsert memakai `ignore_duplicates=True`: baris lama **tidak** diperbarui. Artikel lama tanpa
> gambar baru terisi setelah di-backfill atau dihapus.

```bash
uv run scraper.py --once --dry-run                  # pratinjau, tanpa DB
uv run scraper.py --once --dry-run --source kompas
uv run scraper.py --once                            # run sungguhan sekali
uv run scraper.py                                   # service, tiap NEWS_INTERVAL_HOURS
```

Scheduler hidup di proses scraper. Lock tabel `news_run_lock` membuat beberapa replica aman
(hanya satu yang menulis).

Catatan: `robots.txt` Kompas memuat komentar ToS yang melarang pengambilan otomatis; robots
sendiri mengizinkan `/read/`. Harvester berjalan jeda 3 detik dengan UA jelas. Risiko ditanggung
pemilik proyek.

## Klasemen kuis

Detail di [`../docs/quiz-supabase.md`](../docs/quiz-supabase.md). Ringkas: periode
`[D 21:00, D+1 21:00)` WIB, skor dihitung server (`quiz_daily.points_for`), satu soal satu baris
per user per periode, pengumuman Discord top 10 dengan `dedupe_key` agar tidak dobel.

## Deploy

- Image: `Dockerfile` (Python 3.12 + Chromium). Build: `docker build -t redjohn-api .`
- Start: `uv run uvicorn main:app --host 0.0.0.0 --port $PORT` (sudah jadi `CMD`).
- Scraper: service kedua, image sama, `command: ["uv","run","scraper.py"]`.
- Healthcheck: `/health`.
- Isi semua variabel wajib lewat dashboard hosting; jangan bake `.env` ke image.
- Urutan menaikkan versi (migrasi → backend → bot → frontend) ada di README root.

## Training model

Dataset latih **sintetis** (tanpa PII nyata), dibuat generator template di
`app/ml/generate_dataset.py`, output `app/ml/data/dataset.csv`.

```bash
uv run python -m app.ml.generate_dataset   # tulis ulang dataset.csv (±250 baris)
uv run python -m app.ml.train              # → app/ml/artifacts/{model.joblib,metrics.json}
uv run python -m app.ml.evaluate_holdout   # 35 contoh tulisan tangan
```

Hasil terkini: test set akurasi 0.98, F1 scam 0.98, recall 1.00, FPR 0.053;
**holdout tulisan tangan 31/35 (88,6%)** — angka realistisnya. Artefak di-commit agar deploy tidak
melatih ulang. Bila artefak hilang, API tetap jalan rules-only (`ml: null`, health `degraded`).

## Test

```bash
uv run pytest
```

## Struktur

```
app/
  rules/            # R01–R10, deteksi teks & URL (murni, teruji)
  ml/               # loader/inferensi, train.py, data/, artifacts/
  news_harvester/   # browser, extract, store, runner, scheduler, parsers/
  quiz.py           # model kuis
  quiz_daily.py     # klasemen harian + cron Discord
  news_broadcast.py # cron broadcast berita Discord
  bot_outbox.py     # antrean job bot Discord
  discord_store.py  # konfigurasi guild
  engine.py         # gabung skor rule + ML
  routers/          # check, examples, news, scan, reports, discord, threats, quiz
  config.py         # Settings (semua env)
  schemas.py        # kontrak request/response
supabase/migrations/  # SQL manual
tests/
```
