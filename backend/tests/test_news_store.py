"""store.to_row / to_news_item / insert_reports dengan fake client (tanpa jaringan)."""

from __future__ import annotations

from typing import Any

import pytest

from app.news_harvester import store
from app.news_harvester.extract import MAX_DESCRIPTION, article_id


def _article(**over: Any) -> dict[str, Any]:
    base = {
        "url": "https://www.detik.com/jatim/hukum/d-7839012/penipuan-apk",
        "title": "Penipuan APK modus baru menyasar pengguna Android",
        "media": "detik.com",
        "published_at": "2026-11-06T10:00:00+00:00",
        "description": "Korban diminta mengunduh file APK dari tautan yang dikirim lewat WhatsApp.",
        "iocs": [{"type": "apk", "value": "penipu.apk"}],
        "category": "malware_apk",
    }
    base.update(over)
    return base


def test_to_row_bentuk_baris() -> None:
    row = store.to_row(_article())
    assert row["id"] == article_id(_article()["url"])
    assert len(row["id"]) == 12
    assert row["status"] == "verified"
    assert row["source_media"] == "detik.com"
    assert row["source_url"] == _article()["url"]
    assert row["scammer_indicators"] == [{"type": "apk", "value": "penipu.apk"}]
    assert row["published_at"] == "2026-11-06T10:00:00+00:00"


def test_to_row_memotong_deskripsi() -> None:
    row = store.to_row(_article(description="kata " * 1000))
    assert len(row["description"]) <= MAX_DESCRIPTION
    assert row["description"].endswith("kata") or row["description"].endswith("kata ")


def test_to_row_memotong_judul_dan_iocs_kosong() -> None:
    row = store.to_row(_article(title="J" * 400, iocs=None))
    assert len(row["title"]) <= 300
    assert row["scammer_indicators"] == []


def test_to_news_item_fallback_published() -> None:
    item = store.to_news_item(
        {
            "id": "abc",
            "title": "Judul",
            "description": "x" * 500,
            "category": "phishing_link",
            "source_url": "https://a.example/read/1",
            "source_media": "kompas.com",
            "published_at": None,
            "created_at": "2026-11-07T01:00:00+00:00",
        }
    )
    assert item["published_at"] == "2026-11-07T01:00:00+00:00"
    assert len(item["snippet"]) <= store.SNIPPET_CHARS
    assert item["categories"] == ["phishing_link"]
    assert item["url"] == "https://a.example/read/1"


class _FakeTable:
    def __init__(self, batches: list[list[dict]], fail_at: int | None = None) -> None:
        self.batches = batches
        self.fail_at = fail_at
        self.seen: list[list[dict]] = []

    def upsert(self, rows: list[dict], **_: Any) -> "_FakeTable":
        self.seen.append(rows)
        return self

    async def execute(self) -> Any:
        index = len(self.seen) - 1
        if self.fail_at is not None and index == self.fail_at:
            raise RuntimeError("postgrest down")

        class _Resp:
            data = self.batches[index] if index < len(self.batches) else []

        return _Resp()


class _FakeClient:
    def __init__(self, table: _FakeTable) -> None:
        self._table = table

    def table(self, _: str) -> _FakeTable:
        return self._table


@pytest.fixture
def fake_store(monkeypatch: pytest.MonkeyPatch):
    def _install(table: _FakeTable) -> None:
        monkeypatch.setattr(store, "_client", _FakeClient(table))

    return _install


def test_insert_reports_chunk_dan_duplikat(fake_store) -> None:
    rows = [store.to_row(_article(url=f"https://a.example/read/{i}")) for i in range(120)]
    table = _FakeTable(batches=[[{}] * 50, [{}] * 20, []])
    fake_store(table)

    import asyncio

    inserted, duplicates, failed = asyncio.run(store.insert_reports(rows))
    assert [len(b) for b in table.seen] == [50, 50, 20]
    assert (inserted, duplicates, failed) == (70, 50, 0)


def test_insert_reports_batch_gagal_tidak_menghentikan_run(fake_store) -> None:
    rows = [store.to_row(_article(url=f"https://a.example/read/{i}")) for i in range(100)]
    table = _FakeTable(batches=[[{}] * 50], fail_at=0)
    fake_store(table)

    import asyncio

    inserted, duplicates, failed = asyncio.run(store.insert_reports(rows))
    assert (inserted, duplicates, failed) == (0, 50, 50)
