import pytest
from pydantic import ValidationError

from app.quiz import QuizAnswerIn, QuizQuestionCreate, QuizQuestionUpdate
from app.quiz_store import evaluate_answer, to_public


def question_data(kind="multiple_choice"):
    data = {
        "round_number": 1,
        "chapter_title": "Bab I",
        "title": "Pesan mencurigakan",
        "kind": kind,
        "threat_type": "Phishing",
        "story_context": "Pesan masuk di malam hari.",
        "red_john_message": "Kirim kode OTP sekarang!",
        "jane_clue": "Jangan bagikan kode OTP.",
        "debrief": {
            "summary": "OTP bersifat rahasia.",
            "safe_action": "Tolak dan verifikasi lewat kanal resmi.",
            "red_john_tactic": "Menciptakan kepanikan.",
        },
        "is_active": True,
    }
    if kind == "text_input":
        data.update(choices=None, text_config={
            "prompt": "Apa responsmu?",
            "placeholder": "Ketik jawaban",
            "rules": [{
                "is_safe": True, "keywords": ["tolak"], "digits_min": None,
                "digits_max": None, "consequence": "Akun tetap aman.",
                "jane_intervention": "Penolakan tepat.", "manipulation_tactic": "Tidak ada",
            }],
            "default": {
                "is_safe": False, "keywords": [], "digits_min": None,
                "digits_max": None, "consequence": "Jawaban tidak aman.",
                "jane_intervention": "Periksa ulang.", "manipulation_tactic": "Urgensi",
            },
        })
    else:
        data.update(text_config=None, choices=[
            {"id": "safe", "text": "Tolak", "is_safe": True,
             "consequence": "Aman", "jane_intervention": "Tepat.",
             "manipulation_tactic": "Urgensi"},
            {"id": "unsafe", "text": "Kirim", "is_safe": False,
             "consequence": "Akun dibajak", "jane_intervention": "Jangan kirim.",
             "manipulation_tactic": "Urgensi"},
        ])
    return data


def test_public_question_never_exposes_correct_answers_or_text_rules():
    public = to_public({"id": "q1", **question_data()}).model_dump()
    assert public["choices"] == [{"id": "safe", "text": "Tolak"},
                                  {"id": "unsafe", "text": "Kirim"}]
    assert "text_config" not in public
    assert "is_safe" not in public["choices"][0]


def test_choice_answer_is_scored_server_side():
    question = {"id": "q1", **question_data()}
    assert evaluate_answer(question, QuizAnswerIn(choice_id="safe"))["points_base"] == 100
    assert evaluate_answer(question, QuizAnswerIn(choice_id="unsafe"))["points_base"] == 0
    with pytest.raises(ValueError):
        evaluate_answer(question, QuizAnswerIn(choice_id="missing"))


def test_text_answer_normalizes_case_and_uses_default():
    question = {"id": "q2", **question_data("text_input")}
    assert evaluate_answer(question, QuizAnswerIn(text="  saya   TOLAK "))["is_safe"] is True
    assert evaluate_answer(question, QuizAnswerIn(text="ini 123456"))["is_safe"] is False


def test_question_requires_exactly_one_safe_choice():
    data = question_data()
    data["choices"][1]["is_safe"] = True
    with pytest.raises(ValidationError):
        QuizQuestionCreate.model_validate(data)


def test_public_only_fields_cannot_be_written():
    with pytest.raises(ValidationError):
        QuizQuestionUpdate.model_validate({**question_data(), "input_prompt": "berbahaya"})
