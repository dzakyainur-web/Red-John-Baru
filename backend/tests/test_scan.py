"""Endpoint /api/scan/{kind}: validasi format + hasil dari engine yang sama."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

import app.auth as auth
import main
from app.config import Settings

client = TestClient(main.app)


@pytest.fixture(autouse=True)
def _open_in_dev(monkeypatch: pytest.MonkeyPatch) -> None:
    fake = Settings.__new__(Settings)
    object.__setattr__(fake, "discord_bot_api_key", "")
    object.__setattr__(fake, "app_env", "development")
    monkeypatch.setattr(auth, "settings", fake)
    auth._warned = False


def _scan(kind: str, target: str, source: str = "discord") -> tuple[int, dict]:
    res = client.post(f"/api/scan/{kind}", json={"target": target, "source": source})
    return res.status_code, res.json()


def test_url_hasil_kontrak_engine() -> None:
    status, body = _scan("url", "https://instagram-verifikasi.xyz/login")
    assert status == 200
    assert body["kind"] == "url"
    assert body["source"] == "discord"
    assert body["target"] == "https://instagram-verifikasi.xyz/login"
    assessment = body["assessment"]
    assert assessment["risk_level"] in {"low", "medium", "high"}
    assert 0 <= assessment["score"] <= 100
    assert assessment["disclaimer"]


def test_url_meniru_domain_resmi_menaikkan_risiko() -> None:
    # R07: host yang memuat nama domain resmi tapi bukan domain itu sendiri.
    status, body = _scan("url", "https://instagram-verifikasi.xyz/login")
    assert status == 200
    flags = body["assessment"]["flags"]
    # Satu sinyal saja tidak wajib menaikkan level; yang diuji: indikator muncul.
    assert any(flag["id"] == "R07" and flag["status"] == "hit" for flag in flags)


def test_url_dengan_prosa_ditolak() -> None:
    status, _ = _scan("url", "buka https://contoh.xyz sekarang")
    assert status == 422


def test_url_tanpa_skema_ditolak() -> None:
    status, body = _scan("url", "instagram-verifikasi.xyz/login")
    assert status == 422
    assert "http" in body["detail"]


def test_url_tld_tidak_dikenal_ditolak() -> None:
    status, _ = _scan("url", "https://contoh.invalidtld/x")
    assert status == 422


def test_domain_dinormalisasi_ke_host() -> None:
    status, body = _scan("domain", "Contoh.XYZ")
    assert status == 200
    assert body["target"] == "contoh.xyz"


def test_domain_dengan_path_ditolak() -> None:
    status, _ = _scan("domain", "contoh.xyz/login")
    assert status == 422


def test_phone_dinormalisasi_ke_62() -> None:
    status, body = _scan("phone", "0812-3456-7890")
    assert status == 200
    assert body["target"] == "+6281234567890"


def test_phone_pendek_ditolak() -> None:
    status, body = _scan("phone", "123")
    assert status == 422
    assert "telepon" in body["detail"]


def test_bank_harus_6_sampai_20_digit() -> None:
    status, body = _scan("bank", "123-456-7890")
    assert status == 200
    assert body["target"] == "1234567890"
    status, _ = _scan("bank", "12")
    assert status == 422


def test_email() -> None:
    status, body = _scan("email", "Admin@Contoh.XYZ")
    assert status == 200
    assert body["target"] == "admin@contoh.xyz"
    status, _ = _scan("email", "bukan-email")
    assert status == 422


def test_text_dan_kosong() -> None:
    status, body = _scan("text", "Lowongan admin online gaji 15 juta, kirim foto KTP")
    assert status == 200
    assert body["kind"] == "text"
    status, _ = _scan("text", "   ")
    assert status == 422


def test_kind_tidak_dikenal_422() -> None:
    res = client.post("/api/scan/hp", json={"target": "x"})
    assert res.status_code == 422
