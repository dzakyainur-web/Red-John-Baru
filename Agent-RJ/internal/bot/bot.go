// Package bot: sesi DiscordGo, routing interaction, dan shutdown.
package bot

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/bwmarrin/discordgo"

	"github.com/r3nddy/Red-John/Agent-RJ/internal/commands"
	"github.com/r3nddy/Red-John/Agent-RJ/internal/config"
	"github.com/r3nddy/Red-John/Agent-RJ/internal/models"
	"github.com/r3nddy/Red-John/Agent-RJ/internal/services"
	"github.com/r3nddy/Red-John/Agent-RJ/internal/ui"
)

// Bot menampung seluruh state runtime.
type Bot struct {
	cfg       *config.Config
	session   *discordgo.Session
	logger    *slog.Logger
	registry  *commands.Registry
	alertsCtx context.Context
}

// New menyusun bot: koneksi gateway, handler, dan command.
func New(cfg *config.Config, logger *slog.Logger) (*Bot, error) {
	session, err := discordgo.New("Bot " + cfg.DiscordToken)
	if err != nil {
		return nil, fmt.Errorf("buat sesi discord: %w", err)
	}
	session.LogLevel = discordgo.LogError
	// MVP tanpa Message Content Intent: bot tidak membaca isi pesan pengguna.
	session.Identify.Intents = discordgo.IntentsGuilds | discordgo.IntentsGuildMessages

	reg := commands.NewRegistry(cfg, logger)

	b := &Bot{cfg: cfg, session: session, logger: logger, registry: reg}
	b.alertsCtx = context.Background()

	session.AddHandler(b.onReady)
	session.AddHandler(reg.HandleInteraction)
	return b, nil
}

// Open konek ke gateway dan register slash command.
func (b *Bot) Open() error {
	if err := b.session.Open(); err != nil {
		return fmt.Errorf("buka gateway: %w", err)
	}
	if err := b.registry.Register(b.session); err != nil {
		return err
	}
	b.startAlerts()
	b.startBroadcast()
	return nil
}

// startBroadcast menjalankan poller job "post berita acak" dari panel admin web.
// Job diklaim di backend sehingga aman bila bot dijalankan lebih dari satu.
func (b *Bot) startBroadcast() {
	client := services.NewClient(b.cfg.RedJohnAPIURL, b.cfg.RedJohnAPIKey, b.cfg.HTTPTimeout)
	broadcaster := services.NewBroadcaster(client, b.cfg.BroadcastPollInterval,
		func(ctx context.Context, channelID string, items []models.NewsItem) error {
			_, err := b.session.ChannelMessageSendComplex(channelID, &discordgo.MessageSend{
				Embeds: []*discordgo.MessageEmbed{
					ui.BroadcastNewsEmbed(&models.NewsList{Items: items, Total: len(items), Configured: true}),
				},
			})
			return err
		})
	go broadcaster.Run(b.alertsCtx)
}

// startAlerts menjalankan poller alert di goroutine terpisah.
func (b *Bot) startAlerts() {
	client := services.NewClient(b.cfg.RedJohnAPIURL, b.cfg.RedJohnAPIKey, b.cfg.HTTPTimeout)
	poller := services.NewAlertPoller(client, b.cfg.AlertPollInterval, b.logger)
	go func() {
		poller.Run(b.alertsCtx, func(_ context.Context, t models.Threat) {
			b.deliverAlert(t)
		})
	}()
}

// deliverAlert kirim AlertEmbed ke channel yang dikonfigurasi guild terkait.
// MVP: kirim ke satu channel terdaftar pertama yang cocok via /api/discord/alert-channels.
func (b *Bot) deliverAlert(t models.Threat) {
	ctx, cancel := context.WithTimeout(b.alertsCtx, 10*time.Second)
	defer cancel()

	channels, err := services.NewClient(b.cfg.RedJohnAPIURL, b.cfg.RedJohnAPIKey, b.cfg.HTTPTimeout).
		AlertChannels(ctx)
	if err != nil {
		b.logger.Warn("ambil daftar alert-channels gagal", "err", err)
		return
	}
	for _, ch := range channels {
		if ch.AlertChannelID == nil || *ch.AlertChannelID == "" {
			continue
		}
		_, err := b.session.ChannelMessageSendComplex(*ch.AlertChannelID, &discordgo.MessageSend{
			Embeds: []*discordgo.MessageEmbed{ui.AlertEmbed(t)},
		})
		if err != nil {
			b.logger.Warn("kirim alert gagal", "channel", *ch.AlertChannelID, "err", err)
		}
	}
}

// Close tutup sesi dengan rapi.
func (b *Bot) Close() {
	_ = b.session.Close()
}

// Run blocking sampai sinyal shutdown.
func (b *Bot) Run(ctx context.Context) error {
	if err := b.Open(); err != nil {
		return err
	}
	defer b.Close()

	b.logger.Info("bot online", "guild_scope", b.cfg.DiscordGuildID)

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	select {
	case <-ctx.Done():
		b.logger.Info("shutdown: context dibatalkan")
	case s := <-stop:
		b.logger.Info("shutdown: sinyal diterima", "signal", s.String())
	}
	return nil
}

func (b *Bot) onReady(_ *discordgo.Session, r *discordgo.Ready) {
	b.logger.Info("gateway siap", "user", r.User.Username)
	_ = b.session.UpdateGameStatus(0, "🛡️ Red John — /help")
}
