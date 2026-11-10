from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ML_DIR = BASE_DIR / "ml"
MODEL_PATH = ML_DIR / "artifacts" / "model.joblib"
METRICS_PATH = ML_DIR / "artifacts" / "metrics.json"
DATASET_PATH = ML_DIR / "data" / "dataset.csv"
ENV_PATH = BASE_DIR.parent / ".env"


def load_env_file(path: Path = ENV_PATH) -> None:
    """Muat `.env` ke os.environ. Tanpa dependency, tanpa menimpa env yang sudah ada.

    Dipanggil saat modul ini diimpor, jadi `uv run main.py`, `uv run scraper.py`, dan
    `uvicorn main:app` semuanya membaca `.env` tanpa flag `--env-file`.
    Variabel yang sudah ada di shell menang (Railway tetap pakai dashboard Variables).
    """
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return
    for raw in lines:
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.removeprefix("export ").strip()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        if key:
            os.environ.setdefault(key, value)


load_env_file()


@dataclass(frozen=True)
class Settings:
    max_input_chars: int = 5000
    # Environment aplikasi. `production` mematikan bypass dev pada endpoint bot.
    app_env: str = field(
        default_factory=lambda: os.environ.get("APP_ENV", "development").strip().lower()
    )
    # Kunci service-to-service untuk Discord Bot (header X-API-Key).
    discord_bot_api_key: str = field(
        default_factory=lambda: os.environ.get("DISCORD_BOT_API_KEY", "")
    )
    cors_origins: tuple[str, ...] = field(
        default_factory=lambda: tuple(
            o.strip()
            for o in os.environ.get("GUARDIANAI_CORS_ORIGINS", "http://localhost:3000").split(",")
            if o.strip()
        )
    )
    rule_weight: float = 0.6
    ml_weight: float = 0.4
    high_threshold: int = 70
    medium_threshold: int = 40

    # --- news_harvester ---
    supabase_url: str = field(default_factory=lambda: os.environ.get("SUPABASE_URL", ""))
    supabase_service_key: str = field(
        default_factory=lambda: os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    )
    # Scheduler hanya hidup di proses scraper (`uv run scraper.py`). Set true bila
    # ingin API ikut menjalankannya (deploy satu container).
    news_scheduler: bool = field(
        default_factory=lambda: os.environ.get("NEWS_SCHEDULER", "false").lower()
        in {"1", "true", "yes", "on"}
    )
    news_run_on_start: bool = field(
        default_factory=lambda: os.environ.get("NEWS_RUN_ON_START", "false").lower()
        in {"1", "true", "yes", "on"}
    )
    news_interval_hours: int = field(
        default_factory=lambda: int(os.environ.get("NEWS_INTERVAL_HOURS", "6"))
    )
    news_max_per_source: int = 15
    news_max_total: int = 60
    news_max_age_days: int = 90
    # Broadcast 5 berita acak ke semua guild: 05:00, 13:00, 20:00 WITA.
    news_broadcast_scheduler: bool = field(
        default_factory=lambda: os.environ.get("NEWS_BROADCAST_SCHEDULER", "false").lower()
        in {"1", "true", "yes", "on"}
    )
    news_concurrency: int = 3
    news_lock_ttl_minutes: int = 45

    # --- leaderboard kuis harian ---
    # Job 21:00 WIB yang mengumumkan papan peringkat ke Discord. Default false:
    # dev lokal tidak menembak channel produksi.
    leaderboard_scheduler: bool = field(
        default_factory=lambda: os.environ.get("LEADERBOARD_SCHEDULER", "false").lower()
        in {"1", "true", "yes", "on"}
    )
    leaderboard_hour: int = field(
        default_factory=lambda: int(os.environ.get("LEADERBOARD_HOUR", "21"))
    )
    news_user_agent: str = "RedJohn-news/2.0 (+edukasi penipuan digital)"


settings = Settings()
