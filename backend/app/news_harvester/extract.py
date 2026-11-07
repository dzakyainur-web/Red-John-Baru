"""Fungsi murni untuk news_harvester: pembersihan teks, tanggal, IOC, klasifikasi modus.

Tanpa I/O, tanpa Playwright, tanpa Supabase — supaya bisa diuji offline.
"""

from __future__ import annotations

import hashlib
import html
import re
from datetime import UTC, datetime, timedelta
from typing import Literal
from urllib.parse import urlparse

from app.rules.text_utils import find_urls, host_of

Category = Literal[
    "fake_job", "phishing_link", "giveaway_palsu", "malware_apk", "pinjol_ilegal"
]

CATEGORIES: tuple[Category, ...] = (
    "fake_job",
    "phishing_link",
    "giveaway_palsu",
    "malware_apk",
    "pinjol_ilegal",
)

MAX_DESCRIPTION = 1200

_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")
_INVISIBLE_RE = re.compile(r"[​-‏  ﻿]")

# Tie-break: kategori pertama menang bila skor sama.
_TIE_ORDER: tuple[Category, ...] = (
    "malware_apk",
    "pinjol_ilegal",
    "fake_job",
    "giveaway_palsu",
    "phishing_link",
)

CATEGORY_TERMS: dict[Category, tuple[str, ...]] = {
    "malware_apk": (
        "apk", "file apk", "unduh aplikasi", "instal aplikasi",
        "malware", "trojan", "spyware", "mod apk",
    ),
    "phishing_link": (
        "phishing", "tautan", "situs palsu", "web palsu",
        "akun dibajak", "otp", "kode otp", "link bodong",
    ),
    "fake_job": (
        "lowongan", "rekrutmen", "loker", "kerja paruh",
        "part time", "wawancara kerja", "lamaran kerja",
    ),
    "giveaway_palsu": (
        "giveaway", "undian", "hadiah", "pemenang",
        "kuis berhadiah", "voucher", "saldo gratis",
    ),
    "pinjol_ilegal": (
        "pinjol", "pinjaman online", "pinjaman ilegal", "pinjam uang",
        "debt collector", "sebar data", "bunga pinjaman",
    ),
}

# Cocokkan per kata: "menang" jangan kena di "menangkap", "bunga" di "hubungan".
_CATEGORY_RES: dict[Category, tuple[re.Pattern[str], ...]] = {
    category: tuple(
        re.compile(rf"(?<!\w){re.escape(term)}(?!\w)") for term in terms
    )
    for category, terms in CATEGORY_TERMS.items()
}

# Host milik media/sosial/CDN: tautan ini bukan indikator penipuan.
_BLOCKED_SUFFIXES: tuple[str, ...] = (
    "detik.com", "kompas.com", "liputan6.com", "kly.id", "cekfakta.com",
    "facebook.com", "fbcdn.net", "twitter.com", "x.com", "twimg.com",
    "instagram.com", "tiktok.com", "youtube.com", "ytimg.com",
    "wa.me", "whatsapp.com", "t.me", "telegram.org",
    "google.com", "googleusercontent.com", "googleapis.com", "gstatic.com",
    "googletagmanager.com", "doubleclick.net", "cloudfront.net",
    "bit.ly", "tinyurl.com", "s.id", "linktr.ee",
    "fakeimagedetector.com", "truthscan.com", "sightengine.com",
)

# TLD yang lazim dipakai penipuan. Sengaja allowlist: tanpa ini "2026. Warga"
# dan "SMP.SMA.SMK" ikut terbaca sebagai domain.
_ALLOWED_TLDS: frozenset[str] = frozenset(
    {
        "com", "net", "org", "info", "biz", "xyz", "top", "shop", "store",
        "online", "site", "website", "tech", "link", "click", "live", "app",
        "pro", "club", "vip", "icu", "cc", "tv", "io", "ai", "me", "id",
        "co.id", "my.id", "biz.id", "web.id", "or.id", "ac.id", "go.id",
        "in", "sg", "my", "ly", "to", "ws", "tk",
    }
)

_ASSET_SUFFIXES: tuple[str, ...] = (
    ".js", ".css", ".jpg", ".jpeg", ".png", ".webp", ".gif",
    ".svg", ".ico", ".woff", ".woff2", ".mp4", ".pdf",
)

_APK_RE = re.compile(r"\b([\w.-]{3,60}\.apk)\b", re.IGNORECASE)
_APK_CONTEXT_RE = re.compile(r"(unduh|download|kirim|instal|install|\bapk\b)", re.IGNORECASE)
_PHONE_RE = re.compile(r"(?<![\d.])(?:\+62|62|0)8(?:[\s.\-]?\d){7,12}(?![\d.])")
_PHONE_CONTEXT_RE = re.compile(
    r"(wa\b|whatsapp|telepon|telp|hubungi|chat|kontak)", re.IGNORECASE
)
_AMOUNT_RE = re.compile(r"(rp|idr|usd|juta|ribu|%|\bjt\b)", re.IGNORECASE)
_DATE_CONTEXT_RE = re.compile(r"\d{1,2}[/-]\d{1,2}[/-]$")
# "nomor seri"/rekening/NIK bukan kontak pelaku; kontak redaksi media bukan IOC.
_NON_CONTACT_RE = re.compile(
    r"(nomor\s+seri|no\.?\s*seri|nomor\s+rekening|nomor\s+nik|\bnik\b|"
    r"nomor\s+polis|nomor\s+urut|pasal|redaksi|layanan\s+pelanggan|"
    r"customer\s+service|call\s+center|helpdesk)",
    re.IGNORECASE,
)

_DATE_IN_TEXT = re.compile(
    r"(\d{1,2})\s+(Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des)\w*\s+(\d{4})"
    r"(?:\s+(\d{2}):(\d{2}))?",
    re.IGNORECASE,
)
_DATE_IN_URL = re.compile(r"/(\d{4})/(\d{2})/(\d{2})/")
_MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "mei": 5, "jun": 6,
    "jul": 7, "agu": 8, "sep": 9, "okt": 10, "nov": 11, "des": 12,
}


def clean_text(raw: str) -> str:
    """HTML/entitas/whitespace -> satu baris teks polos."""
    text = _TAG_RE.sub(" ", raw or "")
    text = _INVISIBLE_RE.sub("", html.unescape(text))
    return _WS_RE.sub(" ", text).strip()


def truncate(text: str, limit: int = MAX_DESCRIPTION) -> str:
    """Potong di batas kata, tanpa melewati `limit`."""
    if len(text) <= limit:
        return text
    cut = text[:limit].rsplit(" ", 1)[0].rstrip(" ,.;:-")
    return cut or text[:limit]


def article_id(url: str) -> str:
    """ID stabil per URL (12 hex), sama seperti pipeline lama."""
    return hashlib.sha1(url.encode("utf-8")).hexdigest()[:12]


def parse_date(
    published: str | None = None, text: str = "", url: str = ""
) -> str | None:
    """Prioritas: meta ISO -> tanggal di teks -> tanggal di URL. Output ISO UTC."""
    if published:
        try:
            stamp = datetime.fromisoformat(published.replace("Z", "+00:00"))
            if stamp.tzinfo is None:
                stamp = stamp.replace(tzinfo=UTC)
            return stamp.astimezone(UTC).isoformat(timespec="seconds")
        except ValueError:
            pass

    match = _DATE_IN_TEXT.search(text or "")
    if match:
        day, month, year, hour, minute = match.groups()
        try:
            stamp = datetime(
                int(year), _MONTHS[month[:3].lower()], int(day),
                int(hour or 0), int(minute or 0), tzinfo=UTC,
            )
            return stamp.isoformat(timespec="seconds")
        except (KeyError, ValueError):
            pass

    match = _DATE_IN_URL.search(url or "")
    if match:
        try:
            stamp = datetime(*(int(part) for part in match.groups()), tzinfo=UTC)
            return stamp.isoformat(timespec="seconds")
        except ValueError:
            return None
    return None


def is_fresh(published_at: str | None, max_age_days: int, now: datetime | None = None) -> bool:
    """Tanggal tak terbaca dianggap segar; yang jelas basi dibuang."""
    if not published_at:
        return True
    try:
        stamp = datetime.fromisoformat(published_at)
    except ValueError:
        return True
    return (now or datetime.now(UTC)) - stamp <= timedelta(days=max_age_days)


def _host_blocked(host: str) -> bool:
    return any(host == suffix or host.endswith("." + suffix) for suffix in _BLOCKED_SUFFIXES)


def _tld_allowed(host: str) -> bool:
    """Wajib TLD yang dikenal: menyaring '2026. Warga' dan 'SMP.SMA.SMK'."""
    labels = host.split(".")
    if len(labels) < 2 or labels[-1].isdigit():
        return False
    if ".".join(labels[-2:]) in _ALLOWED_TLDS:
        return True
    return labels[-1] in _ALLOWED_TLDS


def _defang(url: str) -> str:
    return re.sub(r"\.", "[.]", re.sub(r"^http", "hxxp", url, flags=re.IGNORECASE))


def _in_quote(text: str, index: int) -> bool:
    """True bila posisi berada di dalam pasangan kutip."""
    for open_q, close_q in (('"', '"'), ("“", "”"), ("'", "'")):
        start = 0
        while (opening := text.find(open_q, start)) != -1:
            closing = text.find(close_q, opening + 1)
            if closing == -1:
                break
            if opening < index < closing:
                return True
            start = closing + 1
    return False


def _ioc_urls(text: str) -> list[dict]:
    found: list[dict] = []
    seen: set[str] = set()
    for raw in find_urls(text):
        url = raw.rstrip(".,;:!?”’)]}\"'")
        url = url.split("#", 1)[0]
        if url.endswith("/amp"):
            url = url[:-4]
        host = host_of(url)
        if not host or _host_blocked(host) or not _tld_allowed(host):
            continue
        path = urlparse(url if "://" in url else f"http://{url}").path.lower()
        if path.endswith(_ASSET_SUFFIXES):
            continue
        key = f"{host}{path}"
        if key in seen:
            continue
        seen.add(key)
        found.append({"type": "url", "value": _defang(url)})
        if len(found) >= 20:
            break
    return found


def _ioc_apk(text: str) -> list[dict]:
    found: list[dict] = []
    seen: set[str] = set()
    for match in _APK_RE.finditer(text):
        name = match.group(1)
        if _in_quote(text, match.start()):
            continue
        if name.lower() in seen:
            continue
        if len(name[:-4]) < 4:
            continue
        before = text[max(0, match.start() - 60):match.start()]
        if ("-" not in name and "_" not in name) and not _APK_CONTEXT_RE.search(before):
            continue
        seen.add(name.lower())
        found.append({"type": "apk", "value": name})
        if len(found) >= 20:
            break
    return found


def _normalize_phone(digits: str) -> str | None:
    if digits.startswith("+62"):
        digits = digits[1:]
    if digits.startswith("0"):
        digits = "62" + digits[1:]
    if not digits.startswith("62") or not (10 <= len(digits) <= 15):
        return None
    return "+" + digits


def _clause_before(text: str, index: int, window: int = 60) -> str:
    """Teks sebelum `index` sampai batas kalimat terakhir, maks `window` karakter."""
    start = max(0, index - window)
    chunk = text[start:index]
    cut = max(chunk.rfind(". "), chunk.rfind("! "), chunk.rfind("? "), chunk.rfind("\n"))
    return chunk[cut + 1 :] if cut != -1 else chunk


def _ioc_phones(text: str) -> list[dict]:
    found: list[dict] = []
    seen: set[str] = set()
    for match in _PHONE_RE.finditer(text):
        before = _clause_before(text, match.start())
        if _DATE_CONTEXT_RE.search(before) or _AMOUNT_RE.search(before):
            continue
        if _NON_CONTACT_RE.search(before):
            continue
        if not _PHONE_CONTEXT_RE.search(before):
            continue
        number = _normalize_phone(re.sub(r"\D", "", match.group()))
        if number is None or number.endswith("0000") or number in seen:
            continue
        seen.add(number)
        found.append({"type": "phone", "value": number})
        if len(found) >= 20:
            break
    return found


def extract_iocs(text: str) -> list[dict]:
    """Indikator penipuan dari teks: URL defanged, nama file .apk, nomor WA/telepon."""
    if not text:
        return []
    return _ioc_urls(text) + _ioc_apk(text) + _ioc_phones(text)


def classify(title: str, description: str) -> Category:
    """Pilih kategori modus dengan skor istilah; seri -> urutan _TIE_ORDER."""
    haystack = f"{title} {description}".lower()
    scores = {
        category: sum(1 for pattern in patterns if pattern.search(haystack))
        for category, patterns in _CATEGORY_RES.items()
    }
    best = max(_TIE_ORDER, key=lambda c: (scores[c], -_TIE_ORDER.index(c)))
    return best if scores[best] else "phishing_link"


def parse_anchors(
    anchors: list[dict], pattern: re.Pattern[str], media: str
) -> list[dict]:
    """Anchor hasil Playwright -> item listing unik. Murni, bisa diuji tanpa browser."""
    items: list[dict] = []
    seen: set[str] = set()
    for anchor in anchors:
        url = (anchor.get("href") or "").strip()
        if not url.startswith(("http://", "https://")) or url in seen:
            continue
        if not pattern.search(url):
            continue
        title = clean_text(anchor.get("text") or "")
        if len(title) < 20:
            continue
        seen.add(url)
        items.append(
            {
                "url": url,
                "title": title,
                "media": media,
                "published_at": parse_date(
                    anchor.get("date") or "", title, url
                ),
            }
        )
    return items
