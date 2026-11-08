"""Outbox bot Discord: enqueue, klaim, lapor selesai, rate limit, validasi."""

from __future__ import annotations

from typing import Any

import pytest
from fastapi.testclient import TestClient

import app.auth as auth
import main
from app import bot_outbox, discord_store
from app.config import Settings
from app.news_harvester import store

client = TestClient(main.app)
HEADERS = {"X-API-Key": "test-key"}


@pytest.fixture(autouse=True)
def _setup(monkeypatch: pytest.MonkeyPatch):
    # Settings frozen: ganti objek `settings` di modul auth saja.
    fake = Settings.__new__(Settings)
    object.__setattr__(fake, "discord_bot_api_key", "test-key")
    object.__setattr__(fake, "app_env", "test")
    monkeypatch.setattr(auth, "settings", fake)
    monkeypatch.setattr(store, "_client", object())


class FakeOutbox:
    def __init__(self) -> None:
        self.jobs: list[dict[str, Any]] = []
        self.finished: dict[int, str | None] = {}
        self.pending = False
        self.recent = 0

    def install(self, monkeypatch: pytest.MonkeyPatch) -> "FakeOutbox":
        async def has_pending(_guild: str) -> bool:
            return self.pending

        async def count_recent(_guild: str, _window: Any) -> int:
            return self.recent

        async def enqueue(guild_id: str) -> dict[str, Any]:
            job = {"id": len(self.jobs) + 1, "guild_id": guild_id, "kind": "news_broadcast"}
            self.jobs.append(job)
            return job

        async def claim_next() -> dict[str, Any] | None:
            return self.jobs.pop(0) if self.jobs else None

        async def finish(event_id: int, error: str | None) -> dict[str, Any] | None:
            if event_id not in self.finished:
                return None
            self.finished[event_id] = error
            return {"id": event_id}

        monkeypatch.setattr(bot_outbox, "has_pending", has_pending)
        monkeypatch.setattr(bot_outbox, "count_recent", count_recent)
        monkeypatch.setattr(bot_outbox, "enqueue", enqueue)
        monkeypatch.setattr(bot_outbox, "claim_next", claim_next)
        monkeypatch.setattr(bot_outbox, "finish", finish)
        return self


@pytest.fixture
def outbox(monkeypatch: pytest.MonkeyPatch) -> FakeOutbox:
    return FakeOutbox().install(monkeypatch)


# --- POST /api/discord/broadcast ---------------------------------------------


def test_broadcast_enqueue(outbox: FakeOutbox) -> None:
    res = client.post("/api/discord/broadcast", json={"guild_id": "42"}, headers=HEADERS)
    assert res.status_code == 202
    assert res.json()["status"] == "queued"
    assert outbox.jobs[0]["guild_id"] == "42"


def test_broadcast_butuh_api_key(outbox: FakeOutbox) -> None:
    res = client.post("/api/discord/broadcast", json={"guild_id": "42"})
    assert res.status_code == 401


def test_broadcast_guild_id_harus_angka(outbox: FakeOutbox) -> None:
    res = client.post("/api/discord/broadcast", json={"guild_id": "abc"}, headers=HEADERS)
    assert res.status_code == 422


def test_broadcast_tolak_bila_masih_pending(outbox: FakeOutbox) -> None:
    outbox.pending = True
    res = client.post("/api/discord/broadcast", json={"guild_id": "42"}, headers=HEADERS)
    assert res.status_code == 409
    assert outbox.jobs == []


def test_broadcast_rate_limit(outbox: FakeOutbox) -> None:
    outbox.recent = 20
    res = client.post("/api/discord/broadcast", json={"guild_id": "42"}, headers=HEADERS)
    assert res.status_code == 429
    assert outbox.jobs == []


# --- Klaim & finish -----------------------------------------------------------


def test_claim_kosong_204(outbox: FakeOutbox) -> None:
    res = client.post("/api/discord/outbox/claim", headers=HEADERS)
    assert res.status_code == 204
    assert res.content == b""


def test_claim_mengembalikan_job(outbox: FakeOutbox) -> None:
    outbox.jobs.append({"id": 9, "guild_id": "42", "kind": "news_broadcast"})
    body = client.post("/api/discord/outbox/claim", headers=HEADERS).json()
    assert body == {"id": 9, "guild_id": "42", "kind": "news_broadcast"}


def test_finish_sukses_dan_gagal(outbox: FakeOutbox) -> None:
    outbox.finished = {1: "x", 2: "x"}
    ok = client.post("/api/discord/outbox/1/finish", json={}, headers=HEADERS)
    assert ok.status_code == 204
    assert outbox.finished[1] is None

    failed = client.post(
        "/api/discord/outbox/2/finish", json={"error": "Missing Permissions"}, headers=HEADERS
    )
    assert failed.status_code == 204
    assert outbox.finished[2] == "Missing Permissions"


def test_finish_job_tidak_aktif_404(outbox: FakeOutbox) -> None:
    res = client.post("/api/discord/outbox/99/finish", json={}, headers=HEADERS)
    assert res.status_code == 404


# --- GET /api/discord/news-channels ------------------------------------------


def test_news_channels(monkeypatch: pytest.MonkeyPatch) -> None:
    async def list_news_channels() -> list[dict[str, Any]]:
        return [
            {
                "guild_id": "1",
                "alert_channel_id": "11",
                "news_channel_id": "12",
                "protection_enabled": True,
                "notification_categories": [],
            }
        ]

    monkeypatch.setattr(discord_store, "list_news_channels", list_news_channels)
    body = client.get("/api/discord/news-channels", headers=HEADERS).json()
    assert body[0]["news_channel_id"] == "12"
    assert body[0]["alert_channel_id"] == "11"


# --- Store helper -------------------------------------------------------------


def test_as_rows_menerima_list_dan_objek() -> None:
    assert bot_outbox._as_rows([{"id": 1}]) == [{"id": 1}]
    assert bot_outbox._as_rows({"id": 2}) == [{"id": 2}]
    assert bot_outbox._as_rows(None) == []
