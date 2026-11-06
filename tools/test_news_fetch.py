"""Cek fungsi murni news_fetch tanpa jaringan: python -m unittest tools/test_news_fetch.py"""

import unittest
from datetime import UTC, datetime

from tools.news_fetch import (
    append_jsonl,
    clean_text,
    classify,
    dedupe,
    is_relevant,
    make_snippet,
    parse_date,
    parse_feed,
    resolve_url,
)

SAMPLE = b"""<?xml version="1.0"?><rss version="2.0"><channel><title>X</title>
<item><title>Waspada penipuan online bermodus undian</title><link>https://contoh.id/a</link>
<description>&lt;p&gt;Korban diminta transfer biaya admin.&lt;/p&gt;</description>
<pubDate>Tue, 04 Nov 2026 10:00:00 +0700</pubDate></item>
<item><title>Resep nasi goreng spesial</title><link>https://contoh.id/b</link>
<description>Masak nasi lalu goreng.</description></item>
<item><title>Tanpa link</title><description>penipuan</description></item>
</channel></rss>"""


class NewsFetchTest(unittest.TestCase):
    def test_clean_text_strips_tags_and_entities(self):
        self.assertEqual(clean_text("<p>A &amp; B</p>\n <b>C</b>"), "A & B C")

    def test_snippet_cuts_on_word_boundary(self):
        out = make_snippet("kata " * 100, limit=20)
        self.assertTrue(out.endswith("…"))
        self.assertLessEqual(len(out), 21)

    def test_relevance_accepts_scam_and_rejects_cooking(self):
        self.assertTrue(is_relevant("Waspada penipuan online", ""))
        self.assertTrue(is_relevant("Cek Fakta: Hoaks Tautan Bansos Pelajar", "viral di Facebook"))
        self.assertFalse(is_relevant("Resep nasi goreng", "Masak nasi lalu goreng."))

    def test_relevance_rejects_hoax_without_scam_vector(self):
        # Hoaks politik/gosip bukan materi penipuan digital.
        self.assertFalse(is_relevant("Cek Fakta: Hoaks Presiden Batasi Media Sosial", "viral di Facebook"))
        self.assertFalse(is_relevant("Skandal Miss Thailand Selewengkan Donasi", "tuduhan penipuan publik"))

    def test_classify_returns_expected_categories(self):
        self.assertIn("giveaway", classify("Penipuan bermodus undian hadiah", ""))
        self.assertIn("investasi", classify("Investasi bodong kripto", ""))

    def test_parse_feed_skips_irrelevant_and_missing_link(self):
        items = parse_feed(SAMPLE, "Contoh")
        self.assertEqual(len(items), 1)
        item = items[0]
        self.assertEqual(item["url"], "https://contoh.id/a")
        self.assertEqual(item["published_at"], "2026-11-04T03:00:00+00:00")
        self.assertNotIn("<p>", item["snippet"])
        self.assertEqual(item["source"], "Contoh")

    def test_parse_feed_bad_xml_is_empty_not_crash(self):
        self.assertEqual(parse_feed(b"<rss><broken", "X"), [])

    def test_desc_img_url_does_not_create_false_match(self):
        """<img src="…instagram…"> di deskripsi tidak boleh membuat berita lolos filter."""
        feed = (
            b'<?xml version="1.0"?><rss version="2.0"><channel><title>X</title>'
            b"<item><title>Skandal Miss Thailand</title><link>https://contoh.id/c</link>"
            b'<description><img src="https://cdn.example/instagram-post.jpg"> '
            b"Tuduhan penipuan publik.</description></item></channel></rss>"
        )
        self.assertEqual(parse_feed(feed, "Contoh"), [])

    def test_stale_item_dropped_and_undated_kept(self):
        now = datetime(2026, 11, 5, tzinfo=UTC)
        feed = (
            b'<?xml version="1.0"?><rss version="2.0"><channel><title>X</title>'
            b"<item><title>Penipuan online modus lama</title><link>https://contoh.id/old</link>"
            b"<pubDate>Mon, 01 Jan 2024 00:00:00 +0000</pubDate></item>"
            b"<item><title>Penipuan online tanpa tanggal</title><link>https://contoh.id/new</link></item>"
            b"</channel></rss>"
        )
        urls = [item["url"] for item in parse_feed(feed, "Contoh", now=now)]
        self.assertEqual(urls, ["https://contoh.id/new"])

    def test_parse_date_handles_garbage(self):
        self.assertIsNone(parse_date("kemarin"))
        self.assertIsNone(parse_date(None))

    def test_dedupe_by_url_and_title(self):
        items = [
            {"id": "1", "title": "Penipuan OTP", "url": "https://a.id/1"},
            {"id": "2", "title": "Penipuan OTP!", "url": "https://b.id/1"},
            {"id": "3", "title": "Penipuan transfer", "url": "https://a.id/2"},
        ]
        self.assertEqual([i["id"] for i in dedupe(items)], ["1", "3"])

    def test_resolve_url_unwraps_bing_news_redirect(self):
        wrapped = (
            "http://www.bing.com/news/apiclick.aspx?ref=FexRss&aid=&tid=abc"
            "&url=https%3a%2f%2finvestor.id%2fbusiness%2f316236%2fx&c=1&mkt=en-id"
        )
        self.assertEqual(resolve_url(wrapped), "https://investor.id/business/316236/x")
        self.assertEqual(resolve_url("https://contoh.id/a"), "https://contoh.id/a")

    def test_append_jsonl_appends_once_and_skips_known_ids(self):
        import tempfile
        from pathlib import Path

        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "articles.jsonl"
            first = [{"id": "a", "title": "Penipuan A"}, {"id": "b", "title": "Penipuan B"}]
            self.assertEqual(append_jsonl(first, path), 2)
            self.assertEqual(append_jsonl(first, path), 0)
            self.assertEqual(append_jsonl([{"id": "c", "title": "Penipuan C"}], path), 1)
            self.assertEqual(len(path.read_text(encoding="utf-8").strip().splitlines()), 3)


if __name__ == "__main__":
    unittest.main()
