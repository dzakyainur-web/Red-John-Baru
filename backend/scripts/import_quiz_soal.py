"""Impor bank soal dari `soal.txt` ([SOAL_START] … [SOAL_END]) ke public.quiz_questions.

Jalankan dari backend/: `.venv/Scripts/python.exe scripts/import_quiz_soal.py [--dry-run]`

Idempotent: upsert on_conflict=id, aman diulang. Validasi memakai `QuizQuestionCreate`
yang sama dengan API admin, jadi soal yang lolos di sini lolos di backend juga.

Soal teks: `_match` di quiz_store mewajibkan SEMUA keyword ada (AND), jadi tiap
alternatif jawaban ("OTP Bombing / SMS Bombing") jadi rule sendiri, bukan satu rule
dengan banyak keyword.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import load_env_file  # noqa: E402

load_env_file()

from app.quiz import QuizQuestionCreate  # noqa: E402

SOAL = Path(__file__).resolve().parents[2] / "soal.txt"
TABLE_URL = f"{os.environ['SUPABASE_URL'].rstrip('/')}/rest/v1/quiz_questions?on_conflict=id"

EASY = [
    ("easy-001", "multiple_choice", "SMS peringatan transaksi BCA palsu",
     'SMS: "PERINGATAN RESMI BANK BCA: Terdeteksi transaksi Rp8.500.000 keluar. Segera batalkan di tautan darurat: bca-bataltransaksi.xyz". Apa yang kamu lakukan?',
     [("A", "Klik link tersebut karena panik uang akan hilang.", False),
      ("B", "Abaikan SMS, jangan klik tautannya, lalu blokir nomor tersebut.", True),
      ("C", "Balas SMS tersebut menanyakan kebenarannya.", False)],
     "Phishing SMS",
     "Perhatikan domain tautannya ('bca-bataltransaksi.xyz'). Bank resmi tidak pernah menggunakan domain gratisan seperti '.xyz'."),
    ("easy-002", "binary", "File APK berkedok foto resi kurir",
     "Seorang kurir JNE menghubungi via WhatsApp dan mengirimkan foto resi paket dalam bentuk lampiran file bernama Foto_Resi_Paket.APK. Bolehkah kamu mengunduh dan membuka file tersebut?",
     [("tidak", "Tidak", True), ("ya", "Ya", False)],
     "Malware APK",
     "File foto asli biasanya berformat .JPG atau .PNG. File .APK adalah aplikasi Android yang sering disalahgunakan untuk menyebar malware dan mencuri data OTP."),
    ("easy-003", "text_input", "Singkatan kode verifikasi 6 digit",
     "Serangkaian 6 digit angka rahasia yang dikirimkan via SMS untuk memverifikasi akun (dan sering dicuri oleh penipu) dikenal dengan singkatan apa?",
     ("OTP", [["otp"]]),
     "Pencurian OTP",
     "Kepanjangannya adalah One Time Password."),
    ("easy-004", "binary", "Kode pendaftaran diminta pihak WhatsApp palsu",
     'Kamu mendapat pesan di WhatsApp dari nomor tak dikenal yang mengaku dari "Pusat Bantuan WhatsApp", mendesak agar kamu segera mengirimkan kode pendaftaran 6 digit yang baru saja masuk ke SMS kamu agar akunmu tidak dihapus. Haruskah diserahkan?',
     [("tidak", "Tidak", True), ("ya", "Ya", False)],
     "Impersonasi layanan resmi",
     "Pihak resmi tidak akan pernah meminta kode rahasia atau PIN milikmu. Jangan pernah tunduk pada gertakan."),
    ("easy-005", "multiple_choice", "Tawaran like & subscribe dengan deposit",
     'Kamu mendapat tawaran kerja freelance yang mudah, yaitu cukup "Like & Subscribe Video YouTube". Namun, kamu diminta mentransfer sejumlah uang sebagai "deposit awal". Jenis tawaran apakah ini?',
     [("A", "Lowongan kerja terpercaya.", False),
      ("B", "Penipuan tugas palsu (Task Scam).", True),
      ("C", "Peluang bisnis afiliasi.", False)],
     "Task scam",
     "Pekerjaan seharusnya memberimu uang, bukan memintamu mentransfer uang (deposit) di awal."),
    ("easy-006", "text_input", "Protokol situs dengan ikon gembok",
     "Ikon gembok kecil di kolom alamat browser menunjukkan bahwa situs web menggunakan protokol koneksi aman yang diawali dengan huruf apa?",
     ("HTTPS", [["https"]]),
     "Penipuan situs palsu",
     'Ada tambahan huruf "S" (yang berarti Secure) setelah HTTP.'),
    ("easy-007", "binary", "Tanggal lahir sebagai PIN rekening",
     "Karena mudah diingat, menggunakan tanggal lahir sendiri atau tanggal lahir anak sebagai kata sandi (PIN) rekening bank sangat direkomendasikan.",
     [("tidak", "Tidak", True), ("ya", "Ya", False)],
     "Kata sandi lemah",
     "Tanggal lahir adalah informasi publik yang sangat mudah dilacak oleh penipu melalui profil media sosialmu."),
    ("easy-008", "multiple_choice", "Tiga angka rahasia di belakang kartu kredit",
     "Saat menelepon petugas call center bank, kamu diminta menyebutkan 3 angka rahasia di bagian belakang kartu kreditmu. Tiga angka rahasia ini disebut:",
     [("A", "PIN", False), ("B", "NIK", False), ("C", "CVV / CVC", True)],
     "Penipuan data kartu",
     "Terletak di belakang kartu dan pantang diberikan kepada siapapun, termasuk petugas bank."),
    ("easy-009", "text_input", "Istilah pemalsuan pesan untuk menipu korban",
     "Kejahatan menipu korban untuk mengklik tautan berbahaya dengan cara memalsukan email, SMS, atau pesan seolah-olah dari instansi resmi disebut dengan istilah apa?",
     ("Phishing", [["phishing"]]),
     "Phishing",
     'Istilahnya menyerupai kata "memancing" (fishing) dalam bahasa Inggris.'),
    ("easy-010", "binary", "Pinjaman darurat dari nomor baru sahabat",
     "Sahabat karibmu tiba-tiba chat dari nomor baru dan meminta pinjaman darurat Rp 1 Juta tanpa basa-basi karena sedang di rumah sakit. Apakah aman untuk langsung mentransfer?",
     [("tidak", "Tidak", True), ("ya", "Ya", False)],
     "Impersonasi / pembajakan akun",
     "Ini adalah modus impersonasi atau akun dibajak. Kamu wajib menelepon nomor sahabatmu yang asli atau memverifikasi identitasnya terlebih dahulu."),
]

MEDIUM = [
    ("medium-001", "multiple_choice", "Email admin Instagram copyright palsu",
     "Kamu menerima email dari admin@instagram-copyright-center.com yang menyatakan akunmu akan dihapus dalam 24 jam karena pelanggaran hak cipta. Tindakan apa yang paling tepat?",
     [("A", "Segera klik link banding agar akun tidak dihapus.", False),
      ("B", "Teliti alamat email pengirim, sadari domainnya palsu, dan abaikan.", True),
      ("C", "Balas email tersebut dengan melampirkan KTP untuk verifikasi.", False)],
     "Phishing email",
     "Selalu cek bagian belakang tanda @ pada email. Email resmi Instagram berakhiran @instagram.com atau @mail.instagram.com."),
    ("medium-002", "binary", "Transaksi e-commerce via chat pribadi",
     'Penjual di sebuah e-commerce memintamu untuk melanjutkan transaksi pembayaran barang melalui chat WhatsApp pribadi dan menransfer langsung ke rekening pribadinya karena "sistem sedang error". Apakah tindakan ini aman?',
     [("tidak", "Tidak", True), ("ya", "Ya", False)],
     "Transaksi di luar sistem",
     "Bertransaksi di luar sistem resmi (rekber) e-commerce berarti kamu kehilangan fitur perlindungan pembeli (garansi uang kembali)."),
    ("medium-003", "text_input", "Kode QR palsu di kasir",
     "Metode memancing informasi kredensial perbankan dengan menggunakan kode QR palsu (misalnya yang ditempel menimpa QR asli di kasir atau meja restoran) disebut?",
     ("Quishing", [["quishing"]]),
     "Quishing",
     "Singkatan perpaduan dari kata QR Code dan Phishing."),
    ("medium-004", "multiple_choice", "Flashdisk asing di parkiran kampus",
     "Kamu menemukan flashdisk berlogo perusahaan terkenal tergeletak di parkiran kampus. Apa risiko terbesar jika kamu mencolokkannya ke laptopmu?",
     [("A", "Flashdisk tersebut akan merusak hardware baterai laptop.", False),
      ("B", "Flashdisk berisi malware yang terinstal otomatis (serangan Baiting).", True),
      ("C", "Flashdisk akan menghapus otomatis riwayat pencarian Google Chrome-mu.", False)],
     "Baiting",
     'Serangan "Baiting" memanfaatkan rasa penasaran korban. Begitu terhubung, skrip peretasan bisa berjalan otomatis di latar belakang.'),
    ("medium-005", "binary", "Domain mengecoh kIikbca.com",
     'Domain web seperti www.kIikbca.com (menggunakan huruf "I" kapital pengganti "l" kecil) sama pastinya aman untuk bertransaksi selama tampilan web-nya persis dengan aslinya.',
     [("tidak", "Tidak", True), ("ya", "Ya", False)],
     "Typosquatting",
     "Ini adalah serangan Typosquatting (mengecoh visual dengan huruf mirip) untuk mencuri username dan kata sandi saat kamu mencoba login."),
    ("medium-006", "text_input", "Malware pengunci file dengan tebusan",
     "Jenis malware yang secara agresif menyandera dan mengunci/mengenkripsi seluruh file penting di komputermu lalu menuntut pembayaran dalam bentuk kripto agar file bisa dibuka kembali disebut?",
     ("Ransomware", [["ransomware"]]),
     "Ransomware",
     'Kata depannya berasal dari bahasa Inggris yang berarti "uang tebusan".'),
    ("medium-007", "multiple_choice", "Telepon mengaku polisi minta uang damai",
     'Seseorang meneleponmu sambil marah-marah, mengaku dari kepolisian, mengabarkan keluargamu ditahan dan butuh uang "damai" agar tidak dipenjara malam ini. Langkah terbaik?',
     [("A", "Panik dan segera negosiasi jumlah uang untuk transfer.", False),
      ("B", "Tanya nama pangkatnya secara rinci untuk memastikan dia polisi asli.", False),
      ("C", "Matikan telepon, tenangkan diri, lalu hubungi langsung keluargamu yang bersangkutan.", True)],
     "Rekayasa sosial / penipuan telepon",
     "Ini adalah metode Rekayasa Sosial konvensional. Penipu sengaja menciptakan urgensi dan emosi tinggi (kepanikan) agar target kehilangan akal sehat."),
    ("medium-008", "binary", "2FA via SMS dianggap anti-retas total",
     "Jika akun media sosialmu sudah mengaktifkan perlindungan Autentikasi Dua Langkah (2FA) via SMS, mustahil akunmu bisa diretas dari jarak jauh.",
     [("tidak", "Tidak", True), ("ya", "Ya", False)],
     "SIM swap",
     "SMS memiliki celah keamanan tingkat tinggi bernama SIM Swap. Lebih disarankan menggunakan Authenticator App (seperti Google Authenticator)."),
    ("medium-009", "text_input", "Singkatan intelijen dari internet terbuka",
     "Penipu sering mengumpulkan informasi personal korban dari media sosial (nama anjing, sekolah lama) untuk menebak password. Praktik mengumpulkan intelijen dari informasi terbuka di internet ini dikenal dengan singkatan?",
     ("OSINT", [["osint"]]),
     "OSINT",
     "Kepanjangannya adalah Open Source Intelligence."),
    ("medium-010", "multiple_choice", "Iklan iPhone sitaan Bea Cukai",
     'Kamu melihat Iklan bersponsor di Facebook: iPhone 15 Pro Max dijual sangat murah Rp 3 Juta karena "Barang Sitaan Bea Cukai". Sikap yang tepat:',
     [("A", "Gunakan metode pembayaran paylater untuk mencoba.", False),
      ("B", "Sadari ini jebakan harga tak masuk akal (Too good to be true), abaikan dan laporkan iklan.", True),
      ("C", "Tanya ke penjual bukti foto KTP untuk meyakinkan keaslian toko.", False)],
     "Penipuan e-commerce",
     "Foto KTP dan testimoni sangat mudah dipalsukan penipu untuk membangun kepercayaan semu."),
]

HARD = [
    ("hard-001", "binary", "Voice note bos yang dikloning AI",
     "Kamu adalah staf keuangan. Bosmu (Direktur) mengirim pesan suara (Voice Note) via WhatsApp dengan nada suara dan gaya bicaranya yang identik, memerintahkan transfer dana mendadak ke nomor rekening vendor tak dikenal tanpa dokumen tertulis. Karena suaranya tidak mungkin ditiru, kamu aman menuruti instruksi tersebut.",
     [("tidak", "Tidak", True), ("ya", "Ya", False)],
     "Deepfake audio",
     "Itu bisa jadi serangan manipulasi suara Deepfake Audio / AI Voice Cloning."),
    ("hard-002", "multiple_choice", "Aplikasi senter minta izin kontak & SMS",
     'Kamu mencoba menginstal aplikasi "Senter Flashlight HD" dari luar Play Store. Pada saat instalasi, aplikasi tersebut meminta izin (permissions) ke Kontak dan SMS. Apa motif sebenarnya?',
     [("A", "Membantu membagikan aplikasi senter ke teman via SMS.", False),
      ("B", "Mengakses SMS untuk memotong pulsa dan menyadap masuknya kode OTP.", True),
      ("C", "Aplikasi membutuhkan internet untuk menampilkan iklan di senter.", False)],
     "Spyware / abuse permission",
     "Izin kontak dan SMS tidak masuk akal untuk aplikasi senter; itu ciri spyware pencuri OTP."),
    ("hard-003", "text_input", "Ribuan OTP beruntun menutupi transaksi asli",
     "Istilah untuk jenis serangan di mana peretas mengirimkan ribuan permintaan OTP secara beruntun ke HP korban dalam waktu singkat, bertujuan membuat korban merasa jengkel, kebingungan, atau menyembunyikan notifikasi transaksi peretasan yang sebenarnya sedang berjalan disebut?",
     ("OTP Bombing / SMS Bombing", [["otp bombing"], ["sms bombing"]]),
     "OTP bombing",
     "OTP bombing menyamarkan notifikasi transaksi asli di antara ribuan pesan palsu."),
    ("hard-004", "binary", "Ikon gembok HTTPS sebagai jaminan keaslian",
     'Sebuah situs penipuan tidak akan mungkin menampilkan ikon gembok "HTTPS" di browser, karena otoritas sertifikasi di dunia maya akan selalu memverifikasi legalitas perusahaan secara ketat sebelum memberikan sertifikat keamanan.',
     [("tidak", "Tidak", True), ("ya", "Ya", False)],
     "Sertifikat HTTPS palsu",
     "Sertifikat SSL/HTTPS saat ini bisa didapatkan secara instan, gratis, dan tanpa verifikasi dokumen identitas perusahaan."),
    ("hard-005", "multiple_choice", "Root domain pada URL login.microsoft.security-update.com",
     "Kamu menerima surel dari alamat yang mencurigakan. Di badannya terdapat tautan https://login.microsoft.security-update.com/auth. Pada hierarki domain tersebut, bagian manakah yang merupakan Domain Utama (Root Domain) yang menunjukkan siapa pemilik sebenarnya dari situs itu?",
     [("A", "microsoft", False), ("B", "security-update.com", True), ("C", "login.microsoft", False)],
     "Phishing domain",
     "Baca domain dari kanan; teks sebelum tanda @ atau subdomain bisa dipalsukan bebas."),
    ("hard-006", "text_input", "Phishing bertarget eksekutif perusahaan",
     "Serangan phishing yang ditargetkan secara spesifik kepada petinggi perusahaan berjabatan tinggi (seperti CEO, CFO, atau direktur utama) dengan pesan yang dibuat sangat meyakinkan dan khusus, disebut dengan istilah phishing tipe apa?",
     ("Whaling", [["whaling"]]),
     "Whaling",
     "Whaling menarget eksekutif dengan pesan yang tampak sah dan bernilai tinggi."),
    ("hard-007", "binary", "Klik lalu tutup browser tetap 100% aman",
     "Jika kamu terlanjur menekan klik pada sebuah tautan tautan phishing namun cepat-cepat menutup browser sebelum mengisi data diri apapun (form username/password), komputermu dijamin 100% aman dari ancaman peretasan.",
     [("tidak", "Tidak", True), ("ya", "Ya", False)],
     "Drive-by download",
     "Tetap ada ancaman injeksi kerentanan yang disebut Drive-by Download, di mana malware bisa terunduh secara rahasia begitu situs dirender oleh browser."),
    ("hard-008", "multiple_choice", "Penyadapan di Wi-Fi Kafe",
     "Jenis peretasan di mana pelaku berada dan mencegat jaringan komunikasi internet antara komputermu dan router Wi-Fi Kafe, sehingga pelaku bisa membaca semua data yang kamu kirim tanpa kamu sadari, dikenal dengan nama:",
     [("A", "Man-in-the-Middle (MitM) Attack", True), ("B", "SQL Injection", False),
      ("C", "Cross-Site Scripting (XSS)", False)],
     "Man-in-the-Middle",
     "MitM di Wi-Fi publik memungkinkan penyadapan; pakai koneksi terenkripsi dan hindari situs sensitif."),
    ("hard-009", "text_input", "Pura-pura tim IT menanyakan password",
     'Sebuah modus manipulasi di mana seseorang berpura-pura menjadi tim IT kantormu melalui telepon, dan perlahan menanyakan hal-hal yang membuatmu tanpa sadar menyebutkan password dengan dalih "perawatan server", tergolong ke dalam seni peretasan psikologis apa?',
     ("Social Engineering / Rekayasa Sosial",
      [["social engineering"], ["rekayasa sosial"], ["rekayasa"]]),
     "Rekayasa sosial",
     "Rekayasa sosial memanfaatkan otoritas palsu; kata sandi tidak pernah boleh disebutkan ke siapa pun."),
    ("hard-010", "binary", "URL dengan tanda @ mengarah ke google.com",
     "Seorang anonim di forum membagikan link berikut: http://www.google.com@192.168.1.1/login. Saat kamu klik, secara teknis struktur keamanan di browser internet modern akan tetap mengarahkanmu ke situs aman www.google.com.",
     [("tidak", "Tidak", True), ("ya", "Ya", False)],
     "URL trick (@ exploitation)",
     "Struktur URL dengan tanda `@` membuat browser mengabaikan teks di kirinya (dianggap username) dan menuju IP di kanannya: 192.168.1.1/login."),
]

CHAPTERS = {10: "Bab I · Dasar", 20: "Bab II · Menengah", 30: "Bab III · Lanjutan"}


def rule(consequence: str, jane: str, tactic: str, is_safe: bool, keywords=None, digits=None):
    lo, hi = digits or (None, None)
    return {"is_safe": is_safe, "keywords": keywords or [], "digits_min": lo, "digits_max": hi,
            "red_john_reaction": "", "consequence": consequence,
            "jane_intervention": jane, "manipulation_tactic": tactic}


def build(item, round_number: int) -> dict:
    sid, kind, title, question, answers, threat, explain = item
    chapter = CHAPTERS[10 if round_number <= 10 else 20 if round_number <= 20 else 30]
    row = {
        "id": sid, "round_number": round_number,
        "chapter_title": chapter,
        "title": title, "kind": kind, "threat_type": threat,
        # story_context dirender sebagai deskripsi, red_john_message sebagai isi pesan masuk.
        # Jangan ulangi soal di keduanya.
        "story_context": f"Kasus {threat}. Baca pesan masuk dengan teliti sebelum menentukan langkah.",
        "red_john_message": question,
        "jane_clue": f"Petunjuk: {explain}",
        "debrief": {
            "summary": explain,
            "safe_action": "Jangan klik, jangan bagikan data, dan verifikasi lewat kanal resmi yang kamu hubungi sendiri.",
            "red_john_tactic": threat,
        },
        "is_active": True,
    }
    if kind == "text_input":
        answer, variants = answers
        row["choices"] = None
        row["text_config"] = {
            "prompt": "Ketik jawabanmu",
            "placeholder": "Ketik jawaban…",
            "rules": [rule("Jawaban tepat!", "Detektif sejati mengenali trik ini.", threat, True, kw)
                      for kw in variants],
            "default": rule("Belum tepat. Baca baik-baik petunjuk soal.",
                            f"Jawaban yang dicari: {answer}.", threat, False),
        }
    else:
        row["text_config"] = None
        row["choices"] = [
            {"id": cid.lower(), "text": text, "is_safe": safe,
             "consequence": ("Langkah yang benar — kamu tidak tertipu." if safe
                             else "Jawaban ini membuatmu terjebak dalam trik Red John."),
             "jane_intervention": (explain if safe else "Bandingkan dengan jawaban aman di debrief."),
             "manipulation_tactic": threat}
            for cid, text, safe in answers
        ]
    return row


def rows() -> list[dict]:
    items = EASY + MEDIUM + HARD
    rows = [build(item, n) for n, item in enumerate(items, start=1)]
    assert len(rows) == 30 and len({r["id"] for r in rows}) == 30
    return [QuizQuestionCreate.model_validate(r).model_dump(mode="json") for r in rows]


def main() -> None:
    data = rows()
    print(f"{len(data)} soal valid dari {SOAL.name}")
    for r in data:
        print(f"  {r['round_number']:>2} {r['id']:<12} {r['kind']:<16} {r['title']}")
    if "--dry-run" in sys.argv:
        return
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    req = urllib.request.Request(
        TABLE_URL, data=json.dumps(data, ensure_ascii=False).encode(), method="POST",
        headers={"apikey": key, "Authorization": f"Bearer {key}",
                 "Content-Type": "application/json",
                 "Prefer": "resolution=merge-duplicates,return=representation"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            written = json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        raise SystemExit(f"HTTP {exc.code}: {exc.read().decode('utf-8', 'replace')}")
    print(f"Upsert {len(written)} baris ke quiz_questions.")


if __name__ == "__main__":
    main()
