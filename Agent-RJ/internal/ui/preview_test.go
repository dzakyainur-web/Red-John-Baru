package ui

import (
	"testing"

	"github.com/r3nddy/Red-John/Agent-RJ/internal/models"
)

// TestNewsEmbedPreview bukan asersi — hanya mencetak contoh render untuk
// direview manual dengan `go test -run Preview -v ./internal/ui`.
func TestNewsEmbedPreview(t *testing.T) {
	l := &models.NewsList{Total: 9, Configured: true, Items: []models.NewsItem{
		{ID: "1", Title: "Waspada Pinjol Ilegal Baru Menyasar Mahasiswa", URL: ptr("https://www.detik.com/berita/x1"), Source: "detik", PublishedAt: ptr("2026-11-07T09:00:00Z"), Snippet: "Penawaran pinjaman tanpa izin OJK kembali beredar lewat pesan WhatsApp dengan bunga sangat rendah.", Categories: []string{"pinjol_ilegal"}},
		{ID: "2", Title: "APK Undangan Pernikahan Mencuri Rekening", URL: ptr("https://www.kompas.com/x2"), Source: "kompas", PublishedAt: ptr("2026-11-06T14:30:00Z"), Snippet: "Modus file APK berkedok undangan menyebar via grup keluarga.", Categories: []string{"malware_apk", "phishing_link"}},
		{ID: "3", Title: "Lowongan Kerja Palsu Menjanjikan Gaji Tinggi", Source: "cnnindonesia"},
	}}
	e := NewsEmbed(l, "📰 Berita Penipuan Terverifikasi")
	t.Log("TITLE: " + e.Title)
	for _, f := range e.Fields {
		t.Log("--- " + f.Name)
		t.Log(f.Value)
	}
	t.Log("FOOTER: " + e.Footer.Text)
}
