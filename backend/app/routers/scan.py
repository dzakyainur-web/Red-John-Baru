"""Scan terstruktur: url/domain/text/phone/bank/email → engine `assess()`.

Merupakan adapter tipis di atas `/api/check`: validasi format per jenis target,
lalu lempar ke engine yang sama. Tidak ada logika deteksi baru di sini.
"""

from __future__ import annotations

import re

from fastapi import APIRouter, Depends, HTTPException

from app.auth import require_bot_key
from app.engine import assess
from app.news_harvester.extract import (
    clean_text,
    sanitize_indicator,
    tld_allowed,
)
from app.rules.text_utils import find_urls, host_of
from app.schemas import CheckResponse, ScanKind, ScanRequest, ScanResponse

router = APIRouter(
    tags=["scan"],
    prefix="/scan",
    dependencies=[Depends(require_bot_key)],
)

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[a-z]{2,}$", re.IGNORECASE)


def _invalid(message: str) -> HTTPException:
    return HTTPException(status_code=422, detail=message)


def _normalize(kind: ScanKind, target: str) -> str:
    """Validasi + normalisasi target. Lempar 422 bila format tidak cocok."""
    target = clean_text(target)

    if kind == "text":
        if not target:
            raise _invalid("Teks tidak boleh kosong.")
        return target

    if kind == "url":
        if not target.lower().startswith(("http://", "https://")):
            raise _invalid("URL harus diawali http:// atau https://.")
        if find_urls(target)[:1] != [target]:
            raise _invalid("URL tidak valid.")
        host = host_of(target)
        if not host or not tld_allowed(host):
            raise _invalid("Domain pada URL tidak dikenali.")
        return target

    if kind == "domain":
        host = host_of(target)
        if not host or any(ch in target for ch in "/@ \t") or not tld_allowed(host):
            raise _invalid("Domain tidak valid (contoh: contoh.xyz).")
        return host

    if kind == "email":
        if not _EMAIL_RE.match(target):
            raise _invalid("Format email tidak valid.")
        return target.lower()

    # phone | bank — sanitizer yang sama dipakai penyimpanan IOC.
    indicator = sanitize_indicator("phone" if kind == "phone" else "bank_account", target)
    if indicator is None:
        message = (
            "Nomor telepon tidak valid (contoh: 0812-3456-7890)."
            if kind == "phone"
            else "Nomor rekening harus 6–20 digit."
        )
        raise _invalid(message)
    return indicator["value"]


@router.post("/{kind}", response_model=ScanResponse)
def scan(kind: ScanKind, payload: ScanRequest) -> ScanResponse:
    target = _normalize(kind, payload.target)
    assessment = assess(target)
    return ScanResponse(
        kind=kind,
        target=target,
        source=payload.source,
        assessment=CheckResponse(**assessment.to_dict()),
    )
