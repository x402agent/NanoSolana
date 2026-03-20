// Package fleet manages a collection of agents for multi-device deployments.
// Scales from 1 device (home miner) to 1000+ (fleet operator).
package fleet

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/8bitlabs/mawdbot-bitaxe/internal/agent"
	"github.com/8bitlabs/mawdbot-bitaxe/internal/config"
	"github.com/8bitlabs/mawdbot-bitaxe/internal/tamagochi"
)

// DeviceSnapshot is the API-facing view of a single device
type DeviceSnapshot struct {
	ID        string                `json:"id"`
	IP        string                `json:"ip"`
	State     string                `json:"state"`
	Health    string                `json:"health"`
	HashRate  float64               `json:"hashRate"`
	Temp      float64               `json:"temp"`
	Power     float64               `json:"power"`
	Shares    int                   `json:"sharesAccepted"`
	Rejected  int                   `json:"sharesRejected"`
	Uptime    float64               `json:"uptimeHours"`
	Pet       tamagochi.PetState    `json:"pet"`
	Metrics   agent.AgentMetrics    `json:"metrics"`
	LastSeen  time.Time             `json:"lastSeen"`
}

// FleetSnapshot is the API-facing view of the entire fleet
type FleetSnapshot struct {
	TotalDevices  int               `json:"totalDevices"`
	OnlineDevices int               `json:"onlineDevices"`
	TotalHashRate float64           `json:"totalHashRate"`
	AvgTemp       float64           `json:"avgTemp"`
	TotalPower    float64           `json:"totalPower"`
	TotalShares   int               `json:"totalShares"`
	Devices       []DeviceSnapshot  `json:"devices"`
	Timestamp     time.Time         `json:"timestamp"`
}

// Manager orchestrates all agents
type Manager struct {
	agents map[string]*agent.Agent
	config *config.FleetConfig
	mu     sync.RWMutex
	ctx    context.Context
	cancel context.CancelFunc
}

// NewManager creates a fleet manager
func NewManager(cfg *config.FleetConfig) *Manager {
	ctx, cancel := context.WithCancel(context.Background())
	m := &Manager{
		agents: make(map[string]*agent.Agent),
		config: cfg,
		ctx:    ctx,
		cancel: cancel,
	}

	// Create agents for all configured devices
	for _, devCfg := range cfg.Devices {
		a := agent.NewAgent(devCfg.DeviceID, devCfg)
		m.agents[devCfg.DeviceID] = a
	}

	return m
}

// Start launches all agents
func (m *Manager) Start() {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, a := range m.agents {
		a.Start(m.ctx)
	}
}

// Stop gracefully shuts down all agents
func (m *Manager) Stop() {
	m.cancel()
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, a := range m.agents {
		a.Stop()
	}
}

// AddDevice adds a new device to the fleet at runtime
func (m *Manager) AddDevice(devCfg config.DeviceConfig) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, exists := m.agents[devCfg.DeviceID]; exists {
		return fmt.Errorf("device %s already exists", devCfg.DeviceID)
	}
	a := agent.NewAgent(devCfg.DeviceID, devCfg)
	m.agents[devCfg.DeviceID] = a
	a.Start(m.ctx)
	return nil
}

// RemoveDevice stops and removes a device
func (m *Manager) RemoveDevice(id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	a, exists := m.agents[id]
	if !exists {
		return fmt.Errorf("device %s not found", id)
	}
	a.Stop()
	delete(m.agents, id)
	return nil
}

// Snapshot returns the full fleet state
func (m *Manager) Snapshot() FleetSnapshot {
	m.mu.RLock()
	defer m.mu.RUnlock()

	snap := FleetSnapshot{
		TotalDevices: len(m.agents),
		Timestamp:    time.Now(),
	}

	for _, a := range m.agents {
		metrics := a.GetMetrics()
		pet := a.GetPetState()

		ds := DeviceSnapshot{
			ID:    a.ID,
			IP:    a.DeviceIP,
			State: string(a.State),
			Pet:   pet,
			Metrics: metrics,
		}

		if metrics.LastObservation != nil && metrics.LastObservation.Info != nil {
			info := metrics.LastObservation.Info
			ds.Health = metrics.LastObservation.Health.Status
			ds.HashRate = info.HashRate
			ds.Temp = info.Temp
			ds.Power = info.Power
			ds.Shares = info.SharesAccepted
			ds.Rejected = info.SharesRejected
			ds.Uptime = float64(info.UptimeSeconds) / 3600.0
			ds.LastSeen = metrics.LastObservation.Timestamp

			snap.TotalHashRate += info.HashRate
			snap.TotalPower += info.Power
			snap.TotalShares += info.SharesAccepted
			snap.AvgTemp += info.Temp
			snap.OnlineDevices++
		} else {
			ds.Health = "offline"
		}

		snap.Devices = append(snap.Devices, ds)
	}

	if snap.OnlineDevices > 0 {
		snap.AvgTemp /= float64(snap.OnlineDevices)
	}

	return snap
}

// GetDevice returns a single device snapshot
func (m *Manager) GetDevice(id string) (*DeviceSnapshot, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	a, exists := m.agents[id]
	if !exists {
		return nil, fmt.Errorf("device %s not found", id)
	}
	metrics := a.GetMetrics()
	pet := a.GetPetState()
	ds := &DeviceSnapshot{
		ID:      a.ID,
		IP:      a.DeviceIP,
		State:   string(a.State),
		Pet:     pet,
		Metrics: metrics,
	}
	if metrics.LastObservation != nil && metrics.LastObservation.Info != nil {
		info := metrics.LastObservation.Info
		ds.Health = metrics.LastObservation.Health.Status
		ds.HashRate = info.HashRate
		ds.Temp = info.Temp
		ds.Power = info.Power
		ds.Shares = info.SharesAccepted
		ds.Rejected = info.SharesRejected
		ds.Uptime = float64(info.UptimeSeconds) / 3600.0
		ds.LastSeen = metrics.LastObservation.Timestamp
	}
	return ds, nil
}

// SnapshotJSON returns the fleet snapshot as JSON bytes
func (m *Manager) SnapshotJSON() ([]byte, error) {
	return json.Marshal(m.Snapshot())
}
