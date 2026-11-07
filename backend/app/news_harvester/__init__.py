"""Pengumpul berita penipuan: Playwright -> IOC + kategori -> Supabase."""

from __future__ import annotations

from app.news_harvester.runner import HarvestStats, run_once

__all__ = ["HarvestStats", "run_once"]
