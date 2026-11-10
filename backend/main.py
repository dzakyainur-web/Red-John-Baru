"""Aplikasi FastAPI Red John — rules + model ML lokal, tanpa API LLM/pihak ketiga."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.config import settings
from app.ml.model import get_model
from app.news_harvester import store as news_store
from app.news_harvester.scheduler import start_scheduler, stop_scheduler
from app.routers import check, discord, examples, news, quiz, reports, scan, threats
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

    await news_store.init_store()
    if settings.news_scheduler and news_store.get_store() is not None:
        start_scheduler()
    else:
        logger.info(
            "Scraper terjadwal nonaktif di proses API. Jalankan `uv run scraper.py` bila perlu."
        )

    try:
        yield
    finally:
        stop_scheduler()
        await news_store.close_store()


app = FastAPI(
    title="Red John API",
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
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "X-API-Key", "Authorization"],
)

app.include_router(check.router, prefix="/api")
app.include_router(examples.router, prefix="/api")
app.include_router(news.router, prefix="/api")
app.include_router(scan.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(discord.router, prefix="/api")
app.include_router(threats.router, prefix="/api")
app.include_router(quiz.router, prefix="/api")


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

