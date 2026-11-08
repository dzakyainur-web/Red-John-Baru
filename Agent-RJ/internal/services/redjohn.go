// Package services: klien HTTP untuk backend Red John.
package services

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/r3nddy/Red-John/Agent-RJ/internal/models"
)

// MaxBodyBytes batas ukuran respons — respons backend tidak perlu lebih besar.
const MaxBodyBytes = 1 << 20 // 1 MB

// APIError membedakan jenis kegagalan agar embed bisa memberi pesan tepat.
type APIError struct {
	HTTPStatus int
	Detail     string
	Kind       Kind
}

// Kind klasifikasi error API.
type Kind int

const (
	KindValidation   Kind = iota // 422 — input ditolak backend
	KindUnauthorized             // 401
	KindConflict                 // 409
	KindRateLimited              // 429
	KindUnavailable              // 503 — Supabase/migrasi belum siap
	KindServer                   // 5xx lain
	KindNetwork                  // timeout / koneksi gagal
)

func (e *APIError) Error() string {
	if e.Detail != "" {
		return e.Detail
	}
	return fmt.Sprintf("backend %s", http.StatusText(e.HTTPStatus))
}

// UserMessage pesan singkat yang aman ditampilkan ke pengguna Discord.
func (e *APIError) UserMessage() string {
	switch e.Kind {
	case KindValidation:
		return e.Detail
	case KindUnauthorized:
		return "Autentikasi ke backend gagal (X-API-Key salah)."
	case KindConflict:
		return "Laporan serupa sudah ada."
	case KindRateLimited:
		return e.Detail
	case KindUnavailable:
		return "Backend Red John sedang tidak siap: " + e.Detail
	default:
		if e.HTTPStatus >= 500 {
			return "Terjadi kesalahan di backend Red John. Coba lagi nanti."
		}
		return "Gagal menghubungi backend Red John."
	}
}

// Client komunikasi satu arah ke FastAPI Red John.
type Client struct {
	base   string
	apiKey string
	http   *http.Client
}

// NewClient membuat klien. Timeout diberikan pemanggil (config).
func NewClient(baseURL, apiKey string, timeout time.Duration) *Client {
	return &Client{
		base:   strings.TrimRight(baseURL, "/"),
		apiKey: apiKey,
		http:   &http.Client{Timeout: timeout},
	}
}

func (c *Client) do(ctx context.Context, method, path string, body any, out any) error {
	var reader io.Reader
	if body != nil {
		buf, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("encode request: %w", err)
		}
		reader = bytes.NewReader(buf)
	}

	req, err := http.NewRequestWithContext(ctx, method, c.base+path, reader)
	if err != nil {
		return &APIError{Kind: KindNetwork, Detail: "URL backend tidak valid"}
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "RedJohn-Discord/0.1")
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if c.apiKey != "" {
		req.Header.Set("X-API-Key", c.apiKey)
	}

	resp, err := c.http.Do(req)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || isTimeout(err) {
			return &APIError{Kind: KindNetwork, Detail: "Koneksi ke backend timeout."}
		}
		return &APIError{Kind: KindNetwork, Detail: "Backend tidak dapat dihubungi."}
	}
	defer func() { _ = resp.Body.Close() }()

	data, err := io.ReadAll(io.LimitReader(resp.Body, MaxBodyBytes))
	if err != nil {
		return &APIError{Kind: KindNetwork, Detail: "Respons backend terpotong."}
	}

	if resp.StatusCode >= 300 {
		apiErr := &APIError{HTTPStatus: resp.StatusCode, Kind: classifyStatus(resp.StatusCode)}
		apiErr.Detail = extractDetail(data)
		return apiErr
	}

	if out != nil && len(data) > 0 {
		if err := json.Unmarshal(data, out); err != nil {
			return &APIError{HTTPStatus: resp.StatusCode, Kind: KindServer, Detail: "Respons backend tidak bisa dibaca."}
		}
	}
	return nil
}

func classifyStatus(status int) Kind {
	switch status {
	case 401, 403:
		return KindUnauthorized
	case 409:
		return KindConflict
	case 422:
		return KindValidation
	case 429:
		return KindRateLimited
	case 503:
		return KindUnavailable
	}
	if status >= 500 {
		return KindServer
	}
	return KindServer
}

// extractDetail mengambil field `detail` FastAPI (string atau daftar validasi).
func extractDetail(data []byte) string {
	var probe struct {
		Detail json.RawMessage `json:"detail"`
	}
	if err := json.Unmarshal(data, &probe); err != nil || probe.Detail == nil {
		return ""
	}
	var s string
	if err := json.Unmarshal(probe.Detail, &s); err == nil {
		return s
	}
	var items []struct {
		Msg string `json:"msg"`
	}
	if err := json.Unmarshal(probe.Detail, &items); err == nil && len(items) > 0 {
		msgs := make([]string, 0, len(items))
		for _, it := range items {
			msgs = append(msgs, it.Msg)
		}
		return strings.Join(msgs, "; ")
	}
	return ""
}

func isTimeout(err error) bool {
	var netErr net.Error
	if errors.As(err, &netErr) {
		return netErr.Timeout()
	}
	return false
}

// ---- Endpoint methods -----------------------------------------------------------

// Scan POST /api/scan/{kind}.
func (c *Client) Scan(ctx context.Context, kind, target string) (*models.ScanResponse, error) {
	var out models.ScanResponse
	err := c.do(ctx, http.MethodPost, "/api/scan/"+url.PathEscape(kind),
		models.ScanRequest{Target: target, Source: "discord"}, &out)
	if err != nil {
		return nil, err
	}
	return &out, nil
}

// News GET /api/news.
func (c *Client) News(ctx context.Context, q string, limit, offset int) (*models.NewsList, error) {
	params := url.Values{}
	params.Set("limit", strconv.Itoa(limit))
	if offset > 0 {
		params.Set("offset", strconv.Itoa(offset))
	}
	if q != "" {
		params.Set("q", q)
	}
	var out models.NewsList
	err := c.do(ctx, http.MethodGet, "/api/news?"+params.Encode(), nil, &out)
	if err != nil {
		return nil, err
	}
	out.QueryText = q
	return &out, nil
}

// RandomNews GET /api/news/random — sampel acak berita terverifikasi.
func (c *Client) RandomNews(ctx context.Context, limit int) (*models.NewsList, error) {
	params := url.Values{}
	params.Set("limit", strconv.Itoa(clamp(limit, 1, 20)))
	var out models.NewsList
	if err := c.do(ctx, http.MethodGet, "/api/news/random?"+params.Encode(), nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// CreateReport POST /api/reports.
func (c *Client) CreateReport(ctx context.Context, payload models.ReportCreate) (*models.ReportStatus, error) {
	var out models.ReportStatus
	err := c.do(ctx, http.MethodPost, "/api/reports", payload, &out)
	if err != nil {
		return nil, err
	}
	return &out, nil
}

// ReportStatus GET /api/reports/{id}?reporter_id=&platform=discord.
func (c *Client) ReportStatus(ctx context.Context, id, reporterID string) (*models.ReportStatus, error) {
	params := url.Values{}
	params.Set("reporter_id", reporterID)
	params.Set("platform", "discord")
	var out models.ReportStatus
	err := c.do(ctx, http.MethodGet, "/api/reports/"+url.PathEscape(id)+"?"+params.Encode(), nil, &out)
	if err != nil {
		return nil, err
	}
	return &out, nil
}

// GuildConfig GET /api/discord/config/{guild_id}.
func (c *Client) GuildConfig(ctx context.Context, guildID string) (*models.GuildConfig, error) {
	var out models.GuildConfig
	err := c.do(ctx, http.MethodGet, "/api/discord/config/"+url.PathEscape(guildID), nil, &out)
	if err != nil {
		return nil, err
	}
	return &out, nil
}

// PatchGuildConfig PATCH /api/discord/config/{guild_id}. Gunakan model patch eksplisit
// (map) agar null vs kosong bisa dibedakan.
func (c *Client) PatchGuildConfig(ctx context.Context, guildID string, patch map[string]any) (*models.GuildConfig, error) {
	var out models.GuildConfig
	err := c.do(ctx, http.MethodPatch, "/api/discord/config/"+url.PathEscape(guildID), patch, &out)
	if err != nil {
		return nil, err
	}
	return &out, nil
}

// Health GET /health — sengaja di luar /api agar juga mendeteksi backend yang
// hidup tapi routing /api rusak. Tidak butuh X-API-Key.
func (c *Client) Health(ctx context.Context) (*models.Health, error) {
	var out models.Health
	if err := c.do(ctx, http.MethodGet, "/health", nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// VerifiedThreats GET /api/threats?status=verified&source_type=scraped untuk polling alert.
func (c *Client) VerifiedThreats(ctx context.Context, limit int) (*models.ThreatList, error) {
	params := url.Values{}
	params.Set("status", "verified")
	params.Set("source_type", "scraped")
	params.Set("limit", strconv.Itoa(clamp(limit, 1, 100)))
	var out models.ThreatList
	err := c.do(ctx, http.MethodGet, "/api/threats?"+params.Encode(), nil, &out)
	if err != nil {
		return nil, err
	}
	return &out, nil
}

// AlertChannels GET /api/discord/alert-channels.
func (c *Client) AlertChannels(ctx context.Context) ([]models.GuildConfig, error) {
	var out []models.GuildConfig
	err := c.do(ctx, http.MethodGet, "/api/discord/alert-channels", nil, &out)
	if err != nil {
		return nil, err
	}
	return out, nil
}

// ---- Antrian pekerjaan dari panel admin (/api/discord/outbox) --------------------

// PendingBroadcast satu permintaan "kirim 5 berita acak" dari panel admin.
type PendingBroadcast struct {
	ID      int64  `json:"id"`
	GuildID string `json:"guild_id"`
}

// NewsChannels GET /api/discord/news-channels — guild beserta channel beritanya.
// Dipakai polling agar posting ke channel tujuan tanpa query per guild.
func (c *Client) NewsChannels(ctx context.Context) ([]models.GuildConfig, error) {
	var out []models.GuildConfig
	err := c.do(ctx, http.MethodGet, "/api/discord/news-channels", nil, &out)
	if err != nil {
		return nil, err
	}
	return out, nil
}

// ClaimBroadcast POST /api/discord/outbox/claim — ambil dan kunci job yang
// menunggu dibagikan ke channel berita. Antrian kosong = backend 204 (result nil).
func (c *Client) ClaimBroadcast(ctx context.Context) (*PendingBroadcast, error) {
	var out PendingBroadcast
	err := c.do(ctx, http.MethodPost, "/api/discord/outbox/claim", struct{}{}, &out)
	if err != nil {
		var apiErr *APIError
		// 404 dipertahankan untuk kompatibilitas backend lama.
		if errors.As(err, &apiErr) && apiErr.HTTPStatus == http.StatusNotFound {
			return nil, nil
		}
		return nil, err
	}
	if out.ID == 0 {
		return nil, nil
	}
	return &out, nil
}

// FinishBroadcast POST /api/discord/outbox/{id}/finish — tandai selesai/gagal.
// `errMsg` kosong = sukses.
func (c *Client) FinishBroadcast(ctx context.Context, id int64, errMsg string) error {
	path := "/api/discord/outbox/" + strconv.FormatInt(id, 10) + "/finish"
	return c.do(ctx, http.MethodPost, path, map[string]string{"error": errMsg}, nil)
}

func clamp(v, lo, hi int) int {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}
