"""Leaderboard kuis harian: jendela 21:00 WIB, poin server-side, pengumuman Discord."""

from __future__ import annotations

from datetime import date, datetime
from types import SimpleNamespace

import pytest
from postgrest.exceptions import APIError

from app import bot_outbox, discord_store, quiz_daily

WIB = quiz_daily.WIB


def at(y, m, d, h, mi=0, s=0) -> datetime:
    return datetime(y, m, d, h, mi, s, tzinfo=WIB)


# ---- jendela per hari -------------------------------------------------------

def test_quiz_day_bergeser_tepat_21_00() -> None:
    # Periode [D 21:00, D+1 21:00) diberi label D.
    assert quiz_daily.quiz_day(at(2026, 11, 10, 20, 59, 59)) == date(2026, 11, 9)
    assert quiz_daily.quiz_day(at(2026, 11, 10, 21, 0, 0)) == date(2026, 11, 10)
    assert quiz_daily.quiz_day(at(2026, 11, 11, 0, 30)) == date(2026, 11, 10)
    assert quiz_daily.quiz_day(at(2026, 11, 11, 20, 59, 59)) == date(2026, 11, 10)
    assert quiz_daily.quiz_day(at(2026, 11, 11, 21, 0, 0)) == date(2026, 11, 11)


def test_closed_day_menunjuk_periode_yang_baru_ditutup() -> None:
    # Tepat 21:00 dan fire terlambat mengumumkan periode yang baru berakhir.
    assert quiz_daily.closed_day(at(2026, 11, 11, 21, 0, 0)) == date(2026, 11, 10)
    assert quiz_daily.closed_day(at(2026, 11, 11, 22, 30)) == date(2026, 11, 10)
    # Catch-up pagi berikutnya: periode 11 Nov sudah tutup 12 Nov 21:00? belum.
    assert quiz_daily.closed_day(at(2026, 11, 12, 9, 0)) == date(2026, 11, 10)
    assert quiz_daily.closed_day(at(2026, 11, 12, 21, 0, 0)) == date(2026, 11, 11)


def test_window_dan_resets_at() -> None:
    start, end = quiz_daily.window(date(2026, 11, 10))
    assert (start, end) == (at(2026, 11, 10, 21), at(2026, 11, 11, 21))
    assert quiz_daily.resets_at(at(2026, 11, 11, 8)) == at(2026, 11, 11, 21)
    assert "WIB" in quiz_daily.window_label(date(2026, 11, 10))


def test_day_memakai_wib_meski_input_utc() -> None:
    from datetime import UTC

    # 14:00 UTC = 21:00 WIB → hari bergeser.
    assert quiz_daily.quiz_day(datetime(2026, 11, 10, 14, 0, tzinfo=UTC)) == date(2026, 11, 10)


# ---- poin -------------------------------------------------------------------

@pytest.mark.parametrize(
    ("level", "expected"),
    [(1, 100), (25, 100), (26, 150), (50, 150), (51, 220), (75, 220), (76, 350), (100, 350)],
)
def test_tangga_level_sama_dengan_frontend(level: int, expected: int) -> None:
    assert quiz_daily.points_for(100, level, False) == expected


def test_poin_penalti_none_dan_salah() -> None:
    assert quiz_daily.points_for(100, 90, True) == 335
    assert quiz_daily.points_for(100, None, False) == 100  # tanpa bonus
    assert quiz_daily.points_for(0, 100, False) == 0
    assert quiz_daily.points_for(100, 100, True) == 335


# ---- pengumuman -------------------------------------------------------------

@pytest.fixture
def announce_env(monkeypatch: pytest.MonkeyPatch):
    sent: list[dict] = []

    async def top(day: date, limit: int = 20):
        return [{"rank": 1, "user_id": "u1", "name": "Budi", "points": 350, "solved": 10}]

    async def guilds():
        return [{"guild_id": "g1"}, {"guild_id": "g2"}, {"guild_id": None}]

    async def enqueue(guild_id, kind="news_broadcast", payload=None, dedupe_key=None):
        sent.append({"guild_id": guild_id, "kind": kind, "payload": payload,
                     "dedupe_key": dedupe_key})
        return {"guild_id": guild_id}

    monkeypatch.setattr(quiz_daily, "top_scores", top)
    monkeypatch.setattr(discord_store, "list_news_channels", guilds)
    monkeypatch.setattr(bot_outbox, "enqueue", enqueue)
    return sent


def test_announce_mengantrikan_satu_job_per_guild(announce_env) -> None:
    import asyncio

    queued = asyncio.run(quiz_daily.announce(now=at(2026, 11, 11, 21, 0, 5)))
    assert queued == 2
    assert [s["guild_id"] for s in announce_env] == ["g1", "g2"]
    for job in announce_env:
        assert job["kind"] == "leaderboard"
        assert job["dedupe_key"] == "leaderboard:2026-11-10:" + job["guild_id"]
        assert job["payload"]["day"] == "2026-11-10"
        assert job["payload"]["entries"][0]["name"] == "Budi"


def test_announce_idempotent_dan_hari_kosong(announce_env, monkeypatch: pytest.MonkeyPatch) -> None:
    import asyncio

    asyncio.run(quiz_daily.announce(now=at(2026, 11, 11, 21, 0, 5)))
    asyncio.run(quiz_daily.announce(now=at(2026, 11, 11, 21, 0, 40)))
    keys = [s["dedupe_key"] for s in announce_env]
    assert len(keys) == 4  # dua guild × dua kali, dedupe ditangani DB (dedupe_key sama)
    assert len(set(keys)) == 2

    async def empty(day: date, limit: int = 20):
        return []

    monkeypatch.setattr(quiz_daily, "top_scores", empty)
    before = len(announce_env)
    assert asyncio.run(quiz_daily.announce(now=at(2026, 11, 12, 21, 0, 0))) == 0
    assert len(announce_env) == before


def test_announce_menelan_bentrok_dedupe(announce_env, monkeypatch: pytest.MonkeyPatch) -> None:
    import asyncio

    async def conflict(*_args, **_kwargs):
        raise APIError({"message": "duplicate key", "code": "23505"})

    monkeypatch.setattr(bot_outbox, "enqueue", conflict)
    assert asyncio.run(quiz_daily.announce(now=at(2026, 11, 11, 21, 0, 5))) == 0


def test_record_score_tidak_pernah_melempar(monkeypatch: pytest.MonkeyPatch) -> None:
    import asyncio

    class BrokenRpc:
        def execute(self):
            raise APIError({"message": "relation does not exist", "code": "42P01"})

    fake = SimpleNamespace(rpc=lambda *a, **k: BrokenRpc())
    monkeypatch.setattr(quiz_daily.store, "get_store", lambda: fake)
    assert asyncio.run(
        quiz_daily.record_score("u1", "q1", date(2026, 11, 10), 100)
    ) is False
