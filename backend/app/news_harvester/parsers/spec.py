"""Deskripsi satu media berita: halaman listing + selector ekstraksi."""

from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class Source:
    name: str
    media: str
    listings: tuple[str, ...]
    list_selector: str
    item_pattern: re.Pattern[str]
    body_selector: str
    crawl_delay: float = 1.5
