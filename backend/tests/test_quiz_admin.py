"""Auth admin kuis: hanya public.profiles.role = "admin" yang lolos."""

from __future__ import annotations

import asyncio
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app import quiz_store
from app.news_harvester import store
from app.routers import quiz


def run_auth(role: str | None, authorization: str | None = "Bearer tok") -> str:
    user = SimpleNamespace(id="user-1", email="budi@contoh.id")

    async def get_user(_: str):
        return SimpleNamespace(user=user)

    async def get_role(_: str) -> str:
        return quiz_store.normalize_role(role)

    fake = SimpleNamespace(auth=SimpleNamespace(get_user=get_user))

    async def call() -> str:
        return await quiz.require_quiz_admin(authorization=authorization)

    orig_store, orig_role = store.get_store, quiz_store.get_user_role
    store.get_store = lambda: fake
    quiz_store.get_user_role = get_role
    try:
        return asyncio.run(call())
    finally:
        store.get_store = orig_store
        quiz_store.get_user_role = orig_role


def test_role_admin_lolos() -> None:
    assert run_auth("admin") == "budi@contoh.id"


def test_role_user_ditolak() -> None:
    with pytest.raises(HTTPException) as exc:
        run_auth("user")
    assert exc.value.status_code == 403


def test_tanpa_profil_ditolak() -> None:
    with pytest.raises(HTTPException) as exc:
        run_auth(None)
    assert exc.value.status_code == 403


def test_tanpa_bearer_ditolak() -> None:
    with pytest.raises(HTTPException) as exc:
        run_auth("admin", authorization=None)
    assert exc.value.status_code == 401
