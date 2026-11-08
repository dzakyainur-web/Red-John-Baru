package services

import (
	"testing"
	"time"
)

func TestRateLimiterAllow(t *testing.T) {
	rl := NewRateLimiter(2, time.Minute)
	if !rl.Allow("u1") || !rl.Allow("u1") {
		t.Fatal("dua request pertama harus lolos")
	}
	if rl.Allow("u1") {
		t.Fatal("request ketiga harus diblokir")
	}
	if !rl.Allow("u2") {
		t.Fatal("user lain tidak boleh terpengaruh")
	}
}

func TestRateLimiterRefill(t *testing.T) {
	rl := NewRateLimiter(1, 30*time.Millisecond)
	if !rl.Allow("u1") {
		t.Fatal("pertama harus lolos")
	}
	if rl.Allow("u1") {
		t.Fatal("kedua harus diblokir")
	}
	time.Sleep(50 * time.Millisecond)
	if !rl.Allow("u1") {
		t.Fatal("setelah window, token harus terisi ulang")
	}
}

func TestRateLimiterSweepIdleBuckets(t *testing.T) {
	rl := NewRateLimiter(1, 20*time.Millisecond)
	for i := 0; i < 50; i++ {
		_ = rl.Allow("user" + string(rune('a'+i%26)) + string(rune('0'+i/26)))
	}
	before := rl.size()
	time.Sleep(30 * time.Millisecond)
	_ = rl.Allow("fresh-user") // memicu sweep
	if after := rl.size(); after >= before {
		t.Fatalf("bucket idle harus dibuang: sebelum %d, sesudah %d", before, after)
	}
	if !rl.Allow("fresh-user-2") {
		t.Fatal("user baru tetap harus lolos setelah sweep")
	}
}

func TestRetryAfter(t *testing.T) {
	rl := NewRateLimiter(1, time.Minute)
	_ = rl.Allow("u1")
	if rl.RetryAfter("u1") <= 0 {
		t.Fatal("retry setelah diblokir harus positif")
	}
	// Untuk user yang belum pernah request, Allow tetap true — tidak ada wait.
	if !rl.Allow("u9") {
		t.Fatal("user baru harus lolos")
	}
}
