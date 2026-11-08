package services

import (
	"sync"
	"time"
)

// RateLimiter token bucket sederhana per pengguna. In-memory: cukup untuk satu
// instance bot; multi-replica perlu store bersama (catatan README).
type RateLimiter struct {
	mu      sync.Mutex
	buckets map[string]*bucket
	limit   int
	window  time.Duration
}

type bucket struct {
	tokens float64
	last   time.Time
}

// NewRateLimiter: `limit` kejadian per `window` untuk tiap kunci.
func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		buckets: make(map[string]*bucket),
		limit:   limit,
		window:  window,
	}
}

// Allow mengambil satu token. Kunci disarankan `<kind>:<userID>`.
func (r *RateLimiter) Allow(key string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()

	now := time.Now()
	b, ok := r.buckets[key]
	if !ok {
		r.buckets[key] = &bucket{tokens: float64(r.limit) - 1, last: now}
		return true
	}

	elapsed := now.Sub(b.last).Seconds()
	rate := float64(r.limit) / r.window.Seconds()
	b.tokens = min(float64(r.limit), b.tokens+elapsed*rate)
	b.last = now

	if b.tokens < 1 {
		return false
	}
	b.tokens--
	return true
}

// RetryAfter perkiraan waktu tunggu (min. 1 detik) — untuk pesan pengguna.
func (r *RateLimiter) RetryAfter(key string) time.Duration {
	r.mu.Lock()
	defer r.mu.Unlock()
	b, ok := r.buckets[key]
	if !ok || b.tokens >= 1 {
		return time.Second
	}
	need := 1 - b.tokens
	rate := float64(r.limit) / r.window.Seconds()
	return max(time.Second, time.Duration(need/rate*float64(time.Second)))
}
