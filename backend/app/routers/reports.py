"""Laporan komunitas (website & Discord): selalu masuk antrian `pending`.

Moderasi tetap di panel admin (`/api/threats`). Router ini hanya membuat laporan
dan memberi ringkasan status kepada pelapor aslinya.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from postgrest.exceptions import APIError

from app import threats_store
from app.auth import require_bot_key
from app.news_harvester import store
from app.news_harvester.extract import sanitize_indicator
from app.schemas import ReportCreate, ReportStatusOut

router = APIRouter(
    tags=["reports"],
    prefix="/reports",
    dependencies=[Depends(require_bot_key)],
)

# Batas antrean agar satu pengguna tidak membanjiri moderasi.
_MAX_ACTIVE_REPORTS = 5
# Urutan tebakan tipe IOC untuk `target`. Satu target -> maksimal satu indikator.
_INDICATOR_ORDER = ("url", "phone", "bank_account", "apk")


def _require_client() -> None:
    if store.get_store() is None:
        raise HTTPException(status_code=503, detail="Supabase tidak dikonfigurasi.")


def _translate(exc: APIError) -> HTTPException:
    if exc.code == "42703":
        return HTTPException(
            status_code=503,
            detail="Skema database belum dimigrasi. Jalankan "
            "backend/supabase/migrations/004_discord_bot.sql di Supabase SQL Editor.",
        )
    return HTTPException(status_code=502, detail=f"Gagal mengakses database: {exc.code}")


def target_to_indicators(target: str | None) -> list[dict[str, str]]:
    """Target pelaku -> satu IOC tervalidasi (defanged/normalisasi), atau kosong."""
    if not target:
        return []
    for kind in _INDICATOR_ORDER:
        cleaned = sanitize_indicator(kind, target)
        if cleaned is not None:
            return [cleaned]
    return []


@router.post("", response_model=ReportStatusOut, status_code=201)
async def create_report(payload: ReportCreate) -> ReportStatusOut:
    """Simpan laporan sebagai `pending`. Admin memutuskan verified/rejected."""
    _require_client()
    reporter = payload.reporter
    try:
        active = await threats_store.count_active_reports(
            platform=reporter.platform, reporter_id=reporter.id
        )
    except APIError as exc:
        raise _translate(exc) from exc
    if active >= _MAX_ACTIVE_REPORTS:
        raise HTTPException(
            status_code=429,
            detail=f"Laporan yang masih menunggu tinjauan sudah {active}. "
            "Tunggu hingga ditinjau sebelum mengirim lagi.",
        )

    row_input = {
        "title": payload.title,
        "category": payload.category,
        "description": payload.description,
        "scammer_indicators": target_to_indicators(payload.target),
        "reporter": reporter.model_dump(),
    }
    try:
        row = await threats_store.create_report(row_input)
    except APIError as exc:
        raise _translate(exc) from exc
    if row is None:
        raise HTTPException(status_code=503, detail="Gagal menyimpan laporan.")
    return ReportStatusOut(
        id=row["id"],
        category=row["category"],
        status=row["status"],
        created_at=row.get("created_at"),
        updated_at=row.get("updated_at"),
    )


@router.get("/{report_id}", response_model=ReportStatusOut)
async def get_report_status(
    report_id: str,
    reporter_id: Annotated[str, Query(min_length=1, max_length=64)],
    platform: Annotated[str, Query(pattern="^(discord|web)$")] = "discord",
) -> ReportStatusOut:
    """Status untuk pelapor aslinya. ID tidak ada dan reporter salah -> sama-sama 404."""
    _require_client()
    try:
        row = await threats_store.get_report_for_reporter(
            report_id, platform=platform, reporter_id=reporter_id
        )
    except APIError as exc:
        raise _translate(exc) from exc
    if row is None:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan.")
    return ReportStatusOut(**row)
