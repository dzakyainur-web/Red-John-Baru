"""Browser Playwright async + pembacaan halaman listing/artikel.

Satu browser dan satu context per run; halaman dibuat per artikel supaya satu
kegagalan tidak merusak yang lain.
"""

from __future__ import annotations

import asyncio
import logging
import urllib.request
import urllib.robotparser
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import AsyncIterator
from urllib.parse import urlsplit

from playwright.async_api import BrowserContext, Page, async_playwright

logger = logging.getLogger(__name__)

NAV_TIMEOUT_MS = 30_000
SELECTOR_TIMEOUT_MS = 10_000

_LIST_JS = """els => els.map(e => ({
    href: e.href,
    text: (e.textContent || '').replace(/\\s+/g, ' ').trim()
}))"""

_ARTICLE_JS = """([bodySelector]) => {
    const meta = (property) => {
        const el = document.querySelector(`meta[property="${property}"]`);
        return el ? (el.getAttribute('content') || '') : '';
    };
    // Paragraf pengisi yang bukan isi berita.
    const filler = /^(scroll to continue with content|advertisement|iklan|baca juga:?)$/i;
    const body = document.querySelector(bodySelector);
    const paragraphs = body
        ? Array.from(body.querySelectorAll('p'))
            .map(p => (p.textContent || '').replace(/\\s+/g, ' ').trim())
            .filter(t => t.length > 0 && !filler.test(t))
        : [];
    const time = document.querySelector('time[datetime]');
    const imageSrc = document.querySelector('link[rel="image_src"]');
    return {
        title: meta('og:title') || (document.querySelector('h1')?.textContent || '').trim(),
        published: meta('article:published_time')
            || (time ? (time.getAttribute('datetime') || '') : ''),
        image: meta('og:image')
            || meta('twitter:image')
            || (imageSrc ? (imageSrc.getAttribute('href') || '') : ''),
        text: paragraphs.join('\\n')
    };
}"""


@dataclass(frozen=True)
class ArticleHtml:
    title: str
    published: str
    text: str
    image: str = ""


class PageReader:
    """Pembungkus tipis context Playwright; tiap metode memakai halaman sendiri."""

    def __init__(self, context: BrowserContext) -> None:
        self._context = context

    async def _new_page(self) -> Page:
        page = await self._context.new_page()
        page.set_default_timeout(NAV_TIMEOUT_MS)
        return page

    async def listing(self, url: str, selector: str) -> list[dict]:
        page = await self._new_page()
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=NAV_TIMEOUT_MS)
            await page.wait_for_selector(selector, timeout=SELECTOR_TIMEOUT_MS)
            return await page.eval_on_selector_all(selector, _LIST_JS)
        finally:
            await page.close()

    async def article(self, url: str, body_selector: str) -> ArticleHtml:
        page = await self._new_page()
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=NAV_TIMEOUT_MS)
            await page.wait_for_selector(body_selector, timeout=SELECTOR_TIMEOUT_MS)
            data = await page.evaluate(_ARTICLE_JS, [body_selector])
            return ArticleHtml(
                title=(data.get("title") or "").strip(),
                published=(data.get("published") or "").strip(),
                text=(data.get("text") or "").strip(),
                image=(data.get("image") or "").strip(),
            )
        finally:
            await page.close()


@asynccontextmanager
async def browser_session(
    user_agent: str, *, headless: bool = True
) -> AsyncIterator[PageReader]:
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            headless=headless, args=["--disable-dev-shm-usage"]
        )
        context = await browser.new_context(
            user_agent=user_agent, locale="id-ID", viewport={"width": 1366, "height": 900}
        )
        try:
            yield PageReader(context)
        finally:
            await context.close()
            await browser.close()


_robots_cache: dict[str, bool] = {}


def _fetch_robots(origin: str, user_agent: str) -> str | None:
    try:
        request = urllib.request.Request(
            f"{origin}/robots.txt", headers={"User-Agent": user_agent}
        )
        with urllib.request.urlopen(request, timeout=15) as response:
            return response.read().decode("utf-8", "replace")
    except (OSError, ValueError) as exc:
        logger.warning("robots.txt %s gagal: %s", origin, exc)
        return None


async def robots_allows(url: str, user_agent: str) -> bool:
    """Cek robots.txt per origin (cache per proses). Gagal ambil -> tolak."""
    parts = urlsplit(url)
    origin = f"{parts.scheme}://{parts.netloc}"
    if origin in _robots_cache:
        return _robots_cache[origin]

    body = await asyncio.to_thread(_fetch_robots, origin, user_agent)
    if body is None:
        _robots_cache[origin] = False
        return False
    parser = urllib.robotparser.RobotFileParser()
    parser.parse(body.splitlines())
    allowed = parser.can_fetch(user_agent, url)
    _robots_cache[origin] = allowed
    return allowed


async def polite_pause(seconds: float) -> None:
    """Jeda antar request supaya tidak membebani server sumber."""
    await asyncio.sleep(seconds)
