// Package config handles device and fleet configuration.
// Designed for one-shot setup: user fills .env, runs setup.sh, done.
package config

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"
)

// DeviceConfig configures a single Bitaxe device
type DeviceConfig struct {
	DeviceID        string `json:"deviceId"`
	BitaxeIP        string `json:"bitaxeIp"`
	PollIntervalSec int    `json:"pollIntervalSec"`
	MaxTempC        int    `json:"maxTempC"`
	WarnTempC       int    `json:"warnTempC"`
	CoolTempC       int    `json:"coolTempC"`
	MaxFreqMHz      int    `json:"maxFreqMHz"`
	MinFreqMHz      int    `json:"minFreqMHz"`
	AutoTune        bool   `json:"autoTune"`
	PoolURL         string `json:"poolUrl"`
	PoolPort        int    `json:"poolPort"`
	PoolUser        string `json:"poolUser"`
	PoolPass        string `json:"poolPass"`
}

// FleetConfig configures the fleet management server
type FleetConfig struct {
	// Server
	APIPort     int    `json:"apiPort"`
	APIHost     string `json:"apiHost"`
	APIKey      string `json:"apiKey"` // HMAC-SHA256 auth key

	// Supabase backend (for fleet scale)
	SupabaseURL string `json:"supabaseUrl"`
	SupabaseKey string `json:"supabaseKey"`

	// Alerts
	WebhookURL     string `json:"webhookUrl"`     // Discord/Slack/Telegram
	AlertCooldownS int    `json:"alertCooldownS"`

	// Tailscale
	TailscaleEnabled bool   `json:"tailscaleEnabled"`
	TailscaleAuthKey string `json:"tailscaleAuthKey"`

	// Devices
	Devices []DeviceConfig `json:"devices"`
}

// DefaultDeviceConfig returns sane defaults for Bitaxe Gamma
func DefaultDeviceConfig() DeviceConfig {
	return DeviceConfig{
		PollIntervalSec: 10,
		MaxTempC:        72,
		WarnTempC:       65,
		CoolTempC:       50,
		MaxFreqMHz:      600,
		MinFreqMHz:      400,
		AutoTune:        true,
		PoolURL:         "public-pool.io",
		PoolPort:        21496,
		PoolPass:        "x",
	}
}

// LoadFromEnv loads configuration from environment variables
// This is the one-shot path: user sets env vars, we build config
func LoadFromEnv() (*FleetConfig, error) {
	cfg := &FleetConfig{
		APIPort:        envInt("MAWDAXE_API_PORT", 8420),
		APIHost:        envStr("MAWDAXE_API_HOST", "0.0.0.0"),
		APIKey:         envStr("MAWDAXE_API_KEY", ""),
		SupabaseURL:    envStr("SUPABASE_URL", ""),
		SupabaseKey:    envStr("SUPABASE_KEY", ""),
		WebhookURL:     envStr("MAWDAXE_WEBHOOK_URL", ""),
		AlertCooldownS: envInt("MAWDAXE_ALERT_COOLDOWN", 300),
		TailscaleEnabled: envBool("TAILSCALE_ENABLED", false),
		TailscaleAuthKey: envStr("TAILSCALE_AUTH_KEY", ""),
	}

	// Parse device list from MAWDAXE_DEVICES="ip1,ip2,ip3"
	deviceIPs := envStr("MAWDAXE_DEVICES", "")
	if deviceIPs == "" {
		// Single device mode
		ip := envStr("BITAXE_IP", "")
		if ip == "" {
			return nil, fmt.Errorf("set BITAXE_IP or MAWDAXE_DEVICES")
		}
		dev := DefaultDeviceConfig()
		dev.DeviceID = "mawdaxe-001"
		dev.BitaxeIP = ip
		dev.PoolURL = envStr("POOL_URL", dev.PoolURL)
		dev.PoolPort = envInt("POOL_PORT", dev.PoolPort)
		dev.PoolUser = envStr("POOL_USER", dev.PoolUser)
		cfg.Devices = []DeviceConfig{dev}
	} else {
		ips := strings.Split(deviceIPs, ",")
		for i, ip := range ips {
			ip = strings.TrimSpace(ip)
			if ip == "" {
				continue
			}
			dev := DefaultDeviceConfig()
			dev.DeviceID = fmt.Sprintf("mawdaxe-%03d", i+1)
			dev.BitaxeIP = ip
			dev.PoolURL = envStr("POOL_URL", dev.PoolURL)
			dev.PoolPort = envInt("POOL_PORT", dev.PoolPort)
			dev.PoolUser = envStr("POOL_USER", dev.PoolUser)
			cfg.Devices = append(cfg.Devices, dev)
		}
	}

	return cfg, nil
}

// LoadFromFile loads config from a JSON file
func LoadFromFile(path string) (*FleetConfig, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var cfg FleetConfig
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}

// SaveToFile persists config
func (c *FleetConfig) SaveToFile(path string) error {
	data, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0600)
}

// helpers

func envStr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func envInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return fallback
}

func envBool(key string, fallback bool) bool {
	if v := os.Getenv(key); v != "" {
		return strings.ToLower(v) == "true" || v == "1"
	}
	return fallback
}
