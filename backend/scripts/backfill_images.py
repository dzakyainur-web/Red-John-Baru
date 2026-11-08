"""Isi `image_url` untuk baris lama yang masih NULL (sebelum migrasi 003).

Baris lama tidak ter-update oleh harvest karena upsert memakai `ignore_duplicates=True`.
Jalankan sekali: `.venv/Scripts/python.exe scripts/backfill_images.py`

ponytail: og:image diambil dari HTML mentah (httpx), bukan Playwright — cukup untuk
situs berita target. Kalau ada media yang render og:image via JS, ganti ke browser reader.
"""

from __future__ import annotations

import asyncio
import re
import sys

import httpx

sys.path.insert(0, ".")

from app.news_harvester import store  # noqa: E402
from app.news_harvester.extract import clean_image_url  # noqa: E402

OG_RE = re.compile(
    r"""<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']""",
    re.I,
)
OG_RE_REV = re.compile(
    r"""<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']""",
    re.I,
)
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"


async def fetch_image(client: httpx.AsyncClient, url: str) -> str | None:
    try:
        res = await client.get(url, follow_redirects=True, timeout=20)
        if res.status_code != 200:
            return None
        match = OG_RE.search(res.text) or OG_RE_REV.search(res.text)
        return clean_image_url(match.group(1), url) if match else None
    except Exception as exc:  # noqa: BLE001 - satu URL gagal, lanjut
        print(f"  gagal {url}: {type(exc).__name__}: {exc}")
        return None


async def main() -> int:
    sb = await store.init_store()
    if sb is None:
        print("Supabase belum dikonfigurasi.")
        return 1

    res = await sb.table(store.TABLE).select("id,source_url").is_("image_url", "null").execute()
    rows = [r for r in (res.data or []) if r.get("source_url")]
    print(f"{len(rows)} baris tanpa gambar")

    filled = 0
    async with httpx.AsyncClient(headers={"User-Agent": UA}) as client:
        for row in rows:
            image = await fetch_image(client, row["source_url"])
            if not image:
                continue
            await sb.table(store.TABLE).update({"image_url": image}).eq("id", row["id"]).execute()
            filled += 1
            print(f"  ok {row['id']} -> {image[:80]}")

    print(f"selesai: {filled}/{len(rows)} terisi")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
