package ui

import (
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/bwmarrin/discordgo"

	"github.com/r3nddy/Red-John/Agent-RJ/internal/models"
)

func ptr(s string) *string { return &s }

// checkEmbed memastikan seluruh batas keras Discord terpenuhi.
func checkEmbed(t *testing.T, prepend string, emb *discordgo.MessageEmbed) {
	t.Helper()
	total := len([]rune(prepend)) + len([]rune(emb.Title)) + len([]rune(emb.Description))
	if emb.Title == "" {
		t.Error("judul embed kosong")
	}
	if n := len([]rune(emb.Title)); n > 256 {
		t.Errorf("judul %d karakter (>256)", n)
	}
	if n := len([]rune(emb.Description)); n > maxDescription {
		t.Errorf("deskripsi %d karakter (>%d)", n, maxDescription)
	}
	if emb.Footer != nil {
		if n := len([]rune(emb.Footer.Text)); n > maxFooter {
			t.Errorf("footer %d karakter (>%d)", n, maxFooter)
		}
		total += len([]rune(emb.Footer.Text))
	}
	if len(emb.Fields) > 25 {
		t.Errorf("%d field (>25)", len(emb.Fields))
	}
	for i, f := range emb.Fields {
		if n := len([]rune(f.Name)); n > maxFieldName {
			t.Errorf("field %d: nama %d karakter (>%d)", i, n, maxFieldName)
		}
		if n := len([]rune(f.Value)); n > maxFieldValue {
			t.Errorf("field %d: nilai %d karakter (>%d)", i, n, maxFieldValue)
		}
		if strings.TrimSpace(f.Value) == "" {
			t.Errorf("field %d: nilai kosong", i)
		}
		total += len([]rune(f.Name)) + len([]rune(f.Value))
	}
	if total > maxMessageChars-200 { // sisakan ruang judul pesan/header
		t.Errorf("total %d karakter (>%d)", total, maxMessageChars)
	}
}

func longWords(n int) string {
	return strings.Repeat("penipuan", n/8+1)[:n]
}

func TestNewsEmbedWithinLimits(t *testing.T) {
	items := make([]models.NewsItem, 0, maxNewsFields)
	for i := 0; i < maxNewsFields; i++ {
		items = append(items, models.NewsItem{
			ID:          fmt.Sprint(i),
			Title:       longWords(400), // melebihi batas judul field
			URL:         ptr("https://contoh.xyz/" + strings.Repeat("a", 300)),
			Source:      "detik",
			PublishedAt: ptr(time.Now().UTC().Format(time.RFC3339)),
			Snippet:     longWords(1500),
			Categories:  []string{"phishing_link"},
			ImageURL:    ptr("https://contoh.xyz/gambar.jpg"),
		})
	}
	emb := NewsEmbed(&models.NewsList{Items: items, Total: 42, Configured: true}, "📰 Berita Penipuan Terbaru")
	checkEmbed(t, "", emb)
	if len(emb.Fields) != maxNewsFields {
		t.Fatalf("field = %d, mau %d", len(emb.Fields), maxNewsFields)
	}
}

func TestNewsEmbedLinksClickable(t *testing.T) {
	item := models.NewsItem{
		ID: "1", Title: "Modus baru pinjol", URL: ptr("https://contoh.xyz/berita"),
		Source: "detik", PublishedAt: ptr("2026-11-08T10:00:00Z"),
		Snippet: "Korban diminta transfer biaya admin.",
	}
	emb := NewsEmbed(&models.NewsList{Items: []models.NewsItem{item}, Total: 1, Configured: true}, "x")
	v := emb.Fields[0].Value
	if !strings.Contains(v, "[🔗 Buka sumber](https://contoh.xyz/berita)") {
		t.Errorf("tautan sumber harus bisa diklik: %q", v)
	}
	if strings.Contains(v, "hxxp") {
		t.Errorf("link berita tidak boleh di-defang: %q", v)
	}
	if !strings.Contains(v, "<t:") {
		t.Errorf("waktu terbit harus pakai timestamp Discord: %q", v)
	}
	if strings.Contains(v, "``") || strings.Contains(v, "Kategori:") {
		t.Errorf("meta tidak boleh berisi label kosong: %q", v)
	}
}

func TestNewsEmbedRejectsNonHTTPLink(t *testing.T) {
	item := models.NewsItem{ID: "1", Title: "A", Source: "detik", URL: ptr("javascript:alert(1)")}
	emb := NewsEmbed(&models.NewsList{Items: []models.NewsItem{item}, Total: 1, Configured: true}, "x")
	if strings.Contains(emb.Fields[0].Value, "javascript:") {
		t.Errorf("skema non-http tidak boleh jadi tautan: %q", emb.Fields[0].Value)
	}
}

func TestNewsEmbedEmptyStates(t *testing.T) {
	unconfigured := NewsEmbed(&models.NewsList{Configured: false}, "x")
	if !strings.Contains(unconfigured.Description, "Supabase") {
		t.Errorf("state belum dikonfigurasi: %q", unconfigured.Description)
	}
	empty := NewsEmbed(&models.NewsList{Configured: true}, "x")
	if !strings.Contains(empty.Description, "Belum ada berita") {
		t.Errorf("state kosong: %q", empty.Description)
	}
	noHits := NewsEmbed(&models.NewsList{Configured: true, QueryText: "xyz"}, "x")
	if !strings.Contains(noHits.Description, "Tidak ada berita") {
		t.Errorf("state pencarian tanpa hasil: %q", noHits.Description)
	}
}

func TestNewsEmbedFooter(t *testing.T) {
	items := []models.NewsItem{{ID: "1", Title: "A", Source: "detik"}}
	emb := NewsEmbed(&models.NewsList{Items: items, Total: 9, Configured: true}, "x")
	if emb.Footer == nil || !strings.Contains(emb.Footer.Text, "1 dari 9") {
		t.Errorf("footer harus menyebut 1 dari 9: %+v", emb.Footer)
	}
}
