# Agent-RJ — Red John Discord Bot

Client tipis (Golang + DiscordGo) di atas backend FastAPI Red John. Bot tidak punya
database, ML, atau scraper sendiri — semua deteksi, berita, laporan, dan konfigurasi
diteruskan ke backend via REST (`X-API-Key`).

## Perintah

| Perintah | Fungsi |
|---|---|
| `/ping` | Status bot, latency, koneksi backend |
| `/help` | Daftar perintah |
| `/scan url\|domain\|text\|phone\|bank\|email <target>` | Pemeriksaan via `POST /api/scan/{kind}` |
| `/scam explain <text>` | Penjelasan indikator penipuan pada sebuah pesan |
| `/news latest` / `/news search <kata>` | Berita penipuan terverifikasi |
| `/report scam` | Formulir modal laporan → `POST /api/reports` (status `pending`, tidak dipublikasikan sebelum diverifikasi admin) |
| `/report status <id>` | Cek status laporan milik sendiri |
| `/config status\|alert-channel\|news-channel\|protection` | Pengaturan server (khusus admin: ManageGuild/Administrator) |

Semua hasil scan/laporan/config dikirim sebagai pesan **ephemeral** (hanya terlihat
oleh pemanggil), kecuali `/news` dan `/ping` yang memang data publik. URL di embed
di-defang (`hxxps://`) agar tidak bisa diklik.

`/config news-channel <#channel>` menentukan channel tujuan tombol "Tampilkan 5
berita acak" di panel `/admin`. Bot mengambil permintaan dari outbox backend
(`POST /api/discord/outbox/claim`, interval `BROADCAST_POLL_INTERVAL`, default 5s),
lalu posting 5 berita acak. Fallback bila belum diatur: channel alert.

## Menjalankan (dev)

```bash
cp .env.example .env   # isi DISCORD_TOKEN, DISCORD_APP_ID, REDJOHN_API_KEY
go run main.go        # atau: go run ./cmd/bot
```

`REDJOHN_API_KEY` harus sama dengan `DISCORD_BOT_API_KEY` di `backend/.env`.
Set `DISCORD_GUILD_ID` saat development agar command terdaftar instan di guild test.

## Rate limit (in-memory)

- `/scan` & `/scam explain`: 5 request/menit per user.
- `/report`: 1 laporan per 10 menit per user.

Catatan: state dedupe alert & rate limit hanya hidup di satu proses. Untuk
multi-replica, pindahkan ke Redis (di luar scope MVP).

## Docker

```bash
docker build -t redjohn-bot .
docker run --env-file .env redjohn-bot
```

## Arsitektur

```
main.go, cmd/bot/main.go entry point (keduanya memanggil internal/app)
internal/app             bootstrap + slog
internal/config          env parsing (token tidak pernah di-log)
internal/bot             sesi DiscordGo, alert delivery, shutdown
internal/commands        definisi slash command + handler interaction
internal/services        klien HTTP backend, APIError typed, token bucket, alert poller
internal/models          struct JSON sesuai kontrak FastAPI
internal/ui              pembangun embed (warna per risk level, defang URL, batas embed)
```

Aturan: `commands` tidak pernah memanggil HTTP langsung (hanya via `services`);
`ui` tidak memanggil API; bot tidak pernah meng-fetch URL target (tidak ada SSRF).
