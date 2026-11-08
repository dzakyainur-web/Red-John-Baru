// Package ui: pembangun Discord Embed dari data backend. Tidak ada nilai yang
// dikarang — semua field berasal dari respons API.
package ui

import (
	"fmt"
	"strings"
	"time"

	"github.com/bwmarrin/discordgo"

	"github.com/r3nddy/Red-John/Agent-RJ/internal/models"
)

// Warna presentasi (bukan data backend).
const (
	ColorLow    = 0x2ECC71
	ColorMedium = 0xF1C40F
	ColorHigh   = 0xE74C3C
	ColorInfo   = 0x3498DB
	ColorError  = 0x95A5A6
)

// Batas embed Discord.
const (
	maxFieldValue  = 1024
	maxDescription = 4096
	maxEvidenceRun = 160
	maxSnippetRun  = 200
	maxFlagFields  = 5
	maxNewsFields  = 5
)

func riskColor(level string) int {
	switch level {
	case "high":
		return ColorHigh
	case "medium":
		return ColorMedium
	default:
		return ColorLow
	}
}

func severityLabel(sev string) string {
	switch sev {
	case "tinggi":
		return "tinggi"
	case "sedang":
		return "sedang"
	case "rendah":
		return "rendah"
	default:
		return sev
	}
}

func trunc(s string, n int) string {
	r := []rune(s)
	if len(r) <= n {
		return s
	}
	return strings.TrimSpace(string(r[:n-1])) + "…"
}

func deferangURL(u string) string {
	if u == "" {
		return u
	}
	return strings.ReplaceAll(strings.ReplaceAll(u, "https://", "hxxps://"), "http://", "hxxp://")
}

// ErrorEmbed pesan kegagalan yang aman ditampilkan.
func ErrorEmbed(message string) *discordgo.MessageEmbed {
	return &discordgo.MessageEmbed{
		Title:       "❌ Gagal",
		Description: trunc(message, maxDescription),
		Color:       ColorError,
	}
}

// ScanEmbed hasil /scan dari backend.
func ScanEmbed(resp *models.ScanResponse) *discordgo.MessageEmbed {
	a := resp.Assessment
	emb := &discordgo.MessageEmbed{
		Title:       "🛡️ Red John — Hasil Pemeriksaan",
		Description: fmt.Sprintf("**Target** (`%s`)\n%s", resp.Kind, trunc(deferangURL(resp.Target), 300)),
		Color:       riskColor(a.RiskLevel),
		Fields:      []*discordgo.MessageEmbedField{},
	}

	emb.Fields = append(emb.Fields,
		&discordgo.MessageEmbedField{
			Name:   "Risk Score",
			Value:  fmt.Sprintf("**%d/100** — %s", a.Score, strings.ToUpper(a.RiskLevel)),
			Inline: true,
		},
	)

	if a.ML != nil {
		emb.Fields = append(emb.Fields, &discordgo.MessageEmbedField{
			Name:   "Keyakinan ML",
			Value:  fmt.Sprintf("%.0f%% (model `%s`)", a.ML.FraudProbability*100, a.ML.ModelVersion),
			Inline: true,
		})
	}

	// Indikator: maksimal 5 agar embed tetap muat.
	count := 0
	for _, f := range a.Flags {
		if count >= maxFlagFields {
			break
		}
		evidence := ""
		if f.Evidence != nil && *f.Evidence != "" {
			evidence = "\n> " + trunc(*f.Evidence, maxEvidenceRun)
		}
		emb.Fields = append(emb.Fields, &discordgo.MessageEmbedField{
			Name: fmt.Sprintf("⚠️ %s (%s)", f.Title, severityLabel(f.Severity)),
			Value: trunc(f.Explanation, maxFieldValue) + evidence +
				"\n**Saran:** " + trunc(f.Advice, maxFieldValue),
		})
		count++
	}
	if len(a.Flags) > maxFlagFields {
		emb.Fields = append(emb.Fields, &discordgo.MessageEmbedField{
			Name:   "…",
			Value:  fmt.Sprintf("%d indikator lain tidak ditampilkan.", len(a.Flags)-maxFlagFields),
			Inline: false,
		})
	}

	emb.Fields = append(emb.Fields, &discordgo.MessageEmbedField{
		Name:   "Catatan",
		Value:  trunc(a.Disclaimer, maxFieldValue),
		Inline: false,
	})
	return emb
}

// ExplainEmbed hasil /scam explain: fokus ke indikator dan sarannya.
func ExplainEmbed(resp *models.ScanResponse) *discordgo.MessageEmbed {
	emb := ScanEmbed(resp)
	emb.Title = "🔎 Red John — Penjelasan Indikator"
	return emb
}

// NewsEmbed daftar berita.
func NewsEmbed(list *models.NewsList, title string) *discordgo.MessageEmbed {
	emb := &discordgo.MessageEmbed{
		Title:       title,
		Color:       ColorInfo,
		Description: "",
		Fields:      []*discordgo.MessageEmbedField{},
	}
	if len(list.Items) == 0 {
		emb.Description = "Belum ada berita penipuan terverifikasi."
		return emb
	}
	for i, item := range list.Items {
		if i >= maxNewsFields {
			break
		}
		var b strings.Builder
		if item.URL != nil && *item.URL != "" {
			b.WriteString(fmt.Sprintf("[Baca sumber](%s)\n", deferangURL(*item.URL)))
		}
		cats := strings.Join(item.Categories, ", ")
		if cats == "" {
			cats = "umum"
		}
		b.WriteString(fmt.Sprintf("Kategori: `%s` • Sumber: `%s`", cats, item.Source))
		if item.PublishedAt != nil && *item.PublishedAt != "" {
			if t, err := time.Parse(time.RFC3339, *item.PublishedAt); err == nil {
				b.WriteString(fmt.Sprintf(" • <t:%d:R>", t.Unix()))
			}
		}
		if item.Snippet != "" {
			b.WriteString("\n" + trunc(item.Snippet, maxSnippetRun))
		}
		emb.Fields = append(emb.Fields, &discordgo.MessageEmbedField{
			Name:   fmt.Sprintf("%d. %s", i+1, trunc(item.Title, 256)),
			Value:  trunc(b.String(), maxFieldValue),
			Inline: false,
		})
	}
	if list.Total > len(list.Items) {
		emb.Footer = &discordgo.MessageEmbedFooter{
			Text: fmt.Sprintf("Menampilkan %d dari %d berita.", len(list.Items), list.Total),
		}
	}
	return emb
}

// ReportCreatedEmbed konfirmasi laporan masuk antrian.
func ReportCreatedEmbed(status *models.ReportStatus) *discordgo.MessageEmbed {
	return &discordgo.MessageEmbed{
		Title:       "📨 Laporan Terkirim",
		Description: "Laporanmu masuk antrian moderasi Red John. Tidak dipublikasikan sebelum diverifikasi admin.",
		Color:       ColorInfo,
		Fields: []*discordgo.MessageEmbedField{
			{Name: "ID Laporan", Value: "`" + status.ID + "`", Inline: true},
			{Name: "Kategori", Value: "`" + status.Category + "`", Inline: true},
			{Name: "Status", Value: strings.ToUpper(status.Status), Inline: true},
		},
		Footer: &discordgo.MessageEmbedFooter{
			Text: "Simpan ID di atas untuk /report status.",
		},
	}
}

// ReportStatusEmbed status laporan untuk pelapor.
func ReportStatusEmbed(status *models.ReportStatus) *discordgo.MessageEmbed {
	color := ColorInfo
	switch status.Status {
	case "verified":
		color = ColorLow
	case "rejected":
		color = ColorError
	}
	return &discordgo.MessageEmbed{
		Title: "📋 Status Laporan",
		Color: color,
		Fields: []*discordgo.MessageEmbedField{
			{Name: "ID", Value: "`" + status.ID + "`", Inline: true},
			{Name: "Kategori", Value: "`" + status.Category + "`", Inline: true},
			{Name: "Status", Value: statusStatusLabel(status.Status), Inline: true},
		},
	}
}

func statusStatusLabel(s string) string {
	switch s {
	case "pending":
		return "⏳ Menunggu tinjauan admin"
	case "verified":
		return "✅ Terverifikasi"
	case "rejected":
		return "🗂️ Diarsipkan (tidak dipublikasikan)"
	default:
		return s
	}
}

// ConfigEmbed konfigurasi guild.
func ConfigEmbed(cfg *models.GuildConfig) *discordgo.MessageEmbed {
	channel := "belum diatur"
	if cfg.AlertChannelID != nil && *cfg.AlertChannelID != "" {
		channel = "<#" + *cfg.AlertChannelID + ">"
	}
	protection := "🔴 OFF"
	if cfg.ProtectionEnabled {
		protection = "🟢 ON"
	}
	return &discordgo.MessageEmbed{
		Title: "⚙️ Konfigurasi Red John",
		Color: ColorInfo,
		Fields: []*discordgo.MessageEmbedField{
			{Name: "Channel Alert", Value: channel, Inline: true},
			{Name: "Perlindungan", Value: protection, Inline: true},
		},
	}
}

// AlertEmbed notifikasi ancaman terverifikasi baru.
func AlertEmbed(t models.Threat) *discordgo.MessageEmbed {
	desc := trunc(t.Title, 300)
	if t.SourceURL != nil && *t.SourceURL != "" {
		desc += "\n" + deferangURL(*t.SourceURL)
	}
	if len(t.ScammerIndicators) > 0 {
		var b strings.Builder
		for _, ind := range t.ScammerIndicators {
			b.WriteString("- `" + trunc(ind.Value, 80) + "` (" + ind.Type + ")\n")
			if b.Len() > maxFieldValue-20 {
				break
			}
		}
		desc += "\n**Indikator:**\n" + b.String()
	}
	return &discordgo.MessageEmbed{
		Title:       fmt.Sprintf("🚨 Alert: %s", t.Category),
		Description: trunc(desc, maxDescription),
		Color:       ColorHigh,
		Footer:      &discordgo.MessageEmbedFooter{Text: "Sumber: " + t.SourceMedia},
	}
}
