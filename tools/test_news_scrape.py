"""Cek parser news_scrape tanpa browser: python -m unittest tools.test_news_scrape"""

import re
import unittest

from tools.news_scrape import _clean_title, _parse_date, parse_anchors

PATTERN = re.compile(r"/d-\d+/")


class ScrapeTest(unittest.TestCase):
    def test_parse_anchors_filters_navigation_and_short_titles(self):
        # Halaman tag sudah menyaring topik: yang disaring di sini adalah link navigasi
        # (tidak cocok pola URL artikel) dan judul terlalu pendek.
        anchors = [
            {"href": "https://www.detik.com/jatim/x/d-8729974/aksi-tipu-pns-palsu", "text": "Aksi Tipu-tipu PNS Palsu Tipu Warga"},
            {"href": "https://www.detik.com/tag/penipuan-online", "text": "Penipuan online tag halaman daftar"},
            {"href": "https://www.detik.com/jatim/x/d-2/penipuan-online", "text": "Pendek"},
        ]
        items = parse_anchors(anchors, "detik", PATTERN)
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["url"], "https://www.detik.com/jatim/x/d-8729974/aksi-tipu-pns-palsu")
        self.assertEqual(items[0]["categories"], ["umum"])

    def test_clean_title_strips_channel_and_date_prefix(self):
        raw = "detikJabarKamis, 29 Okt 2026 18:32 WIB Aksi Tipu-tipu PNS Palsu"
        self.assertEqual(_clean_title(raw), "Aksi Tipu-tipu PNS Palsu")

    def test_parse_date_from_text(self):
        self.assertEqual(
            _parse_date("Kamis, 29 Okt 2026 18:32 WIB Aksi", "https://www.detik.com/a"),
            "2026-10-29T18:32:00+00:00",
        )
        self.assertEqual(
            _parse_date("Berita", "https://www.detik.com/2026/10/29/x"),
            "2026-10-29T00:00:00+00:00",
        )

    def test_parse_date_unknown(self):
        self.assertIsNone(_parse_date("tanpa tanggal", "https://contoh.id/a"))

    def test_duplicate_url_kept_once(self):
        anchors = [
            {"href": "https://www.detik.com/x/d-9/penipuan-online-modus-baru", "text": "Penipuan online modus baru"},
            {"href": "https://www.detik.com/x/d-9/penipuan-online-modus-baru", "text": "Penipuan online modus baru"},
        ]
        self.assertEqual(len(parse_anchors(anchors, "detik", PATTERN)), 1)


if __name__ == "__main__":
    unittest.main()
