"""Orkestrasi news_harvester: scrap -> IOC + kategori -> Supabase. Juga entry CLI."""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys
from dataclasses import asdict, dataclass, field
from typing import Any

from app.config import settings
from app.news_harvester import store
from app.news_harvester.browser import PageReader, browser_session, polite_pause, robots_allows
from app.news_harvester.extract import (
    classify,
    clean_image_url,
    clean_text,
    extract_iocs,
    is_fresh,
    parse_anchors,
    parse_date,
    truncate,
)
from app.news_harvester.parsers import SOURCES, Source

logger = logging.getLogger(__name__)


@dataclass
class HarvestStats:
    sources: int = 0
    parsed: int = 0
    inserted: int = 0
    duplicates: int = 0
    failed: int = 0
    skipped_robots: int = 0
    selector_miss: int = 0
    errors: list[str] = field(default_factory=list)

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


async def _listing_links(reader: PageReader, source: Source, stats: HarvestStats) -> list[dict]:
    """Tautan artikel unik dari semua halaman listing satu media."""
    collected: dict[str, dict] = {}
    for url in source.listings:
        if not await robots_allows(url, settings.news_user_agent):
            stats.skipped_robots += 1
            logger.info("%s: robots.txt menolak %s", source.name, url)
            continue
        try:
            anchors = await reader.listing(url, source.list_selector)
        except Exception as exc:  # noqa: BLE001 - satu listing gagal, lanjut
            stats.errors.append(f"{source.name} listing {url}: {exc}")
            logger.warning("%s: gagal ambil listing %s (%s)", source.name, url, exc)
            continue
        items = parse_anchors(anchors, source.item_pattern, source.media)
        if not items:
            stats.selector_miss += 1
            logger.warning(
                "%s: 0 artikel dari %s (selector atau pola URL mungkin berubah)",
                source.name, url,
            )
        for item in items:
            collected.setdefault(item["url"], item)
        await polite_pause(source.crawl_delay)
    # Listing JS tidak mengembalikan tanggal; urutan halaman tag sudah terbaru dulu.
    return list(collected.values())[: settings.news_max_per_source]


async def _harvest_source(reader: PageReader, source: Source, stats: HarvestStats) -> list[dict]:
    links = await _listing_links(reader, source, stats)
    semaphore = asyncio.Semaphore(settings.news_concurrency)

    async def fetch(link: dict) -> dict | None:
        async with semaphore:
            if not await robots_allows(link["url"], settings.news_user_agent):
                stats.skipped_robots += 1
                return None
            try:
                detail = await reader.article(link["url"], source.body_selector)
            except Exception as exc:  # noqa: BLE001 - satu artikel gagal, lanjut
                stats.failed += 1
                logger.debug("%s: gagal ambil %s (%s)", source.name, link["url"], exc)
                return None
            finally:
                await polite_pause(source.crawl_delay)

        title = clean_text(detail.title or link["title"])
        body = clean_text(detail.text)
        if len(body) < 200:
            stats.failed += 1
            logger.debug("%s: body terlalu pendek untuk %s", source.name, link["url"])
            return None

        stats.parsed += 1
        return {
            "url": link["url"],
            "title": title,
            "media": source.media,
            # Meta artikel lebih akurat daripada tanggal di URL listing.
            "published_at": parse_date(detail.published, "", link["url"])
            or link.get("published_at"),
            "description": truncate(body),
            "iocs": extract_iocs(body),
            "category": classify(title, body),
            "image_url": clean_image_url(detail.image, link["url"]),
        }

    results = await asyncio.gather(*(fetch(link) for link in links))
    return [item for item in results if item is not None]


async def scrape(sources: tuple[Source, ...] = SOURCES) -> tuple[list[dict], HarvestStats]:
    """Ambil artikel dari sumber terpilih, tanpa menyentuh database."""
    stats = HarvestStats(sources=len(sources))
    articles: list[dict] = []
    async with browser_session(settings.news_user_agent) as reader:
        for source in sources:
            try:
                articles.extend(await _harvest_source(reader, source, stats))
            except Exception as exc:  # noqa: BLE001 - satu media gagal, lanjut
                stats.errors.append(f"{source.name}: {exc}")
                logger.warning("%s: harvest gagal (%s)", source.name, exc)
    return articles, stats


async def run_once(*, dry_run: bool = False, only: str | None = None) -> HarvestStats:
    """Satu putaran penuh. `dry_run` mencetak JSON tanpa menyentuh Supabase."""
    sources: tuple[Source, ...] = SOURCES
    if only:
        sources = tuple(s for s in SOURCES if s.name == only)
        if not sources:
            raise SystemExit(f"Sumber tidak dikenal: {only}")

    if dry_run:
        articles, stats = await scrape(sources)
        print(json.dumps(articles, ensure_ascii=False, indent=2))
        logger.info("dry-run: %s", stats.as_dict())
        return stats

    if await store.init_store() is None:
        stats = HarvestStats()
        stats.errors.append("Supabase belum dikonfigurasi")
        logger.warning("Supabase belum dikonfigurasi — harvest dilewati.")
        return stats

    if not await store.acquire_lock(settings.news_lock_ttl_minutes):
        logger.info("Run lain sedang berjalan (lock DB dipegang) — dilewati.")
        stats = HarvestStats()
        stats.errors.append("skipped_locked")
        return stats

    try:
        articles, stats = await scrape(sources)
        fresh = [
            a for a in articles if is_fresh(a.get("published_at"), settings.news_max_age_days)
        ]
        rows = [store.to_row(article) for article in fresh[: settings.news_max_total]]
        stats.inserted, stats.duplicates, batch_failed = await store.insert_reports(rows)
        stats.failed += batch_failed
        logger.info("harvest selesai: %s", stats.as_dict())
        return stats
    finally:
        await store.release_lock()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Kumpulkan berita penipuan -> Supabase")
    parser.add_argument("--once", action="store_true", help="Jalankan satu putaran lalu keluar.")
    parser.add_argument("--dry-run", action="store_true", help="Cetak hasil, tanpa Supabase.")
    parser.add_argument("--source", help="Batasi ke satu sumber: detik|kompas|liputan6")
    args = parser.parse_args(argv)

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    stats = asyncio.run(run_once(dry_run=args.dry_run, only=args.source))
    if not args.dry_run and stats.parsed == 0:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
