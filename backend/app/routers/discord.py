"""Konfigurasi bot per Discord Guild, dikelola lewat backend.

Bot memvalidasi bahwa pemanggil adalah admin guild sebelum PATCH; backend
menyimpan berdasar `guild_id`.
"""

from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Response
from postgrest.exceptions import APIError

from app import bot_outbox, discord_store
from app.auth import require_bot_key
from app.news_harvester import store
from app.schemas import (
    BotEventFinishIn,
    BotEventOut,
    BroadcastQueuedOut,
    BroadcastRequest,
    GuildConfigOut,
    GuildConfigUpdate,
)

router = APIRouter(
    tags=["discord"],
    prefix="/discord",
    dependencies=[Depends(require_bot_key)],
)

# Batas tombol panel: maksimal 20 permintaan per guild dalam 5 menit.
_BROADCAST_WINDOW = timedelta(minutes=5)
_BROADCAST_MAX = 20


def _require_client() -> None:
    if store.get_store() is None:
        raise HTTPException(status_code=503, detail="Supabase tidak dikonfigurasi.")


def _translate(exc: APIError) -> HTTPException:
    if exc.code in {"42P01", "PGRST205"}:
        return HTTPException(
            status_code=503,
            detail="Tabel Discord belum ada. Jalankan backend/supabase/migrations/"
            "004_discord_bot.sql dan 005_discord_news_broadcast.sql di Supabase SQL Editor.",
        )
    if exc.code in {"42703", "PGRST204"}:
        return HTTPException(
            status_code=503,
            detail="Kolom baru Discord belum ada. Jalankan "
            "backend/supabase/migrations/005_discord_news_broadcast.sql di Supabase SQL Editor.",
        )
    if exc.code == "PGRST202":  # RPC claim_discord_event tidak ditemukan
        return HTTPException(
            status_code=503,
            detail="Fungsi claim_discord_event belum ada. Jalankan "
            "backend/supabase/migrations/005_discord_news_broadcast.sql di Supabase SQL Editor.",
        )
    return HTTPException(status_code=502, detail=f"Gagal mengakses database: {exc.code}")


@router.get("/config/{guild_id}", response_model=GuildConfigOut)
async def get_config(guild_id: str) -> GuildConfigOut:
    """Konfigurasi guild; guild belum dikonfigurasi mengembalikan default."""
    _require_client()
    try:
        row = await discord_store.get_config(guild_id)
    except APIError as exc:
        raise _translate(exc) from exc
    return GuildConfigOut(**discord_store.to_config_out(row, guild_id))


@router.patch("/config/{guild_id}", response_model=GuildConfigOut)
async def update_config(
    guild_id: str, payload: GuildConfigUpdate
) -> GuildConfigOut:
    """Ubah sebagian konfigurasi. Field tak dikirim tidak diubah."""
    _require_client()
    patch = payload.model_dump(exclude_unset=True)
    if not patch:
        raise HTTPException(status_code=422, detail="Tidak ada field yang diubah.")
    try:
        row = await discord_store.upsert_config(guild_id, patch)
    except APIError as exc:
        raise _translate(exc) from exc
    return GuildConfigOut(**discord_store.to_config_out(row, guild_id))


@router.get("/alert-channels", response_model=list[GuildConfigOut])
async def list_alert_channels() -> list[GuildConfigOut]:
    """Guild ber-channel alert — dipakai polling bot untuk tahu ke mana mengirim."""
    _require_client()
    try:
        rows = await discord_store.list_with_alert_channel()
    except APIError as exc:
        raise _translate(exc) from exc
    return [
        GuildConfigOut(**discord_store.to_config_out(row, row["guild_id"])) for row in rows
    ]


@router.get("/news-channels", response_model=list[GuildConfigOut])
async def list_news_channels() -> list[GuildConfigOut]:
    """Guild bertujuan berita. Bot memilih `news_channel_id`, fallback alert."""
    _require_client()
    try:
        rows = await discord_store.list_news_channels()
    except APIError as exc:
        raise _translate(exc) from exc
    return [
        GuildConfigOut(**discord_store.to_config_out(row, row["guild_id"])) for row in rows
    ]


# --- Outbox: panel admin -> backend -> bot polling ---------------------------


@router.post("/broadcast", response_model=BroadcastQueuedOut, status_code=202)
async def queue_broadcast(payload: BroadcastRequest) -> BroadcastQueuedOut:
    """Enqueue job "post 5 berita acak" untuk guild. Bot mengambilnya saat polling."""
    _require_client()
    guild_id = payload.guild_id
    try:
        if await bot_outbox.has_pending(guild_id):
            raise HTTPException(
                status_code=409,
                detail="Masih ada permintaan yang diproses bot. Tunggu beberapa detik.",
            )
        if await bot_outbox.count_recent(guild_id, _BROADCAST_WINDOW) >= _BROADCAST_MAX:
            raise HTTPException(
                status_code=429,
                detail="Terlalu banyak permintaan berita ke Discord. Coba lagi beberapa menit.",
            )
        await bot_outbox.enqueue(guild_id)
    except APIError as exc:
        raise _translate(exc) from exc
    return BroadcastQueuedOut()


@router.post("/outbox/claim", response_model=BotEventOut)
async def claim_event() -> Response | BotEventOut:
    """Bot mengambil satu job pending. 204 bila antrian kosong."""
    _require_client()
    try:
        job = await bot_outbox.claim_next()
    except APIError as exc:
        raise _translate(exc) from exc
    if job is None:
        return Response(status_code=204)
    return BotEventOut(id=int(job["id"]), guild_id=job["guild_id"], kind=job["kind"])


@router.post("/outbox/{event_id}/finish", status_code=204)
async def finish_event(event_id: int, payload: BotEventFinishIn) -> Response:
    """Bot melaporkan hasil. `error` kosong = sukses. 404 bila job sudah tidak aktif."""
    _require_client()
    try:
        row = await bot_outbox.finish(event_id, payload.error)
    except APIError as exc:
        raise _translate(exc) from exc
    if row is None:
        raise HTTPException(status_code=404, detail="Job tidak ditemukan atau sudah selesai.")
    return Response(status_code=204)
