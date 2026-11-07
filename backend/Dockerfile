FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# Chromium penuh: parser butuh mesin browser utuh.
RUN uv run playwright install --with-deps chromium \
    && rm -rf /var/lib/apt/lists/*

COPY . .
RUN uv sync --frozen --no-dev

EXPOSE 8000
# API saja. Scraper dijalankan sebagai service terpisah dengan image yang sama:
#   command: ["uv", "run", "scraper.py"]
# atau set NEWS_SCHEDULER=true untuk menggabungkan keduanya di satu instance.
CMD ["sh", "-c", "uv run uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
