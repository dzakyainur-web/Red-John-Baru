"""Storage dan penilaian kuis. Jawaban benar hanya tersedia di server/admin."""
from __future__ import annotations

import re
from typing import Any
from uuid import uuid4

from app.news_harvester import store
from app.quiz import QuizAnswerIn, QuizQuestionBase, QuizQuestionPublic

TABLE = "quiz_questions"
PROFILES = "profiles"


def to_public(row: dict[str, Any]) -> QuizQuestionPublic:
    config = row.get("text_config") or {}
    choices = row.get("choices")
    return QuizQuestionPublic.model_validate({
        **row,
        "choices": [{"id": c["id"], "text": c["text"]} for c in choices] if choices else None,
        "text_config": None,
        "input_prompt": config.get("prompt"),
        "input_placeholder": config.get("placeholder"),
    })


def normalize_role(role: str | None) -> str:
    """public.profiles.role -> 'admin' bila persis 'admin', selain itu 'user'."""
    return "admin" if role == "admin" else "user"


async def get_user_role(user_id: str) -> str:
    """Role dari public.profiles. Panggil hanya setelah token Supabase diverifikasi."""
    sb = store.get_store()
    if sb is None:
        raise RuntimeError("Supabase tidak dikonfigurasi.")
    result = await sb.table(PROFILES).select("role").eq("id", user_id).limit(1).execute()
    return normalize_role(result.data[0]["role"] if result.data else None)


def _match(rule: dict[str, Any], text: str) -> bool:
    # Kata kunci literal, bukan regex dari admin. Semua kata harus ada.
    keywords = rule.get("keywords") or []
    if not all(k in text for k in keywords):
        return False
    low = rule.get("digits_min")
    high = rule.get("digits_max")
    if low is not None and high is not None:
        if not re.search(rf"(?<!\d)\d{{{low},{high}}}(?!\d)", text):
            return False
    return True


def evaluate_text(config: dict[str, Any], raw: str) -> dict[str, Any]:
    text = " ".join(raw.lower().split())
    for rule in config["rules"]:
        if _match(rule, text):
            return {**rule, "user_said": raw}
    return {**config["default"], "user_said": raw}


def evaluate_answer(row: dict[str, Any], answer: QuizAnswerIn) -> dict[str, Any]:
    if row["kind"] == "text_input":
        if not answer.text or not answer.text.strip():
            raise ValueError("Jawaban teks tidak boleh kosong.")
        result = evaluate_text(row["text_config"], answer.text.strip())
    else:
        if not answer.choice_id:
            raise ValueError("Pilihan jawaban wajib diisi.")
        choice = next((c for c in row["choices"] if c["id"] == answer.choice_id), None)
        if choice is None:
            raise ValueError("Pilihan tidak ditemukan pada soal ini.")
        result = {**choice, "user_said": choice["text"]}
    result["points_base"] = 100 if result["is_safe"] else 0
    return result


def create_row(payload: QuizQuestionBase, question_id: str | None = None) -> dict[str, Any]:
    return {"id": question_id or f"quiz-{uuid4().hex[:12]}", **payload.model_dump()}


async def list_questions(*, admin: bool = False) -> list[dict[str, Any]]:
    sb = store.get_store()
    if sb is None:
        return []
    query = sb.table(TABLE).select("*")
    if not admin:
        query = query.eq("is_active", True)
    result = await query.order("round_number").order("created_at").execute()
    return list(result.data or [])


async def get_question(question_id: str, *, active_only: bool = True) -> dict[str, Any] | None:
    sb = store.get_store()
    if sb is None:
        return None
    query = sb.table(TABLE).select("*").eq("id", question_id)
    if active_only:
        query = query.eq("is_active", True)
    result = await query.limit(1).execute()
    return result.data[0] if result.data else None


async def create_question(payload: QuizQuestionBase) -> dict[str, Any]:
    sb = store.get_store()
    if sb is None:
        raise RuntimeError("Supabase tidak dikonfigurasi.")
    result = await sb.table(TABLE).insert(create_row(payload)).execute()
    return result.data[0]


async def update_question(question_id: str, payload: QuizQuestionBase) -> dict[str, Any] | None:
    sb = store.get_store()
    if sb is None:
        raise RuntimeError("Supabase tidak dikonfigurasi.")
    result = await sb.table(TABLE).update(payload.model_dump()).eq("id", question_id).execute()
    return result.data[0] if result.data else None
