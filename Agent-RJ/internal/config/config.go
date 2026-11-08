// Package config memuat konfigurasi bot dari environment. Token tidak pernah di-log.
package config

import (
	"fmt"
	"log/slog"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

// Config adalah seluruh setting runtime bot.
type Config struct {
	DiscordToken   string
	DiscordAppID   string
	DiscordGuildID string // kosong = register global (production)

	RedJohnAPIURL string
	RedJohnAPIKey string

	AppEnv   string
	LogLevel slog.Level

	AlertPollInterval     time.Duration
	BroadcastPollInterval time.Duration
	HTTPTimeout           time.Duration
}

// Load membaca .env (tanpa menimpa env shell) lalu validasi field wajib.
func Load() (*Config, error) {
	_ = godotenv.Load() // .env opsional; shell env menang

	cfg := &Config{
		DiscordToken:   os.Getenv("DISCORD_TOKEN"),
		DiscordAppID:   os.Getenv("DISCORD_APP_ID"),
		DiscordGuildID: os.Getenv("DISCORD_GUILD_ID"),

		RedJohnAPIURL: os.Getenv("REDJOHN_API_URL"),
		RedJohnAPIKey: os.Getenv("REDJOHN_API_KEY"),

		AppEnv: getenvDefault("APP_ENV", "development"),
	}

	var err error
	if cfg.LogLevel, err = getLogLevel("LOG_LEVEL", slog.LevelInfo); err != nil {
		return nil, err
	}
	if cfg.AlertPollInterval, err = getDuration("ALERT_POLL_INTERVAL", 60*time.Second); err != nil {
		return nil, err
	}
	if cfg.BroadcastPollInterval, err = getDuration("BROADCAST_POLL_INTERVAL", 5*time.Second); err != nil {
		return nil, err
	}
	if cfg.HTTPTimeout, err = getDuration("HTTP_TIMEOUT", 9*time.Second); err != nil {
		return nil, err
	}

	if cfg.DiscordToken == "" {
		return nil, fmt.Errorf("DISCORD_TOKEN wajib diisi")
	}
	if cfg.DiscordAppID == "" {
		return nil, fmt.Errorf("DISCORD_APP_ID wajib diisi")
	}
	if cfg.RedJohnAPIURL == "" {
		return nil, fmt.Errorf("REDJOHN_API_URL wajib diisi")
	}
	return cfg, nil
}

func getenvDefault(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func getDuration(key string, def time.Duration) (time.Duration, error) {
	raw := os.Getenv(key)
	if raw == "" {
		return def, nil
	}
	d, err := time.ParseDuration(raw)
	if err != nil {
		return 0, fmt.Errorf("%s: %w", key, err)
	}
	return d, nil
}

// getLogLevel memetakan text → slog level. Nilai tak dikenal = error konfigurasi
// (lebih baik gagal saat start daripada diam-diam jatuh ke default).
func getLogLevel(key string, def slog.Level) (slog.Level, error) {
	raw := strings.ToLower(strings.TrimSpace(os.Getenv(key)))
	switch raw {
	case "":
		return def, nil
	case "debug":
		return slog.LevelDebug, nil
	case "info":
		return slog.LevelInfo, nil
	case "warn", "warning":
		return slog.LevelWarn, nil
	case "error":
		return slog.LevelError, nil
	default:
		return 0, fmt.Errorf("%s: nilai %q tidak dikenal (debug|info|warn|error)", key, raw)
	}
}
