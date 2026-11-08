"""GET /api/news/random: sampel acak 5 berita terverifikasi untuk panel /admin."""

from __future__ import annotations

from typing import Any

import pytest
from fastapi.testclient import TestClient

import main
from app.news_harvester import store

client = TestClient(main.app)


def _row(i: int) -> dict[str, Any]:
    return {
        "id": f"id{i:03d}",
        "title": f"Berita penipuan nomor {i}",
        "description": "Deskripsi singkat.",
        "category": "phishing_link",
        "source_url": f"https://a.example/{i}",
        "source_media": "detik.com",
        "published_at": "2026-11-06T10:00:00+00:00",
        "created_at": "2026-11-06T10:00:00+00:00",
        "image_url": None,
    }


@pytest.fixture
def fake_store(monkeypatch: pytest.MonkeyPatch):
    """Pasang populasi palsu; kembalikan list `calls` (limit, offset, order) tiap query."""

    def _install(rows: list[dict[str, Any]]) -> list[tuple[int, int, str]]:
        calls: list[tuple[int, int, str]] = []
        monkeypatch.setattr(store, "_client", object())

        async def count_reports() -> int:
            return len(rows)

        async def list_reports(
            *, limit: int, offset: int, order: str = "created_at", descending: bool = True, **_: Any
        ) -> tuple[list[dict[str, Any]], int]:
            calls.append((limit, offset, order))
            window = rows[offset : offset + limit]
            if not descending:
                window = sorted(window, key=lambda r: r["id"])
            return window, len(rows)

        monkeypatch.setattr(store, "count_reports", count_reports)
        monkeypatch.setattr(store, "list_reports", list_reports)
        return calls

    return _install


def test_random_mengembalikan_lima_unik(fake_store) -> None:
    fake_store([_row(i) for i in range(40)])
    res = client.get("/api/news/random")
    assert res.status_code == 200
    body = res.json()
    assert len(body["items"]) == 5
    assert len({i["id"] for i in body["items"]}) == 5
    assert body["total"] == 40
    assert body["configured"] is True
    for item in body["items"]:
        assert {"id", "title", "url", "source", "published_at", "snippet", "categories"} <= set(item)


def test_random_populasi_kecil_tidak_lebih_dari_total(fake_store) -> None:
    fake_store([_row(i) for i in range(3)])
    body = client.get("/api/news/random").json()
    assert len(body["items"]) == 3
    assert body["total"] == 3


def test_random_tabel_kosong(fake_store) -> None:
    fake_store([])
    body = client.get("/api/news/random").json()
    assert body["items"] == []
    assert body["total"] == 0


def test_random_limit_divalidasi() -> None:
    assert client.get("/api/news/random?limit=0").status_code == 422
    assert client.get("/api/news/random?limit=999").status_code == 422


def test_random_supabase_belum_dikonfigurasi(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(store, "_client", None)
    body = client.get("/api/news/random").json()
    assert body["items"] == []
    assert body["configured"] is False


def test_random_jendela_di_akhir_tabel_dilengkapi(fake_store) -> None:
    """Offset acak di ujung tabel tidak boleh menghasilkan < 5 item."""
    rows = [_row(i) for i in range(40)]
    calls = fake_store(rows)
    for _ in range(50):
        body = client.get("/api/news/random").json()
        assert len(body["items"]) == 5, calls
