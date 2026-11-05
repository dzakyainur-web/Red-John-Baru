export type Choice = {
  id: string;
  text: string;
  safe: boolean;
  consequence: string;
  explain: string;
};

export type Step =
  | { kind: "message"; from: string; text: string }
  | { kind: "choice"; options: Choice[] };

export type Scenario = {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  intro: string;
  steps: Step[];
  debrief: string;
};

export const SCENARIOS: Scenario[] = [
  {
    id: "job-scam-01",
    title: "Tawaran Kerja WFH Terlalu Bagus",
    difficulty: "easy",
    intro: "Kamu dapat DM dari akun yang mengaku HRD sebuah perusahaan.",
    steps: [
      { kind: "message", from: "HRD PT Maju Jaya", text: "Halo kak! Kami buka lowongan admin online, gaji 15 juta per bulan, WFH, tanpa pengalaman. Masih ada kuota hari ini!" },
      {
        kind: "choice",
        options: [
          {
            id: "a",
            text: "Langsung isi data & kirim foto KTP biar cepat diproses",
            safe: false,
            consequence: "Data KTP kamu dikirim ke penipu. Besoknya akun 'HRD' diblokir dan hilang.",
            explain: "Perusahaan resmi tidak meminta foto KTP sebelum ada kontrak. Gaji besar + tanpa pengalaman + buru-buru adalah pola klasik scam kerja.",
          },
          {
            id: "b",
            text: "Tanya nama resmi perusahaan & cek website serta legalitasnya",
            safe: true,
            consequence: "'HRD' bilang 'nanti dijelasin setelah daftar' dan menekan kamu buru-buru. Tandai sebagai mencurigakan.",
            explain: "Perusahaan asli transparan: nama, alamat kantor, dan website resmi mudah diverifikasi. Penipu menghindari pertanyaan verifikasi.",
          },
          {
            id: "c",
            text: "Transfer biaya training 250rb dulu supaya diterima",
            safe: false,
            consequence: "Uang 250rb hilang. Setelah transfer, kamu diminta bayar 'biaya AKD' lagi — terus-menerus.",
            explain: "Lowongan resmi TIDAK pernah minta pembayaran dari pelamar. Minta bayar di muka = hampir pasti penipuan.",
          },
        ],
      },
    ],
    debrief: "Ciri scam kerja: gaji tidak wajar besar, tanpa syarat, minta biaya di muka, minta data pribadi (KTP) terlalu cepat, dan selalu menekan 'kuota terakhir'.",
  },
  {
    id: "friend-impersonation-01",
    title: "Teman Minta Kode OTP",
    difficulty: "easy",
    intro: "Nomor tak dikenal mengirim chat WA, mengaku temanmu yang 'ganti nomor'.",
    steps: [
      { kind: "message", from: "Nomor tak dikenal", text: "Bro, ini nomer baru aku, nomer lama kena hack. Aku lagi login m-banking tapi OTP-nya masuk ke nomer kamu. Kirim kode 6 digitnya ya, penting banget." },
      {
        kind: "choice",
        options: [
          {
            id: "a",
            text: "Kirim OTP-nya, toh katanya teman sendiri",
            safe: false,
            consequence: "Akun m-banking temanmu (atau akunmu yang dipakai penipu) berhasil diambil alih.",
            explain: "OTP adalah kunci akunmu. Tidak ada layanan resmi yang minta OTP lewat chat — apalagi 'teman' dari nomor baru yang belum terverifikasi.",
          },
          {
            id: "b",
            text: "Telepon nomor lama temanmu untuk konfirmasi dulu",
            safe: true,
            consequence: "Temanmu bilang tidak ganti nomor. Itu penipu.",
            explain: "Verifikasi lewat kanal lain (telepon nomor lama, tanya langsung) adalah cara paling aman sebelum percaya identitas di chat.",
          },
          {
            id: "c",
            text: "Tanya kode itu buat apa, tapi tetap siap kirim kalau alasannya masuk akal",
            safe: false,
            consequence: "Penipu punya cerita siap pakai dan berhasil meyakinkanmu. OTP terkirim, akun bobol.",
            explain: "Alasan penipu selalu 'masuk akal'. Aturannya sederhana: OTP tidak pernah boleh dibagikan ke siapa pun, apa pun alasannya.",
          },
        ],
      },
    ],
    debrief: "OTP = kunci rumahmu. Jangan pernah dibagikan, bahkan ke orang yang mengaku keluarga/teman/bank. Verifikasi lewat kanal lain sebelum percaya.",
  },
  {
    id: "giveaway-01",
    title: "Giveaway TikTok Menang Hadiah",
    difficulty: "medium",
    intro: "Kamu dapat DM: 'Selamat, kamu pemenang giveaway!'",
    steps: [
      { kind: "message", from: "Admin Giveaway", text: "SELAMAT! 🎉 Kamu menang iPhone dari giveaway! Tinggal bayar ongkir 100rb & isi data kartu untuk verifikasi pemenang. Link: tiktok-giveaway.example/claim" },
      {
        kind: "choice",
        options: [
          {
            id: "a",
            text: "Bayar ongkir & isi data kartu — sayang kan, sudah menang",
            safe: false,
            consequence: "Kartu kreditmu terpakai jutaan rupiah untuk transaksi yang bukan kamu.",
            explain: "Hadiah asli tidak pernah minta pembayaran. 'Ongkir/verifikasi' adalah trik untuk mengambil data kartu.",
          },
          {
            id: "b",
            text: "Cek akun resmi kreatornya — apakah benar ada giveaway ini",
            safe: true,
            consequence: "Kamus giveaway resmi di bio kreator: ini giveaway palsu. Blokir & lapor.",
            explain: "Selalu verifikasi lewat akun resmi (bio, channel resmi), bukan lewat link yang dikirim ke DM.",
          },
          {
            id: "c",
            text: "Isi data kartu tapi jangan bayar apa-apa",
            safe: false,
            consequence: "Data kartu bocor. Cukup nomor + CVV untuk belanja online di banyak merchant.",
            explain: "Memberi data kartu dengan alasan apa pun = risiko. Tidak ada 'verifikasi pemenang' yang butuh data kartu.",
          },
        ],
      },
    ],
    debrief: "Giveaway palsu: kamu 'menang' padahal tidak ikut, diminta bayar ongkir/pajak, atau isi data kartu. Hadiah asli tidak butuh pembayaran dari pemenang.",
  },
  {
    id: "investment-01",
    title: "Investasi Bodong 'Crypto' di Grup WA",
    difficulty: "medium",
    intro: "Kamu diinvite ke grup WA 'Komunitas Profit Harian'.",
    steps: [
      { kind: "message", from: "Mentor Crypto", text: "Modal 500rb, profit 10% PER HARI, dijamin, tanpa risiko! Lihat testimoni member (semuanya beneran untung). Slot deposit terakhir hari ini!" },
      {
        kind: "choice",
        options: [
          {
            id: "a",
            text: "Deposit 500rb — risikonya kecil, katanya dijamin",
            safe: false,
            consequence: "Awalnya 'profit' tampil di dashboard. Saat mau tarik dana, diminta bayar 'pajak penarikan'. Setelah itu akun diblokir.",
            explain: "Investasi asli TIDAK PERNAH dijamin profit & selalu ada risiko. 'Profit pasti tanpa risiko' = definisi penipuan.",
          },
          {
            id: "b",
            text: "Cek apakah platformnya terdaftar & berizin (mis. di situs OJK/Bappebti)",
            safe: true,
            consequence: "Platformnya tidak ada di daftar resmi. Keluar grup dan laporkan.",
            explain: "Cek legalitas di situs resmi regulator (OJK, Bappebti untuk aset kripto) adalah langkah wajib sebelum menaruh uang.",
          },
          {
            id: "c",
            text: "Deposit kecil dulu 50rb buat 'uji coba'",
            safe: false,
            consequence: "50rb 'balik' jadi 55rb di dashboard — kamu yakin dan deposit jutaan. Semua hilang.",
            explain: "Deposit kecil yang 'berhasil' adalah trik membangun kepercayaan (grooming). Dashboard bisa dipalsukan total.",
          },
        ],
      },
    ],
    debrief: "Tanda investasi bodong: profit pasti & dijamin, tanpa risiko, testimoni seragam, tekanan deposit hari ini, dan minta transfer ke rekening pribadi.",
  },
  {
    id: "bank-cs-01",
    title: "CS Bank Minta Kode M-Banking",
    difficulty: "medium",
    intro: "Telepon/SMS dari 'CS bank': transaksi mencurigakan terdeteksi.",
    steps: [
      { kind: "message", from: "CS Bank (08xx)", text: "Maaf Bu, ada transaksi Rp5.000.000 dari kartu Anda. Untuk pembatalan, segera masukkan kode m-banking & PIN di link aman berikut: bankbni-verif.example/stop" },
      {
        kind: "choice",
        options: [
          {
            id: "a",
            text: "Buka link-nya sekarang, uang 5 juta dipertaruhkan!",
            safe: false,
            consequence: "Link itu halaman phishing. Kredensial m-banking kamu terkirim ke penipu, saldo kosong.",
            explain: "Bank asli tidak pernah mengirim link untuk 'membatalkan transaksi'. Cek domain: bukan domain resmi bank.",
          },
          {
            id: "b",
            text: "Tutup telepon, hubungi call center resmi bank dari nomor di website/kartu",
            safe: true,
            consequence: "Call center resmi konfirmasi: tidak ada transaksi mencurigakan. Itu penipuan.",
            explain: "Selalu hubungi bank lewat nomor resmi (di website resmi / kartu debit), jangan nomor yang menghubungimu.",
          },
          {
            id: "c",
            text: "Bilang ke penipu kamu tahu ini scam, lalu tutup telepon",
            safe: true,
            consequence: "Penipu berhenti menghubungi. Tidak ada data yang terkirim.",
            explain: "Memutus komunikasi tanpa memberi data apa pun selalu aman. Melaporkan ke bank setelahnya makin bagus.",
          },
        ],
      },
    ],
    debrief: "CS bank palsu: menakut-nakuti 'transaksi tidak dikenal', minta kredensial/PIN/OTP, kirim link. Prinsip: bank tidak pernah minta PIN, OTP, atau kode m-banking.",
  },
];
