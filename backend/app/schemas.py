from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

from app.config import settings
from app.news_harvester.extract import clean_text

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
    url: str | None
    source: str
    published_at: str | None
    snippet: str
    categories: list[str]
    image_url: str | None = None


class NewsListOut(BaseModel):
    items: list[NewsItemOut]
    total: int
    limit: int
    offset: int
    updated_at: str | None
    configured: bool


# --- Scan terstruktur (dipakai Discord Bot via /api/scan/{kind}) ---------------

ScanKind = Literal["url", "domain", "text", "phone", "bank", "email"]
ScanSource = Literal["discord", "web", "api"]


class ScanRequest(BaseModel):
    """Input satu target. Validasi format per `kind` ada di router scan."""

    target: str = Field(
        ...,
        min_length=1,
        max_length=settings.max_input_chars,
        description="URL, domain, teks, nomor telepon, nomor rekening, atau email.",
    )
    source: ScanSource = Field(default="discord")

    @field_validator("target")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Target tidak boleh kosong.")
        return value


class ScanResponse(BaseModel):
    """Hasil pemeriksaan. `assessment` memakai kontrak `CheckResponse` yang sama."""

    kind: ScanKind
    target: str
    source: ScanSource
    assessment: CheckResponse


# --- Panel admin: CRUD ancaman ------------------------------------------------

ThreatStatus = Literal["pending", "verified", "rejected"]
ThreatCategory = Literal[
    "fake_job", "phishing_link", "giveaway_palsu", "malware_apk", "pinjol_ilegal"
]
ThreatSource = Literal["scraped", "user_report"]
IndicatorType = Literal["url", "apk", "phone", "bank_account"]
ReporterPlatform = Literal["discord", "web"]

_STATUS_ALIASES = {"pending", "verified", "rejected"}


def _lower(value: object) -> object:
    return value.strip().lower() if isinstance(value, str) else value


def _clean(value: str | None, *, low: int, high: int, field: str) -> str | None:
    """Bersihkan HTML/entitas seperti pipeline scraper, lalu cek panjang kolom SQL.

    Tanpa ini judul berisi markup bisa lolos min_length lalu ditolak constraint
    database (500), bukan 422.
    """
    if value is None:
        return None
    cleaned = clean_text(value)
    if not low <= len(cleaned) <= high:
        raise ValueError(f"{field} harus {low}–{high} karakter setelah pembersihan.")
    return cleaned


def _clean_url(value: str | None) -> str | None:
    """Batas kepercayaan: tolak skema selain http(s) sebelum masuk DB."""
    if value is not None and not value.startswith(("http://", "https://")):
        raise ValueError("URL harus diawali http:// atau https://.")
    return value or None


class Indicator(BaseModel):
    type: IndicatorType
    value: str = Field(..., min_length=1, max_length=300)


class ThreatOut(BaseModel):
    id: str
    title: str
    category: ThreatCategory
    description: str
    scammer_indicators: list[Indicator]
    source_url: str | None
    source_media: str
    source_type: ThreatSource
    status: ThreatStatus
    published_at: str | None
    created_at: str | None
    updated_at: str | None
    reporter_platform: ReporterPlatform | None = None
    reporter_id: str | None = None
    reporter_name: str | None = None


class ThreatListOut(BaseModel):
    items: list[ThreatOut]
    total: int
    limit: int
    offset: int
    configured: bool


class ThreatCreate(BaseModel):
    title: str = Field(..., min_length=10, max_length=300)
    category: ThreatCategory
    description: str = Field(..., min_length=1, max_length=1200)
    scammer_indicators: list[Indicator] = Field(default_factory=list, max_length=50)
    source_url: str | None = Field(default=None, max_length=2000)

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        return _clean(value, low=10, high=300, field="Judul") or ""

    @field_validator("description")
    @classmethod
    def clean_description(cls, value: str) -> str:
        return _clean(value, low=1, high=1200, field="Deskripsi") or ""

    @field_validator("source_url")
    @classmethod
    def clean_source_url(cls, value: str | None) -> str | None:
        return _clean_url(value)


class ThreatUpdate(BaseModel):
    """PATCH parsial: hanya field yang dikirim yang ditulis."""

    title: str | None = Field(default=None, min_length=10, max_length=300)
    category: ThreatCategory | None = None
    description: str | None = Field(default=None, min_length=1, max_length=1200)
    scammer_indicators: list[Indicator] | None = Field(default=None, max_length=50)
    source_url: str | None = Field(default=None, max_length=2000)
    status: ThreatStatus | None = None

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str | None) -> str | None:
        return _clean(value, low=10, high=300, field="Judul")

    @field_validator("description")
    @classmethod
    def clean_description(cls, value: str | None) -> str | None:
        return _clean(value, low=1, high=1200, field="Deskripsi")

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, value: object) -> object:
        value = _lower(value)
        if value is not None and value not in _STATUS_ALIASES:
            raise ValueError("Status tidak dikenal.")
        return value

    @field_validator("source_url")
    @classmethod
    def clean_source_url(cls, value: str | None) -> str | None:
        return _clean_url(value)


StatusFilter = Literal["all", "pending", "verified", "rejected"]
SourceFilter = Literal["all", "scraped", "user_report"]
CategoryFilter = Literal[
    "all", "fake_job", "phishing_link", "giveaway_palsu", "malware_apk", "pinjol_ilegal"
]


# --- Laporan publik (website & Discord Bot) ------------------------------------


class Reporter(BaseModel):
    """Identitas pelapor. `id` = Discord user id atau id akun website."""

    platform: ReporterPlatform
    id: str = Field(..., min_length=1, max_length=64)
    name: str | None = Field(default=None, max_length=100)


class ReportCreate(BaseModel):
    """Laporan publik. Server memaksa `status=pending`; klien tidak bisa memilih status."""

    category: ThreatCategory
    title: str = Field(..., min_length=10, max_length=300)
    description: str = Field(..., min_length=1, max_length=1200)
    target: str | None = Field(
        default=None,
        max_length=2000,
        description="URL/nomor/rekening/nama file APK milik pelaku (opsional).",
    )
    reporter: Reporter

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        return _clean(value, low=10, high=300, field="Judul") or ""

    @field_validator("description")
    @classmethod
    def clean_description(cls, value: str) -> str:
        return _clean(value, low=1, high=1200, field="Deskripsi") or ""

    @field_validator("target")
    @classmethod
    def clean_target(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = clean_text(value)
        return cleaned or None


class ReportStatusOut(BaseModel):
    """Ringkasan status untuk pelapor. Sengaja tanpa judul/deskripsi/indikator."""

    id: str
    category: ThreatCategory
    status: ThreatStatus
    created_at: str | None
    updated_at: str | None


# --- Konfigurasi per Discord Guild --------------------------------------------


class GuildConfigOut(BaseModel):
    guild_id: str
    alert_channel_id: str | None
    news_channel_id: str | None = None
    protection_enabled: bool
    notification_categories: list[ThreatCategory]
    updated_at: str | None


class GuildConfigUpdate(BaseModel):
    """PATCH parsial: hanya field yang dikirim yang ditulis.

    Channel memakai `model_fields_set` karena None sah (matikan channel).
    """

    alert_channel_id: str | None = Field(default=None, max_length=32)
    news_channel_id: str | None = Field(default=None, max_length=32)
    protection_enabled: bool | None = None
    notification_categories: list[ThreatCategory] | None = Field(default=None, max_length=5)

    @field_validator("alert_channel_id", "news_channel_id")
    @classmethod
    def digits_only(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value.isdigit():
            raise ValueError("ID channel Discord harus berupa angka.")
        return value


# --- Outbox bot Discord (alur: panel admin -> backend -> bot polling) ----------


class BroadcastRequest(BaseModel):
    """Permintaan dari panel /admin agar bot memposting berita acak ke guild ini."""

    guild_id: str = Field(min_length=1, max_length=32)

    @field_validator("guild_id")
    @classmethod
    def guild_digits(cls, value: str) -> str:
        value = value.strip()
        if not value.isdigit():
            raise ValueError("ID guild Discord harus berupa angka.")
        return value


class BroadcastQueuedOut(BaseModel):
    status: Literal["queued"] = "queued"
    message: str = (
        "Permintaan diterima. Bot akan memposting 5 berita acak ke channel "
        "berita server ini dalam beberapa detik."
    )


class BotEventOut(BaseModel):
    """Job yang diklaim bot. Tanpa `error`/status internal lain."""

    id: int
    guild_id: str
    kind: Literal["news_broadcast", "leaderboard"]
    payload: dict[str, Any] | None = None


class BotEventFinishIn(BaseModel):
    error: str | None = Field(default=None, max_length=1000)
