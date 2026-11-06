from __future__ import annotations

import re
from typing import Iterable, Pattern
from urllib.parse import urlparse

_URL_RE = re.compile(
    r"""(?ix)
    (?:
        https?://[^\s<>"']+      # skema penuh
        | www\.[^\s<>"']+        # www tanpa skema
        | (?<![\w@.])[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?:/[^\s<>"']*)?  # domain polos
    )
    """
)

_NUMBER_LIKE_RE = re.compile(r"[\w.\-+]{0,3}[0-9][0-9\s.\-]{8,}[\w.\-]{0,3}")


def find_urls(text: str) -> list[str]:
    urls = []
    for match in _URL_RE.finditer(text):
        candidate = match.group(0).rstrip(".,;:!?)]}\"'")
        if candidate and candidate not in urls:
            urls.append(candidate)
    return urls


def host_of(url: str) -> str:
    raw = url if "://" in url else f"http://{url}"
    try:
        host = urlparse(raw).hostname or ""
    except ValueError:
        return ""
    return host.lower().rstrip(".")


def mask_pii(text: str) -> str:
    return _NUMBER_LIKE_RE.sub(lambda m: re.sub(r"\d", "•", m.group(0)), text)


def snippet(text: str, start: int, end: int, pad: int = 30) -> str:
    lo = max(0, start - pad)
    hi = min(len(text), end + pad)
    piece = text[lo:hi].replace("\n", " ").strip()
    prefix = "…" if lo > 0 else ""
    suffix = "…" if hi < len(text) else ""
    return f"{prefix}{mask_pii(piece)}{suffix}"


def compile_any(patterns: Iterable[str]) -> Pattern[str]:
    return re.compile("|".join(f"(?:{p})" for p in patterns), re.IGNORECASE)
