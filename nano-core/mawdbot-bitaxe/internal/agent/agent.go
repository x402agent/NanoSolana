// Package agent implements the MawdBot OODA loop for Bitaxe management.
// Observe → Orient → Decide → Act cycle runs continuously per-device.
package agent

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"sync"
	"time"

	"github.com/8bitlabs/mawdbot-bitaxe/internal/axeos"
	"github.com/8bitlabs/mawdbot-bitaxe/internal/config"
	"github.com/8bitlabs/mawdbot-bitaxe/internal/tamagochi"
)

// ───────────────────────── Agent State ────────────────────────────

type AgentState string

const (
	StateBooting  AgentState = "booting"
	StateRunning  AgentState = "running"
	StateTuning   AgentState = "tuning"
	StateAlert    AgentState = "alert"
	StateStopped  AgentState = "stopped"
)

// Observation holds a single OODA cycle's data snapshot
type Observation struct {
	Timestamp  time.Time          `json:"timestamp"`
	Info       *axeos.SystemInfo  `json:"info"`
	Health     axeos.DeviceHealth `json:"health"`
	Error      string             `json:"error,omitempty"`
}

// Decision represents what the agent decided to do
type Decision struct {
	Action     string                 `json:"action"` // "hold", "tune_up", "tune_down", "alert", "restart", "switch_pool"
	Reason     string                 `json:"reason"`
	Params     map[string]interface{} `json:"params,omitempty"`
	Confidence float64                `json:"confidence"` // 0.0 - 1.0
	Timestamp  time.Time              `json:"timestamp"`
}

// AgentMetrics tracks running performance
type AgentMetrics struct {
	TotalCycles    int64          `json:"totalCycles"`
	TotalUptime    time.Duration  `json:"totalUptime"`
	AvgHashRate    float64        `json:"avgHashRate"`
	AvgTemp        float64        `json:"avgTemp"`
	AvgEfficiency  float64        `json:"avgEfficiency"`
	DecisionCounts map[string]int `json:"decisionCounts"`
	LastObservation *Observation  `json:"lastObservation"`
	LastDecision   *Decision      `json:"lastDecision"`
}

// Agent is the autonomous OODA controller for a single Bitaxe device
type Agent struct {
	ID        string
	DeviceIP  string
	State     AgentState
	Config    config.DeviceConfig
	Client    *axeos.Client
	Pet       *tamagochi.Pet
	Metrics   AgentMetrics

	// OODA history (ring buffer, last 100 observations)
	observations []Observation
	decisions    []Decision
	obsIdx       int

	mu     sync.RWMutex
	cancel context.CancelFunc
	done   chan struct{}
}

// NewAgent creates a new agent for a Bitaxe device
func NewAgent(id string, cfg config.DeviceConfig) *Agent {
	return &Agent{
		ID:       id,
		DeviceIP: cfg.BitaxeIP,
		State:    StateBooting,
		Config:   cfg,
		Client:   axeos.NewClient(cfg.BitaxeIP),
		Pet:      tamagochi.NewPet(id),
		Metrics: AgentMetrics{
			DecisionCounts: make(map[string]int),
		},
		observations: make([]Observation, 100),
		decisions:    make([]Decision, 100),
		done:         make(chan struct{}),
	}
}

// ───────────────────────── Lifecycle ─────────────────────────────

// Start begins the OODA loop
func (a *Agent) Start(ctx context.Context) {
	ctx, a.cancel = context.WithCancel(ctx)
	a.State = StateRunning

	go a.oodaLoop(ctx)
}

// Stop gracefully shuts down the agent
func (a *Agent) Stop() {
	if a.cancel != nil {
		a.cancel()
	}
	a.State = StateStopped
	<-a.done
}

// GetMetrics returns a snapshot of current metrics
func (a *Agent) GetMetrics() AgentMetrics {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.Metrics
}

// GetPetState returns the TamaGOchi state
func (a *Agent) GetPetState() tamagochi.PetState {
	return a.Pet.GetState()
}

// ───────────────────── OODA Loop ────────────────────────────────

func (a *Agent) oodaLoop(ctx context.Context) {
	defer close(a.done)

	interval := time.Duration(a.Config.PollIntervalSec) * time.Second
	if interval == 0 {
		interval = 10 * time.Second
	}

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			a.executeCycle(ctx)
		}
	}
}

func (a *Agent) executeCycle(ctx context.Context) {
	a.mu.Lock()
	defer a.mu.Unlock()

	a.Metrics.TotalCycles++

	// ──── OBSERVE ────
	obs := a.observe(ctx)

	// ──── ORIENT ────
	oriented := a.orient(obs)

	// ──── DECIDE ────
	decision := a.decide(oriented)

	// ──── ACT ────
	a.act(ctx, decision)

	// Update pet based on mining performance
	if obs.Info != nil {
		a.Pet.Feed(tamagochi.MiningEvent{
			HashRate:   obs.Info.HashRate,
			Temp:       obs.Info.Temp,
			Shares:     obs.Info.SharesAccepted,
			Rejected:   obs.Info.SharesRejected,
			Power:      obs.Info.Power,
			UptimeSec:  obs.Info.UptimeSeconds,
		})
	}

	// Store in ring buffer
	a.observations[a.obsIdx%100] = obs
	a.decisions[a.obsIdx%100] = decision
	a.obsIdx++

	a.Metrics.LastObservation = &obs
	a.Metrics.LastDecision = &decision
}

// ──── OBSERVE: Pull raw data from device ────
func (a *Agent) observe(ctx context.Context) Observation {
	info, err := a.Client.GetInfo(ctx)
	obs := Observation{
		Timestamp: time.Now(),
		Info:      info,
		Health:    a.Client.Health(),
	}
	if err != nil {
		obs.Error = err.Error()
		obs.Health = axeos.DeviceHealth{Status: "offline", LastSeen: time.Now()}
	}
	return obs
}

// ──── ORIENT: Contextualize against history ────
func (a *Agent) orient(obs Observation) Observation {
	if obs.Info == nil {
		return obs
	}

	// Update running averages
	n := float64(a.Metrics.TotalCycles)
	if n == 0 {
		n = 1
	}
	a.Metrics.AvgHashRate = (a.Metrics.AvgHashRate*(n-1) + obs.Info.HashRate) / n
	a.Metrics.AvgTemp = (a.Metrics.AvgTemp*(n-1) + obs.Info.Temp) / n
	if obs.Health.Efficiency > 0 {
		a.Metrics.AvgEfficiency = (a.Metrics.AvgEfficiency*(n-1) + obs.Health.Efficiency) / n
	}

	return obs
}

// ──── DECIDE: Determine best action ────
func (a *Agent) decide(obs Observation) Decision {
	d := Decision{
		Action:     "hold",
		Reason:     "nominal operation",
		Confidence: 1.0,
		Timestamp:  time.Now(),
	}

	if obs.Info == nil {
		d.Action = "alert"
		d.Reason = "device unreachable: " + obs.Error
		d.Confidence = 0.95
		a.State = StateAlert
		a.Metrics.DecisionCounts["alert"]++
		return d
	}

	info := obs.Info

	// Critical: Overheat protection
	if info.Temp > float64(a.Config.MaxTempC) {
		d.Action = "tune_down"
		d.Reason = fmt.Sprintf("temp %.1f°C exceeds max %d°C", info.Temp, a.Config.MaxTempC)
		d.Confidence = 0.99
		d.Params = map[string]interface{}{
			"targetFreq": info.Frequency - 25,
			"fanSpeed":   100,
		}
		a.State = StateTuning
		a.Metrics.DecisionCounts["tune_down"]++
		return d
	}

	// Warning: Getting warm, increase fan
	if info.Temp > float64(a.Config.WarnTempC) {
		d.Action = "tune_down"
		d.Reason = fmt.Sprintf("temp %.1f°C approaching limit", info.Temp)
		d.Confidence = 0.85
		d.Params = map[string]interface{}{
			"fanSpeed": min(info.FanSpeed+10, 100),
		}
		a.Metrics.DecisionCounts["tune_down"]++
		return d
	}

	// Opportunity: Running cool, can we push harder?
	if info.Temp < float64(a.Config.CoolTempC) && info.Frequency < a.Config.MaxFreqMHz {
		d.Action = "tune_up"
		d.Reason = fmt.Sprintf("temp %.1f°C well under limit, can overclock", info.Temp)
		d.Confidence = 0.7
		d.Params = map[string]interface{}{
			"targetFreq": info.Frequency + 25,
		}
		a.State = StateTuning
		a.Metrics.DecisionCounts["tune_up"]++
		return d
	}

	// High reject rate
	total := info.SharesAccepted + info.SharesRejected
	if total > 20 {
		ratio := float64(info.SharesAccepted) / float64(total)
		if ratio < 0.90 {
			d.Action = "tune_down"
			d.Reason = fmt.Sprintf("reject rate %.1f%% too high", (1-ratio)*100)
			d.Confidence = 0.8
			d.Params = map[string]interface{}{
				"targetFreq": info.Frequency - 10,
			}
			a.Metrics.DecisionCounts["tune_down"]++
			return d
		}
	}

	// Zero hashrate but device online
	if info.HashRate == 0 && info.UptimeSeconds > 120 {
		d.Action = "restart"
		d.Reason = "zero hashrate after 2+ minutes"
		d.Confidence = 0.9
		a.Metrics.DecisionCounts["restart"]++
		return d
	}

	a.State = StateRunning
	a.Metrics.DecisionCounts["hold"]++
	return d
}

// ──── ACT: Execute the decision ────
func (a *Agent) act(ctx context.Context, d Decision) {
	switch d.Action {
	case "hold":
		// Nothing to do

	case "tune_down":
		if freq, ok := d.Params["targetFreq"]; ok {
			freqInt := int(freq.(int))
			if freqInt < 400 {
				freqInt = 400 // never go below minimum
			}
			_ = a.Client.UpdateSettings(ctx, axeos.PatchSettings{Frequency: &freqInt})
		}
		if fan, ok := d.Params["fanSpeed"]; ok {
			fanInt := int(fan.(int))
			_ = a.Client.SetFanSpeed(ctx, fanInt)
		}

	case "tune_up":
		if freq, ok := d.Params["targetFreq"]; ok {
			freqInt := int(freq.(int))
			_ = a.Client.UpdateSettings(ctx, axeos.PatchSettings{Frequency: &freqInt})
		}

	case "restart":
		_ = a.Client.Restart(ctx)

	case "alert":
		// In production: push to webhook, Discord, Telegram
		a.logAlert(d)

	case "switch_pool":
		if url, ok := d.Params["stratumURL"].(string); ok {
			port := d.Params["stratumPort"].(int)
			user := d.Params["stratumUser"].(string)
			_ = a.Client.SetPool(ctx, url, port, user, "x")
		}
	}
}

func (a *Agent) logAlert(d Decision) {
	entry := map[string]interface{}{
		"agent_id":  a.ID,
		"device_ip": a.DeviceIP,
		"action":    d.Action,
		"reason":    d.Reason,
		"timestamp": d.Timestamp,
	}
	data, _ := json.Marshal(entry)
	fmt.Fprintf(os.Stderr, "[ALERT] %s\n", string(data))
}

// ──── Helpers ────
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
