"""Outbox job untuk bot Discord (`discord_bot_events`).

Modul `discord_bot_api_key` tidak punya akses database, jadi web/panel tidak bisa
langsung memerintahkan bot. Alurnya:

    panel /admin  --POST /api/discord/broadcast-->  backend enqueue job
    bot (polling) --POST /api/discord/outbox/claim-->  klaim 1 job pending
    bot           --POST /api/discord/outbox/{id}/finish-->  lapor selesai/gagal

Klaim memakai RPC `claim_discord_event` (FOR UPDATE SKIP LOCKED) agar dua bot
yang polling bersamaan tidak memproses job yang sama.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta
from typing import Any

from app.news_harvester import store

logger = logging.getLogger(__name__)

TABLE = "discord_bot_events"

PENDING = "pending"
PROCESSING = "processing"
DONE = "done"
FAILED = "failed"

# Job `processing` lebih lama dari ini dianggap bot mati di tengah jalan dan
# dikembalikan ke pending oleh klaim berikutnya.
STALE_AFTER = timedelta(minutes=2)

# Keluaran lama tidak perlu disimpan selamanya.
KEEP_DAYS = 7


def _now() -> datetime:
    return datetime.now(UTC)


def _iso(value: datetime) -> str:
    return value.isoformat(timespec="seconds")


async def enqueue(guild_id: str) -> dict[str, Any]:
    """Tambahkan job `news_broadcast`. Pemanggil sudah memastikan tidak ada
    job pending untuk guild yang sama."""
    sb = store.get_store()
    if sb is None:
        raise RuntimeError("Supabase tidak dikonfigurasi.")
    response = await (
        sb.table(TABLE)
        .insert({"guild_id": guild_id, "kind": "news_broadcast"})
        .execute()
    )
    data = response.data or []
    return data[0] if data else {"guild_id": guild_id, "status": PENDING}


async def count_recent(guild_id: str, window: timedelta) -> int:
    """Jumlah job guild ini sejak `window` lalu — dasar rate limit tombol panel."""
    sb = store.get_store()
    if sb is None:
        return 0
    since = _iso(_now() - window)
    response = await (
        sb.table(TABLE)
        .select("id", count="exact")
        .eq("guild_id", guild_id)
        .gte("created_at", since)
        .limit(1)
        .execute()
    )
    return int(response.count or 0)


async def has_pending(guild_id: str) -> bool:
    """Job yang masih antri/diproses untuk guild ini (cegah klik ganda)."""
    sb = store.get_store()
    if sb is None:
        return False
    response = await (
        sb.table(TABLE)
        .select("id")
        .eq("guild_id", guild_id)
        .in_("status", [PENDING, PROCESSING])
        .limit(1)
        .execute()
    )
    return bool(response.data)


async def claim_next() -> dict[str, Any] | None:
    """Klaim satu job pending; None bila antrian kosong."""
    sb = store.get_store()
    if sb is None:
        raise RuntimeError("Supabase tidak dikonfigurasi.")

    await _requeue_stale(sb)
    await _purge_old(sb)

    result = await sb.rpc("claim_discord_event", {}).execute()
    rows = _as_rows(result.data)
    return rows[0] if rows else None


async def finish(event_id: int, error: str | None) -> dict[str, Any] | None:
    """Tandai job selesai. `error` kosong = sukses."""
    sb = store.get_store()
    if sb is None:
        raise RuntimeError("Supabase tidak dikonfigurasi.")
    row = {
        "status": FAILED if error else DONE,
        "error": error[:1000] if error else None,
        "updated_at": _iso(_now()),
    }
    response = (
        await sb.table(TABLE)
        .update(row)
        .eq("id", event_id)
        .in_("status", [PENDING, PROCESSING])
        .execute()
    )
    data = response.data or []
    return data[0] if data else None


async def _requeue_stale(sb: Any) -> None:
    cutoff = _iso(_now() - STALE_AFTER)
    try:
        await (
            sb.table(TABLE)
            .update({"status": PENDING, "updated_at": _iso(_now())})
            .eq("status", PROCESSING)
            .lt("updated_at", cutoff)
            .execute()
        )
    except Exception as exc:  # noqa: BLE001 - best effort, jangan blokir klaim
        logger.warning("Gagal mengembalikan job basi ke pending: %s", exc)


async def _purge_old(sb: Any) -> None:
    cutoff = _iso(_now() - timedelta(days=KEEP_DAYS))
    try:
        await (
            sb.table(TABLE)
            .delete()
            .in_("status", [DONE, FAILED])
            .lt("created_at", cutoff)
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Gagal membersihkan job lama: %s", exc)


def _as_rows(data: Any) -> list[dict[str, Any]]:
    """RPC `returns setof` bisa dibungkus list; insert/update mengembalikan list."""
    if isinstance(data, list):
        return [row for row in data if isinstance(row, dict)]
    if isinstance(data, dict):
        return [data]
    return []
