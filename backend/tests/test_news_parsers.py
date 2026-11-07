"""Registry parser: bentuk Source + filter anchor per media. Murni, tanpa browser."""

from __future__ import annotations

from app.news_harvester.extract import parse_anchors
from app.news_harvester.parsers import SOURCES

BY_MEDIA = {source.media: source for source in SOURCES}


def test_registry_lengkap() -> None:
    assert set(BY_MEDIA) == {"detik.com", "kompas.com", "liputan6.com"}
    for source in SOURCES:
        assert source.listings and all(u.startswith("https://") for u in source.listings)
        assert source.list_selector and source.body_selector
        assert source.crawl_delay >= 1.0


def test_target_url_sesuai_brief() -> None:
    assert BY_MEDIA["detik.com"].listings == (
        "https://www.detik.com/tag/penipuan-online",
        "https://www.detik.com/tag/phishing",
        "https://www.detik.com/tag/kejahatan-siber",
    )
    assert BY_MEDIA["kompas.com"].listings == (
        "https://www.kompas.com/tag/penipuan-online",
        "https://www.kompas.com/cekfakta",
    )
    assert BY_MEDIA["liputan6.com"].listings == (
        "https://www.liputan6.com/tag/kejahatan-siber",
        "https://www.liputan6.com/tag/cek-fakta",
    )


def test_detik_hanya_url_artikel() -> None:
    source = BY_MEDIA["detik.com"]
    anchors = [
        {"href": "https://www.detik.com/tag/penipuan-online", "text": "Halaman tag penipuan online"},
        {
            "href": "https://www.detik.com/jatim/hukum/d-7823456/penipuan-apk-modus-baru",
            "text": "Penipuan APK modus baru menyasar pengguna Android",
        },
    ]
    items = parse_anchors(anchors, source.item_pattern, source.media)
    assert [i["url"] for i in items] == [
        "https://www.detik.com/jatim/hukum/d-7823456/penipuan-apk-modus-baru"
    ]
    assert items[0]["media"] == "detik.com"


def test_detik_menolak_halaman_galeri_foto() -> None:
    """Galeri foto juga berakhiran /d-<id>/ tapi isinya cuma caption 1 paragraf."""
    source = BY_MEDIA["detik.com"]
    anchors = [
        {
            "href": "https://news.detik.com/foto-news/d-6832239/korban-penipuan-freelance",
            "text": "Korban penipuan freelance sambangi Mabes Polri",
        },
        {
            "href": "https://inet.detik.com/fotoinet/d-8481134/chat-penipu-online",
            "text": "Chat penipu online disikat netizen Indonesia",
        },
        {
            "href": "https://inet.detik.com/security/d-8728686/kebocoran-data-pelanggan",
            "text": "Data 5,7 juta akun pelanggan bocor, diminta ganti PIN",
        },
    ]
    items = parse_anchors(anchors, source.item_pattern, source.media)
    assert [i["url"] for i in items] == [
        "https://inet.detik.com/security/d-8728686/kebocoran-data-pelanggan"
    ]


def test_detik_body_selector_masih_ada_di_markup() -> None:
    """Regresi: `.detail__body-text.itp_bodycontent` sudah dihapus Detik."""
    assert BY_MEDIA["detik.com"].body_selector == ".detail__body-text, .itp_bodycontent"


def test_kompas_menerima_subdomain() -> None:
    source = BY_MEDIA["kompas.com"]
    anchors = [
        {
            "href": "https://surabaya.kompas.com/read/2026/11/06/1200000/penipuan-online-modus-baru",
            "text": "Penipuan online modus baru merugikan warga Surabaya",
        }
    ]
    items = parse_anchors(anchors, source.item_pattern, source.media)
    assert len(items) == 1
    assert items[0]["published_at"] == "2026-11-06T00:00:00+00:00"


def test_liputan6_duplikat_dan_judul_pendek() -> None:
    source = BY_MEDIA["liputan6.com"]
    url = "https://www.liputan6.com/cek-fakta/read/6123456/hoaks-undian-berhadiah"
    anchors = [
        {"href": url, "text": "Hoaks undian berhadiah saldo gratis di media sosial"},
        {"href": url, "text": "Hoaks undian berhadiah saldo gratis di media sosial"},
        {"href": "https://www.liputan6.com/read/6123457/pendek", "text": "Pendek"},
        {"href": "https://www.liputan6.com/tag/cek-fakta", "text": "Tag cek fakta liputan6 hari ini"},
    ]
    items = parse_anchors(anchors, source.item_pattern, source.media)
    assert [i["url"] for i in items] == [url]
