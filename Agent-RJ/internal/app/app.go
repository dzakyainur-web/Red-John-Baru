// Package app berisi bootstrap bot, dipakai oleh main.go root maupun cmd/bot.
package app

import (
	"context"
	"log/slog"
	"os"

	"github.com/r3nddy/Red-John/Agent-RJ/internal/bot"
	"github.com/r3nddy/Red-John/Agent-RJ/internal/config"
)

// Run menjalankan bot sampai sinyal shutdown. Error sudah di-log.
func Run(ctx context.Context) error {
	// Logger awal (level default) agar error konfigurasi tetap ter-log; level
	// sebenarnya baru diketahui setelah config.Load sukses.
	logger := newLogger(slog.LevelInfo)

	cfg, err := config.Load()
	if err != nil {
		logger.Error("konfigurasi tidak valid", "err", err)
		return err
	}
	logger = newLogger(cfg.LogLevel)

	b, err := bot.New(cfg, logger)
	if err != nil {
		logger.Error("gagal membangun bot", "err", err)
		return err
	}

	// Run blocking; alert poller dijalankan dari dalam bot.
	if err := b.Run(ctx); err != nil {
		logger.Error("bot berhenti", "err", err)
		return err
	}
	return nil
}

func newLogger(level slog.Level) *slog.Logger {
	return slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: level}))
}
