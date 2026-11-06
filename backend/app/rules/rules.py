"""Aturan deteksi tanda bahaya (R01–R10) berbasis pola teks/URL.

Setiap aturan menghasilkan status:
- ``hit``     : tanda bahaya terdeteksi (menambah skor sebesar bobotnya)
- ``partial`` : sinyal ancaman sejenis tapi ada peredam (mis. "kami TIDAK akan
                meminta OTP") — dihitung setengah bobot, ditampilkan sebagai info
- ``miss``    : tidak terdeteksi

Agar tidak menyesatkan pengguna, satu tanda bahaya **tinggi** saja sudah cukup
untuk level "sedang" (skor ≥ 40). Skor rule dihitung bertingkat:
- 0..85 : ramps logaritmik dari total bobot — makin banyak tanda bahaya, makin tinggi
- 85..100 : diisi oleh aturan-aturan pendukung (desakan, hadiah, tautan, gaya bahasa)

Dengan skema ini 1 aturan tinggi saja ≈ 52, dua aturan tinggi ≈ 75, satu aturan
tinggi + beberapa sedang ≈ 80-an, dan sinyal lemah sendirian tetap di bawah 40.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import Literal

from app.rules.text_utils import compile_any, find_urls, host_of, snippet

Severity = Literal["tinggi", "sedang", "rendah"]
Status = Literal["hit", "partial", "miss"]

_OTP_TERMS = compile_any(
    (
        r"\b(?:otp|kode\s+verifikasi|kode\s+verification|kode\s+rahasia|token\s+verifikasi)\b",
        r"kode\s+(?:sms\s+)?\d{4,8}\b",
        r"one[- ]time\s+password",
        r"kode\s+ini\s+untuk\s+login",
    )
)

_OTP_NEGATORS = compile_any(
    (
        r"\b(?:tidak|jangan|nggak|gak|belum|bukan)\b[^.]{0,30}?(?:meminta|minta|bagikan|berikan|kasih|share|kirim)[^.]{0,30}?\b(?:otp|pin|password|kode)(?:\W|$)",
        r"\b(?:tidak|jangan|nggak|gak)\b[^.]{0,30}?(?:otp|pin|password|kode\s+verifikasi)\b[^.]{0,30}?(?:siapa\s*pun|orang\s+lain)",
        r"(?:otp|pin|password)\s+(?:kamu|anda)\s+(?:bersifat\s+)?rahasia",
    )
)

_PLATFORM_WARNING = compile_any(
    (
        r"kami\s+(?:tidak|tidak\s+akan|tdk\s+akan)\s+(?:pernah\s+)?meminta",
        r"kami\s+(?:tidak|tidak\s+akan|tdk\s+akan)\s+(?:pernah\s+)?(?:meminta|minta|menanyakan)\b[^.]{0,30}?\b(?:otp|pin|password|kode)",
        r"(?:jangan|tidak)\s+(?:pernah\s+)?(?:membagikan|bagikan|berikan)\b[^.]{0,30}?(?:otp|pin|password)",
    )
)

_OTP_REQUEST = compile_any(
    (
        r"(?:^|[^a-z])(?:kirim|kirimkan|berikan|kasih|bagikan|forward|minta|mengirim)(?:kan|in)?[^.]{0,40}?(?:otp|kode)",
        r"(?:balas|reply)\w*\s+(?:dengan\s+)?(?:otp|kode)",
        r"otp\s+(?:kamu|anda|nya)\b[^.]{0,20}?\b(?:kirim|berikan|balas|share)",
        r"\botp\s*\?",
    )
)

_SENSITIVE_TERMS = compile_any(
    (
        r"\bpin\b",
        r"\bpassword\b",
        r"\bsandi(?:an)?\b",
        r"\bktp\b",
        r"\be[- ]?ktp\b",
        r"\bnik\b",
        r"selfie\s+(?:dengan\s+)?ktp",
        r"foto\s+ktp",
        r"\bnomor\s+(?:rekening|kartu|atm)\b",
        r"data\s+(?:pribadi|kamu|anda)\s+(?:lengkap|bank)",
        r"\bcvv\b",
        r"kode\s+di\s+belakang\s+kartu",
    )
)

_SENSITIVE_SEND = compile_any(
    (
        r"(?:kirim|kirimkan|berikan|kasih|isi|fill|masukkan|upload|unggah)\w*\b[^.]{0,40}?(?:pin|password|ktp|nik|cvv|nomor\s+rekening)",
        r"(?:pin|password|ktp|cvv)\s+(?:kamu|anda)\b[^.]{0,30}?\b(?:kirim|isi|berikan)",
        r"(?:foto|photo|scan)\s+(?:ktp|kartu|sim|npwp)",
    )
)

_PAYMENT_TERMS = compile_any(
    (
        r"\btransfer\b",
        r"\bdp\b",
        r"biaya\s+(?:admin|administrasi|pendaftaran|training|pelatihan|materai|ongkir|pencairan|aktifasi|aktivasi|asuransi|jasa|kartu)",
        r"bayar\w*\s+(?:dulu|sekarang|segera)",
        r"\bsetoran\b",
        r"\bdeposit\b",
        r"\btop\s*up\b",
        r"\bslot\b",
        r"rekening\s+(?:tujuan|kami|admin|baru)",
        r"kirim\s+(?:uang|duit|dana)",
    )
)

_PAYMENT_VERBS = re.compile(
    r"(?:harus|wajib|mohon|tolong|segera|langsung|silakan)?\s*(?:transfer|bayar|setor|top\s*up)\w*\b[^.]{0,30}?(?:rp|idr|\d)",
    re.I,
)

_PAYMENT_REQUEST = compile_any(
    (
        r"(?:harus|wajib|mohon|segera|langsung)?\s*(?:transfer|bayar|setor)\w*\b[^.]{0,40}?(?:rp|idr|\d|biaya|admin|dulu)",
        r"biaya\s+\w+\s+(?:sebesar|senilai)\s*(?:rp|idr)",
        r"transfer\s+(?:minimal\s+)?(?:ke|di)\s+(?:rekening|nomor)",
        r"(?:transfer|bayar|kirim)\s+(?:dulu|sekarang)\b",
        r"\bok(?:e|ay)?\s+(?:aku|saya|gue|gw)\s+transfer",
        r"nanti\s+(?:aku|saya|gue|gw)\s+(?:balikin|transfer|ganti|kembaliin)",
        r"pinjam\s+uang\s+\d",
    )
)

_VERIFY_NEGATOR = compile_any(
    (
        r"(?:tidak|jangan|gak|nggak)\s+(?:pernah\s+)?(?:meminta|minta|membebankan|menagih)\b[^.]{0,40}?(?:biaya|uang|transfer|pembayaran)",
        r"ongkir\s+(?:sudah\s+)?(?:gratis|termasuk|ditanggung)",
        r"(?:ongkir|biaya\s+\w+)\s+(?:ditanggung|sudah\s+termasuk)\b",
        r"(?:berhasil|sukses)\s+pada\b[^.]{0,80}?transaksi",
        r"transaksi\s+[^.]{0,30}?\b(?:berhasil|sukses)\b",
    )
)

_UNREALISTIC_PCT = re.compile(r"\b\d{1,3}(?:[.,]\d+)?\s*%\s*(?:per|/|setiap|tiap|se)\s*(?:hari|minggu|bulan)\b", re.I)
_LARGE_JUTA = re.compile(r"\b(\d{1,3}(?:[.,]\d{1,2})?)\s*juta\b", re.I)

_MONEY_PROMISE = compile_any(
    (
        r"profit\s*(?:tetap|pasti|dijamin|harian|hariannya|besar|fantastis)",
        r"untung\s*(?:besar|pasti|tetap|dijamin|cepat|\d)",
        r"keuntungan\s*(?:tetap|pasti|dijamin|tanpa\s+risiko|\d)",
        r"(?:gaji|penghasilan|income|bayaran)\s*(?:rp\.?\s*)?\d{1,3}(?:[.,]\d{3})+\b",
        r"(?:gaji|penghasilan|income)\s+(?:puluhan|belasan|ratusan)\s+juta",
        r"(?:dijamin|pasti|bebas)\s+(?:aman|profit|untung|cuannya|untungnya)",
        r"(?:auto|otomatis)\s+(?:profit|untung|cuannya|cuan|uang)",
        r"\bpassive\s+income\b",
        r"modal\s+(?:kecil|sedikit)\s+(?:untung|hasil|profit|cuan)",
    )
)

_BIG_JUTA_MIN = 10.0


def _big_juta_match(text: str) -> re.Match[str] | None:
    for match in _LARGE_JUTA.finditer(text):
        try:
            value = float(match.group(1).replace(",", "."))
            if value >= _BIG_JUTA_MIN:
                return match
        except ValueError:
            pass
    return None


_QUALIFIER = re.compile(r"dijamin|pasti|per\s+hari|setiap\s+hari|tiap\s+hari|/\s*hari|tanpa\s+risiko|harian", re.I)

_URGENCY = compile_any(
    (
        r"\bsegera\b",
        r"\bsekarang\s+juga\b",
        r"hari\s+ini\s+(?:terakhir|saja|habis)",
        r"\bterakhir\b",
        r"dalam\s+\d+\s*(?:menit|jam)",
        r"\b(?:buruan|buru-buru|buru\s+buru)\b",
        r"\bsecepatnya\b",
        r"\bterbatas\b",
        r"jangan\s+sampai\s+(?:kehabisan|diblokir|hangus)",
        r"\b(?:akun|rekening)\s+(?:kamu|anda)\s+(?:akan\s+)?(?:diblokir|dibekukan|ditangguhkan|hilang)",
        r"(?:diblokir|ditangguhkan|dibekukan|dihapus)\s+(?:permanen\s+)?(?:dalam|selama)\s+\d+\s*(?:jam|hari)",
    )
)

_PRIZE = compile_any(
    (
        r"selamat[!,.]\s+(?:kamu|anda|km|nomor)\s+.{0,40}?(?:menang|beruntung|terpilih)",
        r"\bmenang\w*\s+(?:hadiah|undian|lucky\s+draw)",
        r"\bgiveaway\b.{0,40}(?:menang|claim|klaim)",
        r"(?:undian|kupon)\s+berhadiah",
        r"hadiah\s+(?:gratis|besar|utama|samsung|iphone|emoney|pulsa)",
        r"klaim\s+(?:hadiah|hadiahmu|sekarang)",
        r"kamu\s+terpilih\s+sebagai",
        r"\bpemenang\b",
    )
)

_SHORTLINK_HOSTS = frozenset(
    {
        "s.id",
        "buff.ly",
        "cutt.ly",
        "ow.ly",
        "is.gd",
        "rb.gy",
        "t.co",
        "tiny.cc",
        "linktr.ee",
        "bit.ly",
        "rebrand.ly",
        "bitly.com",
        "shorturl.at",
        "goo.gl",
        "tinyurl.com",
    }
)

_SUSPICIOUS_TLDS = frozenset(
    {
        "xyz",
        "rest",
        "zip",
        "icu",
        "tk",
        "gq",
        "online",
        "cf",
        "shop",
        "ml",
        "top",
        "win",
        "buzz",
        "click",
        "loan",
        "mov",
        "site",
    }
)

_OFFICIAL_DOMAINS = frozenset(
    {
        "telkomsel.com",
        "btn.co.id",
        "bni.co.id",
        "tiktok.com",
        "ojk.go.id",
        "instagram.com",
        "bca.co.id",
        "bi.go.id",
        "bri.co.id",
        "whatsapp.com",
        "mandiri.co.id",
        "kominfo.go.id",
    }
)

_CONTACT_OUTSIDE = compile_any(
    (
        r"(?:chat|pm|wa|whatsapp|dm|hubungi|add|tambah)\w*\s+(?:ke\s+)?(?:nomor|nomer|akun|wa|whatsapp|admin|cs)\b[^.]{0,30}?(?:\d{2,}|line)",
        r"hubungi\s+(?:kami|admin|cs)\s+di\s+(?:wa|whatsapp|telegram)",
        r"pindah\s+(?:obrolan\s+)?ke\s+(?:wa|whatsapp|telegram)",
        r"chat\s+pribadi\s+admin",
    )
)

_UPPER_BURST = re.compile(r"\b[A-Z]{8,}\b|\w*!{3,}|[?!]{3,}")

_INFORMAL_STYLE = compile_any(
    (
        r"(?:login|masuk|verifikasi)\w*\s+di\s+(?:klik\s+link|link\s+di)",
        r"\b(?:kak|dek|gans|bro|sis)\b.{0,60}\b(?:transfer|bayar|otp|klik)\b",
        r"\b(?:cuannya|cuan|gacor|maxwin)\b",
        r"\bklik\s+(?:link|tautan)\s+(?:di\s+)?(?:bawah|bio|sini)\b",
    )
)

_APK = compile_any(
    (
        r"\.apk\b",
        r"\bapk\b",
        r"install\s+aplikasi",
        r"unduh\s+(?:file|aplikasi)\s+di\s+(?:link|sini)",
        r"download\s+(?:file|aplikasi)\s+di\s+(?:link|sini|bawah)",
    )
)


@dataclass(frozen=True)
class Rule:
    id: str
    title: str
    severity: Severity
    weight: int
    explanation: str
    advice: str


@dataclass(frozen=True)
class RuleResult:
    rule: Rule
    status: Status
    evidence: str | None = None
    note: str | None = None

    @property
    def contribution(self) -> int:
        if self.status == "hit":
            return self.rule.weight
        if self.status == "partial":
            return self.rule.weight // 2
        return 0


RULES: dict[str, Rule] = {
    "R01": Rule(
        id="R01",
        title="Meminta kode OTP / verifikasi",
        severity="tinggi",
        weight=25,
        explanation="Kode OTP adalah kunci masuk akunmu. Bank, operator, atau platform resmi tidak pernah meminta kode OTP lewat chat atau telepon.",
        advice="Jangan pernah membagikan kode OTP, termasuk ke orang yang mengaku teman atau customer service.",
    ),
    "R02": Rule(
        id="R02",
        title="Meminta data sensitif pribadi",
        severity="tinggi",
        weight=25,
        explanation="PIN, password, foto KTP, NIK, atau nomor kartu bisa dipakai untuk membobol akun atau melakukan penipuan atas namamu.",
        advice="Jangan kirim data pribadi lewat chat. Periksa langsung di aplikasi resmi bila diminta untuk verifikasi.",
    ),
    "R03": Rule(
        id="R03",
        title="Diminta bayar / transfer di luar platform",
        severity="tinggi",
        weight=20,
        explanation="Penipu sering meminta DP, biaya admin, biaya training, atau ongkir sebelum memberi sesuatu yang dijanjikan.",
        advice="Jangan transfer ke rekening pribadi yang tidak bisa kamu verifikasi. Bayar hanya lewat platform resmi yang punya perlindungan pembeli.",
    ),
    "R04": Rule(
        id="R04",
        title="Janji keuntungan/gaji tidak masuk akal",
        severity="tinggi",
        weight=20,
        explanation="Keuntungan pasti harian, gaji puluhan juta tanpa pengalaman, atau 'dijamin untung' adalah pola klasik investasi bodong dan lowongan palsu.",
        advice="Jika terdengar terlalu bagus untuk jadi nyata, biasanya memang tidak nyata. Cek legalitas perusahaan atau produk investasinya di sumber resmi.",
    ),
    "R05": Rule(
        id="R05",
        title="Desakan waktu / urgensi palsu",
        severity="sedang",
        weight=10,
        explanation="Menekan kamu untuk cepat-cepat memutuskan adalah trik agar kamu tidak sempat berpikir atau memverifikasi.",
        advice="Jangan terburu-buru. Sediakan waktu untuk memeriksa pihak yang menghubungi.",
    ),
    "R06": Rule(
        id="R06",
        title="Iming-iming hadiah / menang undian",
        severity="sedang",
        weight=10,
        explanation="Menang undian yang tidak pernah kamu ikuti atau yang meminta pembayaran/data lebih lanjut adalah modus giveaway palsu.",
        advice="Hadiah sah tidak meminta kamu membayar biaya atau mengisi data kartu di link sembarangan.",
    ),
    "R07": Rule(
        id="R07",
        title="Tautan atau domain mencurigakan",
        severity="tinggi",
        weight=15,
        explanation="Shortlink, domain mirip situs resmi, domain dengan akhiran tidak umum, atau alamat IP langsung sering dipakai untuk phishing.",
        advice="Ketik sendiri alamat situs resmi di browser. Jangan klik link yang dikirim lewat chat.",
    ),
    "R08": Rule(
        id="R08",
        title="Diminta menghubungi kontak di luar platform",
        severity="sedang",
        weight=10,
        explanation="Mengajak chat ke nomor personal, WA, atau Telegram adalah cara penipu menghindar dari moderasi platform.",
        advice="Tetap berkomunikasi di platform resmi atau kanal resmi yang kamu cari sendiri.",
    ),
    "R09": Rule(
        id="R09",
        title="Gaya bahasa/format mencurigakan",
        severity="rendah",
        weight=5,
        explanation="Ciri kecil seperti link yang diminta diklik, huruf kapital berlebihan, atau bahasa promosi yang terlalu memaksa sering muncul di pesan tipuan.",
        advice="Gunakan ciri ini hanya sebagai petunjuk tambahan, bukan bukti.",
    ),
    "R10": Rule(
        id="R10",
        title="Minta unduh/install file (mis. APK)",
        severity="tinggi",
        weight=20,
        explanation="File aplikasi dari link chat bisa berisi malware yang mencuri akun atau SMS OTP kamu.",
        advice="Install aplikasi hanya dari Play Store atau App Store resmi.",
    ),
}

TOTAL_RULE_WEIGHT = sum(r.weight for r in RULES.values())


def _match(
    rule_id: str,
    status: Status,
    text: str,
    *patterns: re.Pattern[str],
    note: str | None = None,
) -> RuleResult:
    """Kembalikan hasil 'hit'/'partial' bila salah satu pola cocok, jika tidak 'miss'."""
    rule = RULES[rule_id]
    for pattern in patterns:
        match = pattern.search(text)
        if match is not None:
            return RuleResult(
                rule,
                status,
                snippet(text, match.start(), match.end()),
                note,
            )
    return RuleResult(rule, "miss")


def _eval_otp(text: str) -> RuleResult:
    request = _OTP_REQUEST.search(text)
    neg = _OTP_NEGATORS.search(text)
    warning = _PLATFORM_WARNING.search(text)
    if request is None and (warning is not None or neg is not None):
        m = warning if warning else neg
        return RuleResult(
            RULES["R01"],
            "partial",
            snippet(text, m.start(), m.end()),
            "Teks justru berisi peringatan agar tidak berbagi kode.",
        )
    if request is not None or neg is not None:
        return _match("R01", "hit", text, _OTP_REQUEST, _OTP_TERMS)
    return _match("R01", "hit", text, _OTP_TERMS)


def _eval_sensitive(text: str) -> RuleResult:
    if _SENSITIVE_SEND.search(text):
        return _match("R02", "hit", text, _SENSITIVE_SEND)
    warning = _PLATFORM_WARNING.search(text) or _OTP_NEGATORS.search(text)
    if warning is not None and _SENSITIVE_TERMS.search(text):
        return RuleResult(
            RULES["R02"],
            "partial",
            snippet(text, warning.start(), warning.end()),
            "Penyebutan data sensitif disertai peringatan keamanan.",
        )
    return _match("R02", "hit", text, _SENSITIVE_TERMS)


def _eval_payment(text: str) -> RuleResult:
    request = _PAYMENT_REQUEST.search(text)
    warning = _PLATFORM_WARNING.search(text) or _VERIFY_NEGATOR.search(text)
    if request is not None:
        if warning is None or warning.start() > request.start():
            return _match("R03", "hit", text, _PAYMENT_REQUEST)
    if warning is not None:
        return RuleResult(
            RULES["R03"],
            "partial",
            snippet(text, warning.start(), warning.end()),
            "Pembayaran disebut dalam kalimat yang justru mencegah transfer.",
        )
    if request is not None or (_PAYMENT_TERMS.search(text) and _PAYMENT_VERBS.search(text)):
        return _match("R03", "hit", text, _PAYMENT_REQUEST, _PAYMENT_VERBS)
    if _PAYMENT_TERMS.search(text):
        return _match("R03", "partial", text, _PAYMENT_TERMS, note="Ada kata terkait pembayaran, tapi tidak jelas diminta dari kamu.")
    if _PAYMENT_VERBS.search(text):
        return _match("R03", "partial", text, _PAYMENT_VERBS, note="Ada ungkapan nominal uang, tapi tidak jelas diminta dari kamu.")
    return RuleResult(RULES["R03"], "miss")


def _eval_money(text: str) -> RuleResult:
    pct = _UNREALISTIC_PCT.search(text)
    promise = _MONEY_PROMISE.search(text)
    qualifier = _QUALIFIER.search(text)
    amount_match = pct or promise or qualifier or _big_juta_match(text)
    if amount_match is None:
        return RuleResult(RULES["R04"], "miss")
    strong = pct is not None or promise is not None or qualifier is not None
    return RuleResult(
        RULES["R04"],
        "hit" if strong else "partial",
        snippet(text, amount_match.start(), amount_match.end()),
        None if strong else "Ada angka uang/penghasilan, tapi belum jelas berlebihan.",
    )


def _eval_urls(text: str) -> RuleResult:
    for url in find_urls(text):
        host = host_of(url)
        if not host:
            continue
        reasons = []
        if host.startswith("xn--") or ".xn--" in host:
            reasons.append("domain punycode (huruf mirip)")
        if re.fullmatch(r"[\d.]+", host):
            reasons.append("alamat IP langsung")
        tld = host.rsplit(".", 1)[-1]
        if host in _SHORTLINK_HOSTS:
            reasons.append("shortlink")
        elif tld in _SUSPICIOUS_TLDS and not host.endswith(".shop.id"):
            reasons.append(f"akhiran .{tld} tidak umum")
        for official in _OFFICIAL_DOMAINS:
            base = official.split(".")[0]
            if base in host and not (host == official or host.endswith("." + official)):
                reasons.append(f"meniru domain {official}")
                break
        if reasons:
            idx = text.find(url)
            ev = snippet(text, idx, idx + len(url)) if idx >= 0 else url
            return RuleResult(RULES["R07"], "hit", ev, "; ".join(reasons))
    return RuleResult(RULES["R07"], "miss")


def evaluate(text: str) -> list[RuleResult]:
    """Jalankan semua aturan. Mengembalikan satu RuleResult per aturan R01–R10, berurutan."""
    r09 = _match("R09", "hit", text, _INFORMAL_STYLE, _UPPER_BURST)
    return [
        _eval_otp(text),
        _eval_sensitive(text),
        _eval_payment(text),
        _eval_money(text),
        _match("R05", "hit", text, _URGENCY),
        _match("R06", "hit", text, _PRIZE),
        _eval_urls(text),
        _match("R08", "hit", text, _CONTACT_OUTSIDE),
        r09,
        _match("R10", "hit", text, _APK),
    ]


_SUPPORT_IDS = frozenset({"R05", "R06", "R07", "R08", "R09"})
_CORE_IDS = frozenset({"R01", "R02", "R03", "R04", "R10"})


def _saturate(weight: float) -> float:
    return 1.0 - math.exp(-weight / 22.0)


def rule_score(results: list[RuleResult]) -> float:
    """Skor rule 0..1 (lihat penjelasan modul)."""
    core = sum(r.contribution for r in results if r.rule.id in _CORE_IDS)
    support = sum(r.contribution for r in results if r.rule.id in _SUPPORT_IDS)
    if core > 0:
        return round(min(1.0, 0.95 * _saturate(core) + min(0.15, support * 0.006)), 4)
    return round(min(0.72, support * 0.013), 4)
