from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from typing import Literal, Self

from app.news_harvester.extract import clean_text

QuizKind = Literal["multiple_choice", "binary", "text_input"]

class QuizChoice(BaseModel):
    id: str = Field(min_length=1, max_length=30)
    text: str = Field(min_length=1, max_length=1000)
    is_safe: bool
    consequence: str = Field(min_length=1, max_length=2000)
    jane_intervention: str = Field(min_length=1, max_length=2000)
    manipulation_tactic: str = Field(min_length=1, max_length=500)

class QuizFeedback(BaseModel):
    is_safe: bool
    keywords: list[str] = Field(default_factory=list, max_length=30)
    digits_min: int | None = Field(default=None, ge=4, le=8)
    digits_max: int | None = Field(default=None, ge=4, le=8)
    red_john_reaction: str = Field(default="", max_length=2000)
    consequence: str = Field(min_length=1, max_length=2000)
    jane_intervention: str = Field(min_length=1, max_length=2000)
    manipulation_tactic: str = Field(min_length=1, max_length=500)

    @field_validator("keywords")
    @classmethod
    def normalize_keywords(cls, values: list[str]) -> list[str]:
        return list(dict.fromkeys(v.strip().lower() for v in values if v.strip()))

class QuizTextConfig(BaseModel):
    prompt: str = Field(min_length=1, max_length=1000)
    placeholder: str = Field(default="", max_length=300)
    rules: list[QuizFeedback] = Field(min_length=1, max_length=10)
    @model_validator(mode="after")
    def validate_rules(self) -> Self:
        for rule in [*self.rules, self.default]:
            if (rule.digits_min is None) != (rule.digits_max is None):
                raise ValueError("Rentang digit harus memiliki batas bawah dan atas.")
            if rule.digits_min is not None and rule.digits_max is not None and rule.digits_min > rule.digits_max:
                raise ValueError("Batas bawah digit tidak boleh melebihi batas atas.")
        return self


class QuizDebrief(BaseModel):
    summary: str = Field(min_length=1, max_length=2000)
    safe_action: str = Field(min_length=1, max_length=2000)
    red_john_tactic: str = Field(min_length=1, max_length=1000)

class QuizQuestionBase(BaseModel):
    model_config = ConfigDict(extra="forbid")
    round_number: int = Field(ge=1, le=10000)
    chapter_title: str = Field(min_length=1, max_length=200)
    title: str = Field(min_length=3, max_length=300)
    kind: QuizKind
    threat_type: str = Field(min_length=1, max_length=300)
    story_context: str = Field(min_length=1, max_length=3000)
    red_john_message: str = Field(min_length=1, max_length=3000)
    red_john_note: str | None = Field(default=None, max_length=2000)
    red_john_taunt: str | None = Field(default=None, max_length=2000)
    jane_clue: str = Field(min_length=1, max_length=3000)
    choices: list[QuizChoice] | None = None
    text_config: QuizTextConfig | None = None
    debrief: QuizDebrief
    is_active: bool = True

    @model_validator(mode="after")
    def validate_kind(self) -> Self:
        if self.kind == "text_input":
            if self.text_config is None or self.choices is not None:
                raise ValueError("Soal teks memerlukan text_config dan tidak boleh memiliki choices.")
        elif self.choices is None or self.text_config is not None:
            raise ValueError("Soal pilihan memerlukan choices dan tidak boleh memiliki text_config.")
        elif not 2 <= len(self.choices) <= 5:
            raise ValueError("Soal pilihan harus memiliki 2–5 pilihan.")
        elif self.kind == "binary" and len(self.choices) != 2:
            raise ValueError("Soal binary harus memiliki tepat 2 pilihan.")
        elif len({c.id for c in self.choices}) != len(self.choices):
            raise ValueError("ID pilihan harus unik.")
        elif sum(c.is_safe for c in self.choices) != 1:
            raise ValueError("Soal harus memiliki tepat satu pilihan aman.")
        return self

    @field_validator("chapter_title", "title", "threat_type", "story_context",
                     "red_john_message", "red_john_note", "red_john_taunt", "jane_clue")
    @classmethod
    def clean_strings(cls, value: str | None) -> str | None:
        return clean_text(value) if value is not None else None

class QuizQuestionCreate(QuizQuestionBase):
    id: str | None = Field(default=None, min_length=1, max_length=80, pattern=r"^[a-z0-9-]+$")

class QuizQuestionUpdate(QuizQuestionBase):
    pass

class QuizQuestionAdmin(QuizQuestionBase):
    id: str
    created_at: str | None = None
    updated_at: str | None = None

class QuizQuestionPublic(BaseModel):
    id: str
    round_number: int
    chapter_title: str
    title: str
    kind: QuizKind
    threat_type: str
    story_context: str
    red_john_message: str
    red_john_note: str | None = None
    red_john_taunt: str | None = None
    jane_clue: str
    choices: list[dict] | None = None
    input_prompt: str | None = None
    input_placeholder: str | None = None
    debrief: QuizDebrief

class QuizAnswerIn(BaseModel):
    choice_id: str | None = Field(default=None, max_length=30)
    text: str | None = Field(default=None, max_length=1000)

class QuizAnswerOut(BaseModel):
    is_safe: bool
    user_said: str
    red_john_reaction: str = ""
    consequence: str
    jane_intervention: str
    manipulation_tactic: str
    points_base: int
