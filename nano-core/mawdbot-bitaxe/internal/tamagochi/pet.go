// Package tamagochi implements the virtual pet system that evolves
// based on mining performance metrics from the Bitaxe.
package tamagochi

import (
	"encoding/json"
	"os"
	"sync"
	"time"
)

// ───────────────────── Evolution Stages ──────────────────────────

type Stage string

const (
	StageEgg      Stage = "egg"      // First boot, no wallet yet
	StageLarva    Stage = "larva"    // Wallet created, 0 shares
	StageJuvenile Stage = "juvenile" // 10+ shares accepted
	StageAdult    Stage = "adult"    // 50+ shares, >40% uptime
	StageAlpha    Stage = "alpha"    // 200+ shares, >95% accept rate
	StageGhost    Stage = "ghost"    // Offline >24h or drained
)

// ───────────────────── Mood System ──────────────────────────────

type Mood string

const (
	MoodEcstatic Mood = "ecstatic" // High hashrate, cool temps
	MoodHappy    Mood = "happy"    // Normal operation
	MoodNeutral  Mood = "neutral"  // Just booted
	MoodAnxious  Mood = "anxious"  // High reject rate
	MoodSad      Mood = "sad"      // Low hashrate
	MoodHungry   Mood = "hungry"   // Needs attention (high temp)
	MoodHot      Mood = "hot"      // Overheating
)

// MiningEvent is fed into the pet from each OODA cycle
type MiningEvent struct {
	HashRate  float64
	Temp      float64
	Shares    int
	Rejected  int
	Power     float64
	UptimeSec int
}

// PetState is the full serializable pet state
type PetState struct {
	ID             string    `json:"id"`
	Name           string    `json:"name"`
	Stage          Stage     `json:"stage"`
	Mood           Mood      `json:"mood"`
	MoodScore      float64   `json:"moodScore"`      // -1.0 to 1.0
	TotalShares    int       `json:"totalShares"`
	TotalRejected  int       `json:"totalRejected"`
	AcceptRate     float64   `json:"acceptRate"`
	AvgHashRate    float64   `json:"avgHashRate"`
	AvgTemp        float64   `json:"avgTemp"`
	TotalUptimeSec int       `json:"totalUptimeSec"`
	BornAt         time.Time `json:"bornAt"`
	LastFed        time.Time `json:"lastFed"`
	EvolvAt        time.Time `json:"evolvedAt"`
	FeedCount      int64     `json:"feedCount"`
}

// Pet is the TamaGOchi virtual pet
type Pet struct {
	state PetState
	mu    sync.RWMutex
}

// NewPet creates a new pet in egg stage
func NewPet(id string) *Pet {
	return &Pet{
		state: PetState{
			ID:        id,
			Name:      "MawdPet-" + id[:8],
			Stage:     StageEgg,
			Mood:      MoodNeutral,
			MoodScore: 0,
			BornAt:    time.Now(),
		},
	}
}

// Feed processes a mining event and updates pet state
func (p *Pet) Feed(event MiningEvent) {
	p.mu.Lock()
	defer p.mu.Unlock()

	p.state.FeedCount++
	p.state.LastFed = time.Now()
	p.state.TotalShares += event.Shares
	p.state.TotalRejected += event.Rejected
	p.state.TotalUptimeSec = event.UptimeSec

	// Running averages
	n := float64(p.state.FeedCount)
	p.state.AvgHashRate = (p.state.AvgHashRate*(n-1) + event.HashRate) / n
	p.state.AvgTemp = (p.state.AvgTemp*(n-1) + event.Temp) / n

	// Accept rate
	total := p.state.TotalShares + p.state.TotalRejected
	if total > 0 {
		p.state.AcceptRate = float64(p.state.TotalShares) / float64(total)
	}

	// Update mood
	p.updateMood(event)

	// Check evolution
	p.checkEvolution()
}

func (p *Pet) updateMood(event MiningEvent) {
	score := p.state.MoodScore

	// Hashrate contribution
	if event.HashRate > 0 {
		score += 0.05
	} else {
		score -= 0.2
	}

	// Temperature contribution
	switch {
	case event.Temp > 75:
		score -= 0.3
	case event.Temp > 65:
		score -= 0.1
	case event.Temp < 55:
		score += 0.05
	}

	// Reject rate contribution
	total := event.Shares + event.Rejected
	if total > 0 {
		ratio := float64(event.Rejected) / float64(total)
		if ratio > 0.1 {
			score -= 0.15
		} else if ratio < 0.02 {
			score += 0.05
		}
	}

	// Clamp to [-1, 1]
	if score > 1.0 {
		score = 1.0
	}
	if score < -1.0 {
		score = -1.0
	}
	p.state.MoodScore = score

	// Map score to mood
	switch {
	case score > 0.7:
		p.state.Mood = MoodEcstatic
	case score > 0.3:
		p.state.Mood = MoodHappy
	case score > -0.1:
		p.state.Mood = MoodNeutral
	case score > -0.4:
		p.state.Mood = MoodAnxious
	case event.Temp > 70:
		p.state.Mood = MoodHot
	default:
		p.state.Mood = MoodSad
	}
}

func (p *Pet) checkEvolution() {
	prevStage := p.state.Stage

	switch {
	case time.Since(p.state.LastFed) > 24*time.Hour:
		p.state.Stage = StageGhost
	case p.state.TotalShares >= 200 && p.state.AcceptRate > 0.95:
		p.state.Stage = StageAlpha
	case p.state.TotalShares >= 50 && p.state.AcceptRate > 0.90:
		p.state.Stage = StageAdult
	case p.state.TotalShares >= 10:
		p.state.Stage = StageJuvenile
	case p.state.TotalShares > 0:
		p.state.Stage = StageLarva
	default:
		p.state.Stage = StageEgg
	}

	if p.state.Stage != prevStage {
		p.state.EvolvAt = time.Now()
	}
}

// GetState returns a copy of the pet state
func (p *Pet) GetState() PetState {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.state
}

// Save persists pet state to disk
func (p *Pet) Save(path string) error {
	p.mu.RLock()
	defer p.mu.RUnlock()
	data, err := json.MarshalIndent(p.state, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0600)
}

// Load restores pet state from disk
func (p *Pet) Load(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	return json.Unmarshal(data, &p.state)
}
