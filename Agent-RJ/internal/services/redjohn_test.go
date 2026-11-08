package services

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/r3nddy/Red-John/Agent-RJ/internal/models"
)

func newTestClient(t *testing.T, handler http.HandlerFunc) (*Client, *httptest.Server) {
	t.Helper()
	srv := httptest.NewServer(handler)
	t.Cleanup(srv.Close)
	return NewClient(srv.URL, "test-key", 5*time.Second), srv
}

func TestScanSuccess(t *testing.T) {
	client, _ := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.URL.Path != "/api/scan/url" {
			t.Errorf("unexpected request %s %s", r.Method, r.URL.Path)
		}
		if r.Header.Get("X-API-Key") != "test-key" {
			t.Errorf("X-API-Key tidak diteruskan")
		}
		var body map[string]string
		_ = json.NewDecoder(r.Body).Decode(&body)
		if body["target"] != "https://contoh.xyz" || body["source"] != "discord" {
			t.Errorf("body salah: %v", body)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"kind":"url","target":"https://contoh.xyz","source":"discord","assessment":{"risk_level":"high","score":90,"flags":[],"disclaimer":"x"}}`))
	})
	resp, err := client.Scan(context.Background(), "url", "https://contoh.xyz")
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if resp.Assessment.RiskLevel != "high" || resp.Assessment.Score != 90 {
		t.Errorf("assessment salah: %+v", resp.Assessment)
	}
}

func TestErrorClassification(t *testing.T) {
	cases := []struct {
		status int
		kind   Kind
	}{
		{401, KindUnauthorized}, {409, KindConflict}, {422, KindValidation},
		{429, KindRateLimited}, {503, KindUnavailable}, {500, KindServer},
	}
	for _, tc := range cases {
		client, _ := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(tc.status)
			_, _ = w.Write([]byte(`{"detail":"kesalahan"}`))
		})
		_, err := client.Scan(context.Background(), "text", "abc")
		var apiErr *APIError
		if !errors.As(err, &apiErr) {
			t.Fatalf("status %d: bukan APIError: %v", tc.status, err)
		}
		if apiErr.Kind != tc.kind {
			t.Errorf("status %d: kind = %v, mau %v", tc.status, apiErr.Kind, tc.kind)
		}
		if apiErr.Detail != "kesalahan" {
			t.Errorf("detail = %q", apiErr.Detail)
		}
	}
}

func TestValidationDetailList(t *testing.T) {
	client, _ := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(422)
		_, _ = w.Write([]byte(`{"detail":[{"msg":"field wajib"}]}`))
	})
	_, err := client.Scan(context.Background(), "text", "abc")
	var apiErr *APIError
	if !errors.As(err, &apiErr) || apiErr.Detail != "field wajib" {
		t.Fatalf("detail list tidak diekstrak: %v", err)
	}
}

func TestNetworkError(t *testing.T) {
	// Server yang langsung ditutup — koneksi gagal.
	client, srv := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {})
	srv.Close()
	_, err := client.News(context.Background(), "", 1, 0)
	var apiErr *APIError
	if !errors.As(err, &apiErr) || apiErr.Kind != KindNetwork {
		t.Fatalf("mau KindNetwork, dapat: %v", err)
	}
}

func TestTimeout(t *testing.T) {
	client, _ := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(200 * time.Millisecond)
	})
	client.http.Timeout = 30 * time.Millisecond
	_, err := client.News(context.Background(), "", 1, 0)
	var apiErr *APIError
	if !errors.As(err, &apiErr) || apiErr.Kind != KindNetwork {
		t.Fatalf("mau KindNetwork timeout, dapat: %v", err)
	}
}

func TestMalformedJSON(t *testing.T) {
	client, _ := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{bukan json`))
	})
	_, err := client.News(context.Background(), "", 1, 0)
	var apiErr *APIError
	if !errors.As(err, &apiErr) || apiErr.Kind != KindServer {
		t.Fatalf("mau KindServer untuk JSON rusak, dapat: %v", err)
	}
}

func TestCreateReportAndStatus(t *testing.T) {
	client, _ := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/reports":
			if r.Method != http.MethodPost {
				t.Errorf("mau POST, dapat %s", r.Method)
			}
			_, _ = w.Write([]byte(`{"id":"abc123def456","category":"phishing_link","status":"pending","created_at":"2026-01-01T00:00:00Z","updated_at":"2026-01-01T00:00:00Z"}`))
		case "/api/reports/abc123def456":
			if r.URL.Query().Get("reporter_id") != "user1" || r.URL.Query().Get("platform") != "discord" {
				t.Errorf("query salah: %v", r.URL.RawQuery)
			}
			_, _ = w.Write([]byte(`{"id":"abc123def456","category":"phishing_link","status":"verified","created_at":"2026-01-01T00:00:00Z","updated_at":"2026-01-01T00:00:00Z"}`))
		default:
			t.Errorf("path tak dikenal %s", r.URL.Path)
		}
	})
	st, err := client.CreateReport(context.Background(), models.ReportCreate{
		Category:    "phishing_link",
		Title:       "Laporan Discord: phishing_link — contoh",
		Description: "kejadian",
		Target:      "https://contoh.xyz",
		Reporter:    models.Reporter{Platform: "discord", ID: "user1", Name: "budi"},
	})
	if err != nil || st.Status != "pending" {
		t.Fatalf("create: %v %+v", err, st)
	}
	st, err = client.ReportStatus(context.Background(), "abc123def456", "user1")
	if err != nil || st.Status != "verified" {
		t.Fatalf("status: %v %+v", err, st)
	}
}

func TestPatchGuildConfig(t *testing.T) {
	client, _ := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPatch || r.URL.Path != "/api/discord/config/123" {
			t.Errorf("request salah: %s %s", r.Method, r.URL.Path)
		}
		var patch map[string]any
		_ = json.NewDecoder(r.Body).Decode(&patch)
		if _, ok := patch["alert_channel_id"]; !ok {
			t.Errorf("patch salah: %v", patch)
		}
		_, _ = w.Write([]byte(`{"guild_id":"123","alert_channel_id":"456","protection_enabled":true,"notification_categories":[],"updated_at":"2026-01-01T00:00:00Z"}`))
	})
	cfg, err := client.PatchGuildConfig(context.Background(), "123", map[string]any{"alert_channel_id": "456"})
	if err != nil || cfg.AlertChannelID == nil || *cfg.AlertChannelID != "456" {
		t.Fatalf("patch: %v %+v", err, cfg)
	}
}
