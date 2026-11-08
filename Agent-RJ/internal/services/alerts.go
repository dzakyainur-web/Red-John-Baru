package services

import (
	"context"
	"errors"
	"log/slog"
	"sync"
	"time"

	"github.com/r3nddy/Red-John/Agent-RJ/internal/models"
)

// AlertPoller mengambil ancaman terverifikasi dan meneruskan yang baru.
// Dedupe in-memory per ID; saat start, halaman pertama disimpan tanpa dikirim.
type AlertPoller struct {
	client   *Client
	interval time.Duration
	logger   *slog.Logger

	mu      sync.Mutex
	seen    map[string]time.Time
	primed  bool
	maxSeen int
}

// AlertHandler dipanggil untuk setiap ancaman baru.
type AlertHandler func(ctx context.Context, threat models.Threat)

func NewAlertPoller(client *Client, interval time.Duration, logger *slog.Logger) *AlertPoller {
	return &AlertPoller{
		client:   client,
		interval: interval,
		logger:   logger,
		seen:     make(map[string]time.Time),
		maxSeen:  1000,
	}
}

// Run loop polling sampai ctx dibatalkan.
func (p *AlertPoller) Run(ctx context.Context, handler AlertHandler) {
	ticker := time.NewTicker(p.interval)
	defer ticker.Stop()

	p.poll(ctx, handler, true)
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			p.poll(ctx, handler, false)
		}
	}
}

func (p *AlertPoller) poll(ctx context.Context, handler AlertHandler, prime bool) {
	ctx, cancel := context.WithTimeout(ctx, p.interval)
	defer cancel()

	list, err := p.client.VerifiedThreats(ctx, 20)
	if err != nil {
		var apiErr *APIError
		if errors.As(err, &apiErr) && apiErr.Kind == KindUnavailable {
			p.logger.Warn("polling alert: backend belum siap", "detail", apiErr.Detail)
		} else {
			p.logger.Warn("polling alert gagal", "err", err)
		}
		return
	}

	p.mu.Lock()
	defer p.mu.Unlock()

	fresh := make([]models.Threat, 0, len(list.Items))
	for _, t := range list.Items {
		if _, ok := p.seen[t.ID]; ok {
			continue
		}
		p.seen[t.ID] = time.Now()
		if !prime {
			fresh = append(fresh, t)
		}
	}
	p.pruneLocked()

	if prime {
		p.logger.Info("alert poller primed", "known", len(p.seen))
		return
	}
	for _, t := range fresh {
		handler(ctx, t)
	}
}

// pruneLocked buang entri tertua bila melebihi kapasitas.
func (p *AlertPoller) pruneLocked() {
	for len(p.seen) > p.maxSeen {
		oldestID, oldest := "", time.Now()
		for id, at := range p.seen {
			if at.Before(oldest) {
				oldestID, oldest = id, at
			}
		}
		if oldestID == "" {
			return
		}
		delete(p.seen, oldestID)
	}
}
