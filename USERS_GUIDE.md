# Solana Claude Go User Guide

> Build and run wallet-aware Solana trading agents, autonomous daemons, and local operator workflows — all from the terminal.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Build from Source](#build-from-source)
4. [Quick Start](#quick-start)
5. [Configuration](#configuration)
6. [CLI Commands Reference](#cli-commands-reference)
7. [Core Concepts](#core-concepts)
8. [Running the Daemon](#running-the-daemon)
9. [NanoBot Web UI](#nanobot-web-ui)
10. [Mesh Networking](#mesh-networking)
11. [Skills and Extensions](#skills-and-extensions)
12. [NanoHub](#nanohub)
13. [Bitaxe Mining Integration](#bitaxe-mining-integration)
14. [Pump.fun Integration](#pumpfun-integration)
15. [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Requirement | Minimum Version | Notes |
|---|---|---|
| **Node.js** | 22.0.0+ | Required. Check with `node -v` |
| **npm** | Bundled with Node | Used for dependency management |
| **Git** | Any recent | To clone the repo |
| **tmux** | Any | Optional — needed for `scg bots` multi-bot management |
| **Tailscale** | Any | Optional — needed for mesh networking across machines |

## Installation

### From npm (fastest)

```bash
# Run directly — no clone needed
npx scg@latest demo    # simulation mode, no API keys
npx scg@latest go      # full bootstrap with live keys
```

### From source

```bash
git clone https://github.com/x402agent/Solana Claude Go.git
cd Solana Claude Go/nano-core
npm install
npm run build
```

### Global CLI install (optional)

```bash
cd nano-core
bash scripts/install-cli.sh
```

After this, the `scg` command is available system-wide.

## Build from Source

The build uses **tsup** to bundle the TypeScript source into ESM with declarations and sourcemaps.

```bash
cd nano-core

# 1. Install dependencies
npm install

# 2. Build (compile TS → dist/)
npm run build
```

**What `npm run build` does:**

```
tsup src/index.ts src/cli/entry.ts --format esm --dts --sourcemap --out-dir dist --clean
```

This produces:
- `dist/cli/entry.js` — the CLI binary entry point
- `dist/index.js` — the library/SDK entry point
- `dist/index.d.ts` — TypeScript type declarations
- Source maps for debugging

### Other build scripts

| Command | Description |
|---|---|
| `npm run dev` | Watch mode — rebuilds on file changes (`tsx watch`) |
| `npm run start` | Run the compiled CLI from `dist/` |
| `npm test` | Run the test suite (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint with oxlint (type-aware) |
| `npm run format` | Auto-format with oxfmt |
| `npm run gateway` | Start only the gateway server |
| `npm run hub:dev` | Start the NanoHub dev server (requires bun) |

## Quick Start

### Demo mode (no API keys)

```bash
cd nano-core
npm install && npm run build
npx scg demo
```

Demo mode runs the full runtime in simulation: wallet lifecycle, ScgVault memory, TamaGOchi state, and the OODA trading loop — all without real transactions or API keys.

### Full bootstrap

```bash
cd nano-core
cp .env.example .env
# Edit .env — fill in at minimum:
#   OPENROUTER_API_KEY
#   HELIUS_RPC_URL
#   HELIUS_API_KEY
npm install && npm run build
npx scg go
```

`scg go` performs the complete first-run sequence:
1. Collects and encrypts secrets into `~/.scg/vault.enc`
2. Creates or restores the local Solana wallet
3. Boots the TamaGOchi companion state
4. Starts ScgVault epistemological memory
5. Starts the OODA trading runtime
6. Starts the local gateway server
7. Attempts a Helius wallet scan and registry flow

### After initial setup

Once your state is initialized, start the daemon directly:

```bash
npx scg daemon
```

## Configuration

### Environment variables

Copy the example and fill in your keys:

```bash
cp .env.example .env
```

**Minimum required keys for live operation:**

| Variable | Source | Purpose |
|---|---|---|
| `OPENROUTER_API_KEY` | [openrouter.ai](https://openrouter.ai) | AI reasoning for the OODA loop |
| `HELIUS_RPC_URL` | [helius.dev](https://helius.dev) | Solana RPC endpoint |
| `HELIUS_API_KEY` | [helius.dev](https://helius.dev) | Wallet scanning, transaction parsing |

**Recommended additional keys:**

| Variable | Source | Purpose |
|---|---|---|
| `BIRDEYE_API_KEY` | [birdeye.so](https://birdeye.so) | Real-time token analytics and price feeds |
| `JUPITER_API_KEY` | [jup.ag](https://jup.ag) | DEX aggregation and swap execution |
| `HELIUS_WSS_URL` | [helius.dev](https://helius.dev) | WebSocket feed for live updates |

### Encrypted vault

All secrets are stored encrypted at `~/.scg/vault.enc` using AES-256-GCM. The interactive `init` command guides you through setting these:

```bash
npx scg init
```

### Gateway configuration

| Variable | Default | Description |
|---|---|---|
| `NANO_GATEWAY_PORT` | `18790` | HTTP/WebSocket gateway port |
| `NANO_GATEWAY_HOST` | `0.0.0.0` | Gateway bind address |
| `NANO_GATEWAY_SECRET` | (none) | HMAC-SHA256 secret for gateway auth |

### Memory configuration

| Variable | Default | Description |
|---|---|---|
| `SCG_MEMORY_DB_PATH` | `~/.scg/memory.db` | SQLite database path for ScgVault |
| `NANO_MEMORY_TEMPORAL_DECAY_HOURS` | `168` (7 days) | How long before KNOWN entries decay |

### Data directory

All persistent state lives under `~/.scg/`:

```
~/.scg/
  vault.enc          # AES-256-GCM encrypted secrets
  memory.db          # ScgVault SQLite database
  tamagochi.json     # TamaGOchi pet state
  wallet.json        # Wallet metadata
```

## CLI Commands Reference

### Agent Lifecycle

| Command | Description |
|---|---|
| `scg init` | Interactive setup — prompts for API keys and encrypts them |
| `scg birth [-n name] [--pet-name name]` | Create a new agent with a Solana wallet and TamaGOchi pet |
| `scg go` | One-shot bootstrap — init + birth + run in a single command |
| `scg bootstrap` | Alias for `go` |
| `scg run [-n name] [--no-trade] [--no-gateway]` | Start the autonomous daemon |
| `scg daemon` | Alias for `run` |
| `scg demo` | Simulation mode — full runtime loop, no API keys needed |

### Status and Inspection

| Command | Description |
|---|---|
| `scg status` | Show agent status: wallet, balance, TamaGOchi, ScgVault stats, mesh |
| `scg pet` | Display TamaGOchi pet status and mood |
| `scg config` | Show current configuration (secrets redacted) |
| `scg vault [query]` | Query ScgVault memory — shows tiers, lessons, research agenda |
| `scg docs [query]` | Browse integrated docs and extension knowledge corpus |
| `scg tasks [query] [-p persona]` | Inspect the automated task registry |
| `scg scan` | Helius blockchain scan of the agent's wallet |

### Multi-Bot Management

| Command | Description |
|---|---|
| `scg bots list` | List running nano bot tmux sessions |
| `scg bots spawn <name>` | Spawn a new bot in a tmux session |
| `scg bots attach <name>` | Attach to a running bot session |
| `scg bots kill <name>` | Kill a bot session |

### Network and Messaging

| Command | Description |
|---|---|
| `scg nodes` | List Tailscale nodes in the nano mesh |
| `scg send <message> [-t hostname]` | Send a message to bots across the mesh (or broadcast) |

### NanoHub

| Command | Description |
|---|---|
| `scg hub` | Browse the NanoHub skill registry |
| `scg hub search <query>` | Search for skills |
| `scg hub install <skill>` | Install a skill pack |
| `scg hub register` | Register your agent with NanoHub |

### Other

| Command | Description |
|---|---|
| `scg nanobot` | Launch the NanoBot local web dashboard |
| `scg oneshot` | Run a one-shot plan from a NanoHub manifest |
| `scg pay` | Agent payment operations |
| `scg register` | Register the agent on-chain (Metaplex NFT on devnet) |
| `scg registry` | Browse the on-chain agent registry |

## Core Concepts

### OODA Trading Loop

The trading engine follows the OODA decision cycle:

1. **Observe** — Ingest real-time market data from Birdeye (prices, volume, momentum)
2. **Orient** — Run RSI, EMA, and ATR technical indicators to generate signals
3. **Decide** — AI reasoning (via OpenRouter) evaluates signals against ScgVault memory and TamaGOchi risk modifier
4. **Act** — Execute trades through Jupiter DEX aggregation
5. **Learn** — Record outcomes in ScgVault, update TamaGOchi state

### ScgVault (3-Tier Epistemological Memory)

ScgVault is the agent's memory system with three knowledge tiers:

| Tier | Description | Retention |
|---|---|---|
| **KNOWN** | Fresh API data, real-time prices, direct observations | Short-lived (~60s TTL, decays over hours) |
| **LEARNED** | Patterns derived from trades — what worked, what didn't | Persistent, grows with experience |
| **INFERRED** | Correlations and hypotheses — held loosely, retracted if disproven | Persistent but revisable |

The system also tracks:
- **Lessons** — trade outcome patterns with confidence adjustments
- **Research agenda** — open questions the agent wants to investigate
- **Experience replay** — before any trade, the agent reviews past outcomes for similar setups

### TamaGOchi Virtual Pet

Every agent has a TamaGOchi companion whose state is driven by trading performance:

- **Mood** affects the agent's risk tolerance (happy = slightly more aggressive, sad = more cautious)
- **Evolution stages** unlock as the agent gains experience
- Positive balance changes "feed" the pet; losses reduce happiness
- The pet has its own lifecycle with level-ups and mood shifts

### Encrypted Vault

All secrets are encrypted at rest using AES-256-GCM and stored in `~/.scg/vault.enc`. The gateway uses HMAC-SHA256 for request authentication, and wallet operations use Ed25519 signatures with timing-safe comparison.

## Running the Daemon

### Basic daemon start

```bash
npx scg run
```

This starts all subsystems: wallet heartbeat, ScgVault memory, TamaGOchi lifecycle, OODA trading engine, and the gateway server.

### Daemon options

```bash
# Custom agent name
npx scg run -n my-agent --pet-name Crabby

# Disable trading (memory + gateway only)
npx scg run --no-trade

# Disable gateway (trading + memory only)
npx scg run --no-gateway
```

### What runs in the daemon

1. **Wallet** — heartbeat polling for balance changes
2. **TamaGOchi** — lifecycle timer for mood/evolution
3. **ScgVault** — autonomous memory with decay, reflection, and lesson extraction
4. **Trading Engine** — OODA loop with RSI/EMA/ATR signals
5. **Gateway** — HTTP + WebSocket server on port 18790

### Graceful shutdown

Press `Ctrl+C`. The daemon cleanly stops all subsystems and saves state.

## NanoBot Web UI

Launch the local dashboard:

```bash
npx scg nanobot
```

NanoBot provides a browser-based UI showing agent status, wallet info, trade history, ScgVault memory, and TamaGOchi state.

## Mesh Networking

Solana Claude Go supports multi-agent mesh networking through Tailscale VPN:

```bash
# List available nodes
npx scg nodes

# Send a message to all online nodes
npx scg send "check SOL price"

# Send to a specific node
npx scg send "status report" -t my-server

# Spawn multiple bots
npx scg bots spawn alpha
npx scg bots spawn beta
npx scg bots list
```

**Requirements:** Tailscale installed and connected. tmux installed for multi-bot sessions.

## Skills and Extensions

### Skills (50+)

Skills are composable agent capabilities in `SKILL.md` format, found in the `skills/` directory. Examples include: Discord, GitHub, 1Password, coding-agent, image generation, PDF processing, and many more.

Browse and install skills via NanoHub:

```bash
npx scg hub search discord
npx scg hub install discord
```

### Extensions (40+)

Extensions are channel and tool plugins in the `extensions/` directory. They connect Solana Claude Go to external platforms:

| Category | Extensions |
|---|---|
| **Chat** | Telegram, Discord, Slack, WhatsApp, Signal, iMessage, IRC, Matrix, Nostr, Line, Microsoft Teams, Google Chat, Mattermost, Nextcloud Talk, Feishu |
| **Tools** | Memory (core + LanceDB), LLM task runner, diagnostics/OpenTelemetry, device pairing, diffs, phone control |
| **Integrations** | Pump.fun, MiniMax, Qwen, Google Gemini CLI, Copilot proxy |

## NanoHub

NanoHub is the skill registry and marketplace. It runs as a separate web app.

### Running NanoHub locally

```bash
cd nanohub
bun install
bun run dev
```

### Using NanoHub from the CLI

```bash
# Browse available skills
npx scg hub

# Search for skills
npx scg hub search "trading"

# Install a skill
npx scg hub install <skill-name>

# Register your agent
npx scg hub register
```

## Bitaxe Mining Integration

Solana Claude Go includes a Bitaxe/AxeOS mining client for hardware miners on your local network.

### Enable Bitaxe

Add to your `.env`:

```bash
BITAXE_ENABLED=true
BITAXE_HOST=192.168.1.42       # your Bitaxe device IP
BITAXE_POLL_INTERVAL=10         # seconds between status polls
BITAXE_ALERTS_ENABLED=true
BITAXE_TEMP_WARNING=60          # celsius
BITAXE_TEMP_CRITICAL=70
```

### Supported actions

- Refresh miner status
- Restart the device
- Set ASIC frequency, core voltage, fan speed
- Set pool URL and port
- Set payout wallet / stratum user

### Surfaces

- **NanoBot dashboard** — `npx scg nanobot`
- **Gateway endpoints** — `/api/miner` and `/api/extension/miner`
- **Chrome extension** — options page miner controls

## Pump.fun Integration

Solana Claude Go includes a Pump.fun SDK bridge for token launches and swarm trading:

### Swarm configuration

```bash
SWARM_MAX_AGENTS=25
SWARM_MAX_POSITION_SOL=1
SWARM_MAX_TOTAL_SOL=10
SWARM_DEFAULT_SLIPPAGE_BPS=100
SWARM_POLL_INTERVAL=5000
SWARM_HEALTH_INTERVAL=30000
```

### Telegram gateway

The Pump swarm can be controlled via Telegram:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_ADMIN_IDS=123456789,987654321
```

### Tokenized agent payments

Using `@pump-fun/agent-payments-sdk`:

```bash
AGENT_TOKEN_MINT_ADDRESS=your_agent_mint_address
CURRENCY_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v  # USDC
```

## Troubleshooting

### Build fails

```bash
# Make sure you're on Node 22+
node -v

# Clean rebuild
rm -rf node_modules dist
npm install
npm run build
```

### "Module not found" errors at runtime

Make sure you ran `npm run build` after any source changes. The CLI runs from `dist/`, not `src/`.

### Vault password issues

If you forget your vault password, delete `~/.scg/vault.enc` and re-run `npx scg init`. This will not delete your wallet if you have the private key backed up elsewhere.

### Gateway won't start

Check if port 18790 is already in use:

```bash
lsof -i :18790
```

Change the port in `.env`:

```bash
NANO_GATEWAY_PORT=18791
```

### Demo mode crashes

Demo mode should work without any configuration. If it crashes, ensure you have Node 22+ and a clean install:

```bash
node -v   # must be >= 22.0.0
cd nano-core && rm -rf node_modules dist && npm install && npm run build
npx scg demo
```

### Tailscale / mesh not working

- Verify Tailscale is installed and connected: `tailscale status`
- The `scg nodes` command will report "not available" if Tailscale is missing

### Tests

```bash
cd nano-core
npm test              # run full suite
npm run test:watch    # watch mode
```

---

**License:** MIT

**Issues:** https://github.com/x402agent/Solana Claude Go/issues

**Homepage:** https://scg.com
