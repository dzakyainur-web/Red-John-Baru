"""Konfigurasi guild: default, bentuk respons, dan patch upsert parsial."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app import discord_store
from app.schemas import GuildConfigUpdate


def test_default_config() -> None:
    out = discord_store.to_config_out(None, "42")
    assert out == {
        "guild_id": "42",
        "alert_channel_id": None,
        "news_channel_id": None,
        "protection_enabled": True,
        "notification_categories": [],
        "updated_at": None,
    }


def test_to_config_out_salin_list() -> None:
    row = {
        "guild_id": "42",
        "alert_channel_id": "99",
        "protection_enabled": False,
        "notification_categories": ["phishing_link"],
        "updated_at": "2026-11-08T00:00:00+00:00",
    }
    out = discord_store.to_config_out(row, "42")
    assert out["notification_categories"] == ["phishing_link"]
    assert out["protection_enabled"] is False


def test_build_upsert_hanya_field_dikirim() -> None:
    row = discord_store.build_upsert_row("42", {"protection_enabled": False})
    assert set(row) == {"guild_id", "updated_at", "protection_enabled"}
    assert row["protection_enabled"] is False


def test_alert_channel_none_dianggap_dikirim_untuk_mengosongkan() -> None:
    row = discord_store.build_upsert_row("42", {"alert_channel_id": None})
    assert row["alert_channel_id"] is None


def test_alert_channel_harus_angka() -> None:
    with pytest.raises(ValidationError):
        GuildConfigUpdate(alert_channel_id="bukan-angka")


def test_news_channel_patch() -> None:
    row = discord_store.build_upsert_row("42", {"news_channel_id": "123"})
    assert row["news_channel_id"] == "123"
    assert "alert_channel_id" not in row
    with pytest.raises(ValidationError):
        GuildConfigUpdate(news_channel_id="bukan-angka")


def test_to_config_out_news_channel() -> None:
    out = discord_store.to_config_out({"guild_id": "42", "news_channel_id": "5"}, "42")
    assert out["news_channel_id"] == "5"


def test_model_dump_exclude_unset_hanya_field_dikirim() -> None:
    patch = GuildConfigUpdate(alert_channel_id=None).model_dump(exclude_unset=True)
    assert patch == {"alert_channel_id": None}
