# Backend GuardianAI

API FastAPI untuk menilai pesan mencurigakan: **rules yang dapat dijelaskan + model ML lokal**
(TF-IDF + Logistic Regression). Tidak ada panggilan API LLM maupun layanan pihak ketiga.

## Menjalankan

```bash
uv sync
uv run uvicorn main:app --reload --port 8000
```

Dokumentasi interaktif: <http://localhost:8000/docs>

## Endpoint

| Metode | Path | Keterangan |
|---|---|---|
| POST | `/api/check` | Body `{"text": "...", "context": "dm"}` → skor risiko, daftar tanda bahaya, probabilitas ML, rekomendasi skenario |
| GET | `/api/examples` | Contoh pesan fiktif (aman & tipuan) untuk tombol "Coba contoh" |
| GET | `/api/model/status` | Apakah model ML termuat beserta versinya |
| GET | `/health` | Health check (`ok` / `degraded` bila model tidak termuat) |

Teks hanya diproses di memori request; tidak disimpan dan tidak di-log.

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
  engine.py     # gabung skor rule + ML, level risiko, rekomendasi skenario
  routers/      # /api/check, /api/examples
  schemas.py    # kontrak request/response
tests/
```
