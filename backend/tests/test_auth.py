"""Auth service-to-service: bypass dev, 401 key salah, 503 di production tanpa key."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

import app.auth as auth
import main
from app.config import Settings

client = TestClient(main.app)


@pytest.fixture(autouse=True)
def _reset_warned() -> None:
    auth._warned = False


def _settings(monkeypatch: pytest.MonkeyPatch, *, key: str, env: str) -> None:
    # Settings frozen: ganti objek `settings` di modul auth saja.
    fake = Settings.__new__(Settings)
    object.__setattr__(fake, "discord_bot_api_key", key)
    object.__setattr__(fake, "app_env", env)
    monkeypatch.setattr(auth, "settings", fake)


def test_key_benar_lolos(monkeypatch: pytest.MonkeyPatch) -> None:
    _settings(monkeypatch, key="rahasia", env="production")
    res = client.post(
        "/api/scan/url",
        json={"target": "https://contoh.xyz/login"},
        headers={"X-API-Key": "rahasia"},
    )
    assert res.status_code == 200


def test_key_salah_dan_kosong_401(monkeypatch: pytest.MonkeyPatch) -> None:
    _settings(monkeypatch, key="rahasia", env="production")
    for headers in ({}, {"X-API-Key": "salah"}):
        res = client.post(
            "/api/scan/url", json={"target": "https://contoh.xyz/login"}, headers=headers
        )
        assert res.status_code == 401
        assert res.json()["detail"] == "API key tidak valid."


def test_key_backend_kosong_dev_lolos(monkeypatch: pytest.MonkeyPatch) -> None:
    _settings(monkeypatch, key="", env="development")
    res = client.post("/api/scan/text", json={"target": "hadiah gratis"})
    assert res.status_code == 200


def test_key_backend_kosong_production_503(monkeypatch: pytest.MonkeyPatch) -> None:
    _settings(monkeypatch, key="", env="production")
    res = client.post("/api/scan/text", json={"target": "hadiah gratis"})
    assert res.status_code == 503
