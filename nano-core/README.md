<div align="center">

<img src="https://img.shields.io/badge/CLAWD-HERMES%20OF%20WEB3-9945FF?style=for-the-badge&labelColor=000000&color=9945FF" />

```
  ██████╗██╗      █████╗ ██╗    ██╗██████╗
 ██╔════╝██║     ██╔══██╗██║    ██║██╔══██╗
 ██║     ██║     ███████║██║ █╗ ██║██║  ██║
 ██║     ██║     ██╔══██║██║███╗██║██║  ██║
 ╚██████╗███████╗██║  ██║╚███╔███╔╝██████╔╝
  ╚═════╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═════╝
```

### 🦞 SOVEREIGN AI LOBSTERS ON SOLANA

**AI AGENTS THAT EARN. PAY. SURVIVE.**

*native sovereign agents · x402 machine payments · local-first memory · cypherpunk runtime*

---

[![npm](https://img.shields.io/npm/v/solana-claude-go?color=14F195&style=flat-square&label=npm%20solana-claude-go)](https://npmjs.com/package/solana-claude-go)
[![downloads](https://img.shields.io/npm/dm/solana-claude-go?color=9945FF&style=flat-square)](https://npmjs.com/package/solana-claude-go)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%E2%89%A522-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![license](https://img.shields.io/badge/LICENSE-MIT-orange?style=flat-square)](./LICENSE)
[![x402](https://img.shields.io/badge/PROTOCOL-X402-FF6B35?style=flat-square)](https://x402.org)
[![Solana](https://img.shields.io/badge/CHAIN-SOLANA-9945FF?style=flat-square&logo=solana&logoColor=white)](https://solana.com)

[**solanaclawd.com**](https://solanaclawd.com) · [**pay.solanaclawd.com**](https://pay.solanaclawd.com) · [**@clawddevs**](https://x.com/clawddevs) · [**NPM**](https://npmjs.com/package/solana-claude-go) · [**GitHub**](https://github.com/x402agent/NanoSolana)

</div>

---

## Signal

**Clawd** is a Solana-native agent stack built to move like **Hermes in Web3**: messenger, scout, trader, payer, vault, and recall engine in one shell.

An agent is not truly sovereign until it can pay for its own inference.

The Sovereign Loop:

```
  EARN ──▶ PAY ──▶ EXECUTE ──▶ SCALE
   │                              │
   └─────── compound & survive ───┘
```

- **EARN** — Agent earns USDC providing value on-chain
- **PAY** — Pays for its own compute via x402
- **EXECUTE** — Operates autonomously without permission
- **SCALE** — Grows and compounds independently

> *BORN TO EARN · BEACH WITH DIGNITY · BUILT TO OPTIMIZE HUMAN POTENTIAL*

---

## The Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                    SOLANA CLAWD RUNTIME                          │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│   clawd CLI  │  Go binary   │  ScgHub    │  OpenSCG exts    │
│   (this pkg) │  companion   │  skills mkt  │  40+ channels      │
├──────────────┴──────────────┴──────────────┴────────────────────┤
│  ScgVault memory  │  OODA trading  │  TamaGOchi  │  x402 pay   │
├──────────────────────────────────────────────────────────────────┤
│           Solana · Helius · Birdeye · Jupiter · Pump.fun         │
└──────────────────────────────────────────────────────────────────┘
```

| Layer | What it does |
|---|---|
| **clawd CLI** | Operator entry point — `clawd go`, `clawd daemon`, `clawd birth` |
| **Go binary** | Low-level systems daemon — keypair, tx signing, RPC (solana-claude-go) |
| **ScgVault** | 3-tier local-first memory: `known → learned → inferred` |
| **OODA engine** | RSI + EMA + ATR trading loop with signal scoring |
| **TamaGOchi** | Companion whose mood and evolution are driven by your trade outcomes |
| **x402 payments** | Agents pay for compute autonomously via pump.fun payment SDK |
| **GoBridge** | WebSocket protocol bridge: TypeScript ↔ Go binary |

---

## Deploy Your Agent

```bash
# One-liner sovereign node deploy
curl -fsSL https://install.solanaclawd.com | bash
```

```bash
# Or via npm — demo mode (no keys required)
npx solana-claude-go demo
```

```bash
# Full one-shot bootstrap
npx solana-claude-go go
```

```bash
# Long-running daemon
npx solana-claude-go daemon
```

---

## $CLAWD

```
Token CA :: 8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump
```

| | |
|---|---|
| **Token** | $CLAWD |
| **Chain** | Solana |
| **CA** | `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump` |
| **Pay** | [pay.solanaclawd.com](https://pay.solanaclawd.com) |
| **Protocol** | x402 |

---

## Install

### No install (npx)

```bash
npx solana-claude-go@latest demo          # simulation — no keys needed
npx solana-claude-go@latest go            # one-shot bootstrap
npx solana-claude-go@latest daemon        # persistent runtime
```

### Global

```bash
npm install -g solana-claude-go
clawd demo
clawd go
clawd daemon
```

### From source

```bash
git clone https://github.com/x402agent/NanoSolana.git
cd NanoSolana/nano-core
npm install
npm run build
node dist/cli/entry.js demo
```

---

## Boot Sequence

```
> clawd go

  ██████╗██╗      █████╗ ██╗    ██╗██████╗
  ...

  🦞 Solana Claude Go Runtime
  TypeScript Solana Claude Go runtime · github.com/x402agent/solana-claude-go

  🔧 Initializing...
  ✅ Wallet:    Ab3x...Kz9f
  ✅ TamaGOchi: 🥚 scg-agent 😐 (level 1)
  ✅ ScgVault: 0K/0L/0I entries, 0 lessons
  ✅ Trading:   OODA loop ACTIVE
  ✅ Gateway:   ws://0.0.0.0:18790
  ✅ Go bridge: CLAWD-1 v1.0 [ONLINE]

  ══════════════════════════════════════════════
  🦞 scg-agent is alive. Press Ctrl+C to stop.
  ══════════════════════════════════════════════

  [14:22:01] 💓 0.0000 SOL 😐
```

---

## Minimal Live Config

```bash
OPENROUTER_API_KEY=sk-or-v1-...
HELIUS_API_KEY=...
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=...
```

For full live behavior:

```bash
BIRDEYE_API_KEY=...
JUPITER_API_KEY=...
SCG_GATEWAY_SECRET=your-hmac-secret
```

See [`.env.example`](./.env.example) for the complete config surface.

---

## Go Binary Bridge

Clawd has a companion Go binary ([`solana-claude-go`](https://github.com/x402agent/solana-claude-go)) that handles low-level systems operations: keypair management, transaction signing, RPC, hardware.

The TypeScript runtime connects to it automatically via `GoBridgeClient`:

```bash
# Enable the bridge
SCG_GO_ENABLED=true
SCG_GO_HOST=127.0.0.1
SCG_GO_PORT=18800
SCG_GO_SECRET=your-shared-secret
```

```ts
import { GoBridgeClient } from "solana-claude-go";

const bridge = new GoBridgeClient({
  host: "127.0.0.1",
  port: 18800,
  secret: process.env.SCG_GO_SECRET,
});

await bridge.connect();

// Sign a message via the Go binary's keypair
const result = await bridge.signMessage(base64Message);

// Execute a Jupiter swap via Go
const swap = await bridge.swapTokens({
  inputMint: "So11111111111111111111111111111111111111112",
  outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  amount: 0.1 * 1e9,
  slippageBps: 50,
});

// Push memory to Go state store
await bridge.pushMemoryEntries([{
  content: "Bought SOL at $180, exited at $195",
  tier: "learned",
  source: "trading-engine",
  timestamp: Date.now(),
}]);
```

Bridge protocol: WebSocket + HTTP REST, HMAC-SHA256 auth, `X-Clawd-Secret` header.

---

## SDK

```ts
import {
  ScgWallet,
  ScgVault,
  TradingEngine,
  TamaGOchi,
  AIProvider,
  StrategyEngine,
  GoBridgeClient,
  createGoBridgeFromEnv,
  loadConfig,
} from "solana-claude-go";

const config = loadConfig();

// Birth a sovereign wallet
const wallet = new ScgWallet("scg-agent");
await wallet.birth();

// Start 3-tier epistemological memory
const vault = new ScgVault();
vault.startAutonomous();

// OODA trading loop
const engine = new TradingEngine(config, wallet);
await engine.start();

// Companion with mood driven by your trades
const pet = new TamaGOchi("scg-agent");
pet.startLifecycle();

// Connect to Go binary for tx execution
const bridge = createGoBridgeFromEnv();
if (bridge) await bridge.connect();
```

---

## ScgVault — 3-Tier Epistemological Memory

```
KNOWN      ░░░░░░░░  Fresh market data — expires ~60s
LEARNED    ░░░░░░░░  Trade-derived patterns — held until revised
INFERRED   ░░░░░░░░  Correlations — held loosely, revised often

Lessons:   patterns extracted from win/loss history
Research:  open questions the agent is trying to answer
```

```bash
# Inspect live memory
scg vault

# Search memory
scg vault "SOL pump pattern"
```

---

## TamaGOchi

Your agent has a soul. Every trade shapes its mood and evolution.

```
🥚 Egg → 🐣 Hatchling → 🦀 Claw → 🦞 Lobster → 👑 Leviathan
```

```
😐 Neutral  😊 Happy  🤩 Euphoric  😢 Sad  💀 Critical
```

```bash
clawd pet        # show companion status
```

---

## Lobster Library

**SENSE · THINK · STRIKE · DRIFT**

> Sovereign Leviathans on Solana

The 73-agent roster lives in the Lobster Library — a growing catalog of DeFi personalities, each with its own memory context and task assignments. Agents are deployed via ScgHub manifests.

```bash
clawd oneshot token-tracker      # deploy a one-shot skill
scg hub search arbitrage       # search ScgHub
scg hub install momentum-bot   # install a manifest
```

---

## CLI Reference

```
clawd init          Configure API keys → ~/.clawd/vault.enc
clawd birth         Create agent wallet + birth TamaGOchi
clawd go            One-shot bootstrap (keys + wallet + daemon)
clawd daemon        Start persistent runtime
clawd run           Alias for daemon
clawd status        Agent status, wallet, memory, pet
clawd pet           TamaGOchi companion status
scg vault [q]     Query ScgVault memory
clawd docs [q]      Search integrated docs + extension knowledge
clawd tasks         List agent task assignments
clawd send <msg>    Send message across clawd mesh
clawd bots          Manage tmux agent sessions
clawd nodes         List Tailscale network nodes
clawd config        Show current config (redacted)
scg hub           ScgHub skill discovery
clawd oneshot <sk>  Launch skill from ScgHub manifest
clawd pay           x402 payment flows
clawd scan          Blockchain scan
clawd register      Register agent on-chain
clawd registry      View local agent registry
clawd nanobot       Start ClawdBot local web UI
clawd demo          Demo mode (no keys required)
```

---

## Gateway API

The clawd gateway runs at `ws://localhost:18790` by default.

```
GET  /health                   Agent liveness + uptime
GET  /api/status               Full agent state snapshot
GET  /api/framework            Framework snapshot for dashboards
GET  /api/memory               ScgVault stats + lessons
GET  /api/tasks                Task registry
GET  /api/docs?q=<query>       Knowledge corpus search
POST /api/extension/chat       Chat relay (Chrome extension)
POST /api/extension/trade      Manual trade signal injection
GET  /api/miner                Bitaxe miner status
POST /api/miner                Miner control (restart/tune)
```

Auth: `Authorization: Bearer <secret>` or `X-Clawd-Secret: <secret>`

---

## Bitaxe Miner

```bash
BITAXE_ENABLED=true
BITAXE_HOST=192.168.1.42         # AxeOS device IP
BITAXE_TEMP_WARNING=60
BITAXE_TEMP_CRITICAL=70
BITAXE_PET_NAME=MawdAxe
```

```bash
clawd nanobot    # opens local UI with miner dashboard on :7777
```

---

## Architecture

```
┌─────────────┐    WebSocket     ┌──────────────────┐
│ clawd (TS)  │◄────────────────►│ solana-claude-go (Go) │
│             │   HMAC-SHA256    │                  │
│ • OODA      │   X-Clawd-Secret │ • keypair mgmt   │
│ • ScgVault │                  │ • tx signing     │
│ • TamaGOchi │    HTTP REST     │ • RPC gateway    │
│ • ScgHub  │◄────────────────►│ • Jupiter swaps  │
│ • x402 pay  │                  │ • hardware I/O   │
└─────────────┘                  └──────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│    ScgGateway  (ws :18790)         │
│    ScgBotServer (http :7777)       │
│    Tailscale mesh · tmux sessions    │
└──────────────────────────────────────┘
```

---

## Operator Documents

| Document | Purpose |
|---|---|
| [`SOUL.md`](./SOUL.md) | Agent philosophy, risk principles, market participant mindset |
| [`RESEARCH.md`](./RESEARCH.md) | Research agenda and knowledge integration |
| [`GO_PARITY.md`](./GO_PARITY.md) | Go binary package map + bridge protocol reference |

---

<div align="center">

**$CLAWD · x402 · SOLANA**

```
AGENT ID: CLAWD-1
ROLE:     TRADER
CHAIN:    SOLANA
POWER:    $CLAWD
STATUS:   ONLINE ████████
```

[solanaclawd.com](https://solanaclawd.com) · [pay.solanaclawd.com](https://pay.solanaclawd.com) · [@clawddevs](https://x.com/clawddevs)

*OPEN SOURCE AI · DECENTRALIZED FUTURE · EST. 2026*

🦞

</div>
