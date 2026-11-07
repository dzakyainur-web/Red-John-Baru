"""Parser Kompas.com — tag penipuan-online dan kanal Cek Fakta.

Catatan: robots.txt Kompas memuat komentar ToS yang melarang scraping otomatis;
robots.txt sendiri mengizinkan `/read/`. Pengambilan berjalan atas keputusan pemilik
proyek, dengan jeda lebih panjang.
"""

from __future__ import annotations

import re

from app.news_harvester.parsers.spec import Source

SOURCE = Source(
    name="kompas",
    media="kompas.com",
    listings=(
        "https://www.kompas.com/tag/penipuan-online",
        "https://www.kompas.com/cekfakta",
    ),
    # Halaman tag memakai articleItem; kanal cekfakta memakai kelasnya sendiri.
    list_selector=(
        "div.articleItem a.article-link, "
        "a.cekfakta-list-link, "
        "a.cekfakta-headline-link"
    ),
    # Artikel bisa di subdomain (surabaya.kompas.com/read/...) -> cocokkan path.
    item_pattern=re.compile(r"/read/\d{4}/\d{2}/\d{2}/"),
    body_selector="div.read__content",
    crawl_delay=3.0,
)
