"""Aplikasi FastAPI GuardianAI — rules + model ML lokal, tanpa API LLM/pihak ketiga."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.config import settings
from app.ml.model import get_model
from app.routers import check, examples
from app.schemas import HealthResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    model = get_model()
    if model is None:
        logger.warning("Berjalan tanpa lapisan ML (rules-only).")
    else:
        logger.info("Model ML dimuat: %s", model.version)
    yield


app = FastAPI(
    title="GuardianAI API",
    version=__version__,
    description=(
        "Penilaian pesan mencurigakan berbasis aturan yang dapat dijelaskan dan model ML lokal "
        "(TF-IDF + Logistic Regression). Teks diproses di server ini dan tidak disimpan."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins) or ["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(check.router, prefix="/api")
app.include_router(examples.router, prefix="/api")


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    model = get_model()
    return HealthResponse(
        status="ok" if model is not None else "degraded",
        ml_loaded=model is not None,
        model_version=model.version if model else None,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

