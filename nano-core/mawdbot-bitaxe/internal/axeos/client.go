// Package axeos provides a pure Go client for the Bitaxe AxeOS REST API.
// Zero dependencies beyond net/http. Designed for sub-10MB MawdBot Go binary.
package axeos

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"
)

// ───────────────────────────── Types ─────────────────────────────

// SystemInfo represents the full /api/system/info response
type SystemInfo struct {
	Power           float64 `json:"power"`
	Voltage         float64 `json:"voltage"`
	Current         float64 `json:"current"`
	Temp            float64 `json:"temp"`
	VrTemp          float64 `json:"vrTemp"`
	HashRate        float64 `json:"hashRate"`
	BestDiff        string  `json:"bestDiff"`
	BestSessionDiff string  `json:"bestSessionDiff"`
	FreeHeap        int     `json:"freeHeap"`
	CoreVoltage     int     `json:"coreVoltage"`
	CoreVoltageActual int  `json:"coreVoltageActual"`
	Frequency       int     `json:"frequency"`
	SSid            string  `json:"ssid"`
	MacAddr         string  `json:"macAddr"`
	Hostname        string  `json:"hostname"`
	WifiStatus      string  `json:"wifiStatus"`
	SharesAccepted  int     `json:"sharesAccepted"`
	SharesRejected  int     `json:"sharesRejected"`
	UptimeSeconds   int     `json:"uptimeSeconds"`
	ASICModel       string  `json:"ASICModel"`
	StratumURL      string  `json:"stratumURL"`
	StratumPort     int     `json:"stratumPort"`
	StratumUser     string  `json:"stratumUser"`
	Version         string  `json:"version"`
	BoardVersion    string  `json:"boardVersion"`
	RunningPartition string `json:"runningPartition"`
	FlipScreen      int     `json:"flipScreen"`
	OverheatMode    int     `json:"overheat_mode"`
	FanSpeed        int     `json:"fanspeed"`
	FanRPM          int     `json:"fanrpm"`
}

// DashboardStats represents /api/system/statistics/dashboard
type DashboardStats struct {
	HashRate       float64 `json:"hashRate"`
	BestDiff       string  `json:"bestDiff"`
	SharesAccepted int     `json:"sharesAccepted"`
	SharesRejected int     `json:"sharesRejected"`
	Temp           float64 `json:"temp"`
	Power          float64 `json:"power"`
	UptimeSeconds  int     `json:"uptimeSeconds"`
}

// PatchSettings represents settable fields via PATCH /api/system
type PatchSettings struct {
	StratumURL  *string  `json:"stratumURL,omitempty"`
	StratumPort *int     `json:"stratumPort,omitempty"`
	StratumUser *string  `json:"stratumUser,omitempty"`
	StratumPass *string  `json:"stratumPassword,omitempty"`
	Hostname    *string  `json:"hostname,omitempty"`
	SSid        *string  `json:"ssid,omitempty"`
	WifiPass    *string  `json:"wifiPass,omitempty"`
	CoreVoltage *int     `json:"coreVoltage,omitempty"`
	Frequency   *int     `json:"frequency,omitempty"`
	FanSpeed    *int     `json:"fanspeed,omitempty"`
	FlipScreen  *int     `json:"flipScreen,omitempty"`
}

// DeviceHealth is a derived health assessment
type DeviceHealth struct {
	Status      string  `json:"status"` // "healthy", "warning", "critical", "offline"
	Temp        float64 `json:"temp"`
	HashRate    float64 `json:"hashRate"`
	Efficiency  float64 `json:"efficiency"` // GH/J
	ShareRatio  float64 `json:"shareRatio"` // accepted / total
	UptimeHours float64 `json:"uptimeHours"`
	LastSeen    time.Time `json:"lastSeen"`
}

// ───────────────────────────── Client ─────────────────────────────

// Client talks to a single Bitaxe device over its local AxeOS API
type Client struct {
	baseURL    string
	httpClient *http.Client
	mu         sync.RWMutex
	lastInfo   *SystemInfo
	lastSeen   time.Time
	health     DeviceHealth
}

// NewClient creates an AxeOS client for a Bitaxe at the given IP
func NewClient(ip string) *Client {
	base := ip
	if !strings.HasPrefix(base, "http") {
		base = "http://" + base
	}
	base = strings.TrimSuffix(base, "/")

	return &Client{
		baseURL: base,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

// ───────────────────────── API Methods ────────────────────────────

// GetInfo fetches full system info from the Bitaxe
func (c *Client) GetInfo(ctx context.Context) (*SystemInfo, error) {
	var info SystemInfo
	if err := c.get(ctx, "/api/system/info", &info); err != nil {
		return nil, fmt.Errorf("get info: %w", err)
	}
	c.mu.Lock()
	c.lastInfo = &info
	c.lastSeen = time.Now()
	c.health = c.deriveHealth(&info)
	c.mu.Unlock()
	return &info, nil
}

// GetDashboard fetches dashboard statistics
func (c *Client) GetDashboard(ctx context.Context) (*DashboardStats, error) {
	var stats DashboardStats
	if err := c.get(ctx, "/api/system/statistics/dashboard", &stats); err != nil {
		return nil, fmt.Errorf("get dashboard: %w", err)
	}
	return &stats, nil
}

// GetASIC fetches ASIC-specific settings
func (c *Client) GetASIC(ctx context.Context) (map[string]interface{}, error) {
	var result map[string]interface{}
	if err := c.get(ctx, "/api/system/asic", &result); err != nil {
		return nil, fmt.Errorf("get asic: %w", err)
	}
	return result, nil
}

// UpdateSettings patches device settings
func (c *Client) UpdateSettings(ctx context.Context, settings PatchSettings) error {
	return c.patch(ctx, "/api/system", settings)
}

// Restart triggers a device restart
func (c *Client) Restart(ctx context.Context) error {
	return c.post(ctx, "/api/system/restart", nil)
}

// Identify makes the device blink/beep for physical identification
func (c *Client) Identify(ctx context.Context) error {
	return c.post(ctx, "/api/system/identify", nil)
}

// Health returns the derived health assessment (cached from last poll)
func (c *Client) Health() DeviceHealth {
	c.mu.RLock()
	defer c.mu.RUnlock()
	// If we haven't seen it in 60s, mark offline
	if time.Since(c.lastSeen) > 60*time.Second {
		return DeviceHealth{Status: "offline", LastSeen: c.lastSeen}
	}
	return c.health
}

// SetOverclock sets frequency and core voltage (requires El Mirage heatsink!)
func (c *Client) SetOverclock(ctx context.Context, freqMHz int, coreVoltageMV int) error {
	settings := PatchSettings{
		Frequency:   &freqMHz,
		CoreVoltage: &coreVoltageMV,
	}
	if err := c.UpdateSettings(ctx, settings); err != nil {
		return fmt.Errorf("set overclock: %w", err)
	}
	// Overclock changes require restart
	return c.Restart(ctx)
}

// SetPool configures the mining pool
func (c *Client) SetPool(ctx context.Context, url string, port int, user string, pass string) error {
	settings := PatchSettings{
		StratumURL:  &url,
		StratumPort: &port,
		StratumUser: &user,
		StratumPass: &pass,
	}
	return c.UpdateSettings(ctx, settings)
}

// SetFanSpeed sets fan speed (0-100)
func (c *Client) SetFanSpeed(ctx context.Context, speed int) error {
	settings := PatchSettings{FanSpeed: &speed}
	return c.UpdateSettings(ctx, settings)
}

// ───────────────────────── Health Logic ──────────────────────────

func (c *Client) deriveHealth(info *SystemInfo) DeviceHealth {
	total := info.SharesAccepted + info.SharesRejected
	var shareRatio float64
	if total > 0 {
		shareRatio = float64(info.SharesAccepted) / float64(total)
	}

	var efficiency float64
	if info.Power > 0 {
		efficiency = info.HashRate / info.Power // GH/J approximation
	}

	status := "healthy"
	switch {
	case info.Temp > 75:
		status = "critical"
	case info.Temp > 65:
		status = "warning"
	case info.HashRate == 0:
		status = "critical"
	case shareRatio < 0.95 && total > 10:
		status = "warning"
	}

	return DeviceHealth{
		Status:      status,
		Temp:        info.Temp,
		HashRate:    info.HashRate,
		Efficiency:  efficiency,
		ShareRatio:  shareRatio,
		UptimeHours: float64(info.UptimeSeconds) / 3600.0,
		LastSeen:    time.Now(),
	}
}

// ───────────────────── HTTP Helpers ──────────────────────────────

func (c *Client) get(ctx context.Context, path string, target interface{}) error {
	req, err := http.NewRequestWithContext(ctx, "GET", c.baseURL+path, nil)
	if err != nil {
		return err
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
	}
	return json.NewDecoder(resp.Body).Decode(target)
}

func (c *Client) post(ctx context.Context, path string, body interface{}) error {
	var reader io.Reader
	if body != nil {
		data, err := json.Marshal(body)
		if err != nil {
			return err
		}
		reader = strings.NewReader(string(data))
	}
	req, err := http.NewRequestWithContext(ctx, "POST", c.baseURL+path, reader)
	if err != nil {
		return err
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(b))
	}
	return nil
}

func (c *Client) patch(ctx context.Context, path string, body interface{}) error {
	data, err := json.Marshal(body)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, "PATCH", c.baseURL+path, strings.NewReader(string(data)))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(b))
	}
	return nil
}
