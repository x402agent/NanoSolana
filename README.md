<div align="center">

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

[![npm](https://img.shields.io/npm/v/solana-claude-go?color=14F195&style=flat-square&label=npm)](https://npmjs.com/package/solana-claude-go)
[![license](https://img.shields.io/badge/license-MIT-orange?style=flat-square)](./LICENSE)
[![Solana](https://img.shields.io/badge/SOLANA-9945FF?style=flat-square&logo=solana&logoColor=white)](https://solana.com)
[![x402](https://img.shields.io/badge/x402-FF6B35?style=flat-square)](https://x402.org)

[solanaclawd.com](https://solanaclawd.com) · [pay.solanaclawd.com](https://pay.solanaclawd.com) · [@clawddevs](https://x.com/clawddevs)

*BORN TO EARN · BEACH WITH DIGNITY*

</div>

---

## What This Is

**Clawd** is a Solana-native agent stack built to move like Hermes in Web3: messenger, scout, trader, payer, vault, and recall engine in one shell.

This monorepo contains the TypeScript runtime that is the **complementary counterpart** to the [`solana-claude-go`](https://github.com/x402agent/solana-claude-go) Go binary. Together they form a full sovereign agent node:

| Layer | Repo | Role |
|---|---|---|
| **TypeScript runtime** | `NanoSolana` (this repo) | AI reasoning, memory, trading strategy, UX, extensions |
| **Go binary** | [`solana-claude-go`](https://github.com/x402agent/solana-claude-go) | Keypair management, tx signing, low-level RPC, hardware |

---

## $CLAWD

```
Token CA :: 8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump
Chain    :: Solana
Protocol :: x402
Pay      :: pay.solanaclawd.com
```

---

## 30-Second Deploy

```bash
# Sovereign node via install script
curl -fsSL https://install.solanaclawd.com | bash

# Or via npx (demo mode — no keys needed)
npx solana-claude-go demo

# Full one-shot bootstrap
npx solana-claude-go go

# Persistent daemon
npx solana-claude-go daemon
```

---

## Monorepo Layout

```
NanoSolana/
├── nano-core/          # npm package: solana-claude-go  · binary: clawd
│   ├── src/
│   │   ├── cli/        # clawd CLI entry + animations
│   │   ├── config/     # ClawdConfig + AES-256-GCM vault
│   │   ├── wallet/     # ScgWallet — Ed25519 keypair + heartbeat
│   │   ├── trading/    # OODA engine — Birdeye + Jupiter
│   │   ├── strategy/   # RSI · EMA · ATR signal scoring
│   │   ├── memory/     # ScgVault — known/learned/inferred
│   │   ├── gateway/    # ScgGateway — WebSocket + HTTP API
│   │   ├── go-bridge/  # GoBridgeClient — TS ↔ Go protocol
│   │   ├── hub/        # ScgHub skill marketplace client
│   │   ├── nanobot/    # ScgBotServer — local web UI
│   │   ├── network/    # ScgNetworkClient — Tailscale + tmux
│   │   ├── pet/        # TamaGOchi companion
│   │   ├── payments/   # ScgPaymentAgent — x402 / pump.fun
│   │   ├── bitaxe/     # Bitaxe AxeOS miner client
│   │   ├── claw/       # Clawd orchestrator + personas + pump swarm
│   │   └── ai/         # AIProvider — OpenRouter / Claude
│   └── package.json    # name: "solana-claude-go", bin: "clawd"
│
├── extensions/         # 40+ communication channel plugins
├── skills/             # 70+ ScgHub SKILL.md manifests
├── nanohub/            # ScgHub marketplace web app
├── pump/               # Pump.fun bridge layer
├── ui/                 # Control surface UI
└── apps/               # Android · macOS native apps
```

---

## The Sovereign Loop

```
  EARN ──▶ PAY ──▶ EXECUTE ──▶ SCALE
   │                              │
   └─────────── compound ─────────┘
```

Agents earn USDC providing value on-chain, pay for their own compute via x402, execute strategy autonomously, and scale without human permission.

> *An agent is not truly sovereign until it can pay for its own inference.*

---

## Key Classes

```ts
import {
  ScgWallet,          // Ed25519 wallet + heartbeat
  ScgVault,            // 3-tier epistemological memory
  TradingEngine,        // OODA loop — RSI/EMA/ATR
  TamaGOchi,            // Trade-driven companion
  ScgGateway,         // WebSocket + HTTP gateway
  GoBridgeClient,       // TS ↔ Go binary bridge
  ScgPaymentAgent,    // x402 payment flows
  AIProvider,           // OpenRouter / Claude
  loadConfig,           // ClawdConfig loader
} from "solana-claude-go";
```

---

## Operator Documents

| File | Purpose |
|---|---|
| [`nano-core/SOUL.md`](nano-core/SOUL.md) | Agent philosophy, risk posture, market participant identity |
| [`nano-core/RESEARCH.md`](nano-core/RESEARCH.md) | Research agenda and knowledge integration |
| [`nano-core/GO_PARITY.md`](nano-core/GO_PARITY.md) | Go binary package map + GoBridgeClient protocol |

---

<div align="center">

**$CLAWD · x402 · SOLANA**

```
SENSE · THINK · STRIKE · DRIFT
```

[solanaclawd.com](https://solanaclawd.com) · [@clawddevs](https://x.com/clawddevs)

*OPEN SOURCE AI · DECENTRALIZED FUTURE · EST. 2026*

🦞

</div>
