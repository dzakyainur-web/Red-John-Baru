"""Endpoint leaderboard kuis + pencatatan skor dari endpoint jawaban."""

from __future__ import annotations

from typing import Any

import pytest
from fastapi.testclient import TestClient

import main
from app import quiz_daily, quiz_store
from app.news_harvester import store
from app.routers import quiz as quiz_router

client = TestClient(main.app)

ROW = {
    "id": "q1",
    "kind": "multiple_choice",
    "choices": [
        {"id": "safe", "text": "Tolak", "is_safe": True, "consequence": "Aman",
         "jane_intervention": "Tepat", "manipulation_tactic": "Urgensi"},
        {"id": "unsafe", "text": "Kirim", "is_safe": False, "consequence": "Bahaya",
         "jane_intervention": "Jangan", "manipulation_tactic": "Urgensi"},
    ],
}


@pytest.fixture
def db(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(store, "_client", object())

    async def get_question(_qid: str) -> dict[str, Any]:
        return ROW

    monkeypatch.setattr(quiz_store, "get_question", get_question)


def test_leaderboard_publik_bentuk_respons(db: None, monkeypatch: pytest.MonkeyPatch) -> None:
    async def top(day, limit=20):
        return [{"rank": 1, "user_id": "u1", "name": "Budi", "points": 350, "solved": 10}]

    monkeypatch.setattr(quiz_daily, "top_scores", top)
    res = client.get("/api/quiz/leaderboard?limit=5")
    assert res.status_code == 200
    body = res.json()
    assert body["entries"][0] == {
        "rank": 1, "user_id": "u1", "name": "Budi", "points": 350, "solved": 10,
    }
    for key in ("day", "label", "resets_at", "server_now"):
        assert body[key]
    assert body["resets_at"].endswith("+07:00")


def test_leaderboard_503_saat_migrasi_belum_ada(db: None, monkeypatch: pytest.MonkeyPatch) -> None:
    async def missing(day, limit=20):
        raise quiz_daily.APIError({"message": "does not exist", "code": "42P01"})

    monkeypatch.setattr(quiz_daily, "top_scores", missing)
    res = client.get("/api/quiz/leaderboard")
    assert res.status_code == 503
    assert "008_quiz_leaderboard.sql" in res.json()["detail"]


def test_jawaban_tanpa_login_tetap_dinilai(db: None) -> None:
    res = client.post("/api/quiz/questions/q1/answer", json={"choice_id": "safe", "difficulty": 30})
    assert res.status_code == 200
    body = res.json()
    assert body["points_awarded"] == 150
    assert body["counted"] is False


def test_jawaban_salah_tanpa_poin(db: None) -> None:
    res = client.post("/api/quiz/questions/q1/answer", json={"choice_id": "unsafe", "difficulty": 100})
    assert res.status_code == 200
    assert res.json()["points_awarded"] == 0


def test_jawaban_login_mencatat_skor(db: None, monkeypatch: pytest.MonkeyPatch) -> None:
    recorded: list[tuple] = []

    async def user_id(_auth):
        return "user-1"

    async def record(uid, qid, day, points):
        recorded.append((uid, qid, day, points))
        return True

    monkeypatch.setattr(quiz_router, "optional_user_id", user_id)
    monkeypatch.setattr(quiz_daily, "record_score", record)
    res = client.post(
        "/api/quiz/questions/q1/answer",
        json={"choice_id": "safe", "difficulty": 80, "clue_penalty": True},
        headers={"Authorization": "Bearer tok"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["points_awarded"] == 335
    assert body["counted"] is True
    assert recorded and recorded[0][0] == "user-1" and recorded[0][1] == "q1"


def test_jawaban_login_tapi_gagal_catat_tidak_menggagalkan(db: None, monkeypatch: pytest.MonkeyPatch) -> None:
    async def user_id(_auth):
        return "user-1"

    async def record(*_args):
        return False

    monkeypatch.setattr(quiz_router, "optional_user_id", user_id)
    monkeypatch.setattr(quiz_daily, "record_score", record)
    res = client.post("/api/quiz/questions/q1/answer", json={"choice_id": "safe"})
    assert res.status_code == 200
    assert res.json()["counted"] is False


def test_optional_user_id_menolak_token_salah(monkeypatch: pytest.MonkeyPatch) -> None:
    import asyncio
    from types import SimpleNamespace

    class FakeAuth:
        async def get_user(self, token):
            raise RuntimeError("invalid jwt")

    monkeypatch.setattr(store, "get_store", lambda: SimpleNamespace(auth=FakeAuth()))
    assert asyncio.run(quiz_router.optional_user_id("Bearer salah")) is None
    assert asyncio.run(quiz_router.optional_user_id(None)) is None
    assert asyncio.run(quiz_router.optional_user_id("Basic abc")) is None
