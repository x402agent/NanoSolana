---
summary: "Solana Claude Go features overview and capabilities"
title: "Features"
---

# Features

Solana Claude Go is a monorepo for autonomous Solana agents, registry tooling, and Pump integrations.

## Core capabilities

### 🤖 Autonomous trading (OODA loop)
- **Observe**: Real-time Solana data via Helius RPC/WSS and Birdeye API.
- **Orient**: AI-powered market analysis using OpenRouter (healer-alpha model).
- **Decide**: Structured trade decisions with confidence scoring.
- **Act**: Jupiter Ultra Swap execution with slippage protection.
- **Learn**: ScgVault memory records every outcome for future improvement.

### 🧩 Runtime + bridge split
- `nano-core/` is the shipped runtime and npm package.
- `pump/` is a Solana Claude Go-facing Pump bridge layer for swarm operations.
- `pump-fun-sdk-main/` is vendored upstream ecosystem code used by the bridge.
- `nanohub/` is a separate skill registry app and CLI.

### 🧠 Epistemological memory (ScgVault)
- **KNOWN**: Fresh API data (<60s TTL) — what the agent just saw.
- **LEARNED**: Patterns from trade outcomes (7-day TTL) — what worked.
- **INFERRED**: Tentative correlations (3-day TTL) — hypotheses to test.
- Temporal decay, experience replay, and contradiction detection.

### 🐾 TamaGOchi pet engine
- Virtual pet that evolves based on trading performance.
- Stages: Egg → Larva → Juvenile → Adult → Alpha → Ghost.
- Mood affects risk tolerance (happy = more aggressive, sick = conservative).
- Feed to keep alive; neglect leads to Ghost state (trading disabled).

### 💰 Solana wallet
- Ed25519 keypair generated at agent "birth."
- Private key stored in AES-256-GCM encrypted vault.
- SOL and SPL token balance tracking.
- Transaction history and P&L tracking.

### 🌐 Mesh networking
- Tailscale VPN for agent-to-agent communication.
- Tmux session management for bot persistence.
- Memory and signal sharing across the mesh.

### 📱 Multi-channel
- **Telegram**: Persistent conversations with full memory.
- **Discord**: Trading signals and alerts.
- **Nostr**: Decentralized signal relay.
- **iMessage**: Apple Messages integration.
- **Google Chat**: Team notifications.
- This checkout contains 41 extension directories.
- 41 of those directories are now discoverable through the merged extension catalog.
- 38 ship `openclaw.plugin.json`, and 14 also ship `scg-plugin.json`.
- `extensions/pumpfun/` is a dedicated PumpFun event bridge scaffold.

### 🔐 Security-first
- AES-256-GCM encrypted secrets vault.
- HMAC-SHA256 authenticated gateway connections.
- Timing-safe token comparison.
- Rate limiting on all endpoints.
- Wallet private key never leaves the vault.

### 📊 Strategy engine
- RSI + EMA + ATR indicator system.
- Auto-optimizer adjusts parameters after every 20 trades.
- Kelly Criterion position sizing.
- Configurable stop-loss and take-profit.

### 🤝 AI integration
- OpenRouter API with healer-alpha multimodal model.
- SOUL.md system prompt defines agent identity and philosophy.
- Multimodal input support (text, image, audio, video).
- OODA-structured reasoning (orient, decide, research, chat).

### 💳 Tokenized agent payments

- On-chain invoice system powered by `@pump-fun/agent-payments-sdk`.
- `NanoPaymentAgent` class wraps `PumpAgent` for invoice creation, PDA derivation, and verification with retries.
- Supports USDC (6 decimals) and Wrapped SOL (9 decimals) as payment currencies.
- Invoice ID PDAs prevent duplicate payments on-chain.
- Payment-gated swarm spawning: require payment before spawning new agents.
- CLI: `scg pay invoice`, `scg pay verify`, `scg pay status`.
- Telegram: `/invoice` and `/invoices` commands for creating and tracking invoices.
- Program ID: `AgenTMiC2hvxGebTsgmsD4HHBa8WEcqGFf87iwRRxLo7`.

### 🐋 Pump ecosystem integration
- `nano-core/src/claw/pump/sdk-bridge.ts` exposes token price, graduation progress, and quote helpers.
- `nano-core/src/claw/pump/swarm-spawner.ts` manages role-based Pump agents with optional payment gating.
- `nano-core/src/claw/pump/telegram-gateway.ts` provides Telegram control over the Pump swarm, including `/invoice` and `/invoices`.
- `nano-core/src/claw/pump/bot-registry.ts` maps bots, packages, services, env vars, and health endpoints.
- `pump/docs/` contains 83 repo-local Pump docs.
- `skills/` includes 24 Pump and PumpFun-oriented skill packs.
