# NanoSolana

> One-shot Solana trading agents and autonomous daemons in TypeScript.

NanoSolana is a TypeScript-first monorepo for building wallet-aware Solana agents, local operator daemons, NanoHub-powered skill installs, Pump integrations, and lightweight control surfaces.

The main runtime lives in [`nano-core/`](nano-core/) and ships to npm as `nanosolana`.

## Latest Runtime Update

The current published package line now reflects the TypeScript-first runtime work:

- `nanosolana@1.0.3` is published on npm
- `nanosolana daemon` is the explicit long-running runtime alias
- `nanosolana bootstrap` is the explicit alias for `nanosolana go`
- the npm package now bundles [`SOUL.md`](nano-core/SOUL.md), [`RESEARCH.md`](nano-core/RESEARCH.md), and [`GO_PARITY.md`](nano-core/GO_PARITY.md)
- the AI/runtime prompt layer now resolves those packaged operator documents directly
- the docs set now includes the research-program and system-prompt updates for the TypeScript runtime

## What This Repo Is

This repo is the TypeScript adaptation of the broader NanoSolana operator model:

- a wallet that boots itself
- a daemon you can leave running
- memory that compounds across sessions
- a strategy loop that can improve over time
- a one-shot command that gets a developer from install to a live local runtime

That story now belongs to the TypeScript build, not just the older Go materials.

## 30-Second Start

```bash
cd nano-core
npm install
npm run build
npx nanosolana demo
```

`demo` runs the local runtime in simulation mode with wallet lifecycle, ClawVault memory, TamaGOchi state, and the OODA loop. No API keys required.

Published package path:

```bash
npx nanosolana@latest demo
```

## One-Shot Bootstrap

```bash
cd nano-core
cp .env.example .env
npm install
npm run build
npx nanosolana go
```

Published package path:

```bash
npx nanosolana@latest go
npx nanosolana@latest daemon
```

`nanosolana go` is the current TypeScript bootstrap path. It:

- collects and encrypts secrets into `~/.nanosolana/vault.enc`
- creates or restores the local wallet
- boots the TamaGOchi companion state
- starts ClawVault memory
- starts the OODA trading runtime
- starts the local gateway
- attempts a Helius wallet scan and registry flow when configured

If you already have state initialized, run the daemon directly:

```bash
npx nanosolana daemon
```

## Monorepo Layout

| Path | Purpose |
| --- | --- |
| [`nano-core/`](nano-core/) | Published runtime, CLI, wallet, gateway, trading engine, vault, NanoBot |
| [`nanohub/`](nanohub/) | Registry, marketplace, and installer-facing web app |
| [`skills/`](skills/) | Skill packs in `SKILL.md` format |
| [`extensions/`](extensions/) | Channel and tool extensions |
| [`pump/`](pump/) | Pump-facing bridge layer, swarm helpers, and Telegram control plane |
| [`ui/`](ui/) | Standalone UI assets |
| [`apps/`](apps/) | macOS and Android workspaces |
| [`nano-docs/`](nano-docs/) | Product and operator documentation |

## TypeScript Runtime Surface

The current runtime in [`nano-core/src/`](nano-core/src/) already includes:

- encrypted config and secret storage
- wallet creation and heartbeat
- ClawVault epistemological memory
- RSI/EMA/ATR strategy and trading loop
- AI-guided OODA reasoning
- gateway server
- NanoBot local UI
- NanoHub skill discovery and one-shot manifests
- Pump SDK integration and swarm tooling
- Bitaxe Gamma / AxeOS mining integration with polling, control actions, alert tracking, NanoBot UI, and Chrome extension controls

## Bitaxe Integration

The TypeScript runtime now includes a Bitaxe client ported from the Go runtime model and exposed through both the gateway and NanoBot.

Current surfaces:

- `NanoBot` local dashboard at `nanosolana nanobot`
- gateway endpoints: `/api/miner` and `/api/extension/miner`
- Chrome extension options page miner controls

Core env:

```bash
BITAXE_ENABLED=true
BITAXE_HOST=192.168.1.42
BITAXE_POLL_INTERVAL=10
BITAXE_ALERTS_ENABLED=true
BITAXE_TEMP_WARNING=60
BITAXE_TEMP_CRITICAL=70
```

Supported actions:

- refresh miner status
- restart the device
- set ASIC frequency
- set core voltage
- set fan speed
- set pool URL and port
- set payout wallet / stratum user

## Go-to-TypeScript Adaptation

The Go daemon package tree is being mapped into the TypeScript runtime instead of copied line-for-line.

Use:

- [`nano-core/GO_PARITY.md`](nano-core/GO_PARITY.md)

That document marks each Go package as:

- `covered` when the TypeScript runtime already has a clear equivalent
- `partial` when the concept exists but parity is incomplete
- `planned` when the Go capability still needs a dedicated TS module

## Operator Documents

The TypeScript runtime now carries its operator-facing docs directly:

- [`nano-core/SOUL.md`](nano-core/SOUL.md)
- [`nano-core/RESEARCH.md`](nano-core/RESEARCH.md)
- [`nano-core/GO_PARITY.md`](nano-core/GO_PARITY.md)
- [`nano-core/README.md`](nano-core/README.md)

## Developer Workflow

Core runtime:

```bash
cd nano-core
npm install
npm run build
npm test
```

NanoHub:

```bash
cd nanohub
bun install
bun run dev
```

## Next Entry Points

- Package runtime: [`nano-core/README.md`](nano-core/README.md)
- Hub and registry: [`nanohub/README.md`](nanohub/README.md)
- Contribution guide: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Security policy: [`SECURITY.md`](SECURITY.md)
