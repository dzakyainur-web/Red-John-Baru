from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ML_DIR = BASE_DIR / "ml"
MODEL_PATH = ML_DIR / "artifacts" / "model.joblib"
METRICS_PATH = ML_DIR / "artifacts" / "metrics.json"
DATASET_PATH = ML_DIR / "data" / "dataset.csv"


@dataclass(frozen=True)
class Settings:
    max_input_chars: int = 5000
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


settings = Settings()
