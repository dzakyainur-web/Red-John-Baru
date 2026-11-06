from __future__ import annotations

"""Router untuk endpoint pemeriksaan pesan."""

from fastapi import APIRouter

from app.engine import assess
from app.ml.model import get_model
from app.schemas import CheckRequest, CheckResponse

router = APIRouter(tags=["check"])


@router.post("/check", response_model=CheckResponse)
def check(payload: CheckRequest) -> CheckResponse:
    assessment = assess(payload.text)
    return CheckResponse(**assessment.to_dict())


@router.get("/model/status")
def model_status() -> dict:
    model = get_model()
    return {
        "ml_loaded": model is not None,
        "model_version": model.version if model is not None else None,
    }
