# Red John

API deteksi penipuan digital (FastAPI + rules + model ML lokal), web app Next.js, scraper
berita → Supabase, dan bot Discord (Go). Semua arsitektur *single source of truth*: hanya
backend yang bicara ke Supabase; frontend dan bot memanggil API.

```
frontend (Next.js :3000) ──HTTP──┐
Agent-RJ (bot Go)       ──HTTP──┼─► backend (FastAPI :8000) ──service_role──► Supabase (Postgres)
scraper Playwright      ─────────┘
```

## Prasyarat

| Tool | Untuk |
|---|---|
| [uv](https://docs.astral.sh/uv/) | backend Python 3.12 |
| [Bun](https://bun.sh/) | frontend Next.js 16 |
| Go 1.25+ | bot Discord (opsional) |
| Proyek Supabase | database, auth, storage kuis |
| Node/npx | **hanya** fallback `bunx` bila Bun bermasalah |

## Jalankan lokal (4 terminal)

```bash
# 1. Backend API — http://localhost:8000  (docs: /docs, health: /health)
cd backend && uv run main.py

# 2. Scraper — scheduler tiap 6 jam (NEWS_INTERVAL_HOURS), proses terpisah
cd backend && uv run scraper.py

# 3. Frontend — http://localhost:3000
cd frontend && bun install && bun run dev

# 4. Bot Discord (opsional — butuh token, lihat Agent-RJ/README.md)
cd Agent-RJ && go run main.go
```

API **tidak** menjalankan scraper; scraper butuh prosesnya sendiri (atau `NEWS_SCHEDULER=true`
untuk mode satu container).

## Persiapan sekali jalan

```bash
cd backend   && uv sync  && cp .env.example .env        # isi minimal SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
cd frontend  && bun install && cp .env.example .env.local  # isi NEXT_PUBLIC_SUPABASE_*
cd Agent-RJ  && cp .env.example .env                    # hanya bila menjalankan bot
```

`.env.example` di tiap folder memuat komentar lengkap per variabel. Tabel ringkas ada di
[`backend/README.md`](backend/README.md#environment) dan [`frontend/README.md`](frontend/README.md#environment).

### Migrasi SQL (manual, urut)

Jalankan di Supabase → **SQL Editor**, berurutan. Semua idempotent — aman dijalankan ulang.

| # | File | Wajib? |
|---|---|---|
| 1 | `001_scam_reports.sql` | ya |
| 2 | `002_threat_admin.sql` | ya |
| 3 | `003_news_image.sql` | ya |
| 4 | `004_discord_bot.sql` | bila memakai bot Discord |
| 5 | `005_discord_news_broadcast.sql` | bila memakai bot Discord |
| 6 | `006_quiz_questions.sql` | bila memakai fitur kuis |
| 7 | `007_profiles.sql` | bila memakai kuis / login (wajib untuk admin & klasemen) |
| 8 | `008_quiz_leaderboard.sql` | bila memakai klasemen harian (butuh 005 + 007) |

Folder: `backend/supabase/migrations/`.

## Scraper: perintah lain

```bash
cd backend
uv run scraper.py --once --dry-run                  # cek hasil, tanpa menulis DB
uv run scraper.py --once --dry-run --source detik   # satu sumber saja
uv run scraper.py --once                            # harvest sekali lalu keluar
```

## Halaman

| URL | Isi |
|---|---|
| `/` | Periksa pesan mencurigakan |
| `/berita` | Radar berita penipuan terverifikasi |
| `/pemindai` | Pemindai pesan |
| `/lapor-cepat` | Lapor tautan mencurigakan |
| `/quiz` | Kuis kriminal otomatis |
| `/quiz/leaderboard` | Klasemen harian (reset 21:00 WIB) |
| `/quiz/admin` | Admin bank soal (login + `profiles.role = admin`) |
| `/admin` | Panel CRUD ancaman + broadcast berita Discord |
| `/login`, `/register` | Auth Supabase |
| `/act`, `/learn`, `/tentang-keamanan` | Konten edukasi |

## Deploy ke produksi

Ringkas; detail per komponen di README masing-masing.

### 0. Urutan menaikkan versi

1. Jalankan migrasi SQL baru di Supabase (aman, idempotent).
2. Deploy backend.
3. Deploy bot Discord **sebelum** menyalakan `LEADERBOARD_SCHEDULER=true` (bot lama akan
   memperlakukan job `kind="leaderboard"` sebagai berita dan memposting berita acak).
4. Deploy frontend (variabel `NEXT_PUBLIC_*` di-inline saat **build**).
5. Nyalakan fitur opsional lewat env (`LEADERBOARD_SCHEDULER`, `NEWS_SCHEDULER`).

### 1. Backend (Railway / VPS / Docker)

- Image: `backend/Dockerfile` (Python 3.12 + Chromium untuk scraper).
- Start: `uv run uvicorn main:app --host 0.0.0.0 --port $PORT` (sudah jadi `CMD`).
- Scraper: service kedua dari image yang sama, `command: uv run scraper.py`; atau satu service
  dengan `NEWS_SCHEDULER=true`.
- Set `APP_ENV=production` + `DISCORD_BOT_API_KEY` (acak, min. 32 karakter).
- Set `GUARDIANAI_CORS_ORIGINS=https://<domain-frontend>`.
- Healthcheck: `GET /health` (200 walau `degraded` saat model ML hilang).
- Variabel lain: tabel [Environment](backend/README.md#environment).

### 2. Frontend (Vercel / Docker)

- Build: `bun install && bun run build`; start: `bun run start`.
- Set `NEXT_PUBLIC_API_BASE_URL` = URL backend publik, `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dan `DISCORD_BOT_API_KEY` (server-only) **sebelum build**.
- Halaman `/berita` di-prerender saat build dan mem-fetch `GET /api/news` dari backend —
  build gagal (`ECONNREFUSED`) bila backend belum hidup. Deploy backend dulu.

### 3. Bot Discord

- Image: `Agent-RJ/Dockerfile` (distroless). Butuh `DISCORD_TOKEN`, `DISCORD_APP_ID`,
  `REDJOHN_API_URL` (URL backend publik), `REDJOHN_API_KEY` (= `DISCORD_BOT_API_KEY` backend),
  `APP_ENV=production`.
- Detail: [`Agent-RJ/README.md`](Agent-RJ/README.md).

### 4. Supabase

- Auth → URL Configuration: Site URL = domain frontend, Redirect URLs = domain frontend.
- Jangan pernah memakai service_role key di frontend atau bot.
- Promote admin: `update public.profiles set role = 'admin' where email = '...';`

## Dokumentasi lain

- [`backend/README.md`](backend/README.md) — endpoint, env, harvester, model ML
- [`frontend/README.md`](frontend/README.md) — env, build, struktur app
- [`Agent-RJ/README.md`](Agent-RJ/README.md) — perintah bot, env, Docker
- [`docs/discord-bot-local-setup.md`](docs/discord-bot-local-setup.md) — setup bot dari nol
- [`docs/quiz-supabase.md`](docs/quiz-supabase.md) — bank soal, auth admin, klasemen harian
- [`docs/progress-discord-bot.md`](docs/progress-discord-bot.md) — riwayat implementasi bot
- [`docs/plan-5.1-golden-hour-packet.md`](docs/plan-5.1-golden-hour-packet.md) — rencana fitur
