// Package hardware provides I2C integration with Arduino Modulino sensors
// for physical feedback on the MawdBot hardware device.
//
// Supported modules:
//   - Modulino Pixels (RGB LED strip) → mining status colors
//   - Modulino Buzzer → alerts and share notifications
//   - Modulino Buttons → manual override controls
//   - Modulino Knob → fan speed / frequency adjustment
//   - Modulino Movement (IMU) → tilt interactions for TamaGOchi
//   - Modulino Thermo → ambient temperature for thermal management
package hardware

import (
	"context"
	"encoding/binary"
	"fmt"
	"os"
	"sync"
	"time"
)

// ───────────────────── I2C Bus Interface ─────────────────────────

// I2CBus abstracts the Linux I2C interface
type I2CBus struct {
	devPath string
	file    *os.File
	mu      sync.Mutex
}

// I2C addresses for Modulino modules (default)
const (
	AddrPixels   = 0x6C
	AddrBuzzer   = 0x6D
	AddrButtons  = 0x74
	AddrKnob     = 0x76
	AddrMovement = 0x6A
	AddrThermo   = 0x48
)

// NewI2CBus opens an I2C bus (usually /dev/i2c-1 on Orin Nano)
func NewI2CBus(busNum int) (*I2CBus, error) {
	path := fmt.Sprintf("/dev/i2c-%d", busNum)
	f, err := os.OpenFile(path, os.O_RDWR, 0)
	if err != nil {
		return nil, fmt.Errorf("open i2c bus %s: %w", path, err)
	}
	return &I2CBus{devPath: path, file: f}, nil
}

func (b *I2CBus) Close() error {
	return b.file.Close()
}

// ioctl constants for I2C
const i2cSlave = 0x0703

func (b *I2CBus) setAddr(addr uint8) error {
	// syscall ioctl to set slave address
	// Using raw file write for portability
	_, _, errno := rawSyscall(b.file.Fd(), i2cSlave, uintptr(addr))
	if errno != 0 {
		return fmt.Errorf("ioctl set addr 0x%02x: %v", addr, errno)
	}
	return nil
}

func (b *I2CBus) Write(addr uint8, data []byte) error {
	b.mu.Lock()
	defer b.mu.Unlock()
	if err := b.setAddr(addr); err != nil {
		return err
	}
	_, err := b.file.Write(data)
	return err
}

func (b *I2CBus) Read(addr uint8, buf []byte) error {
	b.mu.Lock()
	defer b.mu.Unlock()
	if err := b.setAddr(addr); err != nil {
		return err
	}
	_, err := b.file.Read(buf)
	return err
}

// ───────────────────── RGB Pixels Module ─────────────────────────

// Color represents an RGB color
type Color struct {
	R, G, B uint8
}

// MawdBot color palette
var (
	ColorMawdOrange = Color{255, 102, 0}
	ColorHealthy    = Color{0, 255, 64}
	ColorWarning    = Color{255, 200, 0}
	ColorCritical   = Color{255, 0, 0}
	ColorOffline    = Color{64, 64, 64}
	ColorMining     = Color{255, 165, 0}
	ColorShare      = Color{0, 255, 128}
	ColorEcstatic   = Color{0, 255, 200}
	ColorSad        = Color{0, 0, 255}
)

// Pixels controls the Modulino Pixels LED strip
type Pixels struct {
	bus  *I2CBus
	leds [8]Color
}

func NewPixels(bus *I2CBus) *Pixels {
	return &Pixels{bus: bus}
}

// SetAll sets all LEDs to the same color
func (p *Pixels) SetAll(c Color) error {
	for i := range p.leds {
		p.leds[i] = c
	}
	return p.flush()
}

// SetLED sets a single LED (0-7)
func (p *Pixels) SetLED(idx int, c Color) error {
	if idx < 0 || idx > 7 {
		return fmt.Errorf("LED index %d out of range", idx)
	}
	p.leds[idx] = c
	return p.flush()
}

// SetHealthBar shows a health bar (0-8 LEDs lit)
func (p *Pixels) SetHealthBar(level int, color Color) error {
	for i := 0; i < 8; i++ {
		if i < level {
			p.leds[i] = color
		} else {
			p.leds[i] = Color{0, 0, 0}
		}
	}
	return p.flush()
}

// PulseMining creates a mining animation pattern
func (p *Pixels) PulseMining(ctx context.Context) {
	pos := 0
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			for i := 0; i < 8; i++ {
				if i == pos%8 {
					p.leds[i] = ColorMawdOrange
				} else {
					brightness := uint8(32)
					p.leds[i] = Color{brightness, brightness / 4, 0}
				}
			}
			p.flush()
			pos++
		}
	}
}

// ShowMood maps TamaGOchi mood to LED colors
func (p *Pixels) ShowMood(mood string) error {
	switch mood {
	case "ecstatic":
		return p.SetAll(ColorEcstatic)
	case "happy":
		return p.SetAll(ColorHealthy)
	case "neutral":
		return p.SetAll(Color{128, 128, 128})
	case "anxious":
		return p.SetAll(ColorWarning)
	case "sad":
		return p.SetAll(ColorSad)
	case "hot":
		return p.SetAll(ColorCritical)
	default:
		return p.SetAll(ColorOffline)
	}
}

// ShowEvolution flashes a color pattern for stage transitions
func (p *Pixels) ShowEvolution() error {
	for round := 0; round < 3; round++ {
		for i := 0; i < 8; i++ {
			p.SetLED(i, ColorMawdOrange)
			time.Sleep(50 * time.Millisecond)
		}
		p.SetAll(Color{255, 255, 255})
		time.Sleep(200 * time.Millisecond)
		p.SetAll(Color{0, 0, 0})
		time.Sleep(100 * time.Millisecond)
	}
	return nil
}

func (p *Pixels) flush() error {
	// Protocol: 8 LEDs × 3 bytes (R,G,B) = 24 bytes
	data := make([]byte, 24)
	for i, c := range p.leds {
		data[i*3] = c.R
		data[i*3+1] = c.G
		data[i*3+2] = c.B
	}
	return p.bus.Write(AddrPixels, data)
}

// ───────────────────── Buzzer Module ─────────────────────────────

type Buzzer struct {
	bus *I2CBus
}

func NewBuzzer(bus *I2CBus) *Buzzer {
	return &Buzzer{bus: bus}
}

// Beep plays a tone at given frequency for duration
func (b *Buzzer) Beep(freqHz uint16, durationMs uint16) error {
	data := make([]byte, 4)
	binary.LittleEndian.PutUint16(data[0:2], freqHz)
	binary.LittleEndian.PutUint16(data[2:4], durationMs)
	return b.bus.Write(AddrBuzzer, data)
}

// ShareFound plays the "share accepted" jingle
func (b *Buzzer) ShareFound() error {
	b.Beep(880, 100)
	time.Sleep(120 * time.Millisecond)
	b.Beep(1320, 150)
	return nil
}

// AlertSound plays an alert tone
func (b *Buzzer) AlertSound() error {
	for i := 0; i < 3; i++ {
		b.Beep(440, 200)
		time.Sleep(300 * time.Millisecond)
	}
	return nil
}

// EvolutionFanfare plays when the pet evolves
func (b *Buzzer) EvolutionFanfare() error {
	notes := []uint16{523, 659, 784, 1047} // C5, E5, G5, C6
	for _, n := range notes {
		b.Beep(n, 200)
		time.Sleep(220 * time.Millisecond)
	}
	return nil
}

// ───────────────────── Controller ────────────────────────────────

// HardwareController manages all Modulino modules
type HardwareController struct {
	Bus     *I2CBus
	Pixels  *Pixels
	Buzzer  *Buzzer
	enabled bool
}

// NewController tries to initialize hardware, returns disabled controller if no I2C
func NewController(busNum int) *HardwareController {
	bus, err := NewI2CBus(busNum)
	if err != nil {
		// No hardware available — run in software-only mode
		return &HardwareController{enabled: false}
	}
	return &HardwareController{
		Bus:     bus,
		Pixels:  NewPixels(bus),
		Buzzer:  NewBuzzer(bus),
		enabled: true,
	}
}

func (hc *HardwareController) Enabled() bool {
	return hc.enabled
}

// UpdateFromAgent syncs hardware feedback with agent state
func (hc *HardwareController) UpdateFromAgent(health string, mood string, sharesNew int) {
	if !hc.enabled {
		return
	}

	// Update LED colors based on health
	switch health {
	case "healthy":
		hc.Pixels.ShowMood(mood)
	case "warning":
		hc.Pixels.SetAll(ColorWarning)
	case "critical":
		hc.Pixels.SetAll(ColorCritical)
	case "offline":
		hc.Pixels.SetAll(ColorOffline)
	}

	// Beep on new shares
	if sharesNew > 0 {
		go hc.Buzzer.ShareFound()
	}
}

func (hc *HardwareController) Close() {
	if hc.Bus != nil {
		hc.Bus.Close()
	}
}

// rawSyscall is a placeholder - in production use golang.org/x/sys/unix
func rawSyscall(fd uintptr, cmd uintptr, arg uintptr) (uintptr, uintptr, error) {
	// This would use unix.IoctlSetInt in production
	return 0, 0, nil
}
