# Red John

Red John: API FastAPI + panel admin Next.js + scraper berita penipuan → Supabase.

## Menjalankan (3 terminal)

Butuh [uv](https://docs.astral.sh/uv/) dan [Bun](https://bun.sh/). Dari root repo:

```bash
# 1. Backend API — http://localhost:8000  (docs: /docs)
cd backend && uv run main.py

# 2. Scraper — scheduler tiap 6 jam, proses terpisah dari API
cd backend && uv run scraper.py

# 3. Frontend — http://localhost:3000
cd frontend && bun run dev
```

Ketiganya bisa hidup bersamaan. API **tidak** menjalankan scraper; scraper butuh prosesnya sendiri.

## Persiapan sekali jalan

```bash
cd backend && uv sync && cp .env.example .env    # isi SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
cd frontend && bun install && cp .env.example .env.local
```

Migrasi SQL dijalankan manual di Supabase → SQL Editor, berurutan:

1. `backend/supabase/migrations/001_scam_reports.sql`
2. `backend/supabase/migrations/002_threat_admin.sql`

## Scraper: perintah lain

```bash
cd backend
uv run scraper.py --once --dry-run --source detik   # cek hasil, tanpa menulis DB
uv run scraper.py --once                            # harvest sekali lalu keluar
```

## Halaman

| URL       | Isi                                        |
| --------- | ------------------------------------------ |
| `/`       | Periksa pesan mencurigakan                 |
| `/berita` | Feed penipuan terverifikasi                |
| `/admin`  | Panel CRUD ancaman (tanpa auth — internal) |

Dokumentasi backend lengkap: [`backend/README.md`](backend/README.md).
