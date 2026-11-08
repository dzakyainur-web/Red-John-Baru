"""Akses tabel `discord_guild_config` — konfigurasi bot per Discord Guild.

Selalu lewat backend: bot tidak pernah menyentuh Supabase langsung.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Any

from app.news_harvester import store

logger = logging.getLogger(__name__)

TABLE = "discord_guild_config"
COLUMNS = "guild_id,alert_channel_id,protection_enabled,notification_categories,updated_at"


def _now() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")


def default_config(guild_id: str) -> dict[str, Any]:
    return {
        "guild_id": guild_id,
        "alert_channel_id": None,
        "protection_enabled": True,
        "notification_categories": [],
        "updated_at": None,
    }


def to_config_out(row: dict[str, Any] | None, guild_id: str) -> dict[str, Any]:
    """Baris DB -> bentuk respons. Belum ada baris = konfigurasi default."""
    if not row:
        return default_config(guild_id)
    return {
        "guild_id": row.get("guild_id") or guild_id,
        "alert_channel_id": row.get("alert_channel_id") or None,
        "protection_enabled": bool(row.get("protection_enabled", True)),
        "notification_categories": list(row.get("notification_categories") or []),
        "updated_at": row.get("updated_at"),
    }


async def get_config(guild_id: str) -> dict[str, Any] | None:
    sb = store.get_store()
    if sb is None:
        return None
    response = await (
        sb.table(TABLE).select(COLUMNS).eq("guild_id", guild_id).limit(1).execute()
    )
    data = response.data or []
    return data[0] if data else None


def build_upsert_row(guild_id: str, patch: dict[str, Any]) -> dict[str, Any]:
    """Patch parsial -> baris upsert. Field None berarti 'tidak dikirim'."""
    row: dict[str, Any] = {"guild_id": guild_id, "updated_at": _now()}
    # Kunci hadir = sengaja mengosongkan channel alert.
    if "alert_channel_id" in patch:
        row["alert_channel_id"] = patch["alert_channel_id"]
    if patch.get("protection_enabled") is not None:
        row["protection_enabled"] = bool(patch["protection_enabled"])
    if patch.get("notification_categories") is not None:
        row["notification_categories"] = list(patch["notification_categories"])
    return row


async def upsert_config(guild_id: str, patch: dict[str, Any]) -> dict[str, Any] | None:
    sb = store.get_store()
    if sb is None:
        return None
    row = build_upsert_row(guild_id, patch)
    response = await sb.table(TABLE).upsert(row, on_conflict="guild_id").execute()
    data = response.data or []
    return data[0] if data else row


async def list_with_alert_channel() -> list[dict[str, Any]]:
    """Guild yang mengaktifkan notifikasi — dipakai service alert bot via API."""
    sb = store.get_store()
    if sb is None:
        return []
    response = await sb.table(TABLE).select(COLUMNS).not_.is_(
        "alert_channel_id", "null"
    ).execute()
    return list(response.data or [])
