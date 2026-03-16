# NanoSolana

> The open-source agentic framework for financial intelligence on Solana.

```text
    ███╗   ██╗ █████╗ ███╗   ██╗ ██████╗ ███████╗ ██████╗ ██╗      █████╗ ███╗   ██╗ █████╗
    ████╗  ██║██╔══██╗████╗  ██║██╔═══██╗██╔════╝██╔═══██╗██║     ██╔══██╗████╗  ██║██╔══██╗
    ██╔██╗ ██║███████║██╔██╗ ██║██║   ██║███████╗██║   ██║██║     ███████║██╔██╗ ██║███████║
    ██║╚██╗██║██╔══██║██║╚██╗██║██║   ██║╚════██║██║   ██║██║     ██╔══██║██║╚██╗██║██╔══██║
    ██║ ╚████║██║  ██║██║ ╚████║╚██████╔╝███████║╚██████╔╝███████╗██║  ██║██║ ╚████║██║  ██║
    ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
```

<div align="center">

[![npm version](https://img.shields.io/npm/v/nanosolana?color=14F195&style=for-the-badge)](https://npmjs.com/package/nanosolana)
[![npm downloads](https://img.shields.io/npm/dm/nanosolana?color=9945FF&style=for-the-badge)](https://npmjs.com/package/nanosolana)
[![GitHub stars](https://img.shields.io/github/stars/x402agent/NanoSolana?color=14F195&style=for-the-badge)](https://github.com/x402agent/NanoSolana/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-14F195.svg?style=for-the-badge)](LICENSE)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Solana](https://img.shields.io/badge/Solana-Native-9945FF?style=flat-square&logo=solana&logoColor=white)](https://solana.com)
[![Node](https://img.shields.io/badge/Node-%E2%89%A522-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![CI](https://img.shields.io/github/actions/workflow/status/x402agent/NanoSolana/ci.yml?label=CI&style=flat-square)](https://github.com/x402agent/NanoSolana/actions)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-14F195?style=flat-square)](CONTRIBUTING.md)
[![Discord](https://img.shields.io/badge/Discord-Join-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.gg/nanosolana)

</div>

**NanoSolana** is a TypeScript-first monorepo for autonomous Solana agents, Pump integrations, and agent tooling. The current checkout contains:

- the published `nanosolana` runtime in [`nano-core/README.md`](nano-core/README.md)
- the NanoHub registry in [`nanohub/README.md`](nanohub/README.md)
- a dedicated Pump bridge layer in [`pump/index.ts`](pump/index.ts)
- a PumpFun extension scaffold in [`extensions/pumpfun/src/index.ts`](extensions/pumpfun/src/index.ts)
- two doc trees: [`nano-docs/index.md`](nano-docs/index.md) and [`pump/docs/getting-started.md`](pump/docs/getting-started.md)
- the standalone UI in [`ui/`](ui/) with your new `swarm` and `personas` views

**Website:** [nanosolana.com](https://nanosolana.com) · **Hub:** [hub.nanosolana.com](https://hub.nanosolana.com) · **Docs:** [docs.nanosolana.com](https://docs.nanosolana.com) · **GitHub:** [github.com/x402agent/NanoSolana](https://github.com/x402agent/NanoSolana)

## Quick Start

### Demo mode

```bash
npx nanosolana demo
```

Runs a synthetic OODA loop with a wallet, ClawVault memory, and TamaGOchi pet. No API keys required.

### One-shot bootstrap

```bash
npx nanosolana go
npx nanosolana oneshot token-tracker
```

This is the current end-to-end flow in `nano-core`. It:

- prompts for secrets and encrypts them into `~/.nanosolana/vault.enc`
- creates a wallet
- hatches a TamaGOchi pet
- starts ClawVault
- starts the OODA trading loop
- snapshots the wallet with Helius when configured
- auto-registers a devnet identity NFT when available
- starts the gateway on `ws://0.0.0.0:18790`

`nanosolana oneshot <slug>` is the first manifest-driven bootstrap layer. It
pulls a NanoHub skill manifest, checks required env vars and OAuth providers,
and emits a machine-readable launch plan for the skill.

### From source

```bash
git clone https://github.com/x402agent/NanoSolana.git
cd NanoSolana/nano-core
npm install
npm run build
npm run nanosolana -- demo
npm run nanosolana -- go
```

## Current `nanosolana` CLI Surface

The shipped CLI is defined in [`nano-core/src/cli/entry.ts`](nano-core/src/cli/entry.ts). The current top-level commands are:

```text
init
birth
run
status
pet
send
bots
nodes
config
vault
docs
tasks
hub
pay
go
demo
dvd
lobster
scan
register
registry
nanobot
```

Important clarification: older drafts in this repo described nested trees such as `nanosolana trade ...`, `nanosolana wallet ...`, `nanosolana memory ...`, and `nanosolana gateway ...`. Those are not the current published CLI surface.

## What Ships In This Repo

| Workspace | Path | Purpose |
|----------|------|---------|
| Core runtime + npm package | [`nano-core/`](nano-core/) | Published `nanosolana` package, CLI, wallet, gateway, trading engine, ClawVault, TamaGOchi, NanoBot |
| Product docs | [`nano-docs/`](nano-docs/) | Concise docs for current runtime concepts and operator flows |
| Registry + installer | [`nanohub/`](nanohub/) | NanoHub app and `nanohub` CLI |
| Pump bridge layer | [`pump/`](pump/) | NanoSolana-facing Pump swarm, Telegram gateway, registry, SDK bridge |
| Upstream Pump ecosystem snapshot | [`pump-fun-sdk-main/`](pump-fun-sdk-main/) | Vendored upstream SDK, bots, dashboards, docs, MCP server, website, tests |
| Extension packages | [`extensions/`](extensions/) | 41 extension directories, 14 manifest-based runtime plugins |
| Skills library | [`skills/`](skills/) | 77 skill packs, including 24 Pump and PumpFun-specific packs |
| Standalone UI | [`ui/`](ui/) | Operator UI assets and views, including `swarm` and `personas` tabs |
| Apps | [`apps/`](apps/) | macOS and Android workspaces |

## Core Structure Clarifications

- [`nano-core/src/claw/`](nano-core/src/claw/) is the integrated orchestration layer inside the published `nanosolana` package. It is already part of `nano-core`, not a separate app.
- The old `nanoclaw-main` path is no longer part of this checkout. The live runtime now sits directly in [`nano-core/`](nano-core/).
- The Pump SDK and official IDLs are integrated into [`nano-core/src/claw/pump/sdk/`](nano-core/src/claw/pump/sdk/), and parity is checked against the vendored upstream snapshot in [`pump-fun-sdk-main/src/`](pump-fun-sdk-main/src/).
- NanoHub agent registration is exposed both from the website in [`site/index.html`](site/index.html) and from the CLI via `nanosolana hub register`, `hub list`, `hub search`, and `hub heartbeat`.
- NanoHub skill manifests are now exposed at `/api/v1/skills/:slug/manifest`, and the published CLI can consume them with `nanosolana oneshot <slug>`.

## Pump Stack In This Checkout

NanoSolana’s Pump support is split across three layers.

| Layer | Path | Notes |
|------|------|-------|
| Extension scaffold | [`extensions/pumpfun/`](extensions/pumpfun/) | Package scaffold for Pump.fun event monitoring and message-bus integration |
| NanoSolana bridge | [`pump/`](pump/) | Swarm spawner, Telegram gateway, bot registry, typed bridge helpers |
| Vendored upstream ecosystem | [`pump-fun-sdk-main/`](pump-fun-sdk-main/) | Full external Pump SDK ecosystem used as the source corpus |

### Key Pump integration entrypoints

| File | Purpose |
|------|---------|
| [`pump/index.ts`](pump/index.ts) | Barrel export for the NanoSolana-facing Pump layer |
| [`pump/main.ts`](pump/main.ts) | Standalone Pump swarm launcher |
| [`pump/sdk-bridge.ts`](pump/sdk-bridge.ts) | Token price, graduation progress, quotes, fee tiers, formatting |
| [`pump/swarm-spawner.ts`](pump/swarm-spawner.ts) | Role-based agent orchestration |
| [`pump/telegram-gateway.ts`](pump/telegram-gateway.ts) | Telegram control plane for the Pump swarm |
| [`pump/bot-registry.ts`](pump/bot-registry.ts) | Bot/service registry with env vars and health metadata |
| [`pump/types.ts`](pump/types.ts) | Shared role, config, gateway, and metrics types |
| [`pump/agent-tasks/README.md`](pump/agent-tasks/README.md) | Pump parallel task prompts |
| [`pump/docs/getting-started.md`](pump/docs/getting-started.md) | Pump SDK quick start |
| [`pump/docs/ecosystem.md`](pump/docs/ecosystem.md) | Pump ecosystem overview |

### Pump SDK in the published core

The published `nanosolana` package now re-exports the integrated Pump SDK surface directly from [`nano-core/src/index.ts`](nano-core/src/index.ts):

- `PumpFunSdk`
- `PumpSdk`, `OnlinePumpSdk`, `PUMP_SDK`
- Pump program constants and IDLs
- bonding curve, analytics, fee, fallback, and token incentive helpers

Programmatic usage:

```ts
import {
  OnlinePumpSdk,
  PumpFunSdk,
  PUMP_PROGRAM_ID,
  getBuyTokenAmountFromSolAmount,
} from "nanosolana";
```

### Pump and PumpFun skills

This repo currently includes **24** Pump-oriented skill packs:

- [`skills/pump-admin-ops/SKILL.md`](skills/pump-admin-ops/SKILL.md)
- [`skills/pump-ai-agents/SKILL.md`](skills/pump-ai-agents/SKILL.md)
- [`skills/pump-bonding-curve/SKILL.md`](skills/pump-bonding-curve/SKILL.md)
- [`skills/pump-build-release/SKILL.md`](skills/pump-build-release/SKILL.md)
- [`skills/pump-claims-readonly/SKILL.md`](skills/pump-claims-readonly/SKILL.md)
- [`skills/pump-fee-sharing/SKILL.md`](skills/pump-fee-sharing/SKILL.md)
- [`skills/pump-fee-system/SKILL.md`](skills/pump-fee-system/SKILL.md)
- [`skills/pump-mcp-server/SKILL.md`](skills/pump-mcp-server/SKILL.md)
- [`skills/pump-rust-vanity/SKILL.md`](skills/pump-rust-vanity/SKILL.md)
- [`skills/pump-sdk-core/SKILL.md`](skills/pump-sdk-core/SKILL.md)
- [`skills/pump-security/SKILL.md`](skills/pump-security/SKILL.md)
- [`skills/pump-shell-scripts/SKILL.md`](skills/pump-shell-scripts/SKILL.md)
- [`skills/pump-solana-architecture/SKILL.md`](skills/pump-solana-architecture/SKILL.md)
- [`skills/pump-solana-dev/SKILL.md`](skills/pump-solana-dev/SKILL.md)
- [`skills/pump-solana-wallet/SKILL.md`](skills/pump-solana-wallet/SKILL.md)
- [`skills/pump-testing/SKILL.md`](skills/pump-testing/SKILL.md)
- [`skills/pump-token-incentives/SKILL.md`](skills/pump-token-incentives/SKILL.md)
- [`skills/pump-token-lifecycle/SKILL.md`](skills/pump-token-lifecycle/SKILL.md)
- [`skills/pump-ts-vanity/SKILL.md`](skills/pump-ts-vanity/SKILL.md)
- [`skills/pump-website/SKILL.md`](skills/pump-website/SKILL.md)
- [`skills/pumpfun-analytics/SKILL.md`](skills/pumpfun-analytics/SKILL.md)
- [`skills/pumpfun-fees/SKILL.md`](skills/pumpfun-fees/SKILL.md)
- [`skills/pumpfun-launcher/SKILL.md`](skills/pumpfun-launcher/SKILL.md)
- [`skills/pumpfun-trading/SKILL.md`](skills/pumpfun-trading/SKILL.md)

## Docs And Knowledge Integration

There are two repo-local doc trees, and both are now part of the main knowledge corpus used by `nanosolana docs`.

### NanoSolana docs

Use [`nano-docs/index.md`](nano-docs/index.md) for:

- current runtime and CLI behavior
- OODA, ClawVault, TamaGOchi, gateway, mesh, and extension concepts
- NanoHub publish and install flows

### Pump docs

Use [`pump/docs/getting-started.md`](pump/docs/getting-started.md) for:

- Pump SDK integration
- bonding curve math
- fee sharing and fee tiers
- token lifecycle, AMM flows, analytics, and troubleshooting
- deployment, MCP server, and ecosystem material

The Pump doc tree currently contains **83** files, including:

- [`pump/docs/admin-operations.md`](pump/docs/admin-operations.md)
- [`pump/docs/amm-trading.md`](pump/docs/amm-trading.md)
- [`pump/docs/analytics.md`](pump/docs/analytics.md)
- [`pump/docs/api-reference.md`](pump/docs/api-reference.md)
- [`pump/docs/architecture.md`](pump/docs/architecture.md)
- [`pump/docs/bonding-curve-math.md`](pump/docs/bonding-curve-math.md)
- [`pump/docs/channel-bot-architecture.md`](pump/docs/channel-bot-architecture.md)
- [`pump/docs/cli-guide.md`](pump/docs/cli-guide.md)
- [`pump/docs/deployment.md`](pump/docs/deployment.md)
- [`pump/docs/development.md`](pump/docs/development.md)
- [`pump/docs/ecosystem.md`](pump/docs/ecosystem.md)
- [`pump/docs/events-reference.md`](pump/docs/events-reference.md)
- [`pump/docs/examples.md`](pump/docs/examples.md)
- [`pump/docs/fee-sharing.md`](pump/docs/fee-sharing.md)
- [`pump/docs/fee-tiers.md`](pump/docs/fee-tiers.md)
- [`pump/docs/getting-started.md`](pump/docs/getting-started.md)
- [`pump/docs/performance.md`](pump/docs/performance.md)
- [`pump/docs/security.md`](pump/docs/security.md)
- [`pump/docs/testing.md`](pump/docs/testing.md)
- [`pump/docs/TROUBLESHOOTING.md`](pump/docs/TROUBLESHOOTING.md)

## UI Changes Included

The standalone UI under [`ui/`](ui/) now includes your new operator surfaces:

- [`ui/src/ui/navigation.ts`](ui/src/ui/navigation.ts) adds `swarm` and `personas` tabs
- [`ui/src/ui/views/swarm.ts`](ui/src/ui/views/swarm.ts) adds the swarm dashboard view
- [`ui/src/ui/views/personas.ts`](ui/src/ui/views/personas.ts) adds the personas browser view
- [`ui/src/styles/swarm-personas.css`](ui/src/styles/swarm-personas.css) contains the shared styling

Validation note: `npx vite build` in [`ui/`](ui/) now completes successfully with the `swarm` and `personas` additions in place.

## Development

### `nano-core`

```bash
cd nano-core
npm install
npm run build
npm test
```

### `nanohub`

```bash
cd nanohub
bun install
bun run build
bun run test
```

### `extensions/pumpfun`

```bash
cd extensions/pumpfun
npm install
npm run build
npm test
```

### `ui`

```bash
cd ui
npm install
npx vite build
```

## Configuration And Secrets

The current runtime loads config from environment variables plus the encrypted vault in `~/.nanosolana/vault.enc`.

Core variables that matter today:

| Variable | Required | Notes |
|----------|----------|-------|
| `HELIUS_RPC_URL` | Yes | Solana RPC |
| `HELIUS_API_KEY` | Yes | Helius enhanced APIs |
| `OPENROUTER_API_KEY` or `AI_API_KEY` | Yes | AI provider credential |
| `OPENROUTER_MODEL` or `AI_MODEL` | Optional | Defaults to `openrouter/healer-alpha` |
| `BIRDEYE_API_KEY` | Optional | Market data |
| `JUPITER_API_KEY` | Optional | Swap API |
| `NANO_GATEWAY_SECRET` | Optional | Generated if absent |
| `HELIUS_WSS_URL` | Optional | Realtime subscriptions |
| `TELEGRAM_BOT_TOKEN` | Optional | Pump Telegram gateway |
| `SOLANA_RPC_URL` | Optional | Pump bridge RPC override |
| `TAILSCALE_AUTH_KEY` | Optional | Mesh networking |
| `NANO_HUB_URL` | Optional | NanoHub site URL override for `nanosolana hub` and Hub bridge integrations |

Current gateway defaults come from [`nano-core/src/config/vault.ts`](nano-core/src/config/vault.ts):

- host: `0.0.0.0`
- port: `18790`
- runtime bridge URL default: `http://localhost:3000`
- public NanoHub skill site: `https://hub.nanosolana.com`

Public NanoHub skill discovery is available directly from the published package:

```bash
npx nanosolana hub skills
npx nanosolana hub skills pump --limit 5
npx nanosolana hub inspect token-tracker
```

Install, publish, and sync remain in the dedicated NanoHub CLI:

```bash
npx nanohub@latest install token-tracker
npx nanohub@latest search telegram
```

## Monorepo Layout

```text
NanoSolana/
├── nano-core/              # Published nanosolana package and CLI
├── nano-docs/              # Main docs tree
├── nanohub/                # Registry app and CLI
├── extensions/             # 41 extension directories
├── pump/                   # NanoSolana Pump bridge layer
├── pump-fun-sdk-main/      # Vendored upstream Pump ecosystem
├── skills/                 # 77 skill packs
├── apps/                   # macOS and Android workspaces
├── site/                   # Marketing site
├── ui/                     # Standalone UI
├── tokenized-agents/       # Solana payment integration docs
├── agent-tasks/            # Top-level Pump task prompts
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
└── LICENSE
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).

MIT — [NanoSolana Labs](https://nanosolana.com)
