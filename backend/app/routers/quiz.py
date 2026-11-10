"""API bank soal kuis. Auth admin diverifikasi ke Supabase pada setiap request."""
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from postgrest.exceptions import APIError

from app import quiz_daily, quiz_store
from app.news_harvester import store
from app.quiz import (LeaderboardEntry, QuizAnswerIn, QuizAnswerOut, QuizLeaderboardOut,
                      QuizQuestionAdmin, QuizQuestionCreate, QuizQuestionPublic,
                      QuizQuestionUpdate)

router = APIRouter(prefix="/quiz", tags=["quiz"])


def require_client() -> None:
    if store.get_store() is None:
        raise HTTPException(503, "Supabase tidak dikonfigurasi.")


def _bearer_token(authorization: str | None) -> str | None:
    if not authorization or authorization[:7].lower() != "bearer ":
        return None
    return authorization[7:].strip() or None


async def optional_user_id(authorization: str | None) -> str | None:
    """User id dari token Supabase bila valid. Endpoint jawaban tetap publik:
    setiap kegagalan di sini hanya berarti skor tidak masuk leaderboard."""
    token = _bearer_token(authorization)
    if token is None or store.get_store() is None:
        return None
    try:
        response = await store.get_store().auth.get_user(token)
    except Exception:  # noqa: BLE001 - sesi tidak valid bukan error pemain
        return None
    return getattr(getattr(response, "user", None), "id", None)


async def require_quiz_admin(authorization: Annotated[str | None, Header()] = None) -> str:
    require_client()
    if not authorization or authorization[:7].lower() != "bearer ":
        raise HTTPException(401, "Login admin diperlukan.")
    try:
        response = await store.get_store().auth.get_user(authorization[7:].strip())
    except Exception as exc:
        raise HTTPException(401, "Sesi login tidak valid atau kedaluwarsa.") from exc
    try:
        role = await quiz_store.get_user_role(response.user.id)
    except APIError as exc:
        if exc.code in {"42P01", "42703", "PGRST205"}:
            raise HTTPException(503, "Tabel profiles belum ada. Jalankan migrasi 007_profiles.sql.") from exc
        raise translate_db_error(exc) from exc
    if role != "admin":
        raise HTTPException(403, "Akun ini tidak memiliki akses admin kuis.")
    return response.user.email or response.user.id


def translate_db_error(exc: APIError) -> HTTPException:
    if exc.code == "23505":
        return HTTPException(409, "ID atau nomor soal sudah digunakan.")
    if exc.code in {"42P01", "42703"}:
        return HTTPException(503, "Skema kuis belum tersedia. Jalankan migrasi 006_quiz_questions.sql.")
    if exc.code == "23514":
        return HTTPException(422, "Struktur soal tidak sesuai dengan tipe yang dipilih.")
    return HTTPException(502, f"Gagal mengakses database: {exc.code}")


@router.get("/questions", response_model=list[QuizQuestionPublic])
async def public_questions() -> list[QuizQuestionPublic]:
    require_client()
    try:
        return [quiz_store.to_public(row) for row in await quiz_store.list_questions()]
    except APIError as exc:
        raise translate_db_error(exc) from exc


@router.get("/admin/questions", response_model=list[QuizQuestionAdmin])
async def admin_questions(_: Annotated[str, Depends(require_quiz_admin)]) -> list[dict]:
    try:
        return await quiz_store.list_questions(admin=True)
    except APIError as exc:
        raise translate_db_error(exc) from exc


@router.post("/admin/questions", response_model=QuizQuestionAdmin, status_code=201)
async def create_question(payload: QuizQuestionCreate,
                          _: Annotated[str, Depends(require_quiz_admin)]) -> dict:
    try:
        return await quiz_store.create_question(payload)
    except (IndexError, RuntimeError) as exc:
        raise HTTPException(503, "Gagal menyimpan soal. Periksa konfigurasi Supabase.") from exc
    except APIError as exc:
        raise translate_db_error(exc) from exc


@router.patch("/admin/questions/{question_id}", response_model=QuizQuestionAdmin)
async def update_question(question_id: str, payload: QuizQuestionUpdate,
                          _: Annotated[str, Depends(require_quiz_admin)]) -> dict:
    try:
        row = await quiz_store.update_question(question_id, payload)
    except APIError as exc:
        raise translate_db_error(exc) from exc
    if row is None:
        raise HTTPException(404, "Soal tidak ditemukan.")
    return row


@router.delete("/admin/questions/{question_id}", response_model=QuizQuestionAdmin)
async def archive_question(question_id: str,
                           _: Annotated[str, Depends(require_quiz_admin)]) -> dict:
    require_client()
    try:
        row = await quiz_store.get_question(question_id, active_only=False)
    except APIError as exc:
        raise translate_db_error(exc) from exc
    if row is None:
        raise HTTPException(404, "Soal tidak ditemukan.")
    try:
        return await quiz_store.update_question(question_id, QuizQuestionUpdate.model_validate({**row, "is_active": False}))
    except APIError as exc:
        raise translate_db_error(exc) from exc


@router.post("/questions/{question_id}/answer", response_model=QuizAnswerOut)
async def answer_question(
    question_id: str,
    answer: QuizAnswerIn,
    authorization: Annotated[str | None, Header()] = None,
) -> QuizAnswerOut:
    require_client()
    try:
        row = await quiz_store.get_question(question_id)
    except APIError as exc:
        raise translate_db_error(exc) from exc
    if row is None:
        raise HTTPException(404, "Soal tidak ditemukan atau tidak aktif.")
    try:
        result = quiz_store.evaluate_answer(row, answer)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    points = quiz_daily.points_for(result["points_base"], answer.difficulty, answer.clue_penalty)
    counted = False
    if points > 0:
        user_id = await optional_user_id(authorization)
        if user_id:
            counted = await quiz_daily.record_score(
                user_id, question_id, quiz_daily.quiz_day(), points
            )
    return QuizAnswerOut.model_validate({**result, "points_awarded": points, "counted": counted})


@router.get("/leaderboard", response_model=QuizLeaderboardOut)
async def leaderboard(limit: Annotated[int, Query(ge=1, le=50)] = 20) -> QuizLeaderboardOut:
    """Papan peringkat periode berjalan. Publik; skor butuh login saat menjawab."""
    require_client()
    moment = quiz_daily.now_wib()
    day = quiz_daily.quiz_day(moment)
    try:
        entries = await quiz_daily.top_scores(day, limit)
    except APIError as exc:
        if exc.code in {"42P01", "PGRST202"}:
            raise HTTPException(503, "Jalankan migrasi 008_quiz_leaderboard.sql.") from exc
        raise translate_db_error(exc) from exc
    return QuizLeaderboardOut(
        day=day.isoformat(),
        label=quiz_daily.window_label(day),
        resets_at=quiz_daily.resets_at(moment).isoformat(timespec="seconds"),
        server_now=moment.isoformat(timespec="seconds"),
        entries=[LeaderboardEntry.model_validate(e) for e in entries],
    )
