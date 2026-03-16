<div align="center">

# 🦞 NanoSolana

**TypeScript runtime and CLI for autonomous financial agents on Solana.**

[![npm version](https://img.shields.io/npm/v/nanosolana?color=14F195&style=flat-square)](https://npmjs.com/package/nanosolana)
[![npm downloads](https://img.shields.io/npm/dm/nanosolana?color=9945FF&style=flat-square)](https://npmjs.com/package/nanosolana)
[![GitHub stars](https://img.shields.io/github/stars/x402agent/NanoSolana?color=14F195&style=flat-square)](https://github.com/x402agent/NanoSolana)
[![License: MIT](https://img.shields.io/badge/License-MIT-14F195.svg?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Solana](https://img.shields.io/badge/Solana-Native-9945FF?style=flat-square&logo=solana&logoColor=white)](https://solana.com)
[![Node](https://img.shields.io/badge/Node-%E2%89%A522-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![GitHub last commit](https://img.shields.io/github/last-commit/x402agent/NanoSolana?color=14F195&style=flat-square)](https://github.com/x402agent/NanoSolana)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-14F195?style=flat-square)](https://github.com/x402agent/NanoSolana/blob/main/CONTRIBUTING.md)
[![Discord](https://img.shields.io/badge/Discord-Join-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.gg/nanosolana)

`nano-core` is published to npm as `nanosolana`.
It bundles the local agent runtime, encrypted config vault, wallet lifecycle, OODA trading engine, ClawVault memory, TamaGOchi state machine, gateway server, docs integration, and devnet on-chain identity registration.

[Website](https://nanosolana.com) · [Hub](https://hub.nanosolana.com) · [Docs](https://docs.nanosolana.com) · [GitHub](https://github.com/x402agent/NanoSolana) · [Discord](https://discord.gg/nanosolana)

</div>

---

## What This Package Ships

| Area | Included in `nanosolana` |
| --- | --- |
| CLI | `init`, `birth`, `run`, `go`, `demo`, `scan`, `register`, `registry`, `nanobot`, `status`, `pet`, `docs`, `vault`, `config`, `nodes`, `send`, `bots` |
| Trading runtime | Helius RPC ingestion, Birdeye market data, Jupiter execution, signal events |
| Memory | ClawVault 3-tier memory: known, learned, inferred |
| Security | AES-256-GCM local vault, HMAC-SHA256 gateway auth, timing-safe signature checks |
| Agent state | Solana wallet manager, TamaGOchi lifecycle, local persistence under `~/.nanosolana/` |
| Networking | Gateway server plus optional Tailscale-backed mesh messaging |
| UI | Local NanoBot web UI on `127.0.0.1:7777` by default |
| Registry | Devnet NFT-based on-chain identity via Metaplex-compatible minting flow |

## Requirements

- Node.js `22+`
- npm `10+`
- A burner wallet and test-sized balances for first live runs
- For live mode: `HELIUS_RPC_URL`, `HELIUS_API_KEY`, and `OPENROUTER_API_KEY` or `AI_API_KEY`
- For better live behavior: `HELIUS_WSS_URL`, `BIRDEYE_API_KEY`, `JUPITER_API_KEY`, `NANO_GATEWAY_SECRET`

## Quick Start

### Demo mode

```bash
npx nanosolana demo
```

This runs the full OODA loop in simulation mode with synthetic prices, a local ClawVault instance, and a demo TamaGOchi. No API keys are required.

### Live mode

```bash
npx nanosolana go
```

On first run, `go` will:

1. Prompt for required credentials.
2. Encrypt secrets into `~/.nanosolana/vault.enc`.
3. Create or load the local wallet.
4. Start TamaGOchi, ClawVault, trading, and the gateway.
5. Attempt a blockchain scan when Helius is configured.
6. Attempt devnet registration for the agent identity NFT.

If secrets are already present, skip the prompts:

```bash
npx nanosolana go --skip-init
```

## Install

### Run without installing

```bash
npx nanosolana demo
npx nanosolana go
```

### Global npm install

```bash
npm install -g nanosolana
nanosolana demo
```

### One-shot shell installer

```bash
curl -fsSL https://nanosolana.com/install.sh | bash
export PATH="$HOME/.nanosolana/bin:$PATH"
nanosolana go
```

### From source

```bash
git clone https://github.com/x402agent/NanoSolana.git
cd NanoSolana/nano-core
npm install
npm run build
node dist/cli/entry.js demo
```

## Configuration

Secrets can come from the encrypted local vault, environment variables, or both. The runtime supports the following primary variables:

| Variable | Purpose | Notes |
| --- | --- | --- |
| `OPENROUTER_API_KEY` or `AI_API_KEY` | AI provider key | Required for live trading |
| `OPENROUTER_MODEL` or `AI_MODEL` | Model selection | Defaults to `openrouter/healer-alpha` |
| `HELIUS_RPC_URL` | Solana RPC | Required for live mode and scans |
| `HELIUS_API_KEY` | Helius API key | Required for live mode and scans |
| `HELIUS_WSS_URL` | Helius WebSocket endpoint | Optional but recommended |
| `BIRDEYE_API_KEY` | Market data | Optional in config, important for richer signals |
| `JUPITER_API_KEY` | Swap execution | Required for live execution paths |
| `NANO_GATEWAY_PORT` | Gateway port | Defaults to `18790` |
| `NANO_GATEWAY_HOST` | Gateway bind host | Defaults to `0.0.0.0` |
| `NANO_GATEWAY_SECRET` | Shared HMAC secret | Strongly recommended |
| `NANO_VAULT_PASSWORD` | Override vault password source | Recommended for deterministic multi-session setups |
| `TAILSCALE_AUTH_KEY` | Mesh networking | Needed for automated Tailscale enrollment |

`nanosolana init` writes non-sensitive defaults to a local `.env` and stores prompted secrets in the encrypted vault.

## CLI Reference

### Core runtime

| Command | Description |
| --- | --- |
| `nanosolana init` | Prompt for credentials and save them to the encrypted vault |
| `nanosolana birth` | Create or load the agent wallet and initialize the local TamaGOchi |
| `nanosolana run` | Start wallet heartbeat, ClawVault, trading engine, and gateway |
| `nanosolana go` | Full one-shot flow: configure, birth, run, scan, and attempt registration |
| `nanosolana demo` | Simulation mode with no API keys |
| `nanosolana status` | Show wallet, pet, memory, gateway, Tailscale, and tmux summary |
| `nanosolana pet` | Print the current TamaGOchi status display |

### Ops and inspection

| Command | Description |
| --- | --- |
| `nanosolana scan [address]` | Scan the default wallet or a supplied address via Helius |
| `nanosolana register` | Mint the devnet on-chain identity NFT |
| `nanosolana registry` | Show local registration status and explorer links |
| `nanosolana config` | Print the redacted runtime configuration |
| `nanosolana vault [query]` | Search the ClawVault tiers |
| `nanosolana docs [query]` | Search integrated docs and extension metadata |
| `nanosolana nanobot --port 7777` | Start the local NanoBot companion UI |

### Mesh and multi-bot tooling

| Command | Description |
| --- | --- |
| `nanosolana nodes` | List discovered Tailscale peers |
| `nanosolana send "message"` | Send a one-shot message to local or mesh-connected agents |
| `nanosolana bots list` | List tmux-backed bot sessions |
| `nanosolana bots spawn <name>` | Spawn a bot in a tmux session |
| `nanosolana bots attach <name>` | Attach to a tmux session |
| `nanosolana bots kill <name>` | Terminate a tmux session |
| `nanosolana dvd` | Terminal DVD-style screensaver |
| `nanosolana lobster` | Animated or static lobster banner |

## SDK Usage

`nanosolana` can also be used as a library:

```ts
import {
  ClawVault,
  NanoWallet,
  TamaGOchi,
  TradingEngine,
  loadConfig,
} from "nanosolana";

const config = loadConfig();

const wallet = new NanoWallet("my-agent");
await wallet.birth();

const vault = new ClawVault();
vault.startAutonomous();

const pet = new TamaGOchi("MyPet");
pet.recordWalletCreated(wallet.getInfo().balance);

const engine = new TradingEngine(config, wallet);
engine.on("signal", (signal) => {
  console.log(`${signal.type} ${signal.symbol} ${(signal.confidence * 100).toFixed(0)}%`);
});

await engine.start();
```

Additional runnable examples live in [`examples/`](https://github.com/x402agent/NanoSolana/tree/main/nano-core/examples):

- `basic-agent.ts`
- `custom-strategy.ts`
- `multi-agent-mesh.ts`
- `sdk-programmatic.ts`
- `webhook-alerts.ts`

## Architecture

```text
┌───────────────────────────────────────────────────────┐
│                    Agent Runtime                      │
│     OODA loop · ClawVault · TamaGOchi · Strategy      │
├───────────────────────────────────────────────────────┤
│                  Local Infrastructure                 │
│   Vault · Wallet · Gateway · Registry · Persistence   │
├───────────────────────────────────────────────────────┤
│                 External Integrations                 │
│   Helius · Birdeye · Jupiter · Tailscale · Docs       │
└───────────────────────────────────────────────────────┘
```

Source layout:

```text
nano-core/src/
├── ai/         OpenRouter-backed AI provider
├── cli/        CLI entrypoint and terminal UX
├── config/     Local encrypted vault and config loading
├── docs/       Repo docs and extension corpus integration
├── gateway/    HTTP + WebSocket gateway
├── memory/     ClawVault and legacy memory engine
├── nanobot/    Local companion UI server
├── network/    Tailscale and tmux helpers
├── nft/        Birth certificate support
├── onchain/    Helius readers and wallet scans
├── pet/        TamaGOchi state machine
├── registry/   Devnet identity registration
├── strategy/   Indicators and signal logic
├── trading/    OODA trading engine
└── wallet/     Solana wallet management
```

## Security Notes

- Secrets are stored in `~/.nanosolana/vault.enc` with AES-256-GCM encryption.
- Gateway signatures use HMAC-SHA256 and constant-time comparison via `crypto.timingSafeEqual`.
- HTTP and WebSocket surfaces are rate-limited per source address.
- The default vault password source is local-machine oriented. Set `NANO_VAULT_PASSWORD` explicitly if you need a stable password across shells or hosts.
- On-chain registration uses Solana devnet today. Do not treat devnet identity as production custody or compliance infrastructure.
- The trading engine is experimental software. Start with `demo`, then a burner wallet, then very small live balances.

## Package Scope

This README covers the published TypeScript package in `nano-core`.
For the broader monorepo, including NanoHub, extensions, apps, and site assets, see the main repository README:

- [Monorepo guide](https://github.com/x402agent/NanoSolana/blob/main/README.md)
- [Docs site source](https://github.com/x402agent/NanoSolana/tree/main/nano-docs)
- [Contributing guide](https://github.com/x402agent/NanoSolana/blob/main/CONTRIBUTING.md)

## License

MIT. See [LICENSE](LICENSE).
