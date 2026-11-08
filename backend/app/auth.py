"""Auth sederhana service-to-service untuk endpoint yang dipakai Discord Bot.

Frontend dan panel admin tidak memakai dependency ini; endpoint publik/legacy
tetap tanpa auth. Hanya konsumen ber-token (bot) yang dilindungi.
"""

from __future__ import annotations

import hmac
import logging
from typing import Annotated

from fastapi import Header, HTTPException

from app.config import settings

logger = logging.getLogger(__name__)

_warned = False


def require_bot_key(
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None,
) -> None:
    """Validasi header `X-API-Key` dengan perbandingan constant-time.

    - Key backend kosong + non-production: lolos (dev ramah), warning sekali.
    - Key backend kosong + production: 503 supaya deploy salah konfigurasi ketahuan.
    - Key tidak cocok: 401. Nilai key tidak pernah di-log.
    """
    global _warned
    expected = settings.discord_bot_api_key
    if not expected:
        if settings.app_env == "production":
            raise HTTPException(
                status_code=503,
                detail="DISCORD_BOT_API_KEY belum diset di server.",
            )
        if not _warned:
            logger.warning(
                "DISCORD_BOT_API_KEY kosong — endpoint bot terbuka (mode %s).",
                settings.app_env,
            )
            _warned = True
        return

    if x_api_key is None or not hmac.compare_digest(x_api_key, expected):
        raise HTTPException(status_code=401, detail="API key tidak valid.")
