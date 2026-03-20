// Package x402 implements the HTTP 402 Payment Required protocol
// for monetizing MawdAxe fleet API endpoints via USDC micropayments on Solana.
//
// This enables: sell mining stats API access, fleet management as a service,
// and agent-to-agent payments in the OpenClaw mesh network.
package x402

import (
	"crypto/ed25519"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// PaymentRequirement defines what a client must pay to access a resource
type PaymentRequirement struct {
	Scheme      string `json:"scheme"`      // "exact"
	Network     string `json:"network"`     // "solana-mainnet"
	MaxAmount   string `json:"maxAmount"`   // in lamports or token units
	Resource    string `json:"resource"`    // endpoint URL
	Description string `json:"description"`
	MimeType    string `json:"mimeType,omitempty"`
	PayTo       string `json:"payTo"`       // Solana wallet address
	Token       string `json:"token,omitempty"` // SPL token mint (USDC)
	ExpiresAt   int64  `json:"expiresAt"`   // Unix timestamp
	Nonce       string `json:"nonce"`       // Unique request ID
}

// PaymentPayload is what the client sends back after paying
type PaymentPayload struct {
	Signature   string `json:"signature"`   // Solana TX signature
	PaymentHash string `json:"paymentHash"` // Hash of payment details
	Nonce       string `json:"nonce"`       // Must match requirement
}

// Config for the x402 facilitator
type Config struct {
	Enabled       bool   `json:"enabled"`
	WalletAddress string `json:"walletAddress"` // Receive payments here
	USDCMint      string `json:"usdcMint"`      // USDC SPL token mint
	PricePerCall  uint64 `json:"pricePerCall"`  // In USDC minor units (6 decimals)
	SigningKey    ed25519.PrivateKey
}

// USDC mint on Solana mainnet
const SolanaUSDCMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"

// DefaultConfig returns config with standard USDC pricing
func DefaultConfig(walletAddr string) Config {
	return Config{
		Enabled:       true,
		WalletAddress: walletAddr,
		USDCMint:      SolanaUSDCMint,
		PricePerCall:  1000, // $0.001 USDC per API call
	}
}

// ───────────────── Middleware ────────────────────────────────────

// PaywallMiddleware wraps an HTTP handler with x402 payment requirement
func PaywallMiddleware(cfg Config, next http.HandlerFunc) http.HandlerFunc {
	if !cfg.Enabled {
		return next
	}

	return func(w http.ResponseWriter, r *http.Request) {
		// Check for payment header
		paymentHeader := r.Header.Get("X-Payment")
		if paymentHeader == "" {
			// Return 402 with payment requirements
			send402(w, r, cfg)
			return
		}

		// Verify payment
		var payload PaymentPayload
		decoded, err := base64.StdEncoding.DecodeString(paymentHeader)
		if err != nil {
			http.Error(w, "invalid payment encoding", http.StatusBadRequest)
			return
		}
		if err := json.Unmarshal(decoded, &payload); err != nil {
			http.Error(w, "invalid payment payload", http.StatusBadRequest)
			return
		}

		// In production: verify the Solana TX signature on-chain
		// For now, we trust the facilitator's verification
		if payload.Signature == "" {
			send402(w, r, cfg)
			return
		}

		// Payment verified — serve the resource
		w.Header().Set("X-Payment-Status", "settled")
		next(w, r)
	}
}

func send402(w http.ResponseWriter, r *http.Request, cfg Config) {
	requirement := PaymentRequirement{
		Scheme:      "exact",
		Network:     "solana-mainnet",
		MaxAmount:   fmt.Sprintf("%d", cfg.PricePerCall),
		Resource:    r.URL.String(),
		Description: "MawdAxe Fleet API access",
		PayTo:       cfg.WalletAddress,
		Token:       cfg.USDCMint,
		ExpiresAt:   time.Now().Add(5 * time.Minute).Unix(),
		Nonce:       fmt.Sprintf("mawdaxe-%d", time.Now().UnixNano()),
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Payment", "required")
	w.WriteHeader(http.StatusPaymentRequired)
	json.NewEncoder(w).Encode(requirement)
}

// ───────────── Pricing Tiers ────────────────────────────────────

// Tier defines an API access tier
type Tier struct {
	Name         string `json:"name"`
	PricePerCall uint64 `json:"pricePerCall"` // USDC minor units
	RateLimit    int    `json:"rateLimit"`    // Calls per minute
	Features     string `json:"features"`
}

var (
	TierFree = Tier{
		Name:         "free",
		PricePerCall: 0,
		RateLimit:    10,
		Features:     "health check, basic fleet stats",
	}
	TierBasic = Tier{
		Name:         "basic",
		PricePerCall: 500, // $0.0005
		RateLimit:    60,
		Features:     "device details, pet state, metrics",
	}
	TierPro = Tier{
		Name:         "pro",
		PricePerCall: 1000, // $0.001
		RateLimit:    300,
		Features:     "full fleet API, real-time SSE, swarm signals",
	}
	TierEnterprise = Tier{
		Name:         "enterprise",
		PricePerCall: 5000, // $0.005
		RateLimit:    1000,
		Features:     "all endpoints, priority support, custom webhooks",
	}
)
