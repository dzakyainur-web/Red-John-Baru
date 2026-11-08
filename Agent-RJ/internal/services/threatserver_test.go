package services

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"github.com/r3nddy/Red-John/Agent-RJ/internal/models"
)

// helper server threats yang isinya bisa diganti saat test berjalan.
type threatServer struct {
	*httptest.Server
	mu    sync.Mutex
	items []models.Threat
}

func newThreatServer(t *testing.T, items []models.Threat) *threatServer {
	t.Helper()
	ts := &threatServer{items: items}
	ts.Server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ts.mu.Lock()
		defer ts.mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(models.ThreatList{
			Items: ts.items,
			Total: len(ts.items),
		})
	}))
	t.Cleanup(ts.Close)
	return ts
}

func (ts *threatServer) setItems(items []models.Threat) {
	ts.mu.Lock()
	defer ts.mu.Unlock()
	ts.items = items
}

func setThreatItems(ts *threatServer, items []models.Threat) {
	ts.setItems(items)
}

func TestThreatServerHelper(t *testing.T) {
	ts := newThreatServer(t, []models.Threat{{ID: "a"}})
	defer ts.Close()
	setThreatItems(ts, []models.Threat{{ID: "b"}, {ID: "c"}})
	client := NewClient(ts.URL, "k", time.Second)
	list, err := client.VerifiedThreats(context.Background(), 20)
	if err != nil {
		t.Fatalf("err: %v", err)
	}
	if len(list.Items) != 2 {
		t.Fatalf("mau 2 item, dapat %d", len(list.Items))
	}
}
