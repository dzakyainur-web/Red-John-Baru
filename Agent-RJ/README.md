# Agent-RJ — Red John Discord Bot

Client tipis (Go 1.25 + DiscordGo v0.29) di atas backend FastAPI Red John. Bot tidak punya
database, ML, atau scraper sendiri — semua deteksi, berita, laporan, konfigurasi, dan klasemen
diteruskan ke backend via REST (`X-API-Key`).

## Perintah

| Perintah | Fungsi |
|---|---|
| `/ping` | Status bot, latency, koneksi backend |
| `/help` | Daftar perintah |
| `/scan url\|domain\|text\|phone\|bank\|email <target>` | Pemeriksaan via `POST /api/scan/{kind}` |
| `/scam explain <text>` | Penjelasan indikator penipuan pada sebuah pesan |
| `/news latest` / `/news search <kata>` | Berita penipuan terverifikasi |
| `/report scam` | Formulir modal laporan → `POST /api/reports` (status `pending`) |
| `/report status <id>` | Cek status laporan milik sendiri |
| `/config status\|alert-channel\|news-channel\|protection` | Pengaturan server (khusus admin: ManageGuild/Administrator) |

Hasil scan/laporan/config dikirim **ephemeral**; `/news` dan `/ping` publik. URL di embed
di-defang (`hxxps://`) agar tidak bisa diklik.

## Dua antrean yang dipolling

| Poller | Sumber | Aksi |
|---|---|---|
| Alert | `GET /api/discord/alert-channels` | Kirim embed ancaman terverifikasi, interval `ALERT_POLL_INTERVAL` (60s) |
| Broadcast | `POST /api/discord/outbox/claim` | Ambil job dari outbox, interval `BROADCAST_POLL_INTERVAL` (5s) |

Job outbox punya `kind`:

- `news_broadcast` (atau kosong) → ambil `GET /api/news/random` lalu posting 5 berita ke channel
  berita (`/config news-channel`), fallback channel alert.
- `leaderboard` → payload sudah berisi klasemen; render `LeaderboardEmbed` dan posting ke channel
  berita/alert. Kind tak dikenal → job ditutup dengan error, **tidak** fallback ke berita.

Karena itu: deploy bot versi ini **sebelum** menyalakan `LEADERBOARD_SCHEDULER=true` di backend.

## Menjalankan (dev)

```bash
cp .env.example .env   # isi DISCORD_TOKEN, DISCORD_APP_ID, REDJOHN_API_KEY
go run main.go         # atau: go run ./cmd/bot
```

Development: isi `DISCORD_GUILD_ID` agar slash command terdaftar instan di guild test.

## Environment

Dimuat `internal/config` lewat `godotenv` (opsional) — env shell menang.

| Variabel | Default | Wajib | Keterangan |
|---|---|---|---|
| `DISCORD_TOKEN` | — | ✅ | Bot token Developer Portal. Rahasia, tidak pernah di-log |
| `DISCORD_APP_ID` | — | ✅ | Application ID (register slash command) |
| `DISCORD_GUILD_ID` | kosong | — | Diisi = command guild-scoped (instan, dev). Kosong = global (~1 jam propagasi) |
| `REDJOHN_API_URL` | — | ✅ | URL backend, mis. `https://<backend>` |
| `REDJOHN_API_KEY` | kosong | prod: ✅ | Harus sama dengan `DISCORD_BOT_API_KEY` di backend |
| `APP_ENV` | `development` | — | `development` \| `production` |
| `LOG_LEVEL` | `info` | — | `debug` \| `info` \| `warn` \| `error` (nilai lain = gagal start) |
| `ALERT_POLL_INTERVAL` | `60s` | — | Interval polling alert (format Go duration) |
| `BROADCAST_POLL_INTERVAL` | `5s` | — | Interval polling outbox |
| `HTTP_TIMEOUT` | `9s` | — | Timeout HTTP ke backend (harus < deadline interaction Discord) |

## Rate limit (in-memory)

- `/scan` & `/scam explain`: 5 request/menit per user.
- `/report`: 1 laporan per 10 menit per user.

State dedupe alert & rate limit hanya hidup di satu proses. Multi-replica → pindahkan ke Redis
(di luar scope MVP).

## Deploy

```bash
docker build -t redjohn-bot .
docker run --env-file .env redjohn-bot
```

- Image: multi-stage → `gcr.io/distroless/static-debian12:nonroot`, binary statis (`CGO_ENABLED=0`).
- Tidak butuh port, volume, atau DB — cukup env di atas.
- Set `APP_ENV=production`, `REDJOHN_API_KEY` = `DISCORD_BOT_API_KEY` backend, dan backend
  `APP_ENV=production` agar key benar-benar diwajibkan.
- Health: tidak ada HTTP server. Liveness dari log `slog` (bot online / error gateway).
- Shutdown: `SIGINT`/`SIGTERM` → sesi gateway ditutup rapi. Slash command yang sudah terdaftar
  tetap ada di Discord.

## Arsitektur

```
main.go, cmd/bot/main.go   entry point (keduanya memanggil internal/app)
internal/app               bootstrap + slog
internal/config            env parsing (token tidak pernah di-log)
internal/bot               sesi DiscordGo, alert delivery, broadcast loop, shutdown
internal/commands          definisi slash command + handler interaction
internal/services          klien HTTP backend, APIError typed, token bucket, poller
internal/models            struct JSON sesuai kontrak FastAPI
internal/ui                pembangun embed (warna per risk level, defang URL, batas embed)
```

Aturan: `commands` tidak pernah memanggil HTTP langsung (hanya via `services`); `ui` tidak
memanggil API; bot tidak pernah mem-fetch URL target (tidak ada SSRF).

## Test

```bash
go test ./...
go vet ./...
```
