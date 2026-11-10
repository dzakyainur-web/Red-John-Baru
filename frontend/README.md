# Frontend Red John

Web app **Next.js 16** (App Router, React 19, Tailwind 4) yang memanggil API FastAPI dan
memakai **Supabase Auth** untuk login (admin kuis, klasemen harian). Tidak ada database di
frontend — semua data lewat backend.

> `AGENTS.md` di folder ini mengingatkan bahwa Next.js versi ini berbeda dari yang umum
> diketahui; baca `node_modules/next/dist/docs/` sebelum menambah API/fitur baru.

## Menjalankan

```bash
bun install
cp .env.example .env.local     # isi nilainya
bun run dev                    # → http://localhost:3000
```

Backend harus hidup di `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8000`).

| Script | Isi |
|---|---|
| `bun run dev` | dev server (Turbopack) |
| `bun run build` | build produksi (cek TypeScript + prerender) |
| `bun run start` | server produksi hasil build |
| `bun run lint` | ESLint |

## Environment

Semua di `.env.local` (tidak di-commit). **`NEXT_PUBLIC_*` di-inline saat build** — set di
dashboard hosting *sebelum* build, bukan setelah.

| Variabel | Wajib | Keterangan |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | ✅ | URL backend, tanpa trailing slash. Lokal `http://localhost:8000`, produksi `https://<backend>` |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Project URL Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Anon key saja. **Jangan** service_role |
| `NEXT_PUBLIC_DISCORD_GUILD_ID` | — | ID guild default panel `/admin` |
| `DISCORD_BOT_API_KEY` | prod: ✅ | **Server-only** (tanpa `NEXT_PUBLIC_`), dipakai route handler `/api/discord/broadcast`. Harus sama dengan backend |

Role admin dibaca dari `public.profiles.role` di backend — tidak ada env admin di frontend.

## Build & deploy

- Build: `bun install && bun run build`; start: `bun run start`. Cocok untuk Vercel atau
  Docker (`node`/`bun` runner) dengan port dari `PORT`/default `3000`.
- **`/berita` di-prerender saat build** dan mem-fetch `GET /api/news` dari backend. Build gagal
  dengan `ECONNREFUSED` bila backend tidak dapat dijangkau — deploy/nyalakan backend dulu, atau
  `NEXT_PUBLIC_API_BASE_URL` harus menunjuk backend yang sudah online (bukan `localhost`).
- `next.config.ts` mengaktifkan `cacheComponents` + `partialPrefetching` + `experimental.agentFeedback`.
- Header keamanan (CSP, HSTS) tidak diatur di repo ini — tambahkan di reverse proxy/CDN.
- Backend harus mengizinkan origin frontend lewat `GUARDIANAI_CORS_ORIGINS`.

## Halaman

| URL | Isi |
|---|---|
| `/` | Periksa pesan mencurigakan |
| `/berita` | Radar berita penipuan (SSR di build, data dari `/api/news`) |
| `/pemindai`, `/inspect` | Pemindai pesan, inspeksi tautan |
| `/quiz` | Kuis kriminal otomatis (soal dari backend, skor dihitung server) |
| `/quiz/leaderboard` | Klasemen harian, reset 21:00 WIB, refetch tiap 60 dtk |
| `/quiz/berita-hari-ini` | Placeholder soal harian dari berita (belum aktif) |
| `/quiz/admin` | Admin bank soal (login + role admin) |
| `/admin` | Panel ancaman + broadcast berita Discord |
| `/login`, `/register` | Auth Supabase |
| `/act`, `/learn`, `/tentang-keamanan`, `/dev` | Konten edukasi / eksperimen |

## Struktur

```
app/                 # route App Router
  api/discord/broadcast  # proxy server-side ke backend (menyembunyikan DISCORD_BOT_API_KEY)
  api/news/random        # proxy berita acak
components/          # QuizClient, QuizLeaderboardClient, admin/, UI umum
lib/                 # api.ts (API_BASE), quiz.ts, news.ts, supabase.ts (client anon)
```

`lib/supabase.ts` mengembalikan `null` bila env Supabase kosong — komponen harus tahan
terhadap kondisi itu (login/leaderboard bersifat opsional).
