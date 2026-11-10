package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/r3nddy/Red-John/Agent-RJ/internal/models"
)

// Broadcaster mengambil job dari antrian backend (outbox) lalu mempostingnya ke
// channel guild: berita acak dari panel /admin, atau papan peringkat kuis harian
// dari job terjadwal backend.
type Broadcaster struct {
	client      *Client
	interval    time.Duration
	post        func(ctx context.Context, channelID string, items []models.NewsItem) error
	postLeaderb func(ctx context.Context, channelID string, lb *models.QuizLeaderboard) error
}

// NewBroadcaster: `post` dan `postLeaderboard` mengirim embed ke channel Discord
// (injeksi agar bisa dites tanpa sesi gateway). `postLeaderboard` boleh nil pada
// tes yang hanya menguji jalur berita.
func NewBroadcaster(
	client *Client,
	interval time.Duration,
	post func(context.Context, string, []models.NewsItem) error,
	postLeaderboard func(context.Context, string, *models.QuizLeaderboard) error,
) *Broadcaster {
	return &Broadcaster{
		client:      client,
		interval:    interval,
		post:        post,
		postLeaderb: postLeaderboard,
	}
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

	var errMsg string
	switch job.Kind {
	case KindNewsBroadcast, "":
		errMsg = b.handleNews(ctx, job)
	case KindLeaderboard:
		errMsg = b.handleLeaderboard(ctx, job)
	default:
		// Jangan pernah jatuh ke jalur berita: bot lama menerima kind baru akan
		// memposting konten yang salah ke channel.
		errMsg = "jenis job tidak dikenal: " + job.Kind
	}

	// Laporan status best-effort: job sudah terkunci, timeout pengunci akan
	// mengembalikannya otomatis bila ini gagal.
	_ = b.client.FinishBroadcast(ctx, job.ID, errMsg)
}

func (b *Broadcaster) handleNews(ctx context.Context, job PendingBroadcast) string {
	channelID, err := b.channelFor(ctx, job.GuildID)
	switch {
	case err != nil:
		return "gagal membaca konfigurasi guild: " + err.Error()
	case channelID == "":
		return "channel berita belum diatur: jalankan /config news-channel di Discord"
	}
	list, err := b.client.RandomNews(ctx, 5)
	if err != nil {
		return "gagal mengambil berita acak: " + err.Error()
	}
	if len(list.Items) == 0 {
		return "belum ada berita terverifikasi untuk dibagikan"
	}
	if err := b.post(ctx, channelID, list.Items); err != nil {
		return "gagal mengirim ke Discord: " + err.Error()
	}
	return ""
}

func (b *Broadcaster) handleLeaderboard(ctx context.Context, job PendingBroadcast) string {
	if b.postLeaderb == nil {
		return "pengirim leaderboard tidak dikonfigurasi di bot"
	}
	var lb models.QuizLeaderboard
	if len(job.Payload) == 0 {
		return "payload leaderboard kosong"
	}
	if err := json.Unmarshal(job.Payload, &lb); err != nil {
		return fmt.Sprintf("payload leaderboard tidak valid: %v", err)
	}
	channelID, err := b.channelFor(ctx, job.GuildID)
	switch {
	case err != nil:
		return "gagal membaca konfigurasi guild: " + err.Error()
	case channelID == "":
		return "channel berita belum diatur: jalankan /config news-channel di Discord"
	}
	if err := b.postLeaderb(ctx, channelID, &lb); err != nil {
		return "gagal mengirim ke Discord: " + err.Error()
	}
	return ""
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
