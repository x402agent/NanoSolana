<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=120&section=header&text=SOLANA%20CLAWD%20GO&fontSize=42&fontColor=14F195&animation=fadeIn&fontAlignY=38&desc=sovereign%20ai%20lobsters%20on%20solana&descSize=16&descAlignY=60&descColor=9945FF" width="100%" />

```
 ███████╗ ██████╗ ██████╗
 ██╔════╝██╔════╝██╔════╝
 ███████╗██║     ██║  ███╗
 ╚════██║██║     ██║   ██║
 ███████║╚██████╗╚██████╔╝
 ╚══════╝ ╚═════╝ ╚═════╝
```

![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=18&duration=3000&pause=1000&color=14F195&center=true&vCenter=true&multiline=true&repeat=true&width=600&height=60&lines=AI+AGENTS+THAT+EARN.+PAY.+SURVIVE.;SENSE+%C2%B7+THINK+%C2%B7+STRIKE+%C2%B7+DRIFT;BORN+TO+EARN+%C2%B7+BEACH+WITH+DIGNITY)

---

[![npm](https://img.shields.io/npm/v/solana-clawd-go?color=14F195&style=for-the-badge&label=npm&logo=npm&logoColor=white)](https://npmjs.com/package/solana-clawd-go)
[![downloads](https://img.shields.io/npm/dm/solana-clawd-go?color=9945FF&style=for-the-badge&logo=npm&logoColor=white&label=downloads)](https://npmjs.com/package/solana-clawd-go)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%E2%89%A522-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)

[![Solana](https://img.shields.io/badge/CHAIN-SOLANA-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com)
[![x402](https://img.shields.io/badge/PROTOCOL-X402-FF6B35?style=for-the-badge)](https://x402.org)
[![license](https://img.shields.io/badge/LICENSE-MIT-orange?style=for-the-badge)](./LICENSE)
[![Go Bridge](https://img.shields.io/badge/Go%20Bridge-ONLINE-14F195?style=for-the-badge&logo=go&logoColor=white)](https://github.com/x402agent/solana-clawd)

[**solanaclawd.com**](https://solanaclawd.com) · [**pay.solanaclawd.com**](https://pay.solanaclawd.com) · [**@clawddevs**](https://x.com/clawddevs) · [**NPM**](https://npmjs.com/package/solana-clawd-go) · [**GitHub**](https://github.com/x402agent/NanoClawd)

</div>

---

## Signal

**Solana Clawd Go (SCG)** is a Solana-native agent stack built to move like **Hermes in Web3**: messenger, scout, trader, payer, vault, and recall engine in one shell.

> *An agent is not truly sovereign until it can pay for its own inference.*

```
  EARN ──▶ PAY ──▶ EXECUTE ──▶ SCALE
   │                              │
   └─────── compound & survive ───┘
```

| Phase | What happens |
|---|---|
| **EARN** | Agent earns USDC providing value on-chain |
| **PAY** | Pays for its own compute via x402 |
| **EXECUTE** | Operates autonomously without permission |
| **SCALE** | Grows and compounds independently |

---

## The Stack

```
┌──────────────────────────────────────────────────────────────────┐
│                    SOLANA CLAWD GO RUNTIME                       │
├──────────────┬──────────────┬──────────────┬─────────────────────┤
│   scg CLI    │  Go binary   │   ScgHub     │  OpenSCG exts       │
│   (this pkg) │  companion   │  skills mkt  │  40+ channels       │
├──────────────┴──────────────┴──────────────┴─────────────────────┤
│  ScgVault memory  │  OODA trading  │  TamaGOchi  │  x402 pay     │
├───────────────────────────────────────────────────────────────────┤
│          Solana · Helius · Birdeye · Jupiter · Pump.fun            │
└───────────────────────────────────────────────────────────────────┘
```

| Layer | What it does |
|---|---|
| **scg CLI** | Operator entry point — `scg go`, `scg daemon`, `scg birth` |
| **Go binary** | Low-level systems daemon — keypair, tx signing, RPC |
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
# Via npm — demo mode (no keys required)
npx solana-clawd-go demo
```

```bash
# Full one-shot bootstrap
npx solana-clawd-go go
```

```bash
# Long-running daemon
npx solana-clawd-go daemon
```

---

## $CLAWD

<div align="center">

| | |
|---|---|
| **Token** | $CLAWD |
| **Chain** | Solana |
| **CA** | `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump` |
| **Pay** | [pay.solanaclawd.com](https://pay.solanaclawd.com) |
| **Protocol** | x402 |

```
Token CA :: 8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump
Chain    :: Solana mainnet-beta
Protocol :: x402
Pay      :: pay.solanaclawd.com
```

</div>

---

## Install

### No install (npx)

```bash
npx solana-clawd-go@latest demo          # simulation — no keys needed
npx solana-clawd-go@latest go            # one-shot bootstrap
npx solana-clawd-go@latest daemon        # persistent runtime
```

### Global

```bash
npm install -g solana-clawd-go
scg demo
scg go
scg daemon
```

### From source

```bash
git clone https://github.com/x402agent/NanoClawd.git
cd NanoClawd/nano-core
npm install
npm run build
node dist/cli/entry.js demo
```

---

## Boot Sequence

```
> scg go

 ███████╗ ██████╗ ██████╗
 ██╔════╝██╔════╝██╔════╝
 ███████╗██║     ██║  ███╗
 ╚════██║██║     ██║   ██║
 ███████║╚██████╗╚██████╔╝
 ╚══════╝ ╚═════╝ ╚═════╝

  🦞 Solana Clawd Go Runtime v1.1.0
  TypeScript sovereign agent · github.com/x402agent/NanoClawd

  🔧 Initializing...
  ✅ Wallet:    Ab3x...Kz9f  (0.0000 SOL)
  ✅ TamaGOchi: 🥚 scg-agent 😐 (level 1)
  ✅ ScgVault:  0K / 0L / 0I entries · 0 lessons
  ✅ Trading:   OODA loop ACTIVE
  ✅ Gateway:   ws://0.0.0.0:18790
  ✅ Go bridge: SCG-1 v1.0 [ONLINE]

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

See [`.env.example`](./nano-core/.env.example) for the complete config surface.

---

## Go Binary Bridge

SCG has a companion Go binary ([`solana-clawd`](https://github.com/x402agent/solana-clawd)) that handles low-level systems operations: keypair management, transaction signing, RPC, hardware.

The TypeScript runtime connects to it automatically via `GoBridgeClient`:

```bash
# Enable the bridge
SCG_GO_ENABLED=true
SCG_GO_HOST=127.0.0.1
SCG_GO_PORT=18800
SCG_GO_SECRET=your-shared-secret
```

```ts
import { GoBridgeClient } from "solana-clawd-go";

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

Bridge protocol: WebSocket + HTTP REST, HMAC-SHA256 auth, `X-SCG-Secret` header.

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
} from "solana-clawd-go";

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
┌─────────────────────────────────────────────────────────┐
│                     SCGVAULT MEMORY                      │
├────────────┬────────────────────────────────────────────┤
│  KNOWN     │ ░░░░░░░░  Fresh market data — TTL ~60s      │
│  LEARNED   │ ░░░░░░░░  Trade patterns — held until reset │
│  INFERRED  │ ░░░░░░░░  Correlations — revised often      │
├────────────┴────────────────────────────────────────────┤
│  LESSONS   │  Patterns from win/loss history             │
│  RESEARCH  │  Open questions the agent investigates      │
└─────────────────────────────────────────────────────────┘
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
🥚 Egg  →  🐣 Hatchling  →  🦀 Claw  →  🦞 Lobster  →  👑 Leviathan
```

```
😐 Neutral    😊 Happy    🤩 Euphoric    😢 Sad    💀 Critical
```

```bash
scg pet        # show companion status
```

---

## Lobster Library

```
 ██╗      ██████╗ ██████╗ ███████╗████████╗███████╗██████╗
 ██║     ██╔═══██╗██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗
 ██║     ██║   ██║██████╔╝███████╗   ██║   █████╗  ██████╔╝
 ██║     ██║   ██║██╔══██╗╚════██║   ██║   ██╔══╝  ██╔══██╗
 ███████╗╚██████╔╝██████╔╝███████║   ██║   ███████╗██║  ██║
 ╚══════╝ ╚═════╝ ╚═════╝ ╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
          L I B R A R Y
```

**SENSE · THINK · STRIKE · DRIFT**

> 73 sovereign Leviathans on Solana

The Lobster Library is a growing catalog of DeFi personalities, each with its own memory context and task assignments. Agents are deployed via ScgHub manifests.

```bash
scg oneshot token-tracker      # deploy a one-shot skill
scg hub search arbitrage       # search ScgHub
scg hub install momentum-bot   # install a manifest
```

---

## CLI Reference

```
scg init          Configure API keys → ~/.scg/vault.enc
scg birth         Create agent wallet + birth TamaGOchi
scg go            One-shot bootstrap (keys + wallet + daemon)
scg daemon        Start persistent runtime
scg run           Alias for daemon
scg status        Agent status, wallet, memory, pet
scg pet           TamaGOchi companion status
scg vault [q]     Query ScgVault memory
scg docs [q]      Search integrated docs + extension knowledge
scg tasks         List agent task assignments
scg send <msg>    Send message across SCG mesh
scg bots          Manage tmux agent sessions
scg nodes         List Tailscale network nodes
scg config        Show current config (redacted)
scg hub           ScgHub skill discovery
scg oneshot <sk>  Launch skill from ScgHub manifest
scg pay           x402 payment flows
scg scan          Blockchain scan
scg register      Register agent on-chain
scg registry      View local agent registry
scg nanobot       Start ScgBot local web UI
scg demo          Demo mode (no keys required)
```

---

## Gateway API

The SCG gateway runs at `ws://localhost:18790` by default.

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

Auth: `Authorization: Bearer <secret>` or `X-SCG-Secret: <secret>`

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
scg nanobot    # opens local UI with miner dashboard on :7777
```

---

## Architecture

```
┌──────────────┐    WebSocket     ┌───────────────────┐
│  scg (TS)   │◄────────────────►│ solana-clawd (Go)  │
│              │   HMAC-SHA256    │                   │
│ • OODA       │   X-SCG-Secret   │ • keypair mgmt    │
│ • ScgVault  │                  │ • tx signing      │
│ • TamaGOchi  │    HTTP REST     │ • RPC gateway     │
│ • ScgHub    │◄────────────────►│ • Jupiter swaps   │
│ • x402 pay   │                  │ • hardware I/O    │
└──────────────┘                  └───────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│    ScgGateway  (ws :18790)           │
│    ScgBotServer (http :7777)         │
│    Tailscale mesh · tmux sessions    │
└──────────────────────────────────────┘
```

---

## Operator Documents

| Document | Purpose |
|---|---|
| [`SOUL.md`](./nano-core/SOUL.md) | Agent philosophy, risk principles, market participant mindset |
| [`RESEARCH.md`](./nano-core/RESEARCH.md) | Research agenda and knowledge integration |
| [`GO_PARITY.md`](./nano-core/GO_PARITY.md) | Go binary package map + bridge protocol reference |

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=80&section=footer" width="100%" />

```
AGENT ID: SCG-1
ROLE:     TRADER
CHAIN:    SOLANA
POWER:    $CLAWD
STATUS:   ONLINE ████████████
```

[![$CLAWD](https://img.shields.io/badge/%24CLAWD-8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump-9945FF?style=flat-square)](https://pay.solanaclawd.com)

[solanaclawd.com](https://solanaclawd.com) · [pay.solanaclawd.com](https://pay.solanaclawd.com) · [@clawddevs](https://x.com/clawddevs)

*OPEN SOURCE AI · DECENTRALIZED FUTURE · EST. 2026*

🦞

</div>
