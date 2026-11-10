// Package models menampung kontrak JSON backend Red John. Nama field mengikuti
// respons FastAPI apa adanya; jangan mengarang nilai yang tidak dikirim backend.
package models

// ---- /api/scan, /api/check ----------------------------------------------------

// Flag adalah satu tanda bahaya hasil engine.
type Flag struct {
	ID          string  `json:"id"`
	Title       string  `json:"title"`
	Severity    string  `json:"severity"` // tinggi | sedang | rendah
	Status      string  `json:"status"`   // hit | partial
	Evidence    *string `json:"evidence"`
	Explanation string  `json:"explanation"`
	Advice      string  `json:"advice"`
	Note        *string `json:"note"`
}

// MLInfo hasil model (null bila artefak ML tidak termuat).
type MLInfo struct {
	FraudProbability float64     `json:"fraud_probability"`
	ModelVersion     string      `json:"model_version"`
	TopFeatures      []MLFeature `json:"top_features"`
}

type MLFeature struct {
	Feature string  `json:"feature"`
	Weight  float64 `json:"weight"`
}

// Assessment kontrak /api/check.
type Assessment struct {
	RiskLevel            string   `json:"risk_level"` // low | medium | high
	Score                int      `json:"score"`
	RuleScore            float64  `json:"rule_score"`
	MLScore              *float64 `json:"ml_score"`
	Flags                []Flag   `json:"flags"`
	ML                   *MLInfo  `json:"ml"`
	RecommendedScenarios []string `json:"recommended_scenarios"`
	Disclaimer           string   `json:"disclaimer"`
}

// ScanResponse kontrak POST /api/scan/{kind}.
type ScanResponse struct {
	Kind       string     `json:"kind"`
	Target     string     `json:"target"`
	Source     string     `json:"source"`
	Assessment Assessment `json:"assessment"`
}

// ScanRequest kontrak POST /api/scan/{kind}.
type ScanRequest struct {
	Target string `json:"target"`
	Source string `json:"source"`
}

// ---- /health -------------------------------------------------------------------

// Health kontrak GET /health. Tidak butuh X-API-Key — dipakai /ping untuk cek
// backend benar-benar hidup (bukan sekadar feed kosong).
type Health struct {
	Status       string  `json:"status"` // ok | degraded
	MLLoaded     bool    `json:"ml_loaded"`
	ModelVersion *string `json:"model_version"`
}

// ---- /api/news -----------------------------------------------------------------

type NewsItem struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	URL         *string  `json:"url"`
	Source      string   `json:"source"`
	PublishedAt *string  `json:"published_at"`
	Snippet     string   `json:"snippet"`
	Categories  []string `json:"categories"`
	ImageURL    *string  `json:"image_url"`
}

type NewsList struct {
	Items      []NewsItem `json:"items"`
	Total      int        `json:"total"`
	Limit      int        `json:"limit"`
	Offset     int        `json:"offset"`
	UpdatedAt  *string    `json:"updated_at"`
	Configured bool       `json:"configured"`

	// Query kata kunci pencarian yang dipakai untuk respons ini — diisi klien
	// (bukan dari JSON) agar embed bisa menjelaskan hasil kosong.
	QueryText string `json:"-"`
}

// HasQuery true bila daftar berita berasal dari pencarian.
func (l *NewsList) HasQuery() bool { return l.QueryText != "" }

// Query kata kunci pencarian (aman bila nil).
func (l *NewsList) Query() string { return l.QueryText }

// ---- /api/reports ---------------------------------------------------------------

type Reporter struct {
	Platform string `json:"platform"` // discord | web
	ID       string `json:"id"`
	Name     string `json:"name,omitempty"`
}

type ReportCreate struct {
	Category    string   `json:"category"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Target      string   `json:"target,omitempty"`
	Reporter    Reporter `json:"reporter"`
}

type ReportStatus struct {
	ID        string  `json:"id"`
	Category  string  `json:"category"`
	Status    string  `json:"status"` // pending | verified | rejected
	CreatedAt *string `json:"created_at"`
	UpdatedAt *string `json:"updated_at"`
}

// ---- /api/discord/config --------------------------------------------------------

type GuildConfig struct {
	GuildID                string   `json:"guild_id"`
	AlertChannelID         *string  `json:"alert_channel_id"`
	NewsChannelID          *string  `json:"news_channel_id"`
	ProtectionEnabled      bool     `json:"protection_enabled"`
	NotificationCategories []string `json:"notification_categories"`
	UpdatedAt              *string  `json:"updated_at"`
}

// GuildConfigUpdate PATCH parsial; nil = tidak dikirim.
type GuildConfigUpdate struct {
	AlertChannelID         *string   `json:"alert_channel_id,omitempty"`
	NewsChannelID          *string   `json:"news_channel_id,omitempty"`
	ProtectionEnabled      *bool     `json:"protection_enabled,omitempty"`
	NotificationCategories *[]string `json:"notification_categories,omitempty"`
}

// ---- /api/threats (polling alert) -----------------------------------------------

type Indicator struct {
	Type  string `json:"type"`
	Value string `json:"value"`
}

type Threat struct {
	ID                string      `json:"id"`
	Title             string      `json:"title"`
	Category          string      `json:"category"`
	ScammerIndicators []Indicator `json:"scammer_indicators"`
	SourceURL         *string     `json:"source_url"`
	SourceMedia       string      `json:"source_media"`
	Status            string      `json:"status"`
	CreatedAt         *string     `json:"created_at"`
	UpdatedAt         *string     `json:"updated_at"`
}

type ThreatList struct {
	Items      []Threat `json:"items"`
	Total      int      `json:"total"`
	Limit      int      `json:"limit"`
	Offset     int      `json:"offset"`
	Configured bool     `json:"configured"`
}

// ---- payload job `leaderboard` (dirakit backend dari quiz_daily_scores) ----------

// LeaderboardEntry satu baris papan peringkat kuis harian.
type LeaderboardEntry struct {
	Rank   int    `json:"rank"`
	Name   string `json:"name"`
	Points int    `json:"points"`
	Solved int    `json:"solved"`
}

// QuizLeaderboard papan peringkat satu periode kuis (jendela 21:00 WIB).
type QuizLeaderboard struct {
	Day     string             `json:"day"`
	Label   string             `json:"label"`
	Entries []LeaderboardEntry `json:"entries"`
}
