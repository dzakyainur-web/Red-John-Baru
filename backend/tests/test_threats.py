"""Panel admin: sanitasi IOC, bentuk baris create/update, soft delete."""

from __future__ import annotations

import asyncio
from typing import Any

import pytest
from pydantic import ValidationError

from app import threats_store
from app.news_harvester.extract import sanitize_indicator, sanitize_indicators
from app.news_harvester import store
from app.schemas import ThreatCreate, ThreatUpdate


def test_sanitize_url_didefang_dan_host_diblokir_dibuang() -> None:
    assert sanitize_indicator("url", "https://situs-penipu.xyz/login") == {
        "type": "url",
        "value": "hxxps://situs-penipu[.]xyz/login",
    }
    assert sanitize_indicator("url", "https://www.detik.com/berita/1") is None
    assert sanitize_indicator("url", "http://tanpa-tld/abc") is None
    assert sanitize_indicator("url", "bukan url") is None


def test_sanitize_phone_dan_apk() -> None:
    assert sanitize_indicator("phone", "0812-3456-7890") == {
        "type": "phone",
        "value": "+6281234567890",
    }
    assert sanitize_indicator("phone", "123") is None
    assert sanitize_indicator("apk", "penipu-mod.apk") == {
        "type": "apk",
        "value": "penipu-mod.apk",
    }
    assert sanitize_indicator("apk", "bukan-apk.exe") is None


def test_sanitize_bank_account() -> None:
    assert sanitize_indicator("bank_account", "123-456-7890") == {
        "type": "bank_account",
        "value": "1234567890",
    }
    assert sanitize_indicator("bank_account", "12") is None


def test_sanitize_indicators_buang_tipe_asing_dan_duplikat() -> None:
    items = [
        {"type": "url", "value": "hxxps://a[.]xyz/1"},
        {"type": "url", "value": "https://a.xyz/1"},
        {"type": "bank_account", "value": "123"},
        {"type": "phone", "value": "081200000000"},
    ]
    assert sanitize_indicators(items) == [
        {"type": "url", "value": "hxxps://a[.]xyz/1"},
        {"type": "phone", "value": "+6281200000000"},
    ]


def test_create_row_selalu_verified_dan_user_report() -> None:
    row = threats_store.build_create_row(
        {
            "title": "   Modus pinjol <b>ilegal</b> via WA   ",
            "category": "pinjol_ilegal",
            "description": "Pelaku menagih dengan ancaman.",
            "scammer_indicators": [{"type": "phone", "value": "0812 3456 7890"}],
            "source_url": None,
        }
    )
    assert row["status"] == "verified"
    assert row["source_type"] == "user_report"
    assert row["source_url"] is None
    assert row["title"] == "Modus pinjol ilegal via WA"
    assert len(row["id"]) == 12
    assert row["scammer_indicators"] == [{"type": "phone", "value": "+6281234567890"}]


def test_update_row_hanya_field_yang_dikirim() -> None:
    row = threats_store.build_update_row({"status": "verified"})
    assert set(row) == {"status", "updated_at"}
    assert row["status"] == "verified"


def test_archive_row_status_rejected() -> None:
    row = threats_store.build_update_row({"status": "rejected"})
    assert row["status"] == "rejected"
    assert "id" not in row


def test_threat_update_menolak_status_asing_dan_source_url_non_http() -> None:
    with pytest.raises(ValidationError):
        ThreatUpdate(status="deleted")
    with pytest.raises(ValidationError):
        ThreatUpdate(source_url="ftp://x.xyz/a")
    assert ThreatUpdate(status="VERIFIED").status == "verified"


def test_threat_create_menolak_judul_pendek() -> None:
    with pytest.raises(ValidationError):
        ThreatCreate(title="pendek", category="fake_job", description="x")


def test_to_threat_out_fallback_source_url_null() -> None:
    out = threats_store.to_threat_out(
        {
            "id": "abcdef123456",
            "title": "Judul laporan manual",
            "category": "phishing_link",
            "description": "Isi",
            "scammer_indicators": [],
            "source_url": None,
            "source_media": "laporan-admin",
            "source_type": "user_report",
            "status": "verified",
            "published_at": None,
            "created_at": "2026-11-07T01:00:00+00:00",
            "updated_at": "2026-11-07T01:00:00+00:00",
        }
    )
    assert out["source_url"] is None
    assert out["source_type"] == "user_report"


class _FakeTable:
    """Merekam payload insert/update; cukup untuk menguji kontrak store."""

    def __init__(self) -> None:
        self.inserted: list[dict[str, Any]] = []
        self.updated: list[dict[str, Any] | None] = []
        self.deleted = False
        self.filters: list[tuple[str, str, Any]] = []
        self.rows: list[dict[str, Any]] = []

    def select(self, *_a: Any, **_kw: Any) -> "_FakeTable":
        return self

    def insert(self, row: dict[str, Any]) -> "_FakeTable":
        self.inserted.append(row)
        return self

    def update(self, row: dict[str, Any]) -> "_FakeTable":
        self.updated.append(row)
        return self

    def delete(self) -> "_FakeTable":
        self.deleted = True
        return self

    def eq(self, column: str, value: Any) -> "_FakeTable":
        self.filters.append(("eq", column, value))
        return self

    def ilike(self, column: str, value: Any) -> "_FakeTable":
        self.filters.append(("ilike", column, value))
        return self

    def order(self, *_a: Any, **_kw: Any) -> "_FakeTable":
        return self

    def range(self, *_a: Any) -> "_FakeTable":
        return self

    async def execute(self) -> Any:
        class _Resp:
            data = self.rows
            count = len(self.rows)

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


def test_archive_threat_tidak_pernah_delete(fake_store) -> None:
    table = _FakeTable()
    fake_store(table)
    asyncio.run(threats_store.archive_threat("abcdef123456"))
    assert table.deleted is False
    assert table.updated[0]["status"] == "rejected"
    assert table.filters == [("eq", "id", "abcdef123456")]


def test_create_threat_payload_ke_db(fake_store) -> None:
    table = _FakeTable()
    fake_store(table)
    asyncio.run(
        threats_store.create_threat(
            {
                "title": "Modus undian palsu berkedok kurir",
                "category": "giveaway_palsu",
                "description": "Korban diminta transfer biaya kirim.",
                "scammer_indicators": [],
                "source_url": None,
            }
        )
    )
    assert table.inserted[0]["status"] == "verified"
    assert table.inserted[0]["source_type"] == "user_report"


def test_list_threats_filter_aktif(fake_store) -> None:
    table = _FakeTable()
    fake_store(table)
    asyncio.run(
        threats_store.list_threats(
            limit=10,
            offset=0,
            status="pending",
            source_type="scraped",
            category="all",
            query="0812",
        )
    )
    assert ("eq", "status", "pending") in table.filters
    assert ("eq", "source_type", "scraped") in table.filters
    assert ("ilike", "search_text", "%0812%") in table.filters
    assert not any(f[1] == "category" for f in table.filters)
