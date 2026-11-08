"""Laporan publik: selalu pending, identitas pelapor tersimpan, status tidak bocor."""

from __future__ import annotations

import asyncio
from typing import Any

import pytest

from app import threats_store
from app.news_harvester import store
from app.routers.reports import target_to_indicators


def _payload(**over: Any) -> dict[str, Any]:
    base = {
        "title": "Laporan Discord: phishing_link — contoh[.]xyz",
        "category": "phishing_link",
        "description": "Link login palsu minta OTP lewat WhatsApp.",
        "scammer_indicators": [{"type": "phone", "value": "0812-3456-7890"}],
        "reporter": {"platform": "discord", "id": "123", "name": "budi"},
    }
    base.update(over)
    return base


def test_build_report_row_selalu_pending_dan_platform_server() -> None:
    row = threats_store.build_report_row(_payload())
    assert row["status"] == "pending"
    assert row["source_media"] == "discord"
    assert row["source_type"] == "user_report"
    assert row["reporter_platform"] == "discord"
    assert row["reporter_id"] == "123"
    assert row["reporter_name"] == "budi"
    assert row["published_at"] is None
    assert row["source_url"] is None
    assert len(row["id"]) == 12


def test_build_report_row_tidak_memakai_media_laporan_admin() -> None:
    # Regresi: jalur laporan tidak boleh memakai build_create_row (verified).
    row = threats_store.build_report_row(_payload(reporter={"platform": "web", "id": "u1"}))
    assert row["status"] != "verified"
    assert row["source_media"] != "laporan-admin"
    assert row["reporter_name"] is None


def test_target_to_indicators() -> None:
    assert target_to_indicators("https://penipu.xyz/login") == [
        {"type": "url", "value": "hxxps://penipu[.]xyz/login"}
    ]
    assert target_to_indicators("0812-3456-7890") == [
        {"type": "phone", "value": "+6281234567890"}
    ]
    assert target_to_indicators("123-456-7890") == [
        {"type": "bank_account", "value": "1234567890"}
    ]
    assert target_to_indicators(None) == []
    assert target_to_indicators("bukan target") == []


class _Table:
    def __init__(self) -> None:
        self.filters: list[tuple[str, str, Any]] = []
        self.row: dict[str, Any] | None = None

    def select(self, *_a: Any, **_k: Any) -> _Table:
        return self

    def eq(self, key: str, value: str) -> _Table:
        self.filters.append(("eq", key, value))
        return self

    def limit(self, _n: int) -> _Table:
        return self

    async def execute(self) -> Any:
        data = [self.row] if self.row else []

        class _R:
            pass

        result = _R()
        result.data = data  # type: ignore[attr-defined]
        return result


class _Store:
    def __init__(self, table: _Table) -> None:
        self.table_ = table

    def table(self, _name: str) -> _Table:
        return self.table_


def test_get_report_filter_id_dan_pelapor(monkeypatch: pytest.MonkeyPatch) -> None:
    table = _Table()
    table.row = {
        "id": "abc",
        "category": "phishing_link",
        "status": "pending",
        "created_at": "2026-11-08T00:00:00+00:00",
        "updated_at": None,
    }
    monkeypatch.setattr(store, "get_store", lambda: _Store(table))
    row = asyncio.run(
        threats_store.get_report_for_reporter("abc", platform="discord", reporter_id="123")
    )
    assert row is not None and row["status"] == "pending"
    assert ("eq", "id", "abc") in table.filters
    assert ("eq", "reporter_platform", "discord") in table.filters
    assert ("eq", "reporter_id", "123") in table.filters
