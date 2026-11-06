"""Engine penilaian pesan: gabungan rule-based scoring + model ML lokal.

`final_score = 100 × (rule_weight × rule_score + ml_weight × ml_probability)`
(dinormalisasi bila salah satu lapisan tidak tersedia).
"""

from __future__ import annotations

from dataclasses import dataclass

from app.config import settings
from app.ml.model import MLModel, get_model
from app.rules.rules import RuleResult, evaluate, rule_score


@dataclass(frozen=True)
class Flag:
    id: str
    title: str
    severity: str
    status: str
    evidence: str | None
    explanation: str
    advice: str
    note: str | None


@dataclass(frozen=True)
class MLInfo:
    fraud_probability: float
    model_version: str
    top_features: list[tuple[str, float]]


@dataclass(frozen=True)
class Assessment:
    risk_level: str
    score: int
    rule_score: float
    ml_score: float | None
    flags: list[Flag]
    ml: MLInfo | None
    disclaimer: str
    recommended_scenarios: list[str]

    def to_dict(self) -> dict:
        return {
            "risk_level": self.risk_level,
            "score": self.score,
            "rule_score": round(self.rule_score, 3),
            "ml_score": round(self.ml_score, 3) if self.ml_score is not None else None,
            "flags": [f.__dict__ for f in self.flags],
            "ml": {
                "fraud_probability": round(self.ml.fraud_probability, 3),
                "model_version": self.ml.model_version,
                "top_features": [
                    {"feature": k, "weight": round(v, 3)}
                    for k, v in self.ml.top_features
                ],
            }
            if self.ml is not None
            else None,
            "recommended_scenarios": self.recommended_scenarios,
            "disclaimer": self.disclaimer,
        }


DISCLAIMER = (
    "Hasil ini hanya alat bantu berpikir, bukan bukti bahwa pesan aman atau berbahaya. "
    "Pesan tanpa tanda bahaya tidak otomatis aman."
)

CATEGORY_TO_SCENARIOS = {
    "kerja": ["job-scam-01"],
    "impersonasi": ["friend-impersonation-01"],
    "giveaway": ["giveaway-01"],
    "investasi": ["investment-01"],
    "phishing": ["bank-cs-01"],
}


def level_for(score: int) -> str:
    if score >= settings.high_threshold:
        return "high"
    if score >= settings.medium_threshold:
        return "medium"
    return "low"


def _to_flags(results: list[RuleResult]) -> list[Flag]:
    flags = []
    for r in results:
        if r.status == "miss":
            continue
        flags.append(
            Flag(
                id=r.rule.id,
                title=r.rule.title,
                severity=r.rule.severity,
                status=r.status,
                evidence=r.evidence,
                explanation=r.rule.explanation,
                advice=r.rule.advice,
                note=r.note,
            )
        )
    order = {"tinggi": 0, "sedang": 1, "rendah": 2}
    flags.sort(key=lambda f: (f.status != "hit", order[f.severity]))
    return flags


def _category_from_flags(results: list[RuleResult]) -> str | None:
    hits = {r.rule.id for r in results if r.status == "hit"}
    if not hits:
        return None
    if "R06" in hits:
        return "giveaway"
    if (hits & {"R01", "R02"}) and (hits & {"R03", "R08"}):
        return "impersonasi"
    if "R04" in hits and (hits & {"R07", "R08"}):
        return "investasi"
    if "R07" in hits or "R10" in hits:
        return "phishing"
    if "R03" in hits and (hits & {"R04", "R05"}):
        return "kerja"
    if hits & {"R01", "R02"}:
        return "impersonasi"
    return None


def assess(text: str, ml_model: MLModel | None = None) -> Assessment:
    """Nilai satu teks. `ml_model=None` → cari model default (None bila tidak tersedia)."""
    results = evaluate(text)
    r_score = rule_score(results)

    model = ml_model if ml_model is not None else get_model()
    ml_info = None
    m_score = None
    if model is not None:
        prediction = model.predict(text)
        m_score = prediction.probability
        ml_info = MLInfo(
            fraud_probability=prediction.probability,
            model_version=model.version,
            top_features=prediction.top_features,
        )

    if m_score is None:
        combined = r_score
    else:
        combined = settings.rule_weight * r_score + settings.ml_weight * m_score

    score = int(round(combined * 100))
    category = _category_from_flags(results)
    recommended = CATEGORY_TO_SCENARIOS.get(category or "", [])

    return Assessment(
        risk_level=level_for(score),
        score=score,
        rule_score=r_score,
        ml_score=m_score,
        flags=_to_flags(results),
        ml=ml_info,
        disclaimer=DISCLAIMER,
        recommended_scenarios=recommended,
    )
