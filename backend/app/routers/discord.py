"""Konfigurasi bot per Discord Guild, dikelola lewat backend.

Bot memvalidasi bahwa pemanggil adalah admin guild sebelum PATCH; backend
menyimpan berdasar `guild_id`.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from postgrest.exceptions import APIError

from app import discord_store
from app.auth import require_bot_key
from app.news_harvester import store
from app.schemas import GuildConfigOut, GuildConfigUpdate

router = APIRouter(
    tags=["discord"],
    prefix="/discord",
    dependencies=[Depends(require_bot_key)],
)


def _require_client() -> None:
    if store.get_store() is None:
        raise HTTPException(status_code=503, detail="Supabase tidak dikonfigurasi.")


def _translate(exc: APIError) -> HTTPException:
    if exc.code == "42P01":
        return HTTPException(
            status_code=503,
            detail="Tabel discord_guild_config belum ada. Jalankan "
            "backend/supabase/migrations/004_discord_bot.sql di Supabase SQL Editor.",
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
