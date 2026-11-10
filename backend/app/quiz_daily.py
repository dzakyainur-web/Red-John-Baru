"""Leaderboard kuis harian: jendela 21:00 WIB, pencatatan skor, dan pengumuman Discord.

"Reset harian" bukan job hapus data: satu periode = [D 21:00, D+1 21:00) WIB dan
hari baru kosong dengan sendirinya. Job terjadwal hanya mengumumkan periode yang
baru ditutup lalu enqueue satu event outbox per guild (dedupe_key mencegah ganda).
"""

from __future__ import annotations

import logging
from datetime import date, datetime, time, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from postgrest.exceptions import APIError

from app import bot_outbox, discord_store
from app.config import settings
from app.news_harvester import store

logger = logging.getLogger(__name__)

WIB = ZoneInfo("Asia/Jakarta")
RESET_HOUR = 21
JOB_ID = "quiz_leaderboard_daily"
ANNOUNCE_LIMIT = 10

_scheduler: AsyncIOScheduler | None = None

# Tangga kelipatan harus identik dengan getDifficultyInfo() di frontend:
# 1.0 / 1.5 / 2.2 / 3.5 berdasarkan level kesulitan yang dikirim klien.
def multiplier_for(level: int) -> float:
    if level <= 25:
        return 1.0
    if level <= 50:
        return 1.5
    if level <= 75:
        return 2.2
    return 3.5

def points_for(base: int, difficulty: int | None, clue_penalty: bool) -> int:
    """Poin final satu jawaban. `difficulty` None (klien lama/curl) = tanpa bonus.

    ponytail: difficulty dikirim klien dan endpoint jawaban publik, jadi pemain
    curang bisa mengaku level 100. Mitigasi satu-satunya: pencatatan butuh token
    Supabase valid. Tingkatkan hanya bila benar-benar jadi masalah.
    """
    if base <= 0:
        return 0
    level = max(1, min(100, difficulty if difficulty is not None else 1))
    points = round(base * multiplier_for(level))
    return max(0, points - (15 if clue_penalty else 0))

def now_wib() -> datetime:
    return datetime.now(WIB)

def _local(now: datetime | None) -> datetime:
    moment = now or now_wib()
    return moment.astimezone(WIB) if moment.tzinfo else moment.replace(tzinfo=WIB)

def quiz_day(now: datetime | None = None) -> date:
    """Periode berjalan — dipakai saat MENCATAT skor."""
    return (_local(now) - timedelta(hours=RESET_HOUR)).date()

def closed_day(now: datetime | None = None) -> date:
    """Periode yang baru ditutup — dipakai saat MENGUMUMKAN.

    Tepat 21:00 `quiz_day` sudah menunjuk hari baru, jadi pengumuman memakai
    periode sebelumnya (dan tetap benar untuk fire terlambat / catch-up pagi).
    """
    moment = _local(now)
    today = moment.date()
    return today - timedelta(days=1 if moment.hour >= RESET_HOUR else 2)

def window(day: date) -> tuple[datetime, datetime]:
    start = datetime.combine(day, time(RESET_HOUR), tzinfo=WIB)
    return start, start + timedelta(days=1)

def window_label(day: date) -> str:
    start, end = window(day)
    fmt = "%d %b %H:%M"
    return f"{start.strftime(fmt)} → {end.strftime(fmt)} WIB"

def resets_at(now: datetime | None = None) -> datetime:
    return window(quiz_day(now))[1]

async def record_score(user_id: str, question_id: str, day: date, points: int) -> bool:
    """Simpan skor tertinggi untuk (user, periode, soal). False bila gagal dicatat.

    Kegagalan tidak pernah dilempar: endpoint jawaban bersifat publik dan tidak
    boleh 503 hanya karena migrasi 008 belum dijalankan.
    """
    sb = store.get_store()
    if sb is None or points <= 0:
        return False
    try:
        await sb.rpc(
            "record_quiz_score",
            {
                "p_user": user_id,
                "p_day": day.isoformat(),
                "p_question": question_id,
                "p_points": points,
            },
        ).execute()
        return True
    except Exception as exc:  # noqa: BLE001 - best effort, jangan gagalkan pemain
        logger.warning("Gagal mencatat skor kuis: %s: %s", type(exc).__name__, exc)
        return False

async def top_scores(day: date, limit: int = 20) -> list[dict[str, Any]]:
    sb = store.get_store()
    if sb is None:
        return []
    result = await sb.rpc(
        "quiz_daily_leaderboard", {"p_day": day.isoformat(), "p_limit": limit}
    ).execute()
    return [_entry(row) for row in (result.data or [])]

def _entry(row: dict[str, Any]) -> dict[str, Any]:
    points = int(row.get("points") or 0)
    solved = int(row.get("solved") or 0)
    return {
        "rank": int(row.get("place") or row.get("rank") or 0),
        "user_id": str(row.get("user_id") or ""),
        "name": str(row.get("name") or "Agen"),
        "points": points,
        "solved": solved,
    }

async def announce(now: datetime | None = None) -> int:
    """Enqueue pengumuman periode yang baru ditutup. Kembalikan jumlah guild."""
    day = closed_day(now)
    entries = await top_scores(day, ANNOUNCE_LIMIT)
    if not entries:
        logger.info("Leaderboard %s kosong — tidak ada pengumuman.", day)
        return 0
    payload = {
        "day": day.isoformat(),
        "label": window_label(day),
        "entries": entries,
    }
    queued = 0
    for guild in await discord_store.list_news_channels():
        guild_id = guild.get("guild_id")
        if not guild_id:
            continue
        try:
            await bot_outbox.enqueue(
                guild_id,
                kind="leaderboard",
                payload=payload,
                dedupe_key=f"leaderboard:{day}:{guild_id}",
            )
            queued += 1
        except APIError as exc:
            if exc.code == "23505":
                continue  # sudah diumumkan untuk periode ini
            logger.warning("Gagal enqueue leaderboard guild %s: %s", guild_id, exc)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Gagal enqueue leaderboard guild %s: %s", guild_id, exc)
    logger.info("Leaderboard %s diantrikan untuk %s guild.", day, queued)
    return queued

async def run_scheduled() -> None:
    try:
        await announce()
    except Exception as exc:  # noqa: BLE001 - job terjadwal tidak boleh mati
        logger.warning(
            "Job leaderboard gagal: %s: %s", type(exc).__name__, exc, exc_info=True
        )

def start_scheduler() -> AsyncIOScheduler | None:
    global _scheduler
    if _scheduler is not None:
        return _scheduler
    scheduler = AsyncIOScheduler(timezone=WIB)
    scheduler.add_job(
        run_scheduled,
        CronTrigger(hour=settings.leaderboard_hour, minute=0, timezone=WIB),
        id=JOB_ID,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=6 * 3600,
        replace_existing=True,
    )
    scheduler.start()
    _scheduler = scheduler
    job = scheduler.get_job(JOB_ID)
    logger.info(
        "Leaderboard kuis terjadwal harian %02d:00 WIB (berikutnya %s).",
        settings.leaderboard_hour,
        job.next_run_time if job else "-",
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
