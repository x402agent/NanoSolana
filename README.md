# NanoSolana — The Complete Guide

> The Open-Source Agentic Framework for Financial Intelligence on Solana

```
    ███╗   ██╗ █████╗ ███╗   ██╗ ██████╗ ███████╗ ██████╗ ██╗      █████╗ ███╗   ██╗ █████╗
    ████╗  ██║██╔══██╗████╗  ██║██╔═══██╗██╔════╝██╔═══██╗██║     ██╔══██╗████╗  ██║██╔══██╗
    ██╔██╗ ██║███████║██╔██╗ ██║██║   ██║███████╗██║   ██║██║     ███████║██╔██╗ ██║███████║
    ██║╚██╗██║██╔══██║██║╚██╗██║██║   ██║╚════██║██║   ██║██║     ██╔══██║██║╚██╗██║██╔══██║
    ██║ ╚████║██║  ██║██║ ╚████║╚██████╔╝███████║╚██████╔╝███████╗██║  ██║██║ ╚████║██║  ██║
    ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
```

<<<<<<< Updated upstream
<div align="center">

[![npm version](https://img.shields.io/npm/v/nanosolana?color=14F195&style=for-the-badge)](https://npmjs.com/package/nanosolana)
[![npm downloads](https://img.shields.io/npm/dm/nanosolana?color=9945FF&style=for-the-badge)](https://npmjs.com/package/nanosolana)
[![GitHub stars](https://img.shields.io/github/stars/x402agent/NanoSolana?color=14F195&style=for-the-badge)](https://github.com/x402agent/NanoSolana/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-14F195.svg?style=for-the-badge)](LICENSE)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Solana](https://img.shields.io/badge/Solana-Native-9945FF?style=flat-square&logo=solana&logoColor=white)](https://solana.com)
[![Go](https://img.shields.io/badge/Go-TamaGObot-00ADD8?style=flat-square&logo=go&logoColor=white)](https://golang.org)
[![Node](https://img.shields.io/badge/Node-%E2%89%A522-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![CI](https://img.shields.io/github/actions/workflow/status/x402agent/NanoSolana/ci.yml?label=CI&style=flat-square)](https://github.com/x402agent/NanoSolana/actions)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-14F195?style=flat-square)](CONTRIBUTING.md)
[![Discord](https://img.shields.io/badge/Discord-Join-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.gg/nanosolana)

</div>

**NanoSolana** is a modular, security-first framework for building autonomous financial agents on Solana. Deploy AI-powered trading agents that observe markets in real-time, learn from every trade, and coordinate across a decentralized mesh network — all with one command.
=======
**NanoSolana** is a modular, security-first framework for building autonomous financial agents on Solana. Deploy AI-powered trading agents with 43+ distinct DeFi personalities, direct Pump.fun protocol access, epistemological memory, and multi-bot swarm coordination — all with one command.
>>>>>>> Stashed changes

**Website:** [nanosolana.com](https://nanosolana.com) · **Hub:** [hub.nanosolana.com](https://hub.nanosolana.com) · **Docs:** [docs.nanosolana.com](https://docs.nanosolana.com) · **GitHub:** [github.com/x402agent/NanoSolana](https://github.com/x402agent/NanoSolana)

### 🎮 Try It Now (No API Keys Needed)

```bash
npx nanosolana demo
```

### ⚡ Deploy for Real

```bash
npx nanosolana go
```

### 🎯 Why NanoSolana?

| Feature | NanoSolana | Eliza | AutoGPT | LangChain |
|---------|:---------:|:-----:|:-------:|:---------:|
| Built for finance | ✅ | ❌ | ❌ | ❌ |
| Epistemological memory | ✅ 3-tier | ❌ | ❌ | Partial |
| OODA trading loop | ✅ | ❌ | ❌ | ❌ |
| Encrypted vault | ✅ AES-256 | ❌ .env | ❌ .env | ❌ .env |
| On-chain identity | ✅ NFT | ❌ | ❌ | ❌ |
| Mesh networking | ✅ P2P | ❌ | ❌ | ❌ |
| One-command deploy | ✅ | ❌ | ❌ | ❌ |


---

## Table of Contents

1. [Why NanoSolana?](#1-why-nanosolana)
2. [Quick Start](#2-quick-start)
3. [Architecture & Core Concepts](#3-architecture--core-concepts)
4. [The OODA Trading Loop](#4-the-ooda-trading-loop)
5. [ClawVault: Epistemological Memory](#5-clawvault-epistemological-memory)
6. [Trading Engine & Strategy](#6-trading-engine--strategy)
7. [TamaGOchi: The Pet That Trades](#7-tamagochi-the-pet-that-trades)
8. [Pump.fun Protocol Integration](#8-pumpfun-protocol-integration)
9. [Agent Swarm & Bot Manager](#9-agent-swarm--bot-manager)
10. [🧬 Agent Personas (43+ Personalities)](#10--agent-personas-43-personalities)
11. [MawdBot: Containerized Agent Orchestrator](#11-mawdbot-containerized-agent-orchestrator)
12. [Security Architecture](#12-security-architecture)
13. [On-Chain Identity](#13-on-chain-identity)
14. [Mesh Networking](#14-mesh-networking)
15. [Gateway Architecture](#15-gateway-architecture)
16. [Sessions & Persistence](#16-sessions--persistence)
17. [Multi-Channel Communication](#17-multi-channel-communication)
18. [NanoBot Interactive UI](#18-nanobot-interactive-ui)
19. [Chrome Extension](#19-chrome-extension)
20. [TamaGObot: The Go Implementation](#20-tamagobot-the-go-implementation)
21. [Hardware Integration (Arduino Modulino®)](#21-hardware-integration-arduino-modulino)
22. [x402 Payment Protocol](#22-x402-payment-protocol)
23. [Platform Apps (macOS, Android)](#23-platform-apps-macos-android)
24. [NanoHub: Agent Registry & Skills](#24-nanohub-agent-registry--skills)
25. [Deployment & Infrastructure](#25-deployment--infrastructure)
26. [Configuration Reference](#26-configuration-reference)
27. [CLI Reference](#27-cli-reference)
28. [Monorepo Structure](#28-monorepo-structure)
29. [Contributing](#29-contributing)

---

## 1. Why NanoSolana?

The financial world is being rebuilt by autonomous agents. But today's agent frameworks are fundamentally flawed for finance:

- **Built for chat, not finance** — retrofitting chatbots for trading is dangerous
- **Stateless** — they forget every trade, every lesson, every pattern
- **Siloed** — each agent is an island with no coordination
- **Insecure** — API keys in `.env` files, no encryption, no audit trail
- **No protocol access** — wrappers around HTTP APIs instead of direct on-chain programs

NanoSolana is built from the ground up for financial agents:

- **OODA Trading Loop** — military-grade decision cycle (Observe → Orient → Decide → Act → Learn)
- **Epistemological Memory** — 3-tier ClawVault that distinguishes facts from patterns from hypotheses
- **43+ Agent Personas** — specialized DeFi personalities from whale watchers to yield farmers
- **Direct Pump.fun Protocol** — native IDL access for token creation, bonding curves, AMM pools, fees
- **Bot Swarm Manager** — orchestrate multiple bots with health checks, auto-restart, and event routing
- **Mesh Coordination** — agents share signals and lessons across a Tailscale VPN mesh
- **Vault-Encrypted Secrets** — AES-256-GCM for every API key and private key, always
- **On-Chain Identity** — every agent mints a Metaplex NFT birth certificate at creation

NanoSolana ships in two implementations: a full-featured **TypeScript runtime** (`nano-core`) for rapid development and extensibility, and an ultra-lightweight **Go binary** (`TamaGObot`) that runs on anything from an NVIDIA Orin Nano to a Raspberry Pi in under 10MB.

---

## 2. Quick Start

### One-Command Deploy

```bash
npx nanosolana go
```

That's it. `nanosolana go` handles init → wallet → birth certificate NFT → blockchain scan → on-chain identity → OODA trading loop → gateway — all in one shot.

### Alternative Install Methods

```bash
# Global npm install
npm install -g nanosolana
nanosolana go

# Shell install script
curl -fsSL https://nanosolana.com/install.sh | bash

# From source
git clone https://github.com/x402agent/NanoSolana.git
cd NanoSolana/nano-core
npm install
npm run nanosolana -- go
```

If `nanosolana` is not found right after install, load your PATH:

```bash
export PATH="$HOME/.nanosolana/bin:$PATH"
nanosolana --version
```

### Step-by-Step (if you prefer control)

```bash
nanosolana init      # Configure API keys (encrypted at rest)
nanosolana birth     # Create Solana wallet + mint Birth Certificate NFT
nanosolana run       # Start the OODA trading loop
```

### Start the Swarm

```bash
npm run swarm        # Start PumpFun agent swarm
npm run claw         # Start MawdBot orchestrator
npm run claw:dev     # MawdBot with hot reload
```

### Fun Stuff

```bash
nanosolana scan        # Instant blockchain data scan (SOL, tokens, NFTs, tx history)
nanosolana dvd         # Floating DVD screensaver in your terminal
nanosolana lobster     # Animated Unicode lobster mascot
nanosolana nanobot     # Launch interactive web UI companion
nanosolana register    # Mint on-chain identity NFT (devnet)
nanosolana registry    # View your on-chain agent identity
```

### Required API Keys

| Key | Source | Required |
|-----|--------|----------|
| `OPENROUTER_API_KEY` | [openrouter.ai](https://openrouter.ai) | Yes |
| `HELIUS_RPC_URL` | [helius.dev](https://helius.dev) | Yes |
| `HELIUS_API_KEY` | [helius.dev](https://helius.dev) | Yes |
| `HELIUS_WSS_URL` | [helius.dev](https://helius.dev) | Recommended |
| `BIRDEYE_API_KEY` | [birdeye.so](https://birdeye.so) | Recommended |
| `JUPITER_API_KEY` | [jup.ag](https://jup.ag) | For trading |
| `TELEGRAM_BOT_TOKEN` | [@BotFather](https://t.me/BotFather) | For Telegram |

All keys are encrypted with AES-256-GCM in the local vault. Never stored in plaintext.

---

## 3. Architecture & Core Concepts

### System Overview

NanoSolana is a modular runtime for deploying autonomous financial agents on Solana. Every agent is a self-contained process that observes markets, reasons about data, executes trades, and learns from outcomes — all running inside a security-hardened loop.

The system is organized into four layers:

```
┌─────────────────────────────────────────────────────────┐
│                    AGENT RUNTIME                        │
│     OODA Loop · ClawVault · Strategy · 43+ Personas     │
├─────────────────────────────────────────────────────────┤
│                   PUMP.FUN PROTOCOL                      │
│  Bonding Curves · AMM Pools · Fees · Token Creation      │
├─────────────────────────────────────────────────────────┤
│                  INFRASTRUCTURE                         │
│  Vault · Gateway · Mesh · On-Chain ID · Bot Manager      │
├─────────────────────────────────────────────────────────┤
│                    INTERFACES                           │
│  CLI · Telegram · Discord · WhatsApp · NanoBot · Chrome  │
└─────────────────────────────────────────────────────────┘
```

**Agent Runtime** — the brain. Houses the OODA trading loop, epistemological memory, AI reasoning, agent personas, and strategy execution.

**Pump.fun Protocol** — native on-chain access via the official Pump SDK IDLs. Token creation, bonding curve math, AMM trading, fee sharing, volume rewards.

**Infrastructure** — the skeleton. Encrypted secrets, authenticated gateways, peer-to-peer mesh, bot lifecycle management, and Solana wallet/NFT identity.

**Interfaces** — the skin. Every surface a human (or another agent) can use to interact with a running NanoSolana instance.

### Full Daemon Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                    NanoSolana Daemon                                  │
│                                                                      │
│  1. Agentic Wallet   ─  auto-gen/load Solana keypair                │
│  2. Solana RPC       ─  Helius mainnet + DAS API                    │
│  3. TamaGOchi        ─  virtual pet engine (on-chain driven)        │
│  4. Telegram         ─  bot channel (if configured)                  │
│  5. x402 Gateway     ─  SVM signer + paywall server                │
│  6. Channels         ─  multi-channel message routing                │
│  7. NanoBot UI       ─  interactive widget (wallet, chat, tools)    │
│  8. Heartbeat        ─  periodic health + balance checks             │
│  9. MawdBot          ─  containerized agent orchestrator            │
│ 10. PumpFun Swarm    ─  multi-bot trading coordination              │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────┐│
│  │ NanoBot  │  │  OODA    │  │ TamaGOchi│  │  Pump    │  │MawdBot││
│  │ UI+API   │  │  Agent   │  │  Pet     │  │  Swarm   │  │ Claw  ││
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──┬────┘│
│       │              │              │              │           │     │
│  ┌────▼──────────────▼──────────────▼──────────────▼───────────▼──┐ │
│  │       Message Bus + DAS API + Event Bus + Hardware Adapter     │ │
│  └──────────────────────────┬────────────────────────────────────┘ │
│                             │                                      │
│  ┌──────────────────────────▼────────────────────────────────────┐ │
│  │      Pump SDK (IDL) · Jupiter · Birdeye · Helius · Wallet     │ │
│  └──────────────────────────┬────────────────────────────────────┘ │
│                             │                                      │
│  ┌──────────────────────────▼────────────────────────────────────┐ │
│  │  Solana Mainnet (Helius RPC/WSS + DAS + Jupiter + Birdeye)   │ │
│  └───────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### Core Module Map (TypeScript — nano-core)

```
nano-core/src/
├── ai/              → OpenRouter AI provider (multimodal: text, image, audio, video)
├── cli/             → nanosolana CLI (25+ commands)
├── config/          → AES-256-GCM encrypted vault & Zod-validated config
├── gateway/         → HMAC-SHA256 authenticated WebSocket + HTTP server
├── hub/             → NanoHub bridge for UI communication
├── memory/          → ClawVault 3-tier epistemological memory engine
├── network/         → Tailscale + tmux mesh networking
├── nft/             → Metaplex gasless devnet birth certificate NFT
├── onchain/         → Helius blockchain reader (DAS, Enhanced Tx, wallet scan)
├── registry/        → On-chain agent identity (Metaplex NFT registration)
├── nanobot/         → Interactive local web UI companion
├── pet/             → TamaGOchi virtual pet engine (mood × risk)
├── strategy/        → RSI + EMA + ATR auto-optimizer
├── telegram/        → Persistent conversation store (200 msg/chat)
├── trading/         → OODA trading engine + Jupiter swap execution
├── wallet/          → Solana Ed25519 wallet manager
└── claw/            → ★ MawdBot + PumpFun Swarm (integrated)
    ├── channels/    →   WhatsApp channel integration
    ├── personas/    →   43 DeFi agent personality JSONs
    ├── pump/        →   PumpFun swarm module
    │   ├── sdk/     →   ★ Native Pump.fun SDK (IDL + protocol math)
    │   │   ├── idl/ →     On-chain program IDLs (pump, pump_amm, pump_fees)
    │   │   ├── sdk.ts →   PumpSdk offline instruction builder
    │   │   ├── onlineSdk.ts → OnlinePumpSdk with RPC fetchers
    │   │   ├── bondingCurve.ts → Bonding curve math
    │   │   ├── analytics.ts → Price impact, graduation progress
    │   │   ├── fees.ts → Fee tier calculation
    │   │   └── ...  →   pda, state, errors, fallback, tokenIncentives
    │   ├── bot-manager.ts  →   Bot lifecycle manager
    │   ├── bot-registry.ts →   Bot discovery & config registry
    │   ├── event-bus.ts    →   In-process pub/sub event bus
    │   ├── logger.ts       →   Leveled structured logger
    │   ├── swarm-spawner.ts →  Agent lifecycle + persona + memory
    │   ├── telegram-gateway.ts → Telegram command interface
    │   └── types.ts        →   Shared types
    ├── persona-loader.ts   →   Agent persona system
    ├── container-runner.ts →   Docker agent runner
    ├── db.ts               →   SQLite persistence
    ├── config.ts           →   MawdBot config
    ├── router.ts           →   Message routing
    ├── task-scheduler.ts   →   Cron task scheduler
    └── index.ts            →   Claw orchestrator entry
```

---

## 4. The OODA Trading Loop

NanoSolana's core execution model is the **OODA loop** — a military decision-making framework adapted for autonomous trading.

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ OBSERVE  │──▶│  ORIENT  │──▶│  DECIDE  │──▶│   ACT    │
│          │   │          │   │          │   │          │
│ Helius   │   │ OpenRouter│   │ Signal   │   │ Jupiter  │
│ Birdeye  │   │ AI Model │   │ Scoring  │   │ Swaps    │
│ PumpSDK  │   │ Persona  │   │ ClawVault│   │ PumpFun  │
└──────────┘   └──────────┘   └──────────┘   └────┬─────┘
     ▲                                             │
     │              ┌──────────┐                   │
     └──────────────│  LEARN   │◀──────────────────┘
                    │ClawVault │
                    └──────────┘
```

### Phase 1 — Observe
Pull real-time data: Helius RPC (on-chain state, DAS), Birdeye (prices, volume), Pump SDK (bonding curves, fees), WebSocket feeds, wallet state. All enters ClawVault KNOWN tier (60s TTL).

### Phase 2 — Orient
Feed observations + memory + strategy params + TamaGOchi mood + agent persona + SOUL.md to AI model via OpenRouter. Returns market regime classification and directional bias.

### Phase 3 — Decide
Strategy engine combines AI orientation with RSI + EMA + ATR signals. Confidence scoring: RSI strength (30%) + EMA crossover (30%) + Volume (20%) + Memory patterns (20%). Only confidence ≥ 0.7 advances.

### Phase 4 — Act
Execute via Jupiter Ultra Swap or Pump SDK direct: dynamic slippage (1-3%), Kelly Criterion sizing, max 50% wallet per position, -10% daily loss circuit breaker, TamaGOchi mood modifier.

### Phase 5 — Learn
Experience replay on last 20 trades. Promote patterns to LEARNED tier. Generate hypotheses in INFERRED tier. Run contradiction detection. Update research agenda. Broadcast lessons to mesh.

---

## 5. ClawVault: Epistemological Memory

| Tier | TTL | Status | Example |
|------|-----|--------|---------|
| **KNOWN** | 60s | Empirical fact | "SOL is at $142.50 right now" |
| **LEARNED** | 7 days | Validated pattern | "RSI < 30 + volume spike → 72% bounce rate" |
| **INFERRED** | 3 days | Hypothesis | "This token might correlate with BTC moves" |

**Temporal Decay** — auto GC every 5 min. **Experience Replay** — post-trade pattern analysis. **Contradiction Detection** — new facts drop invalid hypotheses. **Research Agenda** — open questions prioritized in next OODA cycle.

Each swarm agent gets its own ClawVault instance at birth. Persona identity is imprinted as LEARNED memory. Opening questions become research agenda items.

---

## 6. Trading Engine & Strategy

### RSI + EMA + ATR Auto-Optimizer

| Parameter | Default | Description |
|-----------|---------|-------------|
| RSI Period | 14 | Wilder's RSI |
| RSI Overbought | 70 | Short signal zone |
| RSI Oversold | 30 | Long signal zone |
| EMA Fast | 12/20 | Fast moving average |
| EMA Slow | 26/50 | Slow moving average |
| ATR Period | 14 | Average True Range |

Auto-optimizes every 20 trades based on rolling Sharpe ratio. Execution via Jupiter Ultra Swap or native Pump SDK with slippage protection.

### Risk Management

| Control | Value |
|---------|-------|
| Max position | 50% of wallet |
| Daily loss limit | -10% → paused 24h |
| Max slippage | 3% hard cap |
| Minimum reserve | 0.01 SOL for gas |
| Position sizing | Kelly Criterion |
| TamaGOchi mood | ±30% modifier |

---

## 7. TamaGOchi: The Pet That Trades

```
🥚 Egg → 🐛 Larva → 🐣 Juvenile → 🦞 Adult → 👑 Alpha → 👻 Ghost
```

| Mood | Trigger | Risk Effect |
|------|---------|-------------|
| 😊 Happy | Recent wins | +10% position |
| 😐 Content | Normal | No change |
| 🤤 Hungry | Not fed in 24h | -10% position |
| 😢 Sad | Recent losses | -15% position |
| 🤒 Sick | Losses + hunger | -30% position |
| 👻 Ghost | Health = 0 | **Trading disabled** |

Neglect your agent → trading de-risks → eventually halts. A dead man's switch built into the design.

---

## 8. Pump.fun Protocol Integration

NanoSolana includes the **native Pump SDK** — the official TypeScript SDK for the Pump.fun protocol on Solana. This gives every agent direct, offline-first access to on-chain operations without HTTP API wrappers.

### On-Chain Programs

| Program | ID | Purpose |
|---------|----|---------|
| **Pump** | `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P` | Bonding curve creation, buying, selling, migration |
| **PumpAMM** | `pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA` | Graduated AMM pools — trading, liquidity, fees |
| **PumpFees** | `pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ` | Fee sharing config and social fee PDAs |

### SDK Capabilities

| Module | Functions |
|--------|-----------|
| **sdk.ts** | `PumpSdk` — offline instruction builder for create, buy, sell, migrate, set creator, fee sharing |
| **onlineSdk.ts** | `OnlinePumpSdk` — extends PumpSdk with RPC fetchers for bonding curve state, graduation progress |
| **bondingCurve.ts** | `getBuyTokenAmountFromSolAmount`, `getSellSolAmountFromTokenAmount`, `bondingCurveMarketCap` |
| **analytics.ts** | `calculateBuyPriceImpact`, `calculateSellPriceImpact`, `getGraduationProgress`, `getTokenPrice` |
| **fees.ts** | `getFee`, `computeFeesBps`, `calculateFeeTier` — tiered fee calculation by market cap |
| **state.ts** | All account state types: `BondingCurve`, `Global`, `Pool`, `FeeConfig`, `TradeEvent`, etc. |
| **pda.ts** | PDA derivation: `bondingCurvePda`, `creatorVaultPda`, `canonicalPumpPoolPda`, etc. |
| **tokenIncentives.ts** | `totalUnclaimedTokens`, `currentDayTokens` — $PUMP reward tracking |
| **fallback.ts** | Multi-endpoint RPC fallback with automatic failover |
| **errors.ts** | Typed error hierarchy for fee sharing validation |

### IDL Files

The protocol IDLs live at `nano-core/src/claw/pump/sdk/idl/`:

| File | Description |
|------|-------------|
| `pump.json` / `pump.ts` | Pump bonding curve program IDL |
| `pump_amm.json` / `pump_amm.ts` | PumpAMM graduated pool program IDL |
| `pump_fees.json` / `pump_fees.ts` | PumpFees fee-sharing program IDL |

### Usage Example

```typescript
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

// The SDK is re-exported from nano-core
import { PUMP_SDK, OnlinePumpSdk, getBuyTokenAmountFromSolAmount } from "nanosolana";

// Create an online SDK instance
const connection = new Connection(process.env.HELIUS_RPC_URL!);
const sdk = new OnlinePumpSdk(connection);

// Fetch bonding curve state
const mint = new PublicKey("YourTokenMint...");
const summary = await sdk.fetchBondingCurveSummary(mint);
console.log("Market Cap:", summary.marketCap.toString(), "lamports");
console.log("Graduated:", summary.isGraduated);

// Build buy instructions (offline — no RPC needed for instruction building)
const buyIxs = await PUMP_SDK.buyInstructions({ /* ... */ });
```

### Key Constants

| Constant | Value |
|----------|-------|
| `PUMP_PROGRAM_ID` | `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P` |
| `PUMP_AMM_PROGRAM_ID` | `pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA` |
| `PUMP_FEE_PROGRAM_ID` | `pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ` |
| `PUMP_TOKEN_MINT` | `pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn` |
| `MAX_SHAREHOLDERS` | `10` |
| `ONE_BILLION_SUPPLY` | `1000000000000000` |

---

## 9. Agent Swarm & Bot Manager

The swarm manages multiple trading bots as child processes with real-time event routing:

### Bot Registry

| Bot | Description |
|-----|-------------|
| 🔔 `telegram-bot` | PumpFun Fee Monitor (Grammy) — CTO alerts, whale trades, DMs |
| 📺 `channel-bot` | Read-only Telegram channel feed — launches, graduations |
| 💸 `claim-bot` | Fee claim tracker and auto-claimer |
| 👥 `outsiders-bot` | Call tracking with leaderboards, PNL cards, win rates |
| 🤖 `swarm-bot` | Multi-strategy trading: sniper, momentum, graduation, market-maker |
| 🌐 `websocket-server` | Real-time token launch broadcasts via WebSocket |

### Agent Roles

| Role | Description |
|------|-------------|
| 🎯 `sniper` | Snipe new token launches instantly |
| 📡 `monitor` | Watch on-chain events and broadcast alerts |
| 💸 `fee-claimer` | Claim accumulated creator fees |
| 📊 `analyst` | Analyze prices, curves, and graduation progress |
| 📈 `momentum` | Trade based on price momentum signals |
| 🎓 `graduation` | Target tokens nearing bonding curve graduation |
| 🏦 `market-maker` | Provide liquidity via buy/sell oscillation |
| 🚀 `launcher` | Create and launch new tokens on Pump.Fun |
| 📺 `channel-feed` | Post events to a Telegram channel |
| 👥 `outsider` | Call tracking with leaderboards & PNL |

### Event Bus

All bots communicate via an in-process pub/sub event bus:

```
telegram-bot ──▶ ┌─────────────┐ ──▶ dashboard
channel-bot  ──▶ │  Event Bus  │ ──▶ alerts
swarm-bot    ──▶ │  (pub/sub)  │ ──▶ telegram-gateway
websocket    ──▶ └─────────────┘ ──▶ metrics
```

**Event types:** `token:launch`, `token:graduation`, `trade:buy`, `trade:sell`, `trade:whale`, `fee:claim`, `alert:cto`, `alert:whale`, `call:new`, `bot:started`, `bot:stopped`, `bot:error`, `system:metric`

### Telegram Commands

| Command | Description |
|---------|-------------|
| `/swarm` | Dashboard overview |
| `/spawn <role> [--persona <id>]` | Spawn agent with optional personality |
| `/personas [query]` | Browse/search 43+ agent personas |
| `/stop <id>` | Stop an agent |
| `/agents` | List agents (with persona & memory stats) |
| `/health` | Swarm health + collective memory |
| `/memory <id>` | Agent's epistemological memory vault |
| `/price <mint>` | Token price lookup |
| `/quote <mint> <sol>` | Buy/sell quote |
| `/curve <mint>` | Bonding curve state |
| `/fees <mint>` | Fee tier info |
| `/events` | Recent swarm events |
| `/help` | Command reference |

---

## 10. 🧬 Agent Personas (43+ Personalities)

Every swarm agent can be born with a specialized DeFi personality. Personas define the agent's expertise, communication style, opening questions, and knowledge domain.

### Persona Categories

| Category | Count | Examples |
|----------|-------|---------|
| 🪙 **Crypto** | 6 | Whale Watcher, Crypto News Analyst, Alpha Leak Detector |
| 🏦 **DeFi** | 14 | Yield Farmer, Liquidity Pool Analyzer, DEX Aggregator, Flash Loan Analyst |
| 📈 **Trading** | 5 | Pump.fun SDK Expert, Staking Rewards Calculator, MEV Researcher |
| 🔒 **Security** | 6 | Smart Contract Auditor, Bridge Security Analyst, Rug Pull Detective |
| 📚 **Education** | 2 | DeFi Onboarding Mentor, APY vs APR Educator |
| 📁 **Governance** | 3 | Governance Proposal Analyst, Sperax Governance Guide |
| 📁 **Tools** | 6 | Vespa Optimizer, Yield Dashboard Builder, Token Unlock Tracker |
| 🧑‍💻 **Programming** | 1 | Pump.fun SDK Expert |

### How Personas Work

1. **At spawn:** User selects a persona via `/spawn analyst --persona whale-watcher`
2. **Identity imprint:** Persona's role, avatar, and description are stored in ClawVault LEARNED memory
3. **System prompt:** A composite prompt is built combining persona expertise + Solana context + memory awareness
4. **Research agenda:** The persona's opening questions seed the agent's research gaps
5. **Personality persistence:** The ClawVault ensures the agent retains its personality across restarts

### Browse & Search

```bash
# Telegram
/personas                    # List all 43+ personas by category
/personas whale              # Search by keyword
/personas trading            # Filter by category
/personas pump-fun-sdk-expert  # View specific persona details

# Programmatic
import { loadAllPersonas, getPersona, searchPersonas } from 'nanosolana';

const all = loadAllPersonas();           // 43 personas
const whale = getPersona('whale-watcher');
const matches = searchPersonas('security');
```

### Persona JSON Format

Each persona is a JSON file in `nano-core/src/claw/personas/`:

```json
{
  "config": {
    "systemRole": "You are a Crypto Whale Watcher...",
    "openingMessage": "I track the ocean's biggest movers...",
    "openingQuestions": [
      "Want me to track a specific whale wallet?",
      "Should I analyze recent large transactions?"
    ]
  },
  "meta": {
    "title": "Crypto Whale Watcher",
    "avatar": "🐋",
    "description": "Tracks large wallet movements on-chain...",
    "tags": ["on-chain", "whale", "analytics", "trading"]
  }
}
```

---

## 11. MawdBot: Containerized Agent Orchestrator

MawdBot (formerly NanoClaw) is the containerized agent orchestrator integrated directly into nano-core at `src/claw/`. It manages agent lifecycles inside Docker containers with security-hardened mounts.

### Components

| Module | Purpose |
|--------|---------|
| `container-runner.ts` | Docker container management with secure mount isolation |
| `db.ts` | SQLite persistence for chat history, sessions, groups |
| `router.ts` | Multi-channel message routing |
| `task-scheduler.ts` | Cron-based task automation |
| `group-queue.ts` | Group message processing queue |
| `ipc.ts` | Container ↔ host inter-process communication |
| `whatsapp-auth.ts` | WhatsApp QR code authentication |
| `mount-security.ts` | Container mount path validation and sandboxing |

### npm Scripts

```bash
npm run claw         # Start MawdBot orchestrator
npm run claw:dev     # MawdBot with hot reload (tsx)
npm run swarm        # Start PumpFun swarm
npm run auth         # WhatsApp QR authentication
```

---

## 12. Security Architecture

| Layer | Protection |
|-------|------------|
| **Secrets** | AES-256-GCM vault with PBKDF2 |
| **Gateway** | HMAC-SHA256 on every connection |
| **Comparison** | `crypto.timingSafeEqual` always |
| **Rate Limit** | 10 conn/min, 100 msg/min |
| **Permissions** | `0600` files, `0700` dirs |
| **Wallet** | Ed25519 key never leaves vault |
| **Containers** | Mount-path sandboxing, no host access |
| **Bot Envs** | Per-bot `.env` files with `0600` permissions |
| **Audit** | `nanosolana security audit --deep` |

---

## 13. On-Chain Identity

Every agent mints **Metaplex NFTs** on devnet:

- **Birth Certificate** — creation timestamp, config hash, version
- **Identity NFT** — public key, version, skills, SHA-256 fingerprint

Blockchain scan at birth via Helius: DAS API, Enhanced Transactions, Priority Fees, Wallet Snapshot.

---

## 14. Mesh Networking

Agents form P2P mesh over Tailscale VPN:

| Shared | Never Shared |
|--------|-------------|
| Trading signals | Wallet keys |
| Learned patterns | Private keys |
| Price feeds | |
| Pet status | |

```bash
nanosolana nodes                    # Discover peers
nanosolana send "check SOL RSI"     # Broadcast
```

---

## 15. Gateway Architecture

HMAC-SHA256 authenticated WebSocket + HTTP gateway. Wire protocol: JSON text frames.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Liveness (no auth) |
| `/api/status` | GET | Full agent status |
| `/api/framework` | GET | Framework metadata |
| `/api/memory` | GET | Memory stats |

---

## 16. Sessions & Persistence

| Type | Key Format |
|------|-----------:|
| Main | `agent:main:main` |
| Telegram DM | `agent:main:telegram:<chatId>` |
| Discord | `agent:main:discord:<channelId>` |
| WhatsApp | `agent:main:whatsapp:<jid>` |
| Trading | `agent:main:trading` |

---

## 17. Multi-Channel Communication

| Channel | Persistence | Plugin |
|---------|-------------|--------|
| **Telegram** | ✅ Full (200 msg/chat) | Built-in |
| **WhatsApp** | ✅ Full (Baileys) | Built-in |
| **Discord** | Session | Built-in |
| **Nostr** | Session | Extension |
| **iMessage** | Session | Extension |
| **Google Chat** | Session | Extension |
| **Web UI** | Session | Built-in |

14+ extension plugins. Build your own with the plugin SDK.

---

## 18. NanoBot Interactive UI

```bash
nanosolana nanobot    # Opens http://127.0.0.1:7777
```

| Tab | Features |
|-----|----------|
| 🏠 Home | Quick actions, command output |
| 💰 Wallet | SOL balance, token portfolio, send, tx history |
| 💬 Chat | Talk to NanoBot, typing indicators |
| 🔧 Tools | On-chain registration, status, terminal |

---

## 19. Chrome Extension

Manifest V3 browser extension:

| Feature | Description |
|---------|-------------|
| 🔗 Tab Relay | Attach any tab via CDP |
| 💰 Wallet Panel | View status, generate wallets |
| 💬 Chat Relay | Messages + Telegram forwarding |
| 📈 Manual Trades | Buy/sell/hold with confidence |
| ⚙️ Gateway Sync | Auto-load config |

```
Chrome Tab ◄──CDP──► Relay :18792 ◄──HTTP──► Gateway :18790 ◄──► OODA Engine
```

---

## 20. TamaGObot: The Go Implementation

**10MB binary** · **<10MB RAM** · **1s boot** · Cross-compile: x86_64, ARM64, RISC-V

```bash
./build/nanosolana daemon              # Full autonomous daemon
./build/nanosolana ooda --sim          # Simulated mode
./build/nanosolana ooda --hw-bus 1     # With hardware
```

---

## 21. Hardware Integration (Arduino Modulino®)

| Sensor | Function |
|--------|----------|
| **Pixels** (8× RGB LED) | Status visualization |
| **Buzzer** | Audio alerts |
| **Buttons** (3×) | OODA trigger, sim/live toggle, emergency stop |
| **Knob** | Real-time RSI threshold tuning |
| **Thermo** | Temperature logging |
| **Distance** (ToF) | Proximity wake-up |
| **Movement** (IMU) | Tilt → auto-pause |

All hardware gracefully degrades — no sensors? Runs in stub mode.

---

## 22. x402 Payment Protocol

Crypto-gated HTTP APIs via [x402.org](https://x402.org):

- Solana USDC payments via agent wallet
- Multi-chain: Solana, Base, Polygon, Avalanche
- HTTP middleware for paywalling endpoints
- Facilitator proxy to `facilitator.x402.rs`

---

## 23. Platform Apps (macOS, Android)

### macOS

```bash
bash scripts/package-macos.sh    # → dist/NanoSolana-v2.0.0.dmg
nanosolana menubar               # Launch menu bar agent
```

### Android (SeekerClaw)

Android 14+ app: background AI agent, Telegram interface, native Solana wallet, secure on-device key management.

---

## 24. NanoHub: Agent Registry & Skills

**URL:** [hub.nanosolana.com](https://hub.nanosolana.com) · React + TanStack Router + Convex + Vercel

- Agent profiles and public pages
- Skills marketplace
- Real-time updates
- Deployment tracking

```bash
npx nanosolana@latest install my-skill
```

---

## 25. Deployment & Infrastructure

| Target | Command |
|--------|---------|
| Current platform | `make build` |
| NVIDIA Orin | `make orin` |
| Raspberry Pi | `make rpi` |
| Docker (~15MB) | `make docker` |
| macOS | `make macos` |
| All | `make cross` |

---

## 26. Configuration Reference

### Core Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | AI provider |
| `HELIUS_API_KEY` | Yes | Helius API |
| `HELIUS_RPC_URL` | Yes | Solana RPC |
| `HELIUS_WSS_URL` | Recommended | Real-time data |
| `BIRDEYE_API_KEY` | Recommended | Market analytics |
| `JUPITER_API_KEY` | For trading | Swap execution |
| `TELEGRAM_BOT_TOKEN` | Optional | Telegram bot |
| `NANO_GATEWAY_SECRET` | Recommended | Gateway HMAC |
| `TAILSCALE_AUTH_KEY` | For mesh | Mesh networking |
| `SOLANA_RPC_URL` | For swarm | Swarm bots RPC |

---

## 27. CLI Reference

### TypeScript CLI

| Command | Description |
|---------|-------------|
| `nanosolana go` | **One-shot: init + birth + scan + register + trade** |
| `nanosolana init` | Configure + encrypt API keys |
| `nanosolana birth` | Create wallet + NFT + scan |
| `nanosolana run` | Start OODA trading loop |
| `nanosolana scan [address]` | Blockchain scan |
| `nanosolana register` | Mint identity NFT |
| `nanosolana registry` | Show identity |
| `nanosolana nanobot` | Launch web UI |
| `nanosolana status` | Agent status |
| `nanosolana trade status` | P&L |
| `nanosolana wallet balance` | Balances |
| `nanosolana pet status` | TamaGOchi |
| `nanosolana memory search` | Search memory |
| `nanosolana gateway run` | Start gateway |
| `nanosolana nodes` | Mesh peers |
| `nanosolana doctor` | Diagnostics |
| `nanosolana security audit` | Security scan |
| `nanosolana dvd` | DVD screensaver 🦞 |
| `nanosolana lobster` | Animated lobster |

### Go CLI

| Command | Description |
|---------|-------------|
| `nanosolana daemon` | Full GoBot |
| `nanosolana ooda` | Trading loop |
| `nanosolana agent` | Chat REPL |
| `nanosolana pet` | Pet status |
| `nanosolana nanobot` | NanoBot UI |
| `nanosolana menubar` | macOS menu bar |
| `nanosolana hardware scan` | I2C scan |

### Swarm npm Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development with hot reload |
| `npm run build` | Compile TypeScript |
| `npm run claw` | Start MawdBot orchestrator |
| `npm run claw:dev` | MawdBot with hot reload |
| `npm run swarm` | Start PumpFun swarm |
| `npm run auth` | WhatsApp QR authentication |
| `npm run typecheck` | TypeScript strict mode check |
| `npm run format` | Prettier formatting |
| `npm test` | Run vitest suite |

---

## 28. Monorepo Structure

```
NanoSolana/
├── apps/
│   ├── android/            # Android companion (Kotlin)
│   ├── macos/              # Swift macOS app
│   └── shared/             # Cross-platform primitives
├── assets/
│   └── chrome-extension/   # Manifest V3 browser relay
├── extensions/             # 14+ channel plugins
├── nano-core/              # ★ TypeScript runtime/CLI (unified)
│   └── src/
│       ├── ai/             # OpenRouter AI provider
│       ├── cli/            # nanosolana CLI
│       ├── config/         # AES-256-GCM vault
│       ├── claw/           # ★ MawdBot + PumpFun Swarm
│       │   ├── personas/   # 43 DeFi agent personality JSONs
│       │   └── pump/       # PumpFun Swarm
│       │       └── sdk/    # ★ Native Pump SDK (IDL + protocol math)
│       ├── gateway/        # HMAC gateway
│       ├── memory/         # ClawVault epistemological memory
│       ├── pet/            # TamaGOchi engine
│       ├── trading/        # OODA trading loop
│       └── wallet/         # Solana wallet
├── nano-docs/              # Documentation
├── nanohub/                # Agent Registry (React + Convex)
├── site/                   # Landing site (nanosolana.com)
├── skills/                 # Skill library
├── ui/                     # Standalone web UI
├── CONTRIBUTING.md
├── LICENSE                 # MIT
├── README.md               # This file
└── SECURITY.md
```

---

## 29. Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md).

### Areas Where We Need Help

- New trading strategies and indicators
- Memory engine improvements (vector search, LanceDB)
- New channel plugins (Slack, Matrix, Signal)
- Pump.fun SDK extensions (new instructions, analytics)
- Agent persona creation (new DeFi personalities)
- Security audits and hardening
- Backtesting framework
- Documentation and tutorials

---

## License

MIT — [NanoSolana Labs](https://nanosolana.com)

Built for the financial agents of tomorrow. Open source forever.

---

**Website:** [nanosolana.com](https://nanosolana.com) · **Hub:** [hub.nanosolana.com](https://hub.nanosolana.com) · **Docs:** [docs.nanosolana.com](https://docs.nanosolana.com) · **GitHub:** [github.com/x402agent/NanoSolana](https://github.com/x402agent/NanoSolana)

🦞 *Built with lobster energy by NanoSolana Labs* 🦞
