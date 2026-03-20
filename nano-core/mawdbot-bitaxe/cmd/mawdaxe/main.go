// MawdAxe - The MawdBot x Bitaxe Autonomous Mining Agent
//
// One binary. One command. Runs on anything from NVIDIA Orin Nano to Raspberry Pi.
//
// Usage:
//   BITAXE_IP=192.168.1.42 ./mawdaxe
//   MAWDAXE_DEVICES="192.168.1.42,192.168.1.43" ./mawdaxe
//
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/8bitlabs/mawdbot-bitaxe/api"
	"github.com/8bitlabs/mawdbot-bitaxe/internal/config"
	"github.com/8bitlabs/mawdbot-bitaxe/internal/fleet"
)

const banner = `
 ███╗   ███╗ █████╗ ██╗    ██╗██████╗  █████╗ ██╗  ██╗███████╗
 ████╗ ████║██╔══██╗██║    ██║██╔══██╗██╔══██╗╚██╗██╔╝██╔════╝
 ██╔████╔██║███████║██║ █╗ ██║██║  ██║███████║ ╚███╔╝ █████╗  
 ██║╚██╔╝██║██╔══██║██║███╗██║██║  ██║██╔══██║ ██╔██╗ ██╔══╝  
 ██║ ╚═╝ ██║██║  ██║╚███╔███╔╝██████╔╝██║  ██║██╔╝ ██╗███████╗
 ╚═╝     ╚═╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
  MawdBot x Bitaxe │ Autonomous Mining Agent │ OpenClaw Network
  ─────────────────────────────────────────────────────────────
`

func main() {
	fmt.Print(banner)

	// Load config from env or file
	var cfg *config.FleetConfig
	var err error

	if cfgFile := os.Getenv("MAWDAXE_CONFIG"); cfgFile != "" {
		cfg, err = config.LoadFromFile(cfgFile)
		if err != nil {
			log.Fatalf("[FATAL] Failed to load config from %s: %v", cfgFile, err)
		}
		log.Printf("[INIT] Loaded config from %s", cfgFile)
	} else {
		cfg, err = config.LoadFromEnv()
		if err != nil {
			log.Fatalf("[FATAL] Config error: %v", err)
		}
		log.Printf("[INIT] Loaded config from environment")
	}

	log.Printf("[INIT] Managing %d device(s)", len(cfg.Devices))
	for _, d := range cfg.Devices {
		log.Printf("[INIT]   → %s @ %s (pool: %s:%d)", d.DeviceID, d.BitaxeIP, d.PoolURL, d.PoolPort)
	}

	// Create fleet manager
	mgr := fleet.NewManager(cfg)
	mgr.Start()
	log.Printf("[FLEET] All agents started — OODA loops active")

	// Start API server
	srv := api.NewServer(mgr, cfg)
	go func() {
		if err := srv.Start(); err != nil {
			log.Printf("[API] Server stopped: %v", err)
		}
	}()

	log.Printf("[API] Dashboard: http://localhost:%d", cfg.APIPort)
	log.Printf("[API] Fleet API: http://localhost:%d/api/fleet", cfg.APIPort)
	log.Printf("[API] Live SSE:  http://localhost:%d/ws", cfg.APIPort)
	log.Println("[READY] MawdAxe is live. Press Ctrl+C to stop.")

	// Graceful shutdown
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	<-sig

	log.Println("[SHUTDOWN] Stopping agents...")
	mgr.Stop()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	srv.Stop(ctx)

	log.Println("[SHUTDOWN] MawdAxe stopped cleanly.")
}
