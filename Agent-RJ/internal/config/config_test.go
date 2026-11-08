package config

import (
	"log/slog"
	"os"
	"testing"
)

func TestLoadRejectsInvalidLogLevel(t *testing.T) {
	t.Setenv("DISCORD_TOKEN", "x")
	t.Setenv("DISCORD_APP_ID", "1")
	t.Setenv("REDJOHN_API_URL", "http://localhost:8000")
	t.Setenv("LOG_LEVEL", "verbose")

	if _, err := Load(); err == nil {
		t.Fatal("LOG_LEVEL tidak dikenal harus membuat Load gagal")
	}
}

func TestLoadParsesLogLevel(t *testing.T) {
	t.Setenv("DISCORD_TOKEN", "x")
	t.Setenv("DISCORD_APP_ID", "1")
	t.Setenv("REDJOHN_API_URL", "http://localhost:8000")

	cases := map[string]slog.Level{
		"":        slog.LevelInfo,
		"debug":   slog.LevelDebug,
		"warn":    slog.LevelWarn,
		"WARNING": slog.LevelWarn,
		"error":   slog.LevelError,
	}
	for raw, want := range cases {
		t.Setenv("LOG_LEVEL", raw)
		cfg, err := Load()
		if err != nil {
			t.Fatalf("LOG_LEVEL=%q: %v", raw, err)
		}
		if cfg.LogLevel != want {
			t.Fatalf("LOG_LEVEL=%q: dapat %v, mau %v", raw, cfg.LogLevel, want)
		}
	}

	// Sanity: .env lokal (kalau ada) tidak boleh menimpa env proses.
	if _, err := os.Stat(".env"); err == nil {
		t.Log(".env ada — godotenv tidak menimpa env yang sudah diset")
	}
}
