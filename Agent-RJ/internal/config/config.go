// Package config memuat konfigurasi bot dari environment. Token tidak pernah di-log.
package config

import (
	"fmt"
	"os"
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
	LogLevel string

	AlertPollInterval time.Duration
	HTTPTimeout       time.Duration
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

		AppEnv:   getenvDefault("APP_ENV", "development"),
		LogLevel: getenvDefault("LOG_LEVEL", "info"),
	}

	var err error
	if cfg.AlertPollInterval, err = getDuration("ALERT_POLL_INTERVAL", 60*time.Second); err != nil {
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
