from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.config import settings

ContextKind = Literal["dm", "sms", "email", "lowongan", "umum"]


class CheckRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        max_length=settings.max_input_chars,
        description="Teks pesan/tautan/profil yang ingin diperiksa.",
    )
    context: ContextKind = Field(
        default="umum",
        description="Konteks sumber pesan (opsional).",
    )

    @field_validator("text")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Teks tidak boleh kosong.")
        return value


class FlagOut(BaseModel):
    id: str
    title: str
    severity: Literal["tinggi", "sedang", "rendah"]
    status: Literal["hit", "partial"]
    evidence: str | None
    explanation: str
    advice: str
    note: str | None


class MLFeatureOut(BaseModel):
    feature: str
    weight: float


class MLOut(BaseModel):
    fraud_probability: float
    model_version: str
    top_features: list[MLFeatureOut]


class CheckResponse(BaseModel):
    risk_level: Literal["low", "medium", "high"]
    score: int
    rule_score: float
    ml_score: float | None
    flags: list[FlagOut]
    ml: MLOut | None
    recommended_scenarios: list[str]
    disclaimer: str


class ExampleOut(BaseModel):
    id: str
    label: Literal["scam", "legit"]
    category: str
    text: str


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    ml_loaded: bool
    model_version: str | None


class NewsItemOut(BaseModel):
    id: str
    title: str
    url: str
    source: str
    published_at: str | None
    snippet: str
    categories: list[str]


class NewsListOut(BaseModel):
    items: list[NewsItemOut]
    total: int
    limit: int
    offset: int
    updated_at: str | None
    configured: bool
