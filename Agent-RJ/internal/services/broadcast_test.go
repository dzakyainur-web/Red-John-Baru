package services

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"sync"
	"testing"
	"time"

	"github.com/r3nddy/Red-John/Agent-RJ/internal/models"
)

// fakeOutbox: antrian job + catatan finish, tanpa jaringan nyata.
type fakeOutbox struct {
	mu      sync.Mutex
	jobs    []PendingBroadcast
	finish  map[int64]string
	failFin bool
}

func (f *fakeOutbox) handler(t *testing.T) http.HandlerFunc {
	t.Helper()
	return func(w http.ResponseWriter, r *http.Request) {
		f.mu.Lock()
		defer f.mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		switch {
		case r.URL.Path == "/api/discord/outbox/claim" && r.Method == http.MethodPost:
			if len(f.jobs) == 0 {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			job := f.jobs[0]
			f.jobs = f.jobs[1:]
			_ = json.NewEncoder(w).Encode(job)
		case r.URL.Path == "/api/discord/outbox/claim":
			t.Errorf("claim harus POST, dapat %s", r.Method)
		case r.URL.Path == "/api/discord/news-channels":
			_, _ = w.Write([]byte(`[{"guild_id":"g1","alert_channel_id":"A1","news_channel_id":"N1","protection_enabled":true,"notification_categories":[]},
				{"guild_id":"g2","alert_channel_id":"A2","news_channel_id":null,"protection_enabled":true,"notification_categories":[]},
				{"guild_id":"g3","alert_channel_id":null,"news_channel_id":null,"protection_enabled":true,"notification_categories":[]}]`))
		case r.URL.Path == "/api/news/random":
			_, _ = w.Write([]byte(`{"items":[{"id":"n1","title":"Judul","source":"detik"},{"id":"n2","title":"Judul 2"}],"total":2,"configured":true}`))
		case len(r.URL.Path) > len("/api/discord/outbox/") && r.URL.Path[len(r.URL.Path)-len("/finish"):] == "/finish":
			var body map[string]string
			_ = json.NewDecoder(r.Body).Decode(&body)
			var id int64
			for _, c := range r.URL.Path[len("/api/discord/outbox/") : len(r.URL.Path)-len("/finish")] {
				id = id*10 + int64(c-'0')
			}
			f.finish[id] = body["error"]
			_, _ = w.Write([]byte(`{}`))
		default:
			t.Errorf("endpoint tak terduga: %s %s", r.Method, r.URL.Path)
			w.WriteHeader(http.StatusNotFound)
		}
	}
}

func newBroadcaster(t *testing.T, ob *fakeOutbox, post func(context.Context, string, []models.NewsItem) error) *Broadcaster {
	t.Helper()
	return newBroadcasterWith(t, ob, post, nil)
}

func newBroadcasterWith(
	t *testing.T,
	ob *fakeOutbox,
	post func(context.Context, string, []models.NewsItem) error,
	postLeaderboard func(context.Context, string, *models.QuizLeaderboard) error,
) *Broadcaster {
	t.Helper()
	client, _ := newTestClient(t, ob.handler(t))
	return NewBroadcaster(client, time.Second, post, postLeaderboard)
}

func TestBroadcasterPostsToNewsChannel(t *testing.T) {
	ob := &fakeOutbox{finish: map[int64]string{}, jobs: []PendingBroadcast{{ID: 7, GuildID: "g1"}}}
	var gotChannel string
	var gotItems int
	b := newBroadcaster(t, ob, func(_ context.Context, ch string, items []models.NewsItem) error {
		gotChannel, gotItems = ch, len(items)
		return nil
	})
	b.tick(context.Background())

	if gotChannel != "N1" {
		t.Errorf("channel = %q, mau N1 (news_channel_id)", gotChannel)
	}
	if gotItems != 2 {
		t.Errorf("items = %d", gotItems)
	}
	if msg, ok := ob.finish[7]; !ok || msg != "" {
		t.Errorf("job harus ditandai sukses, dapat %q (ada=%v)", msg, ok)
	}
}

func TestBroadcasterFallbackKeChannelAlert(t *testing.T) {
	ob := &fakeOutbox{finish: map[int64]string{}, jobs: []PendingBroadcast{{ID: 1, GuildID: "g2"}}}
	var got string
	b := newBroadcaster(t, ob, func(_ context.Context, ch string, _ []models.NewsItem) error {
		got = ch
		return nil
	})
	b.tick(context.Background())
	if got != "A2" {
		t.Errorf("fallback channel = %q, mau A2", got)
	}
}

func TestBroadcasterTanpaChannelMelaporkanError(t *testing.T) {
	ob := &fakeOutbox{finish: map[int64]string{}, jobs: []PendingBroadcast{{ID: 3, GuildID: "g3"}}}
	posted := false
	b := newBroadcaster(t, ob, func(_ context.Context, _ string, _ []models.NewsItem) error {
		posted = true
		return nil
	})
	b.tick(context.Background())
	if posted {
		t.Error("tidak boleh posting tanpa channel")
	}
	if msg := ob.finish[3]; msg == "" {
		t.Error("kegagalan harus dilaporkan ke backend")
	}
}

func TestBroadcasterGagalKirimDilaporkan(t *testing.T) {
	ob := &fakeOutbox{finish: map[int64]string{}, jobs: []PendingBroadcast{{ID: 4, GuildID: "g1"}}}
	b := newBroadcaster(t, ob, func(context.Context, string, []models.NewsItem) error {
		return errors.New("Missing Permissions")
	})
	b.tick(context.Background())
	if msg := ob.finish[4]; msg == "" {
		t.Error("error kirim Discord harus diteruskan ke backend")
	}
}

func TestClaimBroadcastKosong204Dan404(t *testing.T) {
	// 204 = antrian kosong (backend sekarang); 404 = backend lama.
	for _, status := range []int{http.StatusNoContent, http.StatusNotFound} {
		client, _ := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(status)
		})
		job, err := client.ClaimBroadcast(context.Background())
		if err != nil || job != nil {
			t.Errorf("status %d: job=%v err=%v, mau nil,nil", status, job, err)
		}
	}
}

func TestBroadcasterAntrianKosong(t *testing.T) {
	ob := &fakeOutbox{finish: map[int64]string{}}
	b := newBroadcaster(t, ob, func(context.Context, string, []models.NewsItem) error { return nil })
	b.tick(context.Background())
	if len(ob.finish) != 0 {
		t.Errorf("tidak ada job -> tidak ada finish: %v", ob.finish)
	}
}

func TestBroadcasterLeaderboardDikirimTanpaBerita(t *testing.T) {
	payload := `{"day":"2026-11-10","label":"10 Nov 21:00 → 11 Nov 21:00 WIB","entries":[{"rank":1,"name":"Budi","points":350,"solved":10}]}`
	ob := &fakeOutbox{finish: map[int64]string{}, jobs: []PendingBroadcast{{
		ID: 8, GuildID: "g1", Kind: KindLeaderboard, Payload: []byte(payload),
	}}}
	var gotChannel string
	var got *models.QuizLeaderboard
	b := newBroadcasterWith(t, ob,
		func(context.Context, string, []models.NewsItem) error {
			t.Error("job leaderboard tidak boleh mengambil berita acak")
			return nil
		},
		func(_ context.Context, ch string, lb *models.QuizLeaderboard) error {
			gotChannel, got = ch, lb
			return nil
		})
	b.tick(context.Background())

	if gotChannel != "N1" {
		t.Errorf("channel = %q, mau N1", gotChannel)
	}
	if got == nil || len(got.Entries) != 1 || got.Entries[0].Name != "Budi" || got.Entries[0].Points != 350 {
		t.Errorf("payload leaderboard salah: %+v", got)
	}
	if msg, ok := ob.finish[8]; !ok || msg != "" {
		t.Errorf("job harus ditandai sukses, dapat %q (ada=%v)", msg, ok)
	}
}

func TestBroadcasterClaimRusakTidakPosting(t *testing.T) {
	handler := func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/api/discord/outbox/claim":
			// JSON tidak valid di payload: RawMessage menolak, decode klaim gagal.
			_, _ = w.Write([]byte(`{"id":9,"guild_id":"g1","kind":"leaderboard","payload":{`))
		case "/api/discord/news-channels":
			_, _ = w.Write([]byte(`[{"guild_id":"g1","news_channel_id":"N1"}]`))
		default:
			t.Errorf("endpoint tak terduga: %s %s", r.Method, r.URL.Path)
		}
	}
	client, _ := newTestClient(t, handler)
	b := NewBroadcaster(client, time.Second,
		func(context.Context, string, []models.NewsItem) error {
			t.Error("payload rusak tidak boleh jatuh ke jalur berita")
			return nil
		},
		func(context.Context, string, *models.QuizLeaderboard) error {
			t.Error("payload rusak tidak boleh diposting")
			return nil
		})
	b.tick(context.Background())
}

func TestBroadcasterKindTakDikenalTidakFallbackKeBerita(t *testing.T) {
	ob := &fakeOutbox{finish: map[int64]string{}, jobs: []PendingBroadcast{{
		ID: 11, GuildID: "g1", Kind: "sesuatu_baru",
	}}}
	b := newBroadcasterWith(t, ob,
		func(context.Context, string, []models.NewsItem) error {
			t.Error("kind tak dikenal tidak boleh jatuh ke jalur berita")
			return nil
		},
		func(context.Context, string, *models.QuizLeaderboard) error {
			t.Error("kind tak dikenal tidak boleh diposting sebagai leaderboard")
			return nil
		})
	b.tick(context.Background())
	if msg := ob.finish[11]; msg == "" {
		t.Error("kind tak dikenal harus dilaporkan ke backend")
	}
}
