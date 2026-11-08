// Package commands: definisi slash command, registry, dan routing interaction.
package commands

import (
	"fmt"
	"log/slog"
	"time"

	"github.com/bwmarrin/discordgo"

	"github.com/r3nddy/Red-John/Agent-RJ/internal/config"
	"github.com/r3nddy/Red-John/Agent-RJ/internal/services"
)

// Deps kumpulan layanan yang dipakai command.
type Deps struct {
	Cfg      *config.Config
	Client   *services.Client
	Logger   *slog.Logger
	ScanRL   *services.RateLimiter
	ReportRL *services.RateLimiter
}

// Registry menyimpan definisi & handler command.
type Registry struct {
	deps   *Deps
	defs   []*discordgo.ApplicationCommand
	routes map[string]func(*discordgo.Session, *discordgo.InteractionCreate)
}

// NewRegistry menyusun registry beserta seluruh dependensinya.
func NewRegistry(cfg *config.Config, logger *slog.Logger) *Registry {
	deps := &Deps{
		Cfg:      cfg,
		Client:   services.NewClient(cfg.RedJohnAPIURL, cfg.RedJohnAPIKey, cfg.HTTPTimeout),
		Logger:   logger,
		ScanRL:   services.NewRateLimiter(5, time.Minute),
		ReportRL: services.NewRateLimiter(1, 10*time.Minute),
	}
	reg := &Registry{
		deps:   deps,
		routes: map[string]func(*discordgo.Session, *discordgo.InteractionCreate){},
	}
	reg.routes["ping"] = reg.handlePing
	reg.routes["help"] = reg.handleHelp
	reg.routes["scan"] = reg.handleScan
	reg.routes["news"] = reg.handleNews
	reg.routes["report"] = reg.handleReport
	reg.routes["scam"] = reg.handleScam
	reg.routes["config"] = reg.handleConfig
	reg.defs = Definitions()
	return reg
}

// HandleInteraction didelegasikan ke handlers.go.

// Register mendaftarkan slash command: guild-scoped saat DISCORD_GUILD_ID diset
// (dev, instan), global bila tidak (production, propagasi bisa sampai ~1 jam).
func (r *Registry) Register(s *discordgo.Session) error {
	if r.deps.Cfg.DiscordGuildID != "" {
		_, err := s.ApplicationCommandBulkOverwrite(
			r.deps.Cfg.DiscordAppID, r.deps.Cfg.DiscordGuildID, r.defs)
		return fmt.Errorf("register command guild %s: %w", r.deps.Cfg.DiscordGuildID, err)
	}
	_, err := s.ApplicationCommandBulkOverwrite(r.deps.Cfg.DiscordAppID, "", r.defs)
	return fmt.Errorf("register command global: %w", err)
}
func Definitions() []*discordgo.ApplicationCommand {
	return []*discordgo.ApplicationCommand{
		{
			Name:        "ping",
			Description: "Cek bot hidup dan status backend Red John",
		},
		{
			Name:        "help",
			Description: "Daftar perintah Red John",
		},
		{
			Name:        "scan",
			Description: "Periksa target mencurigakan dengan engine Red John",
			Options: []*discordgo.ApplicationCommandOption{
				sub("url", "Periksa sebuah URL", reqString("target", "URL yang dicurigai")),
				sub("domain", "Periksa sebuah domain", reqString("target", "Domain tanpa path (contoh: contoh.xyz)")),
				sub("text", "Periksa isi pesan mencurigakan", reqString("target", "Isi pesan yang dicurigai")),
				sub("phone", "Periksa nomor telepon/WA", reqString("target", "Nomor telepon (contoh: 0812-3456-7890)")),
				sub("bank", "Periksa nomor rekening", reqString("target", "Nomor rekening (6–20 digit)")),
				sub("email", "Periksa alamat email", reqString("target", "Alamat email")),
			},
		},
		{
			Name:        "scam",
			Description: "Penjelasan indikator penipuan Red John",
			Options: []*discordgo.ApplicationCommandOption{
				sub("explain", "Jelaskan indikator penipuan pada sebuah pesan",
					reqString("text", "Pesan yang ingin dijelaskan")),
			},
		},
		{
			Name:        "news",
			Description: "Berita penipuan terverifikasi dari Red John",
			Options: []*discordgo.ApplicationCommandOption{
				sub("latest", "Berita terbaru (5 item)"),
				sub("search", "Cari berita berdasarkan kata kunci",
					reqString("kata", "Kata kunci pencarian")),
			},
		},
		{
			Name:        "report",
			Description: "Laporkan dugaan penipuan ke Red John",
			Options: []*discordgo.ApplicationCommandOption{
				sub("scam", "Buka formulir laporan penipuan"),
				sub("status", "Cek status laporan milikmu",
					reqString("id", "ID laporan yang kamu terima")),
			},
		},
		{
			Name:        "config",
			Description: "Pengaturan Red John untuk server ini (admin)",
			Options: []*discordgo.ApplicationCommandOption{
				sub("status", "Lihat konfigurasi server ini"),
				sub("alert-channel", "Atur channel notifikasi ancaman",
					channelOpt("channel", "Channel tujuan alert")),
				sub("protection", "Aktif/nonaktifkan perlindungan",
					boolOpt("aktif", "ON atau OFF")),
			},
		},
	}
}

func sub(name, desc string, opts ...*discordgo.ApplicationCommandOption) *discordgo.ApplicationCommandOption {
	s := &discordgo.ApplicationCommandOption{
		Type:        discordgo.ApplicationCommandOptionSubCommand,
		Name:        name,
		Description: desc,
		Options:     opts,
	}
	return s
}

func reqString(name, desc string) *discordgo.ApplicationCommandOption {
	return &discordgo.ApplicationCommandOption{
		Type:        discordgo.ApplicationCommandOptionString,
		Name:        name,
		Description: desc,
		Required:    true,
	}
}

func channelOpt(name, desc string) *discordgo.ApplicationCommandOption {
	return &discordgo.ApplicationCommandOption{
		Type:        discordgo.ApplicationCommandOptionChannel,
		Name:        name,
		Description: desc,
		Required:    true,
		ChannelTypes: []discordgo.ChannelType{
			discordgo.ChannelTypeGuildText,
		},
	}
}

func boolOpt(name, desc string) *discordgo.ApplicationCommandOption {
	return &discordgo.ApplicationCommandOption{
		Type:        discordgo.ApplicationCommandOptionBoolean,
		Name:        name,
		Description: desc,
		Required:    true,
	}
}
