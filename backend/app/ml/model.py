from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from app.config import MODEL_PATH

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class MLPrediction:
    probability: float
    top_features: list[tuple[str, float]]


class MLModel:
    def __init__(self, pipeline: Any, version: str = "v1.0.0"):
        self.pipeline = pipeline
        self.version = version

    def predict(self, text: str) -> MLPrediction:
        try:
            proba = float(self.pipeline.predict_proba([text])[0][1])
            return MLPrediction(probability=proba, top_features=[])
        except Exception as e:
            logger.warning("Gagal melakukan prediksi ML: %s", e)
            return MLPrediction(probability=0.0, top_features=[])


_MODEL_INSTANCE: MLModel | None = None


def get_model() -> MLModel | None:
    global _MODEL_INSTANCE
    if _MODEL_INSTANCE is not None:
        return _MODEL_INSTANCE

    if not MODEL_PATH.exists():
        return None

    try:
        import joblib

        loaded = joblib.load(MODEL_PATH)
        version = getattr(loaded, "version", "v1.0.0")
        _MODEL_INSTANCE = MLModel(pipeline=loaded, version=version)
        return _MODEL_INSTANCE
    except Exception as e:
        logger.warning("Gagal memuat artefak model ML dari %s: %s", MODEL_PATH, e)
        return None
