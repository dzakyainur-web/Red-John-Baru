"""Akses Supabase untuk panel admin: list/filter, create manual, update, soft delete.

Memakai client singleton dari news_harvester.store — satu koneksi per proses.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from app.news_harvester import store
from app.news_harvester.extract import (
    article_id,
    clean_text,
    sanitize_indicators,
    truncate,
)

logger = logging.getLogger(__name__)

TABLE = "scam_reports"
COLUMNS = (
    "id,title,category,description,scammer_indicators,source_url,source_media,"
    "source_type,status,published_at,created_at,updated_at"
)


def _now() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")


def _escape_like(query: str) -> str:
    """PostgREST `or_` memakai , . * ( ) — buang agar tidak jadi operator."""
    return "".join(ch for ch in query if ch not in ",.*()%\\").strip()


async def list_threats(
    *,
    limit: int,
    offset: int,
    status: str = "all",
    source_type: str = "all",
    category: str = "all",
    query: str | None = None,
) -> tuple[list[dict[str, Any]], int]:
    """Daftar ancaman lintas status/sumber. Return (rows, total)."""
    sb = store.get_store()
    if sb is None:
        return [], 0
    builder = sb.table(TABLE).select(COLUMNS, count="exact")
    if status != "all":
        builder = builder.eq("status", status)
    if source_type != "all":
        builder = builder.eq("source_type", source_type)
    if category != "all":
        builder = builder.eq("category", category)
    needle = _escape_like(query or "")
    if needle:
        builder = builder.ilike("search_text", f"%{needle}%")
    response = await builder.order("created_at", desc=True).range(
        offset, offset + limit - 1
    ).execute()
    return list(response.data or []), int(response.count or 0)


def build_create_row(payload: dict[str, Any]) -> dict[str, Any]:
    """Input admin -> baris siap insert. Selalu verified + user_report."""
    source_url = payload.get("source_url") or None
    return {
        "id": article_id(source_url or f"manual:{uuid4()}"),
        "title": truncate(clean_text(payload["title"]), 300),
        "category": payload["category"],
        "description": truncate(clean_text(payload["description"]), 1200),
        "scammer_indicators": sanitize_indicators(payload.get("scammer_indicators") or []),
        "source_url": source_url,
        "source_media": "laporan-admin",
        "source_type": "user_report",
        "status": "verified",
        "published_at": None,
    }


async def create_threat(payload: dict[str, Any]) -> dict[str, Any] | None:
    sb = store.get_store()
    if sb is None:
        return None
    row = build_create_row(payload)
    response = await sb.table(TABLE).insert(row).execute()
    data = response.data or []
    return data[0] if data else row


def build_update_row(patch: dict[str, Any]) -> dict[str, Any]:
    """PATCH parsial -> kolom yang berubah saja. Nilai None (field tak dikirim) dilewati."""
    row: dict[str, Any] = {"updated_at": _now()}
    if patch.get("title") is not None:
        row["title"] = truncate(clean_text(patch["title"]), 300)
    if patch.get("category") is not None:
        row["category"] = patch["category"]
    if patch.get("description") is not None:
        row["description"] = truncate(clean_text(patch["description"]), 1200)
    if patch.get("scammer_indicators") is not None:
        row["scammer_indicators"] = sanitize_indicators(patch["scammer_indicators"])
    # Kunci hadir = admin sengaja mengosongkan tautan sumber.
    if "source_url" in patch:
        row["source_url"] = patch["source_url"]
    if patch.get("status") is not None:
        row["status"] = patch["status"]
    return row


async def update_threat(threat_id: str, patch: dict[str, Any]) -> dict[str, Any] | None:
    sb = store.get_store()
    if sb is None:
        return None
    response = await (
        sb.table(TABLE).update(build_update_row(patch)).eq("id", threat_id).execute()
    )
    data = response.data or []
    return data[0] if data else None


async def archive_threat(threat_id: str) -> dict[str, Any] | None:
    """Soft delete: status -> rejected. Baris tetap tersimpan sebagai sampel latih."""
    return await update_threat(threat_id, {"status": "rejected"})


def to_threat_out(row: dict[str, Any]) -> dict[str, Any]:
    """Baris DB -> bentuk `ThreatOut` frontend."""
    return {
        "id": row["id"],
        "title": row["title"],
        "category": row["category"],
        "description": row.get("description") or "",
        "scammer_indicators": row.get("scammer_indicators") or [],
        "source_url": row.get("source_url") or None,
        "source_media": row.get("source_media") or "",
        "source_type": row.get("source_type") or "scraped",
        "status": row.get("status") or "pending",
        "published_at": row.get("published_at"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }
