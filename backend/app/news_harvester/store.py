"""Akses Supabase: satu AsyncClient per proses, upsert batch, lock run, query feed."""

from __future__ import annotations

import logging
from typing import Any

from supabase import AsyncClient, create_async_client

from app.config import settings
from app.news_harvester.extract import MAX_DESCRIPTION, article_id, truncate

logger = logging.getLogger(__name__)

TABLE = "scam_reports"
BATCH_SIZE = 50
SNIPPET_CHARS = 280

_client: AsyncClient | None = None


async def init_store() -> AsyncClient | None:
    """Buat client sekali saat startup. Env tidak lengkap -> None (API tetap jalan)."""
    global _client
    if _client is not None:
        return _client
    if not settings.supabase_url or not settings.supabase_service_key:
        logger.warning(
            "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY kosong — news harvester nonaktif."
        )
        return None
    try:
        _client = await create_async_client(
            settings.supabase_url, settings.supabase_service_key
        )
        logger.info("Supabase client siap untuk news harvester.")
    except Exception as exc:  # noqa: BLE001 - jangan gagalkan startup
        logger.warning("Gagal membuat Supabase client: %s", exc)
        _client = None
    return _client


def get_store() -> AsyncClient | None:
    return _client


async def close_store() -> None:
    global _client
    if _client is None:
        return
    try:
        await _client.postgrest.aclose()
    except Exception as exc:  # noqa: BLE001 - shutdown tidak boleh melempar
        logger.debug("Penutupan Supabase client dilewati: %s", exc)
    _client = None


async def acquire_lock(ttl_minutes: int) -> bool:
    """Lock lintas-replica; satu statement di DB -> hanya satu pemegang."""
    sb = get_store()
    if sb is None:
        return False
    try:
        result = await sb.rpc(
            "acquire_news_run_lock", {"p_ttl": f"{ttl_minutes} minutes"}
        ).execute()
        return result.data is True
    except Exception as exc:  # noqa: BLE001 - gagal lock = jangan scraping
        logger.warning("Gagal mengambil lock harvest: %s", exc)
        return False


async def release_lock() -> None:
    sb = get_store()
    if sb is None:
        return
    try:
        await sb.rpc("release_news_run_lock", {}).execute()
    except Exception as exc:  # noqa: BLE001
        logger.warning("Gagal melepas lock harvest: %s", exc)


def to_row(article: dict[str, Any]) -> dict[str, Any]:
    """Artikel hasil parser -> baris tabel scam_reports."""
    url = article["url"]
    description = truncate(article.get("description") or article.get("title") or "")
    return {
        "id": article_id(url),
        "title": truncate(article["title"], 300),
        "category": article["category"],
        "description": description[:MAX_DESCRIPTION],
        "scammer_indicators": article.get("iocs") or [],
        "source_url": url,
        "source_media": article["media"],
        "status": "verified",
        "published_at": article.get("published_at"),
    }


async def insert_reports(rows: list[dict[str, Any]]) -> tuple[int, int, int]:
    """Upsert dengan `ON CONFLICT (source_url) DO NOTHING`.

    Return (inserted, duplicates, failed). `len(resp.data)` = baris yang benar-benar
    masuk, jadi selisihnya adalah duplikat yang dilewati.
    """
    sb = get_store()
    if sb is None or not rows:
        return 0, 0, 0

    inserted = duplicates = failed = 0
    for start in range(0, len(rows), BATCH_SIZE):
        batch = rows[start : start + BATCH_SIZE]
        try:
            response = await (
                sb.table(TABLE)
                .upsert(batch, on_conflict="source_url", ignore_duplicates=True)
                .execute()
            )
        except Exception as exc:  # noqa: BLE001 - satu batch gagal tidak menjatuhkan run
            failed += len(batch)
            logger.warning(
                "upsert batch %d gagal (%d baris): %s", start // BATCH_SIZE, len(batch), exc
            )
            continue
        created = len(response.data or [])
        inserted += created
        duplicates += len(batch) - created
    return inserted, duplicates, failed


async def list_reports(
    *,
    limit: int,
    offset: int,
    category: str | None = None,
    media: str | None = None,
    query: str | None = None,
) -> tuple[list[dict[str, Any]], int]:
    """Feed berita terverifikasi, terbaru dulu. Return (rows, total)."""
    sb = get_store()
    if sb is None:
        return [], 0
    builder = (
        sb.table(TABLE)
        .select(
            "id,title,description,category,source_url,source_media,"
            "published_at,created_at",
            count="exact",
        )
        .eq("status", "verified")
    )
    if category:
        builder = builder.eq("category", category)
    if media:
        builder = builder.eq("source_media", media)
    if query:
        builder = builder.ilike("title", f"%{query}%")
    response = await builder.order("created_at", desc=True).range(
        offset, offset + limit - 1
    ).execute()
    return list(response.data or []), int(response.count or 0)


def to_news_item(row: dict[str, Any]) -> dict[str, Any]:
    """Baris DB -> bentuk `NewsItem` yang dipakai frontend."""
    return {
        "id": row["id"],
        "title": row["title"],
        "url": row["source_url"],
        "source": row["source_media"],
        "published_at": row.get("published_at") or row.get("created_at"),
        "snippet": truncate(row.get("description") or "", SNIPPET_CHARS),
        "categories": [row["category"]],
    }
