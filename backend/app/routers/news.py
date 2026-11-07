from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.news_harvester import store
from app.schemas import NewsItemOut, NewsListOut

router = APIRouter(tags=["news"])

NEWS_CATEGORIES = (
    "fake_job",
    "phishing_link",
    "giveaway_palsu",
    "malware_apk",
    "pinjol_ilegal",
)


@router.get("/news", response_model=NewsListOut)
async def list_news(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    category: str | None = Query(default=None),
    source: str | None = Query(default=None),
    q: str | None = Query(default=None, max_length=120),
) -> NewsListOut:
    """Feed berita penipuan terverifikasi untuk halaman /berita.

    Bila Supabase belum dikonfigurasi, kembalikan daftar kosong (`configured: false`)
    alih-alih error — halaman berita tidak boleh rusak karena DB mati.
    """
    if category and category not in NEWS_CATEGORIES:
        raise HTTPException(status_code=422, detail="Kategori tidak dikenal.")

    if store.get_store() is None:
        return NewsListOut(
            items=[], total=0, limit=limit, offset=offset, updated_at=None, configured=False
        )

    try:
        rows, total = await store.list_reports(
            limit=limit, offset=offset, category=category, media=source, query=q
        )
    except Exception:  # noqa: BLE001 - feed kosong lebih baik daripada 500
        return NewsListOut(
            items=[], total=0, limit=limit, offset=offset, updated_at=None, configured=True
        )

    items = [NewsItemOut(**store.to_news_item(row)) for row in rows]
    return NewsListOut(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
        updated_at=items[0].published_at if items else None,
        configured=True,
    )
