# Backend Red John

API FastAPI untuk menilai pesan mencurigakan: **rules yang dapat dijelaskan + model ML lokal**
(TF-IDF + Logistic Regression). Tidak ada panggilan API LLM maupun layanan pihak ketiga.

## Menjalankan

```bash
uv sync
cp .env.example .env      # lalu isi nilainya
uv run main.py            # API saja
uv run scraper.py         # service scraper (scheduler) — proses terpisah
```

Dua proses, satu image. `uv run main.py` **tidak** lagi menjalankan scraper; jalankan
`uv run scraper.py` di terminal/container lain. Untuk deploy satu container, set
`NEWS_SCHEDULER=true` agar API ikut menjalankan scheduler.

`backend/.env` dibaca otomatis oleh `app/config.py` (tanpa dependency tambahan), jadi
`uv run main.py`, `uv run scraper.py`, `uvicorn main:app`, dan CLI harvester semuanya memakai
nilai yang sama. Variabel yang sudah ada di environment shell menang — di Railway cukup isi
Variables dashboard.

Set `NEWS_RUN_ON_START=true` bila ingin satu putaran harvest langsung saat scraper boot, bukan
menunggu interval 6 jam pertama.

Dokumentasi interaktif: <http://localhost:8000/docs>

## Endpoint

| Metode | Path | Keterangan |
|---|---|---|
| POST | `/api/check` | Body `{"text": "...", "context": "dm"}` → skor risiko, daftar tanda bahaya, probabilitas ML, rekomendasi skenario |
| GET | `/api/examples` | Contoh pesan fiktif (aman & tipuan) untuk tombol "Coba contoh" |
| GET | `/api/news` | Daftar berita penipuan (`limit`, `offset`, `category`, `source`, `q`) dari Supabase |
| GET | `/api/model/status` | Apakah model ML termuat beserta versinya |
| GET | `/health` | Health check (`ok` / `degraded` bila model tidak termuat) |

Teks hanya diproses di memori request; tidak disimpan dan tidak di-log.

## News harvester

Parser Playwright async untuk Detik, Kompas, dan Liputan6. Tiap artikel diekstrak jadi judul,
kutipan ≤1200 karakter, IOC (URL/APK/nomor telepon, selalu defanged), satu kategori modus
(`fake_job`, `phishing_link`, `giveaway_palsu`, `malware_apk`, `pinjol_ilegal`), dan URL gambar
utama (`og:image`) untuk card berita. Hasil masuk ke tabel `scam_reports` di Supabase dengan dedupe
`source_url`.

Migrasi SQL dijalankan manual: buka Supabase → SQL Editor → tempel isi
`supabase/migrations/001_scam_reports.sql`, lalu `002_threat_admin.sql` dan `003_news_image.sql`.

> Catatan: upsert memakai `ignore_duplicates=True`, jadi baris lama **tidak** diperbarui. Artikel
> yang sudah masuk sebelum `003_news_image.sql` tetap tanpa gambar (`image_url` NULL) sampai
> di-backfill manual atau barisnya dihapus.

```bash
# pratinjau tanpa menyentuh database
uv run scraper.py --once --dry-run
uv run scraper.py --once --dry-run --source kompas

# run sungguhan sekali (butuh SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
uv run scraper.py --once

# service: scheduler tiap NEWS_INTERVAL_HOURS, berhenti dengan SIGINT/SIGTERM
uv run scraper.py
```

Scheduler hidup di proses scraper, bukan di API. Lock di tabel `news_run_lock` membuat beberapa
replica aman — hanya satu yang menulis, jadi `scraper.py` boleh diskalakan asal tidak semuanya
menulis bersamaan.

Env:

| Variabel | Default | Keterangan |
|---|---|---|
| `SUPABASE_URL` | — | Project URL. Tanpa ini endpoint tetap boot, `/api/news` balas `configured: false` |
| `SUPABASE_SERVICE_ROLE_KEY` | — | Kunci tulis (bypass RLS). Jangan dipakai di frontend |
| `NEWS_SCHEDULER` | `false` | `true` = API ikut menjalankan scheduler scraper (deploy satu container) |
| `NEWS_RUN_ON_START` | `false` | Jalankan sekali saat scraper boot |
| `NEWS_INTERVAL_HOURS` | `6` | Jarak antar run |

Catatan: `robots.txt` Kompas memuat komentar ToS yang melarang pengambilan otomatis; robots sendiri
mengizinkan `/read/`. Harvester berjalan dengan jeda 3 detik dan UA yang jelas. Risiko ditanggung
pemilik proyek — tinjau ulang bila Kompas mengubah ketentuan.

## Training model

Dataset latih **sintetis** dibuat tim dan bersifat fiktif (tanpa PII nyata, tanpa data penipuan asli
dari internet). Sumbernya generator template di `app/ml/generate_dataset.py` (campuran pola scripted
dan variasi bahasa natural), output ke `app/ml/data/dataset.csv` (`text,label,category`).

```bash
uv run python -m app.ml.generate_dataset   # tulis ulang dataset.csv (±250 baris)
uv run python -m app.ml.train              # latih model → app/ml/artifacts/{model.joblib,metrics.json}
uv run python -m app.ml.evaluate_holdout   # evaluasi pakai 35 contoh tulisan tangan (bukan template)
```

Hasil terkini (dataset kecil 250 baris): test set 50 baris → akurasi 0.98, F1 scam 0.98, recall 1.00,
FPR 0.053. **Holdout tulisan tangan: 31/35 (88,6%) akurasi probabilitas model mentah.** Angka test set
yang tinggi adalah tanda model menghafal template — holdout inilah estimasi realistisnya. Di aplikasi
kombinasi rules + ML menaikkan akurasi sistem secara keseluruhan.

Artefak di-commit agar proses deploy tidak perlu melatih ulang. Bila artefak hilang, API tetap jalan
dengan rules saja (`ml: null`, health = `degraded`).

## Test

```bash
uv run pytest
```

## Struktur

```
app/
  rules/        # R01–R10, deteksi teks & URL (murni, teruji)
  ml/           # model.py (loader/inferensi), train.py (offline), data/, artifacts/
  news_harvester/  # browser.py, extract.py, store.py, runner.py, scheduler.py, parsers/
  engine.py     # gabung skor rule + ML, level risiko, rekomendasi skenario
  routers/      # /api/check, /api/examples, /api/news
  schemas.py    # kontrak request/response
supabase/migrations/   # SQL manual (scam_reports, news_run_lock)
tests/
```
