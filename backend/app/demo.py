"""Smoke test manual: `uv run python -m app.demo`."""

from app.engine import assess

SAMPLES = [
    "Selamat! Kamu menang hadiah utama. Transfer biaya admin 200rb dan kirim OTP sekarang juga!",
    "Akun Instagram kamu akan diblokir. Verifikasi di https://instagram-verifikasi.xyz/login",
    "Halo kak, lowongan admin online gaji 15 juta WFH. Kirim foto KTP ya kak.",
    "besok jadi main futsal jam 4 sore?",
    "Transaksi Rp75.000 berhasil. Kami TIDAK pernah meminta PIN atau OTP Anda.",
]


def main() -> None:
    for text in SAMPLES:
        result = assess(text)
        print(f"\n[{result.risk_level.upper()} {result.score}] {text[:70]}")
        print(f"  rule={result.rule_score:.2f} ml={result.ml_score}")
        for flag in result.flags:
            print(f"   - {flag.id} {flag.status} ({flag.severity}) {flag.title}")


if __name__ == "__main__":
    main()
