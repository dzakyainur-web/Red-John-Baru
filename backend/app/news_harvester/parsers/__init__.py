"""Registry parser per media."""

from __future__ import annotations

from app.news_harvester.parsers import detik, kompas, liputan6
from app.news_harvester.parsers.spec import Source

SOURCES: tuple[Source, ...] = (detik.SOURCE, kompas.SOURCE, liputan6.SOURCE)

__all__ = ["SOURCES", "Source"]
