"""Ambil berita penipuan digital dari RSS Tier A -> frontend/lib/news.json (statis).

    python tools/news_fetch.py

Hanya metadata + snippet pendek dari deskripsi RSS; pembaca selalu diarahkan ke
artikel asli. Jalankan manual/CI, bukan saat request. Tanpa dependensi (stdlib).

Sumber baru wajib dicek robots.txt-nya lebih dulu: lihat tools/sources.json.
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import ssl
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import UTC, datetime
from email.utils import parsedate_to_datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCES_PATH = Path(__file__).resolve().parent / "sources.json"
OUT_PATH = ROOT / "frontend" / "lib" / "news.json"

USER_AGENT = "GuardianAI-news/1.0 (+https://github.com/; edukasi penipuan digital)"
TIMEOUT = 20
SNIPPET_CHARS = 280
MAX_PER_SOURCE = 12
MAX_ITEMS = 120

# Kata kunci relevansi: penipuan digital. Aturan = (istilah penipuan DAN konteks digital),
# supaya kasus pidana umum (penyelewengan donasi, pencucian uang) tidak ikut masuk.
_SCAM = re.compile(
    r"penipu|scam|phishing|tipu\s*muslihat|modus\s+(?:penipuan|scam)|bodong|"
    r"pinjol|pinjaman\s+(?:ilegal|daring|online)|"
    r"\botp\b|\bpin\b\s+(?:bank|atm)|"
    r"investasi\s+(?:ilegal|palsu|bodong)|rekening\s+(?:penipu|palsu)|"
    r"judi\s+online|slot\s+online|social\s+engineering|soceng|"
    r"kejahatan\s+(?:siber|digital)|pencurian\s+data|data\s+pribadi\s+bocor|jual\s+beli\s+data|"
    r"fraud|mencuri\s+uang\s+nasabah",
    re.I,
)
_HOAX = re.compile(r"hoaks|hoax", re.I)
# Hoaks hanya ikut bila JUDUL menyebut vektor penipuan. "akun" tidak dipakai: hampir semua
# artikel cek fakta menyebut "akun Facebook", sehingga filter jadi bocor.
_HOAX_VECTOR = re.compile(
    r"tautan|link|rekening|bansos|hadiah|undian|investasi|kripto|pinjol|"
    r"\botp\b|klik|\bapk\b|penipuan|pinjaman",
    re.I,
)

_DIGITAL = re.compile(
    r"digital|online|daring|internet|medsos|media\s+sosial|akun|aplikasi|situs|web|"
    r"tautan|link|whatsapp|\bwa\b|telegram|email|\bsms\b|\bapk\b|facebook|instagram|tiktok|"
    r"ponsel|handphone|ponsel|e-?money|dompet\s+digital|m-?banking",
    re.I,
)
MAX_AGE_DAYS = 120

_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")

# Kategori tipuan -> skenario Learn (id di frontend/lib/scenarios.ts).
# Pola sengaja spesifik: hindari salah kategori (mis. "gaji" -> kerja untuk berita investasi).
CATEGORY_TERMS: dict[str, re.Pattern[str]] = {
    "kerja": re.compile(
        r"lowongan|rekrutmen|rekrut|magang|kerja\s+(?:online|dari\s+rumah|wf|paruh)|"
        r"karyawan|wawancara\s+kerja|lamaran",
        re.I,
    ),
    "giveaway": re.compile(r"hadiah|undian|giveaway|kupon|bansos|bantuan\s+\w+|menang", re.I),
    "impersonasi": re.compile(r"mengaku|akun\s+palsu|telepon\s+palsu|mengatasnamakan|otp|petugas\s+palsu", re.I),
    "investasi": re.compile(r"investasi|kripto|crypto|trading|bodong|profit|pinjol|pinjaman|deposit", re.I),
    "phishing": re.compile(r"phishing|tautan|link|situs\s+palsu|domain|apk|klik", re.I),
}


def clean_text(raw: str) -> str:
    """Deskripsi RSS -> teks polos satu baris."""
    text = _TAG_RE.sub(" ", raw or "")
    text = html.unescape(text)
    return _WS_RE.sub(" ", text).strip()


def make_snippet(text: str, limit: int = SNIPPET_CHARS) -> str:
    """Potong di batas kata; beri elipsis bila terpotong."""
    text = clean_text(text)
    if len(text) <= limit:
        return text
    cut = text[:limit].rsplit(" ", 1)[0].rstrip(" ,.;:")
    return f"{cut}…"


def is_relevant(title: str, description: str) -> bool:
    haystack = f"{title} {description}"
    if not _DIGITAL.search(haystack):
        return False
    if _SCAM.search(haystack):
        return True
    return bool(_HOAX.search(title) and _HOAX_VECTOR.search(title))


def classify(title: str, description: str) -> list[str]:
    haystack = f"{title} {description}"
    return [name for name, pattern in CATEGORY_TERMS.items() if pattern.search(haystack)]


def parse_date(value: str | None) -> str | None:
    if not value:
        return None
    try:
        parsed = parsedate_to_datetime(value)
    except (TypeError, ValueError):
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC).isoformat(timespec="seconds")


def is_fresh(published_at: str | None, now: datetime) -> bool:
    """Tanggal tak tersedia (banyak agregator) dianggap segar; yang jelas basi dibuang."""
    if not published_at:
        return True
    try:
        stamp = datetime.fromisoformat(published_at)
    except ValueError:
        return True
    return (now - stamp).days <= MAX_AGE_DAYS


def article_id(url: str) -> str:
    return hashlib.sha1(url.encode("utf-8")).hexdigest()[:12]


def parse_feed(xml_bytes: bytes, source_name: str, now: datetime | None = None) -> list[dict]:
    """Ambil <item> dari RSS 2.0. Feed rusak -> list kosong (bukan crash)."""
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError:
        return []
    now = now or datetime.now(UTC)
    items: list[dict] = []
    for item in root.iter("item"):
        title = clean_text(item.findtext("title") or "")
        url = (item.findtext("link") or "").strip()
        # Bersihkan tags DULU: <img src="…instagram…"> akan mengotori pencocokan kata kunci.
        description = clean_text(item.findtext("description") or "")
        if not title or not url.startswith(("http://", "https://")):
            continue
        if not is_relevant(title, description):
            continue
        published_at = parse_date(item.findtext("pubDate"))
        if not is_fresh(published_at, now):
            continue
        items.append(
            {
                "id": article_id(url),
                "title": title,
                "url": url,
                "source": source_name,
                "published_at": published_at,
                "snippet": make_snippet(description),
                "categories": classify(title, description) or ["umum"],
            }
        )
    return items


def _ssl_context() -> ssl.SSLContext:
    # Windows sering tak punya CA bundle; pakai certifi bila ada. Verifikasi TLS tidak pernah dimatikan.
    context = ssl.create_default_context()
    context.check_hostname = True
    context.verify_mode = ssl.CERT_REQUIRED
    try:
        import certifi

        context.load_verify_locations(cafile=certifi.where())
    except (ImportError, OSError):
        pass  # pakai bundle OS bawaan
    return context


def fetch(url: str) -> bytes | None:
    """HTTP GET sekali + satu retry. None bila gagal (sumber dilewati)."""
    context = _ssl_context()
    request = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.8"},
    )
    for attempt in (1, 2):
        try:
            with urllib.request.urlopen(request, timeout=TIMEOUT, context=context) as response:
                return response.read()
        except (urllib.error.URLError, OSError, ValueError) as exc:
            if attempt == 2:
                print(f"  ! gagal {url}: {exc}", file=sys.stderr)
                return None
            time.sleep(2)
    return None


def dedupe(items: list[dict]) -> list[dict]:
    """Buang duplikat berdasarkan URL, lalu judul yang sama (mis. Cekfakta == TurnBackHoax)."""
    seen_urls: set[str] = set()
    seen_titles: set[str] = set()
    unique: list[dict] = []
    for item in items:
        title_key = re.sub(r"[^a-z0-9]+", " ", item["title"].lower()).strip()
        if item["url"] in seen_urls or title_key in seen_titles:
            continue
        seen_urls.add(item["url"])
        seen_titles.add(title_key)
        unique.append(item)
    return unique


def build(sources_path: Path, out_path: Path) -> dict:
    config = json.loads(sources_path.read_text(encoding="utf-8"))
    collected: list[dict] = []
    for source in config["sources"]:
        raw = fetch(source["feed"])
        if raw is None:
            continue
        fresh = parse_feed(raw, source["name"])[:MAX_PER_SOURCE]
        print(f"  {source['name']:<16} {source['feed']:<58} {len(fresh):>3} relevan")
        collected.extend(fresh)
        time.sleep(1)  # sopan terhadap server sumber

    items = dedupe(collected)
    items.sort(key=lambda item: item["published_at"] or "", reverse=True)
    items = items[:MAX_ITEMS]

    payload = {
        "generated_at": datetime.now(UTC).isoformat(timespec="seconds"),
        "note": "Metadata + snippet dari RSS resmi. Hak cipta tetap milik media; baca artikel aslinya di url.",
        "items": items,
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"-> {len(items)} artikel ditulis ke {out_path}")
    return payload


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sources", type=Path, default=SOURCES_PATH)
    parser.add_argument("--out", type=Path, default=OUT_PATH)
    args = parser.parse_args()
    if not build(args.sources, args.out)["items"]:
        sys.exit("Tidak ada artikel relevan — cek koneksi atau kata kunci di news_fetch.py")


if __name__ == "__main__":
    main()
