// Package api provides the HTTP server for fleet management.
// Exposes REST endpoints + WebSocket for real-time dashboard updates.
package api

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/8bitlabs/mawdbot-bitaxe/internal/config"
	"github.com/8bitlabs/mawdbot-bitaxe/internal/fleet"
)

// Server is the HTTP API server
type Server struct {
	manager *fleet.Manager
	config  *config.FleetConfig
	srv     *http.Server

	// WebSocket clients for live updates
	wsClients map[chan []byte]bool
	wsMu      sync.RWMutex
}

// NewServer creates the API server
func NewServer(mgr *fleet.Manager, cfg *config.FleetConfig) *Server {
	s := &Server{
		manager:   mgr,
		config:    cfg,
		wsClients: make(map[chan []byte]bool),
	}

	mux := http.NewServeMux()

	// Fleet endpoints
	mux.HandleFunc("/api/fleet", s.corsMiddleware(s.authMiddleware(s.handleFleet)))
	mux.HandleFunc("/api/fleet/devices", s.corsMiddleware(s.authMiddleware(s.handleDevices)))
	mux.HandleFunc("/api/fleet/device/", s.corsMiddleware(s.authMiddleware(s.handleDevice)))

	// Device management
	mux.HandleFunc("/api/fleet/device/add", s.corsMiddleware(s.authMiddleware(s.handleAddDevice)))
	mux.HandleFunc("/api/fleet/device/remove/", s.corsMiddleware(s.authMiddleware(s.handleRemoveDevice)))

	// WebSocket for live updates
	mux.HandleFunc("/ws", s.handleWebSocket)

	// Health check (no auth)
	mux.HandleFunc("/health", s.corsMiddleware(s.handleHealth))

	// Serve static dashboard
	mux.Handle("/", http.FileServer(http.Dir("./web")))

	addr := fmt.Sprintf("%s:%d", cfg.APIHost, cfg.APIPort)
	s.srv = &http.Server{
		Addr:    addr,
		Handler: mux,
	}

	return s
}

// Start begins serving
func (s *Server) Start() error {
	// Start WebSocket broadcast loop
	go s.broadcastLoop()
	log.Printf("[API] Listening on %s", s.srv.Addr)
	return s.srv.ListenAndServe()
}

// Stop gracefully shuts down
func (s *Server) Stop(ctx context.Context) error {
	return s.srv.Shutdown(ctx)
}

// ───────────────────── Handlers ─────────────────────────────────

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	snap := s.manager.Snapshot()
	writeJSON(w, map[string]interface{}{
		"status":  "ok",
		"devices": snap.TotalDevices,
		"online":  snap.OnlineDevices,
		"uptime":  time.Now().Format(time.RFC3339),
	})
}

func (s *Server) handleFleet(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	snap := s.manager.Snapshot()
	writeJSON(w, snap)
}

func (s *Server) handleDevices(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	snap := s.manager.Snapshot()
	writeJSON(w, snap.Devices)
}

func (s *Server) handleDevice(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/fleet/device/")
	if id == "" || id == "add" || strings.HasPrefix(id, "remove") {
		return
	}
	dev, err := s.manager.GetDevice(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	writeJSON(w, dev)
}

func (s *Server) handleAddDevice(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var devCfg config.DeviceConfig
	if err := json.NewDecoder(r.Body).Decode(&devCfg); err != nil {
		http.Error(w, "invalid json: "+err.Error(), http.StatusBadRequest)
		return
	}
	// Apply defaults for missing fields
	defaults := config.DefaultDeviceConfig()
	if devCfg.PollIntervalSec == 0 {
		devCfg.PollIntervalSec = defaults.PollIntervalSec
	}
	if devCfg.MaxTempC == 0 {
		devCfg.MaxTempC = defaults.MaxTempC
	}
	if devCfg.WarnTempC == 0 {
		devCfg.WarnTempC = defaults.WarnTempC
	}
	if devCfg.CoolTempC == 0 {
		devCfg.CoolTempC = defaults.CoolTempC
	}
	if devCfg.MaxFreqMHz == 0 {
		devCfg.MaxFreqMHz = defaults.MaxFreqMHz
	}

	if err := s.manager.AddDevice(devCfg); err != nil {
		http.Error(w, err.Error(), http.StatusConflict)
		return
	}
	writeJSON(w, map[string]string{"status": "added", "id": devCfg.DeviceID})
}

func (s *Server) handleRemoveDevice(w http.ResponseWriter, r *http.Request) {
	if r.Method != "DELETE" {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	id := strings.TrimPrefix(r.URL.Path, "/api/fleet/device/remove/")
	if err := s.manager.RemoveDevice(id); err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	writeJSON(w, map[string]string{"status": "removed", "id": id})
}

// ───────────────────── WebSocket ────────────────────────────────

func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Simple SSE fallback since we're keeping zero-dep
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming not supported", http.StatusInternalServerError)
		return
	}

	ch := make(chan []byte, 10)
	s.wsMu.Lock()
	s.wsClients[ch] = true
	s.wsMu.Unlock()

	defer func() {
		s.wsMu.Lock()
		delete(s.wsClients, ch)
		s.wsMu.Unlock()
	}()

	ctx := r.Context()
	for {
		select {
		case <-ctx.Done():
			return
		case data := <-ch:
			fmt.Fprintf(w, "data: %s\n\n", string(data))
			flusher.Flush()
		}
	}
}

func (s *Server) broadcastLoop() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		data, err := s.manager.SnapshotJSON()
		if err != nil {
			continue
		}
		s.wsMu.RLock()
		for ch := range s.wsClients {
			select {
			case ch <- data:
			default: // skip slow clients
			}
		}
		s.wsMu.RUnlock()
	}
}

// ───────────────────── Middleware ────────────────────────────────

func (s *Server) corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

func (s *Server) authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Skip auth if no key configured (development mode)
		if s.config.APIKey == "" {
			next(w, r)
			return
		}
		key := r.Header.Get("X-API-Key")
		if key == "" {
			key = r.URL.Query().Get("key")
		}
		if key != s.config.APIKey {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		next(w, r)
	}
}

// ───────────────────── Helpers ───────────────────────────────────

func writeJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}
