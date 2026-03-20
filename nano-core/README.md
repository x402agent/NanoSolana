<div align="center">

# NanoSolana

**TypeScript runtime and CLI for autonomous Solana agents, trading daemons, and one-shot operator setup.**

[![npm version](https://img.shields.io/npm/v/nanosolana?color=14F195&style=flat-square)](https://npmjs.com/package/nanosolana)
[![npm downloads](https://img.shields.io/npm/dm/nanosolana?color=9945FF&style=flat-square)](https://npmjs.com/package/nanosolana)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%E2%89%A522-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)

[Website](https://nanosolana.com) · [Hub](https://hub.nanosolana.com) · [Docs](https://docs.nanosolana.com) · [GitHub](https://github.com/x402agent/NanoSolana)

</div>

`nano-core` is the package published to npm as `nanosolana`. It is the main runtime for the current TypeScript build.

## What It Ships

| Area | Included |
| --- | --- |
| Bootstrap | `go`, `bootstrap`, `init`, `birth`, `daemon`, `run`, `demo` |
| Runtime | wallet lifecycle, heartbeat, trading engine, gateway, NanoBot |
| Memory | ClawVault with `known`, `learned`, and `inferred` tiers |
| Strategy | RSI, EMA, ATR, signal scoring |
| Security | AES-256-GCM local secret vault |
| Discovery | NanoHub public skill discovery and one-shot manifests |
| Registry | local registry flows and on-chain identity helpers |
| Pump | integrated Pump SDK exports and swarm helpers |

## Fastest Start

### Demo mode

```bash
npx nanosolana demo
```

Runs the runtime in simulation mode. No API keys required.

### One-shot operator bootstrap

```bash
npx nanosolana go
```

Alias:

```bash
npx nanosolana bootstrap
```

This is the main onboarding path for a new operator. It prompts for required keys, encrypts them into `~/.nanosolana/vault.enc`, creates the local wallet, boots the pet and memory systems, starts the OODA engine, and brings up the gateway.

### Long-running daemon

```bash
npx nanosolana daemon
```

Alias:

```bash
npx nanosolana run
```

This starts the persistent runtime directly if your local state is already initialized.

## Install

### Run without installing

```bash
npx nanosolana demo
npx nanosolana go
```

### Global install

```bash
npm install -g nanosolana
nanosolana demo
```

### From source

```bash
git clone https://github.com/x402agent/NanoSolana.git
cd NanoSolana/nano-core
npm install
npm run build
node dist/cli/entry.js demo
```

## Minimal Live Configuration

The minimum practical live setup is:

```bash
OPENROUTER_API_KEY=...
HELIUS_API_KEY=...
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=...
```

Better live behavior usually also wants:

```bash
BIRDEYE_API_KEY=...
JUPITER_API_KEY=...
NANO_GATEWAY_SECRET=...
```

Use [`./.env.example`](./.env.example) as the full template.

## One-Shot Skill Plans

The runtime can resolve NanoHub manifests into a launch plan:

```bash
npx nanosolana oneshot token-tracker
npx nanosolana oneshot token-tracker --json
```

That flow:

- resolves the public NanoHub manifest
- checks required env vars
- reports OAuth blockers
- shows install packages and linked extensions
- emits a machine-readable launch plan

## Current CLI

```text
init
birth
run
daemon
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
bootstrap
demo
scan
register
registry
nanobot
oneshot
```

## SDK Usage

```ts
import {
  AIProvider,
  ClawVault,
  NanoWallet,
  StrategyEngine,
  TamaGOchi,
  TradingEngine,
  loadConfig,
} from "nanosolana";

const config = loadConfig();
const wallet = new NanoWallet("my-agent");
await wallet.birth();

const vault = new ClawVault();
vault.startAutonomous();

const pet = new TamaGOchi("MyAgent");
const engine = new TradingEngine(config, wallet);
await engine.start();
```

## Operator Documents

- [`SOUL.md`](./SOUL.md)
- [`RESEARCH.md`](./RESEARCH.md)
- [`GO_PARITY.md`](./GO_PARITY.md)

## Go Parity

The old Go daemon package graph is being adapted into the TypeScript runtime, not copied line-for-line. The parity map lives in [`GO_PARITY.md`](./GO_PARITY.md).
