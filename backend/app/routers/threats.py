"""Panel admin: list/filter, tambah manual, triage, arsip (soft delete)."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Query
from postgrest.exceptions import APIError

from app import threats_store
from app.news_harvester import store
from app.schemas import (
    CategoryFilter,
    SourceFilter,
    StatusFilter,
    ThreatCreate,
    ThreatListOut,
    ThreatOut,
    ThreatUpdate,
)

router = APIRouter(tags=["threats"], prefix="/threats")


def _require_client() -> None:
    if store.get_store() is None:
        raise HTTPException(status_code=503, detail="Supabase tidak dikonfigurasi.")


def _translate(exc: APIError) -> HTTPException:
    """Constraint DB -> kode HTTP yang bisa ditindaklanjuti admin."""
    if exc.code == "23505":
        return HTTPException(status_code=409, detail="source_url sudah dipakai laporan lain.")
    if exc.code == "42703":
        # Kolom 002 belum ada: skema live masih 001. Bukan salah input admin.
        return HTTPException(
            status_code=503,
            detail="Skema database belum dimigrasi. Jalankan "
            "backend/supabase/migrations/002_threat_admin.sql di Supabase SQL Editor.",
        )
    return HTTPException(status_code=502, detail=f"Gagal mengakses database: {exc.code}")


@router.get("", response_model=ThreatListOut)
async def list_threats(
    status: StatusFilter = Query(default="all"),
    source_type: SourceFilter = Query(default="all"),
    category: CategoryFilter = Query(default="all"),
    q: str | None = Query(default=None, max_length=120),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> ThreatListOut:
    _require_client()
    try:
        rows, total = await threats_store.list_threats(
            limit=limit,
            offset=offset,
            status=status,
            source_type=source_type,
            category=category,
            query=q,
        )
    except APIError as exc:
        raise _translate(exc) from exc
    return ThreatListOut(
        items=[ThreatOut(**threats_store.to_threat_out(row)) for row in rows],
        total=total,
        limit=limit,
        offset=offset,
        configured=True,
    )


@router.post("", response_model=ThreatOut, status_code=201)
async def create_threat(payload: ThreatCreate) -> ThreatOut:
    """Tambah modus manual — langsung VERIFIED dan tampil di feed publik."""
    _require_client()
    try:
        row = await threats_store.create_threat(payload.model_dump())
    except APIError as exc:
        raise _translate(exc) from exc
    if row is None:
        raise HTTPException(status_code=503, detail="Supabase tidak dikonfigurasi.")
    return ThreatOut(**threats_store.to_threat_out(row))


@router.patch("/{threat_id}", response_model=ThreatOut)
async def update_threat(threat_id: str, payload: ThreatUpdate) -> ThreatOut:
    """Edit / sanitasi. `{"status": "verified"}` = one-click approve."""
    _require_client()
    # exclude_unset: admin boleh mengirim null eksplisit untuk mengosongkan source_url.
    patch: dict[str, Any] = payload.model_dump(exclude_unset=True)
    if "scammer_indicators" in patch and payload.scammer_indicators is not None:
        # Daftar kosong sah: admin menghapus semua IOC.
        patch["scammer_indicators"] = [
            item.model_dump() for item in payload.scammer_indicators
        ]
    if not patch:
        raise HTTPException(status_code=422, detail="Tidak ada field yang diubah.")
    try:
        row = await threats_store.update_threat(threat_id, patch)
    except APIError as exc:
        raise _translate(exc) from exc
    if row is None:
        raise HTTPException(status_code=404, detail="Ancaman tidak ditemukan.")
    return ThreatOut(**threats_store.to_threat_out(row))


@router.delete("/{threat_id}", response_model=ThreatOut)
async def archive_threat(threat_id: str) -> ThreatOut:
    """Soft delete: status -> rejected, data tetap tersimpan untuk sampel latih."""
    _require_client()
    try:
        row = await threats_store.archive_threat(threat_id)
    except APIError as exc:
        raise _translate(exc) from exc
    if row is None:
        raise HTTPException(status_code=404, detail="Ancaman tidak ditemukan.")
    return ThreatOut(**threats_store.to_threat_out(row))
