import sys
from playwright.sync_api import sync_playwright

sys.path.insert(0, ".")
from tools.news_scrape import EXTRACT_JS, parse_anchors
import re

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
url = "https://www.antaranews.com/tag/penipuan-online"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(user_agent=UA, locale="id-ID")
    page.goto(url, timeout=35000, wait_until="domcontentloaded")
    page.wait_for_timeout(2500)
    for sel in ["div.h5 a[href]", ".h5 a[href]"]:
        anchors = page.eval_on_selector_all(sel, EXTRACT_JS)
        items = parse_anchors(anchors, "antaranews", re.compile(r"/(berita|video)/\d+/"))
        print(sel, "anchors:", len(anchors), "items:", len(items))
        for it in items[:2]:
            print("   ", it["title"][:60], "|", it["published_at"])
    browser.close()
