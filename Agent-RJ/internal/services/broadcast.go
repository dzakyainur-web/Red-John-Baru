package services

import (
	"context"
	"time"

	"github.com/r3nddy/Red-John/Agent-RJ/internal/models"
)

// Broadcaster mengambil job "post 5 berita acak" dari antrian backend (outbox,
// dipicu tombol di panel /admin) lalu mempostingnya ke channel berita guild.
type Broadcaster struct {
	client   *Client
	interval time.Duration
	post     func(ctx context.Context, channelID string, items []models.NewsItem) error
}

// NewBroadcaster: `post` mengirim embed ke channel Discord (injeksi agar bisa dites
// tanpa sesi gateway).
func NewBroadcaster(client *Client, interval time.Duration, post func(context.Context, string, []models.NewsItem) error) *Broadcaster {
	return &Broadcaster{client: client, interval: interval, post: post}
}

// Run loop sampai ctx dibatalkan. Satu tick bisa memproses lebih dari satu job
// (mis. dua klik cepat) dengan batas agar tidak memblokir channel lain.
func (b *Broadcaster) Run(ctx context.Context) {
	ticker := time.NewTicker(b.interval)
	defer ticker.Stop()

	b.tick(ctx)
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			b.tick(ctx)
		}
	}
}

func (b *Broadcaster) tick(ctx context.Context) {
	for i := 0; i < 3; i++ {
		select {
		case <-ctx.Done():
			return
		default:
		}
		job, err := b.client.ClaimBroadcast(ctx)
		if err != nil || job == nil {
			return
		}
		b.handle(ctx, *job)
	}
}

func (b *Broadcaster) handle(ctx context.Context, job PendingBroadcast) {
	ctx, cancel := context.WithTimeout(ctx, 20*time.Second)
	defer cancel()

	errMsg := ""
	channelID, err := b.channelFor(ctx, job.GuildID)
	switch {
	case err != nil:
		errMsg = "gagal membaca konfigurasi guild: " + err.Error()
	case channelID == "":
		errMsg = "channel berita belum diatur: jalankan /config news-channel di Discord"
	default:
		list, err := b.client.RandomNews(ctx, 5)
		if err != nil {
			errMsg = "gagal mengambil berita acak: " + err.Error()
		} else if len(list.Items) == 0 {
			errMsg = "belum ada berita terverifikasi untuk dibagikan"
		} else if err := b.post(ctx, channelID, list.Items); err != nil {
			errMsg = "gagal mengirim ke Discord: " + err.Error()
		}
	}

	// Laporan status best-effort: job sudah terkunci, timeout pengunci akan
	// mengembalikannya otomatis bila ini gagal.
	_ = b.client.FinishBroadcast(ctx, job.ID, errMsg)
}

// channelFor pakai channel berita guild; fallback ke channel alert agar panel
// tetap berguna sebelum admin menjalankan /config news-channel.
func (b *Broadcaster) channelFor(ctx context.Context, guildID string) (string, error) {
	channels, err := b.client.NewsChannels(ctx)
	if err != nil {
		return "", err
	}
	var alert string
	for _, ch := range channels {
		if ch.GuildID != guildID {
			continue
		}
		if ch.NewsChannelID != nil && *ch.NewsChannelID != "" {
			return *ch.NewsChannelID, nil
		}
		if ch.AlertChannelID != nil {
			alert = *ch.AlertChannelID
		}
	}
	return alert, nil
}
