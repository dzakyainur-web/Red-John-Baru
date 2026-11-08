// Handler interaction: routing per command, ACK 3 detik, error embed.
package commands

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/bwmarrin/discordgo"

	"github.com/r3nddy/Red-John/Agent-RJ/internal/models"
	"github.com/r3nddy/Red-John/Agent-RJ/internal/services"
	"github.com/r3nddy/Red-John/Agent-RJ/internal/ui"
)

const modalID = "report_scam_modal"

// HandleInteraction titik masuk semua interaction.
func (r *Registry) HandleInteraction(s *discordgo.Session, i *discordgo.InteractionCreate) {
	switch i.Type {
	case discordgo.InteractionModalSubmit:
		if i.ModalSubmitData().CustomID == modalID {
			r.handleReportModal(s, i)
		}
	case discordgo.InteractionApplicationCommand:
		name := i.ApplicationCommandData().Name
		handler, ok := r.routes[name]
		if !ok {
			r.respondError(s, i, "Perintah tidak dikenal.")
			return
		}
		handler(s, i)
	}
}

// ctxFor context dengan timeout HTTP config.
func (r *Registry) ctxFor() (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), r.deps.Cfg.HTTPTimeout+3*time.Second)
}

// deferEphemeral ACK cepat; hasil dikirim via followup (batas 3 detik Discord).
func (r *Registry) deferEphemeral(s *discordgo.Session, i *discordgo.InteractionCreate) {
	r.deferAC(discordgo.MessageFlagsEphemeral)(s, i)
}

// deferPublic ACK tanpa flag ephemeral: pesan "thinking" DAN followup terlihat
// semua anggota channel. Hanya untuk command dengan data publik (mis. /news).
func (r *Registry) deferPublic(s *discordgo.Session, i *discordgo.InteractionCreate) {
	r.deferAC(0)(s, i)
}

func (r *Registry) deferAC(flags discordgo.MessageFlags) func(*discordgo.Session, *discordgo.InteractionCreate) {
	return func(s *discordgo.Session, i *discordgo.InteractionCreate) {
		err := s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseDeferredChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{Flags: flags},
		})
		if err != nil {
			r.deps.Logger.Warn("gagal ACK interaction", "err", err)
		}
	}
}

// respondError balas error embed; fallback followup bila sudah ter-ACK.
func (r *Registry) respondError(s *discordgo.Session, i *discordgo.InteractionCreate, message string) {
	data := &discordgo.InteractionResponseData{
		Embeds: []*discordgo.MessageEmbed{ui.ErrorEmbed(message)},
		Flags:  discordgo.MessageFlagsEphemeral,
	}
	err := s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: data,
	})
	if err != nil {
		_, _ = s.FollowupMessageCreate(i.Interaction, true, &discordgo.WebhookParams{
			Embeds: data.Embeds,
			Flags:  data.Flags,
		})
	}
}

// apiMessage pesan user-facing dari error API/network.
func apiMessage(err error) string {
	var apiErr *services.APIError
	if asAPIError(err, &apiErr) {
		return apiErr.UserMessage()
	}
	return "Gagal menghubungi backend Red John."
}

func followupEmbed(s *discordgo.Session, i *discordgo.InteractionCreate, emb *discordgo.MessageEmbed) {
	// Interaction sudah di-ACK dengan flag ephemeral; followup harus menambahkan
	// Flush agar pesan benar-benar tampil (default discordgo Ephemeral=true).
	_, _ = s.FollowupMessageCreate(i.Interaction, false, &discordgo.WebhookParams{
		Embeds: []*discordgo.MessageEmbed{emb},
		Flags:  discordgo.MessageFlagsEphemeral,
	})
}

// followupPublicEmbed kirim embed yang terlihat semua anggota channel.
// Hanya untuk data publik (mis. daftar berita terverifikasi).
func followupPublicEmbed(s *discordgo.Session, i *discordgo.InteractionCreate, emb *discordgo.MessageEmbed) {
	_, _ = s.FollowupMessageCreate(i.Interaction, false, &discordgo.WebhookParams{
		Embeds: []*discordgo.MessageEmbed{emb},
	})
}

// ---- /ping -----------------------------------------------------------------------

func (r *Registry) handlePing(s *discordgo.Session, i *discordgo.InteractionCreate) {
	// ACK publik: ACK ephemeral membuat seluruh followup tetap privat.
	r.deferPublic(s, i)
	ctx, cancel := r.ctxFor()
	defer cancel()

	backend := "✅ terhubung"
	if health, err := r.deps.Client.Health(ctx); err != nil {
		backend = "❌ tidak terhubung: " + apiMessage(err)
	} else if health.Status != "ok" {
		backend = "⚠️ hidup, status `" + health.Status + "`"
		if !health.MLLoaded {
			backend += " (model ML tidak termuat)"
		}
	}
	followupPublicEmbed(s, i, &discordgo.MessageEmbed{
		Title: "🏓 Pong",
		Description: fmt.Sprintf("Gateway latency: **%d ms**\nBackend: %s",
			s.HeartbeatLatency().Milliseconds(), backend),
		Color: ui.ColorInfo,
	})
}

// ---- /help -----------------------------------------------------------------------

func (r *Registry) handleHelp(s *discordgo.Session, i *discordgo.InteractionCreate) {
	err := s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Embeds: []*discordgo.MessageEmbed{{
				Title: "🛡️ Red John — Bantuan",
				Color: ui.ColorInfo,
				Description: strings.Join([]string{
					"**/scan url|domain|text|phone|bank|email** — periksa target mencurigakan",
					"**/scam explain** — jelaskan indikator penipuan pada sebuah pesan",
					"**/news latest|search** — berita penipuan terverifikasi",
					"**/report scam** — laporkan dugaan penipuan (formulir)",
					"**/report status** — cek status laporanmu",
					"**/config status|alert-channel|news-channel|protection** — pengaturan server (admin)",
					"**/ping** — status bot & backend",
				}, "\n"),
				Footer: &discordgo.MessageEmbedFooter{
					Text: "Red John: Cyber Scam Intelligence. Data dari backend resmi Red John.",
				},
			}},
			Flags: discordgo.MessageFlagsEphemeral,
		},
	})
	if err != nil {
		r.deps.Logger.Warn("gagal mengirim help", "err", err)
	}
}

// ---- /scan -----------------------------------------------------------------------

func (r *Registry) handleScan(s *discordgo.Session, i *discordgo.InteractionCreate) {
	userID := interactionUser(i)
	if !r.deps.ScanRL.Allow("scan:" + userID) {
		r.respondError(s, i, "Terlalu banyak pemeriksaan. Coba lagi beberapa saat.")
		return
	}

	kind, target, ok := subcommandString(i, "target")
	if !ok {
		r.respondError(s, i, "Target wajib diisi.")
		return
	}
	if len([]rune(target)) > 5000 {
		r.respondError(s, i, "Target terlalu panjang (maksimal 5000 karakter).")
		return
	}

	r.deferEphemeral(s, i)
	ctx, cancel := r.ctxFor()
	defer cancel()

	resp, err := r.deps.Client.Scan(ctx, kind, target)
	if err != nil {
		followupEmbed(s, i, ui.ErrorEmbed(apiMessage(err)))
		return
	}
	followupEmbed(s, i, ui.ScanEmbed(resp))
}

// ---- /scam explain -----------------------------------------------------------------

func (r *Registry) handleScam(s *discordgo.Session, i *discordgo.InteractionCreate) {
	if !r.deps.ScanRL.Allow("scan:" + interactionUser(i)) {
		r.respondError(s, i, "Terlalu banyak pemeriksaan. Coba lagi beberapa saat.")
		return
	}
	text, ok := optionString(i, "text")
	if !ok {
		r.respondError(s, i, "Teks wajib diisi.")
		return
	}
	r.deferEphemeral(s, i)
	ctx, cancel := r.ctxFor()
	defer cancel()

	resp, err := r.deps.Client.Scan(ctx, "text", text)
	if err != nil {
		followupEmbed(s, i, ui.ErrorEmbed(apiMessage(err)))
		return
	}
	followupEmbed(s, i, ui.ExplainEmbed(resp))
}

// ---- /news -----------------------------------------------------------------------

func (r *Registry) handleNews(s *discordgo.Session, i *discordgo.InteractionCreate) {
	// ACK juga publik: ACK ephemeral membuat seluruh followup tetap privat.
	r.deferPublic(s, i)
	ctx, cancel := r.ctxFor()
	defer cancel()

	query := ""
	title := "📰 Berita Penipuan Terverifikasi"
	if sub, ok := subcommandName(i); ok && sub == "search" {
		query, _ = optionString(i, "kata")
		query = strings.TrimSpace(query)
		title = "🔎 Hasil Pencarian Berita"
	}

	list, err := r.deps.Client.News(ctx, query, 5, 0)
	if err != nil {
		followupEmbed(s, i, ui.ErrorEmbed(apiMessage(err)))
		return
	}
	// Berita adalah data publik → tampil untuk semua anggota channel.
	followupPublicEmbed(s, i, ui.NewsEmbed(list, title))
}

// ---- /report -----------------------------------------------------------------------

var reportCategories = []string{
	"fake_job", "phishing_link", "giveaway_palsu", "malware_apk", "pinjol_ilegal",
}

func (r *Registry) handleReport(s *discordgo.Session, i *discordgo.InteractionCreate) {
	sub, _ := subcommandName(i)
	if sub == "status" {
		r.reportStatus(s, i)
		return
	}
	// /report scam -> modal
	err := s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseModal,
		Data: &discordgo.InteractionResponseData{
			CustomID: modalID,
			Title:    "Laporkan Penipuan",
			Components: []discordgo.MessageComponent{
				discordgo.TextInput{
					CustomID: "category",
					// Label input Discord maks 45 karakter; daftar kategori ada di
					// placeholder (maks 100) — label panjang ditolak server.
					Label:       "Kategori",
					Style:       discordgo.TextInputShort,
					Placeholder: strings.Join(reportCategories, " | "),
					Required:    true,
					MaxLength:   40,
				},
				discordgo.TextInput{
					CustomID:    "target",
					Label:       "Target pelaku (URL/no. HP/rekening)",
					Style:       discordgo.TextInputShort,
					Placeholder: "https://contoh[.]xyz/login",
					Required:    false,
					MaxLength:   300,
				},
				discordgo.TextInput{
					CustomID:  "description",
					Label:     "Ceritakan kejadian",
					Style:     discordgo.TextInputParagraph,
					Required:  true,
					MaxLength: 1200,
				},
			},
		},
	})
	if err != nil {
		r.deps.Logger.Warn("gagal membuka modal laporan", "err", err)
	}
}

func (r *Registry) handleReportModal(s *discordgo.Session, i *discordgo.InteractionCreate) {
	data := i.ModalSubmitData()
	values := map[string]string{}
	for _, comp := range data.Components {
		if row, ok := comp.(*discordgo.ActionsRow); ok {
			for _, inner := range row.Components {
				if ti, ok := inner.(*discordgo.TextInput); ok {
					values[ti.CustomID] = ti.Value
				}
			}
		}
	}

	category := strings.ToLower(strings.TrimSpace(values["category"]))
	if !isValidCategory(category) {
		r.respondError(s, i,
			"Kategori tidak dikenal. Pilih salah satu: "+strings.Join(reportCategories, ", "))
		return
	}
	description := strings.TrimSpace(values["description"])
	if len([]rune(description)) < 1 {
		r.respondError(s, i, "Deskripsi kejadian wajib diisi.")
		return
	}

	// Judul laporan di-generate agar lolos validasi backend (10–300 karakter).
	target := strings.TrimSpace(values["target"])
	title := "Laporan Discord: " + category
	if target != "" {
		title += " — " + truncTitle(target, 120)
	}

	user := interactionUser(i)
	name := ""
	if m := i.Member; m != nil && m.User != nil {
		name = m.User.Username
	} else if u := i.User; u != nil {
		name = u.Username
	}
	if len([]rune(title)) < 10 {
		title = "Laporan Discord kategori " + category
	}

	payload := models.ReportCreate{
		Category:    category,
		Title:       title,
		Description: description,
		Target:      target,
		Reporter:    models.Reporter{Platform: "discord", ID: user, Name: name},
	}

	if !r.deps.ReportRL.Allow("report:" + user) {
		r.respondError(s, i, "Kamu baru saja mengirim laporan. Coba lagi nanti.")
		return
	}

	r.deferEphemeral(s, i)
	ctx, cancel := r.ctxFor()
	defer cancel()

	status, err := r.deps.Client.CreateReport(ctx, payload)
	if err != nil {
		followupEmbed(s, i, ui.ErrorEmbed(apiMessage(err)))
		return
	}
	followupEmbed(s, i, ui.ReportCreatedEmbed(status))
}

func (r *Registry) reportStatus(s *discordgo.Session, i *discordgo.InteractionCreate) {
	id, ok := optionString(i, "id")
	if !ok {
		r.respondError(s, i, "ID laporan wajib diisi.")
		return
	}
	r.deferEphemeral(s, i)
	ctx, cancel := r.ctxFor()
	defer cancel()

	status, err := r.deps.Client.ReportStatus(ctx, id, interactionUser(i))
	if err != nil {
		followupEmbed(s, i, ui.ErrorEmbed(apiMessage(err)))
		return
	}
	followupEmbed(s, i, ui.ReportStatusEmbed(status))
}

// ---- /config -----------------------------------------------------------------------

func (r *Registry) handleConfig(s *discordgo.Session, i *discordgo.InteractionCreate) {
	if !isGuildAdmin(i) {
		r.respondError(s, i, "Perintah ini hanya untuk admin server.")
		return
	}
	guildID := i.GuildID
	if guildID == "" {
		r.respondError(s, i, "Perintah config hanya bisa dipakai di server.")
		return
	}

	r.deferEphemeral(s, i)
	ctx, cancel := r.ctxFor()
	defer cancel()

	sub, _ := subcommandName(i)
	switch sub {
	case "status":
		cfg, err := r.deps.Client.GuildConfig(ctx, guildID)
		if err != nil {
			followupEmbed(s, i, ui.ErrorEmbed(apiMessage(err)))
			return
		}
		followupEmbed(s, i, ui.ConfigEmbed(cfg))
	case "alert-channel":
		channelID := optionChannel(i, "channel")
		if channelID == "" {
			followupEmbed(s, i, ui.ErrorEmbed("Channel tidak valid."))
			return
		}
		cfg, err := r.deps.Client.PatchGuildConfig(ctx, guildID, map[string]any{
			"alert_channel_id": channelID,
		})
		if err != nil {
			followupEmbed(s, i, ui.ErrorEmbed(apiMessage(err)))
			return
		}
		followupEmbed(s, i, ui.ConfigEmbed(cfg))
	case "news-channel":
		channelID := optionChannel(i, "channel")
		if channelID == "" {
			followupEmbed(s, i, ui.ErrorEmbed("Channel tidak valid."))
			return
		}
		cfg, err := r.deps.Client.PatchGuildConfig(ctx, guildID, map[string]any{
			"news_channel_id": channelID,
		})
		if err != nil {
			followupEmbed(s, i, ui.ErrorEmbed(apiMessage(err)))
			return
		}
		followupEmbed(s, i, ui.ConfigEmbed(cfg))
	case "protection":
		enable := optionBool(i, "aktif")
		cfg, err := r.deps.Client.PatchGuildConfig(ctx, guildID, map[string]any{
			"protection_enabled": enable,
		})
		if err != nil {
			followupEmbed(s, i, ui.ErrorEmbed(apiMessage(err)))
			return
		}
		followupEmbed(s, i, ui.ConfigEmbed(cfg))
	default:
		followupEmbed(s, i, ui.ErrorEmbed("Sub-perintah config tidak dikenal."))
	}
}

// ---- helpers ------------------------------------------------------------------------

func asAPIError(err error, target **services.APIError) bool {
	return errors.As(err, target)
}

func interactionUser(i *discordgo.InteractionCreate) string {
	if i.Member != nil && i.Member.User != nil {
		return i.Member.User.ID
	}
	if i.User != nil {
		return i.User.ID
	}
	return ""
}

func isGuildAdmin(i *discordgo.InteractionCreate) bool {
	if i.Member == nil {
		return false
	}
	const p int64 = int64(discordgo.PermissionManageGuild) | int64(discordgo.PermissionAdministrator)
	return int64(i.Member.Permissions)&p != 0
}

func isValidCategory(c string) bool {
	for _, valid := range reportCategories {
		if c == valid {
			return true
		}
	}
	return false
}

func truncTitle(v string, n int) string {
	r := []rune(v)
	if len(r) <= n {
		return v
	}
	return strings.TrimSpace(string(r[:n])) + "…"
}

func subcommandName(i *discordgo.InteractionCreate) (string, bool) {
	opts := i.ApplicationCommandData().Options
	if len(opts) == 0 {
		return "", false
	}
	return opts[0].Name, true
}

// subcommandString mengembalikan nama sub-command dan nilai opsi `name`.
func subcommandString(i *discordgo.InteractionCreate, name string) (string, string, bool) {
	opts := i.ApplicationCommandData().Options
	if len(opts) == 0 || len(opts[0].Options) == 0 {
		return "", "", false
	}
	sub := opts[0].Name
	for _, o := range opts[0].Options {
		if o.Name == name {
			return sub, o.StringValue(), true
		}
	}
	return sub, "", false
}

func optionString(i *discordgo.InteractionCreate, name string) (string, bool) {
	opts := i.ApplicationCommandData().Options
	if len(opts) == 0 {
		return "", false
	}
	if len(opts[0].Options) > 0 {
		for _, o := range opts[0].Options {
			if o.Name == name {
				return o.StringValue(), true
			}
		}
		return "", false
	}
	for _, o := range opts {
		if o.Name == name {
			return o.StringValue(), true
		}
	}
	return "", false
}

func optionChannel(i *discordgo.InteractionCreate, name string) string {
	opts := i.ApplicationCommandData().Options
	if len(opts) == 0 {
		return ""
	}
	for _, o := range opts[0].Options {
		if o.Name == name {
			return o.ChannelValue(nil).ID
		}
	}
	return ""
}

func optionBool(i *discordgo.InteractionCreate, name string) bool {
	opts := i.ApplicationCommandData().Options
	if len(opts) == 0 {
		return false
	}
	for _, o := range opts[0].Options {
		if o.Name == name {
			return o.BoolValue()
		}
	}
	return false
}
