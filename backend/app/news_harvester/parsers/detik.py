"""Parser Detik.com — tag penipuan-online, phishing, kejahatan-siber."""

from __future__ import annotations

import re

from app.news_harvester.parsers.spec import Source

SOURCE = Source(
    name="detik",
    media="detik.com",
    listings=(
        "https://www.detik.com/tag/penipuan-online",
        "https://www.detik.com/tag/phishing",
        "https://www.detik.com/tag/kejahatan-siber",
    ),
    list_selector="div.list.media_rows article a[href]",
    # Hanya artikel teks: halaman galeri foto (/foto-news/, /fotoinet/, /fotohealth/…)
    # juga berakhiran /d-<id>/ tapi isinya cuma caption satu paragraf.
    item_pattern=re.compile(r"^(?!.*/foto[\w-]*/).*/d-\d+/"),
    # `.itp_bodycontent` dipertahankan sebagai cadangan untuk artikel lama.
    body_selector=".detail__body-text, .itp_bodycontent",
    crawl_delay=1.5,
)
