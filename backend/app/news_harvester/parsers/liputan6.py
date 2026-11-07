"""Parser Liputan6.com — tag kejahatan-siber dan cek-fakta."""

from __future__ import annotations

import re

from app.news_harvester.parsers.spec import Source

SOURCE = Source(
    name="liputan6",
    media="liputan6.com",
    listings=(
        "https://www.liputan6.com/tag/kejahatan-siber",
        "https://www.liputan6.com/tag/cek-fakta",
    ),
    list_selector="h4.articles--iridescent-list--text-item__title a[href]",
    item_pattern=re.compile(r"/read/\d+/"),
    body_selector=".article-content-body",
    crawl_delay=1.5,
)
