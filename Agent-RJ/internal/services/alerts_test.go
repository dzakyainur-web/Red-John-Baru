package services

import (
	"context"
	"log/slog"
	"testing"
	"time"

	"github.com/r3nddy/Red-John/Agent-RJ/internal/models"
)

func TestAlertPollerPrimeThenDeliver(t *testing.T) {
	items := []models.Threat{
		{ID: "old-1", Category: "phishing_link", Title: "lama"},
		{ID: "new-1", Category: "phishing_link", Title: "baru"},
	}
	srv := newThreatServer(t, items)
	client := NewClient(srv.URL, "k", 5*time.Second)

	delivered := make(chan string, 10)
	poller := NewAlertPoller(client, 20*time.Millisecond, slog.Default())
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go poller.Run(ctx, func(_ context.Context, th models.Threat) {
		delivered <- th.ID
	})

	// Fase prime: halaman pertama tidak dikirim.
	select {
	case id := <-delivered:
		t.Fatalf("prime tidak boleh mengirim alert: %s", id)
	case <-time.After(60 * time.Millisecond):
	}

	// Tambah ancaman baru; poll berikutnya harus meneruskannya.
	items = append(items, models.Threat{ID: "new-2", Category: "malware_apk", Title: "baru lagi"})
	setThreatItems(srv, items)

	select {
	case id := <-delivered:
		if id != "new-2" {
			t.Fatalf("alert salah: %s", id)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("alert baru tidak terkirim")
	}
}

func TestAlertPollerNoDuplicate(t *testing.T) {
	srv := newThreatServer(t, []models.Threat{{ID: "x", Category: "phishing_link", Title: "a"}})
	client := NewClient(srv.URL, "k", 5*time.Second)

	count := make(chan string, 10)
	poller := NewAlertPoller(client, 20*time.Millisecond, slog.Default())
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go poller.Run(ctx, func(_ context.Context, th models.Threat) {
		count <- th.ID
	})

	// Seed satu alert, lalu pastikan tidak ada duplikat dalam 150ms.
	<-time.After(60 * time.Millisecond)
	setThreatItems(srv, []models.Threat{{ID: "x", Category: "phishing_link", Title: "a"}})

	select {
	case <-count:
		// alert pertama (dari ancaman yang muncul setelah prime) — ok
	case <-time.After(100 * time.Millisecond):
	}
	select {
	case id := <-count:
		t.Fatalf("duplikat terkirim: %s", id)
	case <-time.After(150 * time.Millisecond):
	}
}
