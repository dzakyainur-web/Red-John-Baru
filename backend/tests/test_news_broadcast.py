"""Jadwal broadcast berita Discord dalam WITA dan dedupe per slot/guild."""

from datetime import datetime
import asyncio
from typing import Any

import pytest
from postgrest.exceptions import APIError

from app import news_broadcast


def test_semua_guild_dan_dedupe_per_slot(monkeypatch: pytest.MonkeyPatch) -> None:
    async def channels() -> list[dict[str, Any]]:
        return [{"guild_id": "1"}, {"guild_id": "2"}]

    jobs: list[dict[str, Any]] = []

    async def enqueue(guild_id: str, **kwargs: Any) -> dict[str, Any]:
        jobs.append({"guild_id": guild_id, **kwargs})
        return {}

    monkeypatch.setattr(news_broadcast.discord_store, "list_news_channels", channels)
    monkeypatch.setattr(news_broadcast.bot_outbox, "enqueue", enqueue)
    moment = datetime(2026, 11, 10, 13, tzinfo=news_broadcast.WITA)
    assert asyncio.run(news_broadcast.broadcast(moment)) == 2
    assert [job["dedupe_key"] for job in jobs] == [
        "news:2026-11-10:13:1",
        "news:2026-11-10:13:2",
    ]


def test_duplikat_dan_kegagalan_tidak_menghentikan_guild_lain(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def channels() -> list[dict[str, Any]]:
        return [{"guild_id": "1"}, {"guild_id": "2"}, {"guild_id": "3"}]

    queued: list[str] = []

    async def enqueue(guild_id: str, **_kwargs: Any) -> dict[str, Any]:
        if guild_id == "1":
            raise APIError({"code": "23505", "message": "duplicate", "details": "", "hint": ""})
        if guild_id == "2":
            raise RuntimeError("database error")
        queued.append(guild_id)
        return {}

    monkeypatch.setattr(news_broadcast.discord_store, "list_news_channels", channels)
    monkeypatch.setattr(news_broadcast.bot_outbox, "enqueue", enqueue)
    assert asyncio.run(news_broadcast.broadcast(datetime(2026, 11, 10, 20, tzinfo=news_broadcast.WITA))) == 1
    assert queued == ["3"]


def test_scheduler_memakai_tiga_jam_wita() -> None:
    async def check() -> None:
        scheduler = news_broadcast.start_scheduler()
        try:
            job = scheduler.get_job(news_broadcast.JOB_ID)
            assert job is not None
            assert str(job.trigger.timezone) == "Asia/Makassar"
            assert "hour='5,13,20'" in str(job.trigger)
            assert "minute='0'" in str(job.trigger)
            assert news_broadcast.start_scheduler() is scheduler
        finally:
            news_broadcast.stop_scheduler()
        assert news_broadcast._scheduler is None

    asyncio.run(check())
