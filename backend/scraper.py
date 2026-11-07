"""Instance scraper berdiri sendiri, terpisah dari proses API.

API (`uv run main.py`) tidak lagi menjalankan harvester; proses ini yang memegang
scheduler. Aman dijalankan sebagai service/container lain — lock di tabel
`news_run_lock` menjamin hanya satu replica yang menulis.

    uv run scraper.py                 # scheduler tiap NEWS_INTERVAL_HOURS
    uv run scraper.py --once          # satu putaran lalu keluar
    uv run scraper.py --once --dry-run --source kompas
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import signal
import sys

from app.config import settings
from app.news_harvester import store
from app.news_harvester.runner import main as runner_main
from app.news_harvester.scheduler import run_scheduled, start_scheduler, stop_scheduler

logger = logging.getLogger(__name__)


async def serve() -> None:
    """Jalankan scheduler sampai SIGINT/SIGTERM."""
    if await store.init_store() is None:
        logger.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY kosong — scraper berhenti.")
        raise SystemExit(1)

    scheduler = start_scheduler()
    if scheduler is None:
        raise SystemExit("Scheduler gagal dimulai.")

    stop = asyncio.Event()
    loop = asyncio.get_running_loop()
    # SIGBREAK hanya ada di Windows (Ctrl+Break dari `docker stop`/service manager).
    signals = [signal.SIGINT, signal.SIGTERM, getattr(signal, "SIGBREAK", signal.SIGTERM)]
    for sig in set(signals):
        try:
            loop.add_signal_handler(sig, stop.set)
        except NotImplementedError:  # Windows: hanya lewat signal.signal
            # call_soon_threadsafe: handler berjalan di thread sinyal, bukan loop.
            signal.signal(sig, lambda *_, _s=stop: loop.call_soon_threadsafe(_s.set))

    if settings.news_run_on_start:
        logger.info("NEWS_RUN_ON_START aktif — harvest pertama sekarang.")
        asyncio.create_task(run_scheduled())

    try:
        await stop.wait()
    finally:
        stop_scheduler()
        await store.close_store()
        logger.info("Scraper berhenti.")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Instance scraper news_harvester")
    parser.add_argument("--once", action="store_true", help="Satu putaran lalu keluar.")
    parser.add_argument("--dry-run", action="store_true", help="Cetak hasil, tanpa Supabase.")
    parser.add_argument("--source", help="Batasi ke satu sumber: detik|kompas|liputan6")
    args = parser.parse_args(argv)

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    if args.once or args.dry_run or args.source:
        return runner_main(argv)

    asyncio.run(serve())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
