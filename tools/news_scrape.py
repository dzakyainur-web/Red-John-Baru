"""Ambil berita penipuan digital dengan Playwright (halaman tag portal berita).

    python tools/news_scrape.py [--headful] [--sources tools/scrape_sources.json]

Dipakai untuk portal yang tidak menyediakan RSS. Hasil ditulis ke
frontend/lib/news_scraped.json (digabung dengan news.json di lib/news.ts) dan
diarsipkan ke backend/data/articles.jsonl.

Aturan: hanya halaman tag/pencarian, hanya judul + URL (tanpa isi artikel),
verifikasi robots.txt sebelum menambah sumber, jeda antar request, dan gagal
= lewati sumber, bukan retry tanpa batas.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.robotparser
from datetime import UTC, datetime
from pathlib import Path

if __package__ in (None, ""):  # dijalankan sebagai `python tools/news_scrape.py`
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from tools.news_fetch import (
    MAX_ITEMS,
    _ssl_context,
    article_id,
    append_jsonl,
    classify,
    clean_text,
    dedupe,
)

ROOT = Path(__file__).resolve().parent.parent
SOURCES_PATH = Path(__file__).resolve().parent / "scrape_sources.json"
OUT_PATH = ROOT / "frontend" / "lib" / "news_scraped.json"
JSONL_PATH = ROOT / "backend" / "data" / "articles.jsonl"

USER_AGENT = "GuardianAI-news/1.0 (+edukasi penipuan digital)"
TIMEOUT_MS = 30_000
NAV_TIMEOUT_MS = 35_000
RENDER_WAIT_MS = 2_000
MAX_PER_SOURCE = 25

_DATE_IN_URL = re.compile(r"/(\d{4})/(\d{2})/(\d{2})/")
_DATE_IN_TEXT = re.compile(
    r"(\d{1,2})\s+(Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des)\w*\s+(\d{4})"
    r"(?:\s+(\d{2}):(\d{2}))?",
    re.I,
)
_MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "mei": 5, "jun": 6,
    "jul": 7, "agu": 8, "sep": 9, "okt": 10, "nov": 11, "des": 12,
}
# Teks yang menempel di judul (mis. "detikJabarKamis, 29 Okt 2026 18:32 WIB ").
_LEAD_NOISE = re.compile(r"^.*?\b(?:WIB|WITA|WIT)\s+", re.I)

EXTRACT_JS = """els => els.map(e => {
    // Cari <time datetime> di 5 ancestor terdekat: banyak portal menaruh tanggal di
    // luar anchor judul. ponytail: batas 5 level mencegah mengambil tanggal kartu tetangga.
    let stamp = '';
    let cur = e;
    for (let i = 0; i < 5 && cur; i++) {
        const t = cur.querySelector ? cur.querySelector('time[datetime]') : null;
        if (t) { stamp = t.getAttribute('datetime') || ''; break; }
        cur = cur.parentElement;
    }
    return {
        href: e.href,
        text: (e.textContent || '').replace(/\\s+/g, ' ').trim(),
        date: stamp
    };
})"""


def _parse_date(text: str, url: str, stamp: str = "") -> str | None:
    """Urutan prioritas: <time datetime> portal, tanggal di teks, lalu tanggal di URL."""
    if stamp:
        try:
            parsed = datetime.fromisoformat(stamp.replace("Z", "+00:00"))
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=UTC)
            return parsed.astimezone(UTC).isoformat(timespec="seconds")
        except ValueError:
            pass
    match = _DATE_IN_TEXT.search(text)
    if match:
        day, month, year, hour, minute = match.groups()
        try:
            stamp = datetime(
                int(year), _MONTHS[month[:3].lower()], int(day),
                int(hour or 0), int(minute or 0), tzinfo=UTC,
            )
            return stamp.isoformat(timespec="seconds")
        except (KeyError, ValueError):
            return None
    match = _DATE_IN_URL.search(url)
    if match:
        try:
            return datetime(*(int(part) for part in match.groups()), tzinfo=UTC).isoformat(
                timespec="seconds"
            )
        except ValueError:
            return None
    return None


def _clean_title(text: str) -> str:
    return _LEAD_NOISE.sub("", clean_text(text)).strip()


def parse_anchors(anchors: list[dict], source: str, pattern: re.Pattern[str]) -> list[dict]:
    """Anchor -> item berita. Murni (tanpa browser) supaya bisa diuji."""
    items: list[dict] = []
    seen: set[str] = set()
    for anchor in anchors:
        url = (anchor.get("href") or "").strip()
        if not url.startswith(("http://", "https://")) or url in seen:
            continue
        if not pattern.search(url):
            continue
        raw_text = anchor.get("text") or ""
        title = _clean_title(raw_text)
        if len(title) < 20:
            continue
        # Halaman tag sudah menyaring topik; filter relevansi kata kunci hanya akan
        # membuang judul sah seperti "Aksi Tipu-tipu PNS Palsu".
        seen.add(url)
        items.append(
            {
                "id": article_id(url),
                "title": title,
                "url": url,
                "source": source,
                "published_at": _parse_date(raw_text, url, anchor.get("date") or ""),
                "snippet": "",
                "categories": classify(title, "") or ["umum"],
            }
        )
    return items


def robots_allows(url: str) -> bool:
    parts = url.split("/")
    origin = f"{parts[0]}//{parts[2]}"
    try:
        import urllib.request

        request = urllib.request.Request(
            f"{origin}/robots.txt", headers={"User-Agent": USER_AGENT}
        )
        body = urllib.request.urlopen(
            request, timeout=15, context=_ssl_context()
        ).read().decode("utf-8", "replace")
    except (OSError, ValueError) as exc:
        print(f"  ! robots.txt {origin} gagal: {exc}", file=sys.stderr)
        return False
    parser = urllib.robotparser.RobotFileParser()
    parser.parse(body.splitlines())
    return parser.can_fetch(USER_AGENT, url)


def scrape(sources_path: Path, out_path: Path, jsonl_path: Path | None, headful: bool) -> dict:
    try:
        from playwright.sync_api import Error as PlaywrightError
        from playwright.sync_api import sync_playwright
    except ImportError:
        sys.exit("Playwright belum terpasang: uv add --dev playwright && uv run playwright install chromium")

    config = json.loads(sources_path.read_text(encoding="utf-8"))
    collected: list[dict] = []
    allowed: dict[str, bool] = {}

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=not headful)
        page = browser.new_page(user_agent=USER_AGENT, locale="id-ID")
        for source in config["sources"]:
            url = source["url"]
            origin = "/".join(url.split("/")[:3])
            if origin not in allowed:
                allowed[origin] = robots_allows(url)
                time.sleep(1)
            if not allowed[origin]:
                print(f"  {source['name']:<12} {url:<52} SKIP robots.txt")
                continue
            try:
                page.goto(url, timeout=NAV_TIMEOUT_MS, wait_until="domcontentloaded")
                page.wait_for_timeout(RENDER_WAIT_MS)
                anchors = page.eval_on_selector_all(source["selector"], EXTRACT_JS)
            except PlaywrightError as exc:
                print(f"  {source['name']:<12} {url:<52} GAGAL {str(exc).splitlines()[0][:60]}")
                continue
            items = parse_anchors(anchors, source["name"], re.compile(source["pattern"]))
            print(f"  {source['name']:<12} {url:<52} {len(items):>3} relevan")
            collected.extend(items[:MAX_PER_SOURCE])
            time.sleep(1)  # sopan terhadap server sumber
        browser.close()

    items = dedupe(list({item["url"]: item for item in collected}.values()))
    items.sort(key=lambda item: item["published_at"] or "", reverse=True)
    items = items[:MAX_ITEMS]

    payload = {
        "generated_at": datetime.now(UTC).isoformat(timespec="seconds"),
        "note": "Judul + tautan dari halaman tag portal berita. Hak cipta milik media; baca artikel aslinya di url.",
        "items": items,
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"-> {len(items)} artikel ditulis ke {out_path}")
    if jsonl_path and items:
        print(f"-> {append_jsonl(items, jsonl_path)} artikel baru di {jsonl_path}")
    return payload


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sources", type=Path, default=SOURCES_PATH)
    parser.add_argument("--out", type=Path, default=OUT_PATH)
    parser.add_argument("--jsonl", type=Path, default=JSONL_PATH, help="Kosongkan untuk mematikan.")
    parser.add_argument("--headful", action="store_true", help="Tampilkan browser (debug selector).")
    args = parser.parse_args()
    if not scrape(args.sources, args.out, args.jsonl, args.headful)["items"]:
        sys.exit("Tidak ada artikel — selector mungkin berubah, jalankan --headful untuk cek.")


if __name__ == "__main__":
    main()
