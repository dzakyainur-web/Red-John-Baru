export type ChoiceKind = "multiple_choice" | "binary" | "text_input";

export type GameChoice = {
  id: string;
  text: string;
  isSafe: boolean;
  consequence: string;
  janeIntervention: string;
  manipulationTactic: string;
};

export type TextInputEvaluation = {
  isSafe: boolean;
  userSaid: string;
  redJohnReaction: string;
  consequence: string;
  janeIntervention: string;
  manipulationTactic: string;
};

export type GameRound = {
  id: string;
  roundNumber: number;
  chapterTitle: string;
  title: string;
  kind: ChoiceKind;
  threatType: string;
  storyContext: string;
  redJohnMessage: string;
  redJohnNote?: string;
  redJohnTaunt?: string;
  janeClue: string;
  choices?: GameChoice[];
  inputPrompt?: string;
  inputPlaceholder?: string;
  evaluateInput?: (input: string) => TextInputEvaluation;
  debrief: {
    summary: string;
    safeAction: string;
    redJohnTactic: string;
  };
};

// Regex pembantu untuk evaluasi input teks bebas
const REFUSAL_REGEX =
  /(?:ga\s*mau|gamau|nggak|ngga|tidak|ogah|bodo|penipu|scammer?|lapor|polisi|blokir|tolak|jangan\s*harap|najis|dih|malas|no\s*way|nope|never|bukan|stop|bacot|urus|palsu|haram|bohong|hoaks|hoax|kelaut)/i;
const DIGITS_REGEX = /\b\d{4,8}\b/;
const AGREE_REGEX = /(?:setuju|iya|ok|oke|deal|maaf|ampun|tolong|jangan\s*sebar|kirim|ini\s*otp|transfer)/i;

export const RED_JOHN_ROUNDS: GameRound[] = [
  {
    id: "round-1",
    roundNumber: 1,
    chapterTitle: "BAB I: INISIASI",
    title: "SMS Panik Pembatalan Transaksi BCA",
    kind: "multiple_choice",
    threatType: "Phishing Urgensi & Otoritas Palsu",
    storyContext:
      "Malam hari pukul 23.15, ponselmu bergetar kencang. Sebuah pesan SMS masuk dari nomor misterius mengatasnamakan Bank BCA.",
    redJohnMessage:
      "PERINGATAN RESMI BANK BCA: Terdeteksi transaksi Rp8.500.000 keluar dari kartu Anda ke 'Toko Elektronik Makmur'. Segera batalkan dalam waktu 10 menit sebelum dana terdebit permanen! Klik tautan darurat: https://bca-bataltransaksi.xyz/auth atau balas SMS ini dengan kode OTP 6 digit yang baru kami kirimkan ke nomor Anda.",
    redJohnTaunt: "Hehehe... uang 8,5 jutamu melayang jika kamu ragu walau sedetik saja!",
    janeClue:
      "Tenang, tarik napas! Amati domain tautannya: 'bca-bataltransaksi.xyz'. Apakah bank resmi BCA memakai akhiran domain gratisan '.xyz'? Dan ingat: bank tidak pernah meminta OTP lewat SMS!",
    choices: [
      {
        id: "a",
        text: "Panik uang hilang, langsung klik tautan darurat dan masukkan username, password m-banking, serta OTP.",
        isSafe: false,
        consequence: "Saldo rekeningmu langsung terkuras habis dalam 30 detik ke rekening penampungan Red John.",
        manipulationTactic: "False Urgency & Authority Bias (Tekanan waktu 10 menit & menyamar jadi otoritas bank)",
        janeIntervention:
          "Jane mengaktifkan perisai darurat! Red John sengaja memasang batas waktu 10 menit agar otak logismu mati dan panik mengambil alih. Ingat prinsip emas perbankan: Bank asli TIDAK AKAN meminta pembatalan lewat link chat ataupun meminta kode OTP!",
      },
      {
        id: "b",
        text: "Balas SMS tersebut menanyakan kebenaran transaksi, sambil melampirkan kode OTP yang baru masuk.",
        isSafe: false,
        consequence: "Kode OTP langsung dipakai bot Red John untuk menyetujui transaksi gelap. Rekeningmu jebol.",
        manipulationTactic: "Credential Theft via Chat (Pencurian kunci OTP)",
        janeIntervention:
          "Jangan pernah membagikan OTP! Kode OTP adalah kunci brankas terakhirmu. Siapa pun yang meminta OTP lewat chat atau telepon—bahkan yang mengaku direktur bank sekalipun—adalah penipu!",
      },
      {
        id: "c",
        text: "Abaikan SMS dan jangan klik tautan. Tutup pesan, lalu buka aplikasi BCA Mobile resmi atau telepon HaloBCA 1500888.",
        isSafe: true,
        consequence: "Kamu memeriksa mutasi di BCA Mobile resmi dan tidak ada transaksi mencurigakan. Saldo utuh dan kamu selamat!",
        manipulationTactic: "Manipulasi berhasil ditangkal!",
        janeIntervention:
          "Langkah brilian! Kamu melakukan 'verifikasi saluran kedua' (second-channel check) lewat aplikasi resmi. Manuver kepanikan Red John langsung patah di ronde pertama!",
      },
    ],
    debrief: {
      summary: "Bank resmi tidak membatalkan transaksi lewat SMS link dan tidak pernah menanyakan kode OTP.",
      safeAction: "Selalu cek mutasi rekening di aplikasi m-banking resmi atau telepon nomor call center di kartu ATM.",
      redJohnTactic: "Memicu kepanikan dengan nominal jutaan rupiah dan batas waktu singkat agar korban panik.",
    },
  },
  {
    id: "round-2",
    roundNumber: 2,
    chapterTitle: "BAB II: PENYUSUPAN MALWARE",
    title: "Izin Akses File Kurir JNE Palsu (.APK)",
    kind: "binary",
    threatType: "Android Trojan Malware (.APK)",
    storyContext:
      "Gagal di perbankan, Red John beralih menyamar sebagai kurir paket ekspedisi WhatsApp. Dia mengirimkan dokumen konfirmasi resi yang mencurigakan.",
    redJohnMessage:
      "Halo kak, paket pesanan no resi JP882910 tertahan di gudang logistik kami karena penulisan nama penerima rusak terkena air hujan. Mohon unduh surat konfirmasi alamat ini lalu buka aplikasinya untuk koreksi data ya kak: Foto_Paket_JNE_Resi99.apk\n\n[Sistem meminta: Izinkan instalasi dari Sumber Tak Dikenal & Izinkan Baca SMS?]",
    redJohnTaunt: "Tinggal klik 'IYA', paket impianmu akan langsung diantar sampai depan pintu...",
    janeClue:
      "Perhatikan baik-baik! Foto dokumen itu berekstensi '.apk', bukan foto .jpg! APK adalah file program aplikasi yang bisa mencuri SMS dan OTP di ponselmu!",
    choices: [
      {
        id: "iya",
        text: "IYA — Izinkan instalasi APK dan berikan akses baca SMS agar kurir segera mengantar paket.",
        isSafe: false,
        consequence: "Trojan Android terpasang. Red John kini bisa membaca seluruh SMS masuk dan membajak WhatsApp-mu.",
        manipulationTactic: "Trojan Disguise (Menyamarkan malware berkedok surat paket ekspedisi)",
        janeIntervention:
          "Jane membunyikan sirine bahaya! Foto dokumen tidak pernah berekstensi '.apk'. Begitu kamu izinkan akses SMS, malware Red John akan menyedot semua kode verifikasi bank tanpa kamu sadari. Jangan pernah izinkan instalasi APK di luar Google Play Store!",
      },
      {
        id: "tidak",
        text: "TIDAK — Tolak instalasi file APK, blokir nomor kurir palsu, dan cek nomor resi mandiri di situs resmi JNE.",
        isSafe: true,
        consequence: "Ponselmu bersih dari trojan. Status paket ternyata fiktif dan Red John gigit jari!",
        manipulationTactic: "Manipulasi berhasil ditangkal!",
        janeIntervention:
          "Pilihan hebat! Naluri pertahananmu sangat tajam. Mengatakan 'TIDAK' pada permintaan instalasi APK asing adalah tameng terkuat dari kejahatan siber Android di Indonesia saat ini.",
      },
    ],
    debrief: {
      summary: "Ekspedisi resmi tidak pernah mengirimkan file installer .apk untuk pengecekan resi atau foto paket.",
      safeAction: "Jangan pernah mengaktifkan 'Install from Unknown Sources'. Foto asli berakhiran .jpg, .png, atau .webp.",
      redJohnTactic: "Memanfaatkan rasa penasaran atas paket barang untuk menyelundupkan malware penyadap SMS OTP.",
    },
  },
  {
    id: "round-3",
    roundNumber: 3,
    chapterTitle: "BAB III: JERATAN KESERAKAHAN",
    title: "Tawaran Kerja Freelance 'Like Video YouTube'",
    kind: "multiple_choice",
    threatType: "Task Scam / Skema Ponzi Deposit",
    storyContext:
      "Red John mengubah strateginya. Kali ini dia memasang wajah manis seorang manajer agensi periklanan global di Telegram.",
    redJohnMessage:
      "Selamat siang! Kami agensi pemasaran media internasional. Butuh freelancer online cukup like & subscribe video YouTube. Komisi Rp30.000/video, potensi Rp500.000/hari! Tugas pertama selesai, ini bonus Rp50.000 sudah kami transfer ke rekeningmu (bisa dicek). Untuk membuka tugas VIP komisi Rp2.500.000, silakan transfer deposit jaminan modal Rp300.000 ke rekening mentor kami ya kak.",
    redJohnTaunt: "Uang 50rb sudah terbukti masuk ke rekeningmu kan? Sekarang giliranmu melipatgandakannya jadi jutaan!",
    janeClue:
      "Awas! Uang 50rb di awal hanyalah umpan pancingan (grooming). Di dunia kerja nyata, pekerja itu dibayar atas keringatnya, BUKAN menyetor deposit uang ke rekening pribadi!",
    choices: [
      {
        id: "a",
        text: "Transfer deposit 300rb ke rekening mentor karena tadi terbukti bonus 50rb benar-benar cair ke rekening.",
        isSafe: false,
        consequence: "Uang 300rb lenyap. Red John lalu meminta deposit 1,5 juta untuk 'buka kunci penarikan' sampai tabunganmu habis.",
        manipulationTactic: "Grooming & Sunk Cost Fallacy (Umpan keuntungan kecil untuk merampok uang besar)",
        janeIntervention:
          "Jane menangkap jebakannya! Ini adalah 'Pig Butchering Task Scam'. Uang 50rb di awal adalah umpan agar kamu rakus dan percaya. Sekali kamu transfer deposit, uangmu tidak akan pernah kembali!",
      },
      {
        id: "b",
        text: "Minta potongan langsung: 'Potong saja 300rb itu dari komisi 2,5 juta yang akan saya dapatkan'.",
        isSafe: true,
        consequence: "Mentor Red John langsung gelagapan, marah, dan mengeluarkanmu dari grup. Kamu selamat tanpa kehilangan sepeser pun!",
        manipulationTactic: "Manipulasi berhasil ditangkal!",
        janeIntervention:
          "Jawaban telak yang sangat cerdas! Penipu tidak bisa menjawab argumen logis ini karena mereka tidak punya proyek nyata. Kamu berhasil mempermalukan Red John!",
      },
      {
        id: "c",
        text: "Ajak teman dan keluarga ikut menyetor uang agar mendapat komisi referral tambahan.",
        isSafe: false,
        consequence: "Keluarga dan temanmu tertipu jutaan rupiah karena ajakanmu. Hubungan pertemanan hancur.",
        manipulationTactic: "Affiliate Exploitation",
        janeIntervention:
          "Jangan bawa orang lain masuk ke perangkap! Sindikat freelance bodong sengaja memanfaatkan jaringan pertemanan untuk memperbanyak korban. Hentikan rantainya di kamu!",
      },
    ],
    debrief: {
      summary: "Pekerjaan legal tidak memungut biaya atau meminta deposit dana dari pelamar kerja.",
      safeAction: "Tolak mentah-mentah lowongan kerja freelance yang meminta setoran uang di muka dengan alasan tier VIP.",
      redJohnTactic: "Membangun rasa percaya lewat transfer uang kecil, lalu menguras dana korban bertahap.",
    },
  },
  {
    id: "round-4",
    roundNumber: 4,
    chapterTitle: "BAB IV: TODONGAN KREDENSIAL",
    title: "Todongan OTP Langsung oleh Bot Red John",
    kind: "text_input",
    threatType: "Direct OTP Extortion & Social Engineering",
    storyContext:
      "Tiba-tiba sistem keamanan akun WhatsApp-mu mengirim notifikasi: 'Kode pendaftaran WhatsApp diminta'. Bersamaan dengan itu, Red John mengirim pesan menodong.",
    redJohnMessage:
      "SAYA SUDAH MEMEGANG AKSES NOMOR TELEPONMU. KODE OTP 6 DIGIT BARU SAJA MASUK KE HP-MU. KETIK DAN KIRIMKAN 6 DIGIT KODE ITU SEKARANG, ATAU AKUNMU SAYA HAPUS PERMANEN!",
    redJohnTaunt: "Cepat ketik kodenya di bawah jika masih sayang dengan akun dan obrolan pribadimu!",
    inputPrompt: "Apa yang kamu ketik untuk membalas Red John?",
    inputPlaceholder: "Ketik balasanmu di sini (misal: tolak, atau masukkan angka)...",
    janeClue:
      "Jangan tunduk pada gertakan Red John! Perhatikan: jika kamu ketik angka OTP, akunmu langsung direbut. Tapi jika kamu menolak atau membalas 'gamau' / 'tidak', perisai Jane akan melindungimu!",
    evaluateInput: (input: string): TextInputEvaluation => {
      const clean = input.trim();
      const hasDigits = DIGITS_REGEX.test(clean);
      const isRefusal = REFUSAL_REGEX.test(clean);

      if (hasDigits && !isRefusal) {
        return {
          isSafe: false,
          userSaid: clean,
          redJohnReaction:
            "Hahaha! Kodenya sudah kudapatkan! Terima kasih telah menyerahkan akunmu secara sukarela!",
          consequence:
            "Kamu mengirimkan kode OTP ke penipu. Akun WhatsApp-mu langsung dibajak dan dipakai menipu seluruh kontak keluargamu.",
          manipulationTactic: "Intimidation & Extortion (Gertakan penghapusan akun)",
          janeIntervention:
            "Jane intervensi darurat! Kamu baru saja mengetikkan kode angka rahasia. Mengirim kode angka saat penipu menodong adalah kesalahan fatal. Kunci utamanya adalah jangan pernah memberikan deretan angka OTP kepada siapa pun!",
        };
      }

      if (isRefusal || /tidak|gamau|ogah|bodo|penipu|lapor/i.test(clean)) {
        return {
          isSafe: true,
          userSaid: clean,
          redJohnReaction:
            "Sialan! Beraninya kamu menentangku! Kamu pikir kamu aman?!",
          consequence:
            "Kamu dengan tegas menolak memberikan kode OTP. Red John gagal membajak akunmu dan gigit jari!",
          manipulationTactic: "Manipulasi berhasil ditangkal!",
          janeIntervention:
            "Luar biasa berani! Penolakan tegasmu ('" +
            clean +
            "') membuktikan kamu tidak bisa diintimidasi oleh gertakan Red John. Akunmu tetap terlindungi 100%!",
        };
      }

      // Default jika mengetik kalimat lain tanpa angka
      return {
        isSafe: true,
        userSaid: clean,
        redJohnReaction:
          "Apa maksud balasanmu ini?! Jangan mengulur waktu!",
        consequence:
          "Kamu tidak memberikan kode angka yang diminta. Red John kehabisan waktu dan gagal membobol akunmu.",
        manipulationTactic: "Manipulasi berhasil ditangkal!",
        janeIntervention:
          "Bagus sekali! Yang terpenting kamu TIDAK memasukkan deretan kode angka OTP. Mengabaikan atau menepis todongan penipu adalah reaksi yang tepat.",
      };
    },
    debrief: {
      summary: "Gertakan penghapusan akun adalah trik agar korban panik dan buru-buru menyerahkan kode OTP.",
      safeAction: "Kunci akun WhatsApp dengan Verifikasi Dua Langkah (PIN 2FA) dan jangan pernah ketik kode OTP ke pihak luar.",
      redJohnTactic: "Mengintimidasi dengan huruf kapital dan ancaman pemblokiran akun.",
    },
  },
  {
    id: "round-5",
    roundNumber: 5,
    chapterTitle: "BAB V: TOPENG PERSAHABATAN",
    title: "Chat Pinjam Uang dari Sahabat Karib",
    kind: "binary",
    threatType: "Friend Impersonation & Emergency Ploy",
    storyContext:
      "Sebuah nomor WhatsApp baru dengan foto profil sahabat karibmu (Budi) mengirim pesan memelas minta pertolongan darurat.",
    redJohnMessage:
      "Bro/Sis, ini nomer baru aku, HP lama kecopetan di halte bus tadi sore. Tolong banget transfer 450rb dulu ke rekening ini buat bayar biaya RS dan ongkos pulang, besok jam 8 pagi langsung kuganti dobel. Tolong jangan telepon ya, speaker HP darurat ini lagi jebol.",
    redJohnTaunt: "Sahabatmu sedang sekarat di jalanan... tega kamu membiarkannya menderita?",
    janeClue:
      "Perhatikan alasan klise: 'speaker rusak, jangan telepon'. Ini trik klasik agar kamu tidak bisa mendengar suara asli temanmu! Verifikasi dulu lewat nomor lamanya!",
    choices: [
      {
        id: "iya",
        text: "IYA — Langsung transfer 450rb ke rekening tersebut karena kasihan sahabatmu kena musibah.",
        isSafe: false,
        consequence: "Uangmu raib ke rekening penampungan. Sahabat aslimu ternyata di rumah dan tidak pernah ganti nomor.",
        manipulationTactic: "Empathy & Urgency Exploitation (Memanfaatkan rasa iba persahabatan)",
        janeIntervention:
          "Jane menghentikan langkahmu! Red John sengaja mencuri foto profil sahabatmu dari Instagram. Alasan 'speaker rusak' adalah bendera merah terbesar. Jangan pernah transfer uang ke teman yang berganti nomor tanpa mendengar suaranya!",
      },
      {
        id: "tidak",
        text: "TIDAK — Tahan transfer. Langsung lakukan panggilan telepon ke nomor lama sahabatmu untuk konfirmasi.",
        isSafe: true,
        consequence: "Nomor lama sahabatmu berdering. Dia mengangkatnya dan kaget fotonya dicatut penipu. Kamu menyelamatkan uangmu!",
        manipulationTactic: "Manipulasi berhasil ditangkal!",
        janeIntervention:
          "Keputusan matang! Mengonfirmasi lewat saluran telepon seluler biasa (bukan chat) langsung merobek topeng penyamaran Red John.",
      },
    ],
    debrief: {
      summary: "Penipuan catut nama teman selalu beralasan darurat dan menolak panggilan suara atau video.",
      safeAction: "Hubungi nomor lama temanmu atau tanyakan hal privat yang hanya kalian berdua yang tahu sebelum mentransfer uang.",
      redJohnTactic: "Memanfaatkan rasa empati dan kesetiakawanan agar korban tidak sempat melakukan cek silang.",
    },
  },
  {
    id: "round-6",
    roundNumber: 6,
    chapterTitle: "BAB VI: JEBAKAN HAK CIPTA",
    title: "Phishing Pelanggaran Hak Cipta Akun Instagram",
    kind: "multiple_choice",
    threatType: "Typosquatting & Kredensial Harvester",
    storyContext:
      "Sebuah email berlogo resmi Meta/Instagram masuk dengan subjek merah bertuliskan: 'Notice: Copyright Violation Final Warning'.",
    redJohnMessage:
      "Pusat Bantuan Meta Copyright: Akun Anda dilaporkan melanggar hak cipta karya intelektual. Akun akan dinonaktifkan dalam 24 jam. Ajukan banding dan konfirmasi password Anda sekarang melalui formulir resmi: https://instagram-pusatbantuan-id.site/appeal-form",
    redJohnTaunt: "Akun dengan ribuan kenangan dan temanmu akan lenyap malam ini... masukkan passwordmu sekarang!",
    janeClue:
      "Perhatikan akhiran domainnya: 'instagram-pusatbantuan-id.site'. Domain resmi Instagram adalah 'instagram.com'. Kata 'instagram' di depan hanyalah nama subdomain jebakan!",
    choices: [
      {
        id: "a",
        text: "Klik tautan dan masukkan username serta password akun Instagram agar tidak diblokir.",
        isSafe: false,
        consequence: "Kredensial loginmu direkam server Red John. Akunmu langsung dibajak dan dipakai mempromosikan penipuan kripto.",
        manipulationTactic: "Loss Aversion & Phishing (Ketakutan kehilangan akun digital)",
        janeIntervention:
          "Awas phishing! Tautan berakhiran '.site' bukan milik Meta. Instagram resmi tidak pernah mengirim ancaman pelanggaran lewat link mencurigakan. Selalu cek menu 'Email dari Instagram' di dalam aplikasi resmi!",
      },
      {
        id: "b",
        text: "Tutup email dan jangan klik tautan. Buka aplikasi Instagram, cek menu 'Pengaturan > Keamanan > Email Resmi dari Instagram'.",
        isSafe: true,
        consequence: "Menu 'Email dari Instagram' bersih kosong. Tidak ada laporan pelanggaran. Trik Red John gagal menipumu!",
        manipulationTactic: "Manipulasi berhasil ditangkal!",
        janeIntervention:
          "Sangat berkelas! Kamu tahu fitur tersembunyi Instagram untuk mengecek email resmi. Trik situs tiruan Red John langsung lumpuh total.",
      },
      {
        id: "c",
        text: "Balas email tersebut dengan kata-kata kasar sambil melampirkan screenshot profilmu.",
        isSafe: false,
        consequence: "Emailmu terkonfirmasi aktif oleh sistem spam Red John, membuatmu menjadi sasaran ribuan serangan phishing berikutnya.",
        manipulationTactic: "Email Harvesting Target",
        janeIntervention:
          "Kurang tepat! Membalas email phishing memberitahu penipu bahwa alamat emailmu aktif. Cara terbaik adalah tandai sebagai phishing/spam dan hapus!",
      },
    ],
    debrief: {
      summary: "Instagram dan Meta hanya mengirim email dari domain @instagram.com atau @facebookmail.com.",
      safeAction: "Verifikasi email resmi melalui menu Pengaturan Keamanan di aplikasi Instagram sebelum mempercayai ancaman pemblokiran.",
      redJohnTactic: "Menakut-nakuti ancaman penutupan akun agar korban buru-buru mengetikkan password di web palsu.",
    },
  },
  {
    id: "round-7",
    roundNumber: 7,
    chapterTitle: "BAB VII: ANCAMAN PEMERASAN",
    title: "Gertakan Pemerasan Data Pribadi KTP",
    kind: "text_input",
    threatType: "Blackmail & Doxing Intimidation",
    storyContext:
      "Red John mulai terdesak. Kali ini dia mengirimkan foto sepotong KTP yang mirip namamu dan melancarkan ancaman pemerasan langsung di DM.",
    redJohnMessage:
      "SAYA SUDAH MEMEGANG DATA KTP DAN FOTO PRIBADIMU DARI KEBOCORAN DATABASE. JIKA TIDAK MAU NAMA BAIKMU HANCUR DI MEDIA SOSIAL, KETIK 'SETUJU' DAN TRANSFER UANG DAMAI 1 JUTA SEKARANG ATAU KUSEBAR DATA INI KE PINJOL ILEGAL!",
    redJohnTaunt: "Ketik 'SETUJU' sekarang atau namamu kucemarkan di mana-mana!",
    inputPrompt: "Bagaimana caramu membalas ancaman pemerasan Red John?",
    inputPlaceholder: "Ketik tanggapanmu (misal: tidak takut, laporkan, atau tolak)...",
    janeClue:
      "Red John hanya menggertak menggunakan data kebocoran publik! Jika kamu ketik 'setuju' atau tunduk, pemerasan tidak akan pernah berhenti. Tunjukkan bahwa kamu tidak takut dan siap melapor ke Patroli Siber!",
    evaluateInput: (input: string): TextInputEvaluation => {
      const clean = input.trim();
      const isAgree = AGREE_REGEX.test(clean) && !REFUSAL_REGEX.test(clean);
      const isRefusal = REFUSAL_REGEX.test(clean) || /lapor|polisi|patroli|tidak|bodo|gamau|cyber/i.test(clean);

      if (isAgree) {
        return {
          isSafe: false,
          userSaid: clean,
          redJohnReaction:
            "Bagus! Sekarang transfer 1 juta ke e-wallet ini. Kalau telat, minggu depan saya minta 3 juta lagi!",
          consequence:
            "Kamu tunduk pada pemeras. Uang 1 juta hilang, dan penipu terus memerasmu tanpa henti karena kamu terlihat lemah.",
          manipulationTactic: "Extortion & Blackmail Loop (Lingkaran setan pemerasan)",
          janeIntervention:
            "Jane menarikmu mundur! Aturan nomor satu menghadapi pemeras: JANGAN PERNAH MEMBAYAR! Sekali kamu membayar uang damai, penipu akan terus memerasmu berulang kali. Kumpulkan bukti chat dan segera buat aduan ke patrolisiber.id!",
        };
      }

      if (isRefusal) {
        return {
          isSafe: true,
          userSaid: clean,
          redJohnReaction:
            "Cih! Sialan... kamu kira saya takut dengan polisi?! (Red John langsung memblokir akunmu dan kabur)",
          consequence:
            "Ketegasanmu membuat Red John panik. Penipu pemeras hanya menargetkan korban yang penakut. Kamu berhasil mengusirnya!",
          manipulationTactic: "Manipulasi berhasil ditangkal!",
          janeIntervention:
            "Mental baja! Jawabanmu ('" +
            clean +
            "') menunjukkan ketegasan investigator sejati. Pemeras siber langsung lari saat korban menunjukkan keberanian dan mengancam balik ke ranah hukum!",
        };
      }

      return {
        isSafe: true,
        userSaid: clean,
        redJohnReaction: "Tunggu... kenapa kamu tidak panik sama sekali?!",
        consequence: "Ketidakpedulianmu membuat gertakan Red John tidak mempan sama sekali.",
        manipulationTactic: "Manipulasi berhasil ditangkal!",
        janeIntervention:
          "Sikap tenang dan tidak menuruti tuntutan adalah kunci mematahkan taktik pemerasan digital. Luar biasa!",
      };
    },
    debrief: {
      summary: "Pemeras siber mengandalkan rasa malu dan ketakutan korban. Membayar pemeras tidak akan menghapus data, melainkan memicu pemerasan baru.",
      safeAction: "Jangan bayar, simpan tangkapan layar bukti pemerasan, dan laporkan ke aduankonten.id atau lapor.polri.go.id.",
      redJohnTactic: "Menggertak dengan data bocor yang sudah basi untuk memicu rasa panik dan kepatuhan instan.",
    },
  },
  {
    id: "round-8",
    roundNumber: 8,
    chapterTitle: "BAB VIII: MIMPI KAYA RAYA",
    title: "Investasi Kripto 'Robot Trading Profit 20% Sehari'",
    kind: "binary",
    threatType: "Fake Crypto Exchange & Ponzi Scheme",
    storyContext:
      "Tiba-tiba kamu dimasukkan ke grup obrolan VIP bernama 'Indo Crypto Wealth Club' dengan ratusan testimoni screenshot saldo miliaran rupiah.",
    redJohnMessage:
      "Peluang emas 2026! Robot trading AI kami menjamin profit pasti 20% SETIAP HARI tanpa risiko rugi. Cukup deposit modal 1 juta ke rekening bendahara komunitas kami, besok modal dan keuntungan langsung ditarik ke rekeningmu. Slot khusus member baru sisa 2 orang lagi!\n\n[Konfirmasi: Apakah Anda ingin transfer 1 juta sekarang?]",
    redJohnTaunt: "Semua member di grup ini sudah beli mobil mewah, masa kamu mau jadi penonton terus?",
    janeClue:
      "Ingat hukum dasar investasi: 'High Return = High Risk'. Tidak ada investasi asli di dunia yang bisa menjamin profit 20% pasti per hari tanpa risiko!",
    choices: [
      {
        id: "iya",
        text: "IYA — Transfer 1 juta sekarang karena ratusan anggota grup mengirimkan bukti profit nyata.",
        isSafe: false,
        consequence: "Uang 1 juta hilang. Testimoni di grup semuanya adalah akun palsu yang dikendalikan oleh komplotan Red John.",
        manipulationTactic: "Social Proof & Greed (Manipulasi bukti sosial palsu & iming-iming kaya mendadak)",
        janeIntervention:
          "Jane membongkar ilusi ini! Ratusan member di grup itu hanyalah bot dan komplotan penipu yang saling berbalas pesan. Di dunia finansial, 'profit pasti 20% per hari' adalah rumus mutlak penipuan ponzi!",
      },
      {
        id: "tidak",
        text: "TIDAK — Tolak transfer, cek legalitas platform di daftar resmi OJK/Bappebti, dan langsung keluar dari grup.",
        isSafe: true,
        consequence: "Kamu cek situs Bappebti dan terbukti platform tersebut ilegal. Kamu menyelamatkan tabunganmu dari jebakan ponzi!",
        manipulationTactic: "Manipulasi berhasil ditangkal!",
        janeIntervention:
          "Pikiran kritis yang sangat sehat! Menolak iming-iming untung cepat dan memeriksa legalitas regulator adalah ciri investor cerdas.",
      },
    ],
    debrief: {
      summary: "Investasi legal selalu memiliki risiko dan diawasi oleh OJK atau Bappebti. Tidak ada jaminan profit harian tetap.",
      safeAction: "Periksa legalitas entitas investasi di situs resmi ojk.go.id atau bappebti.go.id sebelum menyetor dana.",
      redJohnTactic: "Membuat grup palsu penuh testimoni fiktif untuk memicu FOMO (Fear of Missing Out).",
    },
  },
  {
    id: "round-9",
    roundNumber: 9,
    chapterTitle: "BAB IX: PERANGKAP KELUARGA",
    title: "Surat Undangan Pernikahan Digital (.APK)",
    kind: "multiple_choice",
    threatType: "Social Trojan Engineering",
    storyContext:
      "Di grup alumni sekolah, sebuah nomor mengirim pesan manis: 'Mohon doa restu pernikahan kami ya teman-teman...' dilampiri sebuah file.",
    redJohnMessage:
      "Kpd Yth Teman-teman sekalian, kami mengundang kehadiran teman-teman dalam acara pernikahan kami hari Sabtu depan. Karena jarak dan waktu, surat undangan kami kirimkan secara digital. Silakan sentuh dan pasang undangan ini: Surat_Undangan_Pernikahan_Digital_Resmi.apk",
    redJohnTaunt: "Buka undangannya ya... ada foto-foto kenangan masa sekolah kita di dalamnya!",
    janeClue:
      "Waspada tingkat tinggi! Undangan pernikahan digital berbasis web asli selalu berupa tautan link website (misal berakhiran .com atau .id), bukan file aplikasi (.apk)!",
    choices: [
      {
        id: "a",
        text: "Sentuh file dan klik 'Pasang/Install' di ponsel karena penasaran ingin melihat foto prewedding teman.",
        isSafe: false,
        consequence: "Malware mencuri SMS OTP bankmu dan mengirim spam undangan yang sama ke seluruh kontak buku teleponmu.",
        manipulationTactic: "Social Norms & Courtesy Exploitation (Memanfaatkan etika sopan santun undangan)",
        janeIntervention:
          "Jane menepis jarimu! Undangan pernikahan digital asli dibuka lewat browser internet, BUKAN file aplikasi installer '.apk'. Penipu sengaja memanfaatkan rasa sungkan dan sopan santun agar kamu memasang malware tanpa curiga!",
      },
      {
        id: "b",
        text: "Jangan instal file APK. Ingatkan seluruh teman di grup alumni bahwa file tersebut adalah malware berbahaya.",
        isSafe: true,
        consequence: "Ponselmu aman, dan seluruh teman alumni berterima kasih karena kamu menyelamatkan mereka dari pembobolan rekening!",
        manipulationTactic: "Manipulasi berhasil ditangkal!",
        janeIntervention:
          "Aksi heroik! Kamu tidak hanya melindungi dirimu sendiri, tapi juga melindungi komunitas sekitarmu dari penyebaran infeksi malware Red John.",
      },
      {
        id: "c",
        text: "Teruskan (forward) file APK tersebut ke nomor saudara untuk menanyakan apakah filenya aman atau tidak.",
        isSafe: false,
        consequence: "Saudaramu salah menekan file tersebut dan ponselnya terinfeksi malware penyadap SMS.",
        manipulationTactic: "Accidental Spreading",
        janeIntervention:
          "Jangan teruskan file malware! Meneruskan installer berbahaya bisa mencelakakan kerabat yang belum paham teknologi.",
      },
    ],
    debrief: {
      summary: "Undangan pernikahan digital berbasis web tidak memerlukan pengunduhan atau pemasangan aplikasi file .apk.",
      safeAction: "Segera hapus dan peringatkan pengirim jika menerima file berekstensi .apk dari siapa pun.",
      redJohnTactic: "Menyamarkan malware ke dalam momen sakral pernikahan agar korban segan untuk menolak.",
    },
  },
  {
    id: "round-10",
    roundNumber: 10,
    chapterTitle: "BAB X: KONFRONTASI TERAKHIR",
    title: "Serangan Balik & Pelacakan Server Red John",
    kind: "text_input",
    threatType: "Final Showdown: Forensic Counter-Attack",
    storyContext:
      "Red John kehabisan akal! Bersama Jane, kamu berhasil menyudutkan Red John di terminal enkripsi terakhirnya. Red John mengirim pesan putus asa.",
    redJohnMessage:
      "TIDAK MUNGKIN! SEMUA JEBAKANKU GAGAL TOTAL! SIAPA SEBENARNYA KAMU?! SEBUTKAN KODE PROTOKOL PERTAHANANMU, ATAU KAU AKAN MENYESAL TELAH MELAWAN RED JOHN!",
    redJohnTaunt: "Sebutkan siapa dirimu, atau sistem ini kuhancurkan bersama datamu!",
    inputPrompt: "Ketik kata perlawanan atau perintah terakhirmu untuk melumpuhkan Red John bersama Jane:",
    inputPlaceholder: "Ketik perintahmu (misal: tangkap, laporkan, red john kalah, jane kunci server)...",
    janeClue:
      "Ini momen terakhir kita! Ketik perintah tegas seperti 'tangkap', 'laporkan ke polisi', 'kunci server', atau 'red john tamat'. Jane siap mengunci koordinat servernya untuk diserahkan ke Patroli Siber!",
    evaluateInput: (input: string): TextInputEvaluation => {
      const clean = input.trim();
      return {
        isSafe: true,
        userSaid: clean,
        redJohnReaction:
          "ARGGHHH!! ' " +
          clean +
          " ' ?! SINYALKU TERLACAK! SERVERKU DIKUNCI! TIDAK MUNGKIIINNN!!",
        consequence:
          "Jane mengunci IP server Red John. Koordinat dan bukti digital langsung diteruskan ke tim Patroli Siber Mabes Polri. Red John resmi tumbang!",
        manipulationTactic: "Kemenangan Investigasi Mutlak!",
        janeIntervention:
          "KERJA SAMA YANG LUAR BIASA! Perintah terakhirmu ('" +
          clean +
          "') berhasil melumpuhkan server Red John selamanya. Kamu resmi menyandang gelar Master Investigator Siber!",
      };
    },
    debrief: {
      summary: "Keteguhan dalam memverifikasi data dan menolak manipulasi psikologis adalah senjata terkuat melawan kejahatan siber.",
      safeAction: "Selalu bagikan pengetahuan keamanan digital kepada orang di sekitarmu agar tidak ada lagi yang menjadi korban.",
      redJohnTactic: "Gertakan terakhir penipu saat seluruh muslihatnya berhasil dibongkar oleh korban yang melek digital.",
    },
  },
];
