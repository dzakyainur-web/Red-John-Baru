"""Penjadwal in-process (pengganti cron GitHub Actions)."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from zoneinfo import ZoneInfo

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.config import settings
from app.news_harvester.runner import run_once

logger = logging.getLogger(__name__)

JOB_ID = "news_harvester"
_scheduler: AsyncIOScheduler | None = None


async def run_scheduled() -> None:
    """Job periodik. Lock di DB mencegah dua replica scraping bersamaan."""
    try:
        await run_once()
    except Exception as exc:  # noqa: BLE001 - job terjadwal tidak boleh mati
        logger.warning("Job news harvester gagal: %s", exc)


def start_scheduler() -> AsyncIOScheduler | None:
    global _scheduler
    if _scheduler is not None:
        return _scheduler
    scheduler = AsyncIOScheduler(timezone=ZoneInfo("Asia/Jakarta"))
    scheduler.add_job(
        run_scheduled,
        IntervalTrigger(hours=settings.news_interval_hours),
        id=JOB_ID,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=3600,
        replace_existing=True,
    )
    scheduler.start()
    _scheduler = scheduler
    if settings.news_run_on_start:
        asyncio.create_task(run_scheduled())
    logger.info(
        "News harvester terjadwal tiap %s jam (pertama %s).",
        settings.news_interval_hours,
        scheduler.get_job(JOB_ID).next_run_time if scheduler.get_job(JOB_ID) else "-",
    )
    return scheduler


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler is None:
        return
    _scheduler.shutdown(wait=False)
    _scheduler = None


def next_run_time() -> datetime | None:
    if _scheduler is None:
        return None
    job = _scheduler.get_job(JOB_ID)
    return getattr(job, "next_run_time", None)
