"""Antrekan broadcast berita harian ke semua guild Discord terdaftar."""

from __future__ import annotations

import logging
from datetime import datetime
from zoneinfo import ZoneInfo

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from postgrest.exceptions import APIError

from app import bot_outbox, discord_store

logger = logging.getLogger(__name__)

WITA = ZoneInfo("Asia/Makassar")
HOURS = (5, 13, 20)
JOB_ID = "news_broadcast"
_scheduler: AsyncIOScheduler | None = None


async def broadcast(now: datetime | None = None) -> int:
    """Antrekan satu job per guild; bot memilih 5 berita acak saat mengirim."""
    moment = (now or datetime.now(WITA)).astimezone(WITA)
    queued = 0
    for guild in await discord_store.list_news_channels():
        guild_id = guild.get("guild_id")
        if not guild_id:
            continue
        try:
            await bot_outbox.enqueue(
                guild_id,
                dedupe_key=f"news:{moment.date()}:{moment.hour:02d}:{guild_id}",
            )
            queued += 1
        except APIError as exc:
            if exc.code != "23505":
                logger.warning("Gagal enqueue berita guild %s: %s", guild_id, exc)
        except Exception as exc:  # noqa: BLE001 - guild lain tetap diproses
            logger.warning("Gagal enqueue berita guild %s: %s", guild_id, exc)
    logger.info("Berita %s:%02d diantrikan untuk %s guild.", moment.date(), moment.hour, queued)
    return queued


async def run_scheduled() -> None:
    try:
        await broadcast()
    except Exception as exc:  # noqa: BLE001 - job terjadwal tidak boleh mati
        logger.warning("Job broadcast berita gagal: %s: %s", type(exc).__name__, exc, exc_info=True)


def start_scheduler() -> AsyncIOScheduler | None:
    global _scheduler
    if _scheduler is not None:
        return _scheduler
    scheduler = AsyncIOScheduler(timezone=WITA)
    scheduler.add_job(
        run_scheduled,
        CronTrigger(hour="5,13,20", minute=0, timezone=WITA),
        id=JOB_ID,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=3600,
        replace_existing=True,
    )
    scheduler.start()
    _scheduler = scheduler
    job = scheduler.get_job(JOB_ID)
    logger.info("Broadcast berita terjadwal 05:00, 13:00, 20:00 WITA (berikutnya %s).", job.next_run_time if job else "-")
    return scheduler


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler is None:
        return
    _scheduler.shutdown(wait=False)
    _scheduler = None
