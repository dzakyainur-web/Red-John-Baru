from __future__ import annotations

"""Router untuk endpoint contoh pesan fiktif."""

from fastapi import APIRouter

from app.schemas import ExampleOut

router = APIRouter(tags=["examples"])

EXAMPLES: list[ExampleOut] = [
    ExampleOut(
        id="ex-scam-01",
        label="scam",
        category="OTP",
        text="Mbak, ini dari CS Bank BCA. Ada transaksi Rp4.750.000 dari kartu Anda. Untuk pembatalan, segera kirim kode OTP yang masuk ke HP Anda ke nomor ini.",
    ),
    ExampleOut(
        id="ex-scam-02",
        label="scam",
        category="Investasi",
        text="Bergabung sekarang! Modal 500rb profit 10% per hari, dijamin tanpa risiko. Slot terakhir hari ini, transfer ke rekening pribadi mentor ya.",
    ),
    ExampleOut(
        id="ex-scam-03",
        label="scam",
        category="Lowongan",
        text="Halo kak, lowongan admin online gaji 15 juta WFH tanpa pengalaman. Kirim foto KTP dan KK ya kak untuk verifikasi data pelamar.",
    ),
    ExampleOut(
        id="ex-scam-04",
        label="scam",
        category="Phishing",
        text="Akun Instagram kamu akan dibekukan dalam 24 jam. Verifikasi akun di https://instagram-verifikasi.xyz/login untuk mencegah penutupan.",
    ),
    ExampleOut(
        id="ex-legit-01",
        label="legit",
        category="Pengumuman",
        text="Rapat koordinasi divisi dimajukan jadi pukul 09.30 di ruang rapat lantai 3. Mohon konfirmasi kehadiran lewat grup kantor.",
    ),
    ExampleOut(
        id="ex-legit-02",
        label="legit",
        category="Bank Resmi",
        text="Transaksi Rp75.000 berhasil pada 03/11/2026. Bank BCA TIDAK PERNAH meminta kode OTP atau PIN Anda kepada siapa pun.",
    ),
]


@router.get("/examples", response_model=list[ExampleOut])
def get_examples() -> list[ExampleOut]:
    return EXAMPLES
