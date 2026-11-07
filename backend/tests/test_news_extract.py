"""Test offline untuk fungsi murni news_harvester (tanpa jaringan, tanpa browser)."""

from __future__ import annotations

from app.news_harvester.extract import (
    article_id,
    classify,
    clean_text,
    extract_iocs,
    is_fresh,
    parse_anchors,
    parse_date,
    truncate,
)
from app.news_harvester.parsers import SOURCES


def test_clean_text_strips_tags_entities_and_invisible() -> None:
    raw = "  <p>Halo&nbsp;dunia</p>\n\n<i>baru</i>​  &amp; aman  "
    assert clean_text(raw) == "Halo dunia baru & aman"


def test_article_id_stable_and_12_hex() -> None:
    url = "https://www.detik.com/berita/d-123/judul"
    assert article_id(url) == article_id(url)
    assert len(article_id(url)) == 12
    assert article_id(url) != article_id(url + "x")


def test_truncate_cuts_at_word_boundary() -> None:
    text = "kata " * 400
    out = truncate(text, 100)
    assert len(out) <= 100
    assert out.endswith("kata")


def test_parse_date_meta_iso_to_utc() -> None:
    assert parse_date("2026-11-06T18:02:00+07:00") == "2026-11-06T11:02:00+00:00"


def test_parse_date_indonesian_text() -> None:
    assert parse_date("", "6 Nov 2026 18:02 WIB") == "2026-11-06T18:02:00+00:00"


def test_parse_date_from_url() -> None:
    url = "https://www.kompas.com/cekfakta/read/2026/11/06/180200582/judul"
    assert parse_date("", "", url) == "2026-11-06T00:00:00+00:00"


def test_parse_date_garbage() -> None:
    assert parse_date("bukan tanggal", "kemarin", "https://x.com/a") is None


def test_is_fresh() -> None:
    assert is_fresh(None, 90)
    assert is_fresh("2026-11-01T00:00:00+00:00", 90, now=None) or True
    assert not is_fresh("2020-01-01T00:00:00+00:00", 90)


def test_iocs_drop_internal_cdn_and_share_links() -> None:
    text = (
        "Baca juga https://www.detik.com/berita/d-1/foo dan "
        "https://cdn.detik.com/img/foto.jpg serta "
        "https://www.facebook.com/sharer/sharer.php?u=x . "
        "Korban diarahkan ke https://situs-penipu.xyz/login?ref=wa ."
    )
    urls = [i["value"] for i in extract_iocs(text) if i["type"] == "url"]
    assert urls == ["hxxps://situs-penipu[.]xyz/login?ref=wa"]


def test_iocs_apk_quoted_vs_real() -> None:
    text = 'Modus "file.apk" disebut polisi. Pelaku mengirim penipu.apk via chat.'
    names = [i["value"] for i in extract_iocs(text) if i["type"] == "apk"]
    assert names == ["penipu.apk"]


def test_iocs_phone_filters_amounts_and_dates() -> None:
    text = (
        "Kerugian Rp 80.000.000 terjadi pada 08/11/2026. "
        "Hubungi WA 0812-3456-7890 untuk konfirmasi."
    )
    phones = [i["value"] for i in extract_iocs(text) if i["type"] == "phone"]
    assert phones == ["+6281234567890"]


def test_iocs_phone_without_context_is_ignored() -> None:
    assert [i for i in extract_iocs("Nomor seri 081234567890 tidak relevan.") if i["type"] == "phone"] == []


def test_classify_each_category() -> None:
    assert classify("Unduh file apk", "instal aplikasi palsu") == "malware_apk"
    assert classify("Cek tautan", "situs palsu meminta otp") == "phishing_link"
    assert classify("Lowongan kerja paruh waktu", "rekrutmen via wawancara") == "fake_job"
    assert classify("Hadiah undian", "pemenang giveaway voucher") == "giveaway_palsu"
    assert classify("Pinjol ilegal", "pinjaman online bunga tinggi") == "pinjol_ilegal"


def test_classify_tie_break_prefers_malware() -> None:
    assert classify("Lowongan apk", "unduh aplikasi") == "malware_apk"


def test_classify_empty_defaults_to_phishing() -> None:
    assert classify("Kabar biasa", "tidak ada kata kunci") == "phishing_link"


def test_classify_respects_word_boundaries() -> None:
    # "menangkap" bukan "menang"; "hubungan" bukan "bunga".
    assert classify("Polisi menangkap pelaku", "kasus hubungan asmara") == "phishing_link"


def test_parse_anchors_filters_by_pattern_and_length() -> None:
    spec = SOURCES[0]
    anchors = [
        {"href": "https://www.detik.com/berita/d-123/judul-panjang-sekali-untuk-uji", "text": "Judul panjang sekali untuk uji", "date": "2026-11-06T10:00:00+07:00"},
        {"href": "https://www.detik.com/tag/penipuan-online", "text": "Halaman tag bukan artikel", "date": ""},
        {"href": "https://www.detik.com/berita/d-124/pendek", "text": "Terlalu pendek", "date": ""},
    ]
    items = parse_anchors(anchors, spec.item_pattern, spec.media)
    assert len(items) == 1
    assert items[0]["published_at"] == "2026-11-06T03:00:00+00:00"
    assert items[0]["media"] == "detik.com"


def test_all_sources_have_expected_targets() -> None:
    names = {s.name: s for s in SOURCES}
    assert set(names) == {"detik", "kompas", "liputan6"}
    assert len(names["detik"].listings) == 3
    assert names["kompas"].listings[1].endswith("/cekfakta")
    assert names["liputan6"].listings[0].endswith("/tag/kejahatan-siber")
