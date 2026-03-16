---
summary: "New-user architecture map for NanoSolana runtime, gateway, Pump bridge, and NanoHub"
title: "Architecture"
---

# Architecture

NanoSolana is a monorepo. New users usually interact with just one part first:
the `nanosolana` CLI in `nano-core`.

This page explains how the major pieces fit together, so you know which
workspace to open for each task.

## New-user mental model

If you remember one flow, remember this:

1. `npx nanosolana go` (or `init` + `birth` + `run`) starts your runtime.
2. That runtime includes wallet, pet, ClawVault memory, trading engine, and
   gateway.
3. Gateway APIs and extensions are how UIs and automation interact with the
   runtime.
4. NanoHub is the separate skill publishing/discovery layer.

## Top-level map

```text
NanoSolana/
├── nano-core/              # Published nanosolana package
├── nano-docs/              # Product docs
├── nanohub/                # Registry app + nanohub CLI
├── extensions/             # Extension packages and plugin manifests
├── pump/                   # NanoSolana-facing Pump integration layer
├── pump-fun-sdk-main/      # Vendored Pump ecosystem snapshot
├── skills/                 # Agent skills, including 24 pump-focused packs
├── apps/                   # macOS and Android workspaces
├── site/                   # Marketing site
└── ui/                     # Standalone UI assets
```

## Runtime architecture

The current runtime center of gravity is `nano-core`.

```text
                 ┌───────────────────────────────┐
                 │          nano-core            │
                 │  CLI · wallet · AI · memory   │
                 │  trading · gateway · nanobot  │
                 │  payments · pump bridge · dvd │
                 └──────────────┬────────────────┘
                                │
       ┌────────────────────────┼────────────────────────┐
       │                        │                        │
       ▼                        ▼                        ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ extensions/  │         │   nanohub/   │         │    pump/     │
│ plugins +    │         │ app + CLI    │         │ swarm +      │
│ scaffolds    │         │ for skills   │         │ bridge        │
└──────────────┘         └──────────────┘         └──────┬───────┘
                                                          │
                                                          ▼
                                               ┌─────────────────────┐
                                               │ pump-fun-sdk-main/  │
                                               │ vendored upstream   │
                                               │ SDK, bots, docs     │
                                               └─────────────────────┘
```

## `nano-core`

- Published as `nanosolana`
- Owns the shipped CLI surface
- Contains wallet management, ClawVault, trading engine, gateway, NanoBot, and
  on-chain identity
- Ships `nanosolana pay` for on-chain invoice creation and verification via
  `@pump-fun/agent-payments-sdk`
- Includes terminal UX commands such as `demo`, `dvd`, and `lobster`
- Supports optional DVD-style intro during startup with
  `nanosolana go --dvd-intro` or `NANO_DVD_INTRO=1`
- Integrates the Pump bridge layer at `src/claw/pump/` (sdk-bridge,
  swarm-spawner, telegram-gateway, bot-registry)
- Starts the gateway automatically during `nanosolana run` and `nanosolana go`
- Uses `HELIUS_*`, `BIRDEYE_*`, `JUPITER_API_KEY`, and AI provider secrets from
  the encrypted vault

### Core command paths (what is shipped now)

- bootstrap/runtime: `init`, `birth`, `run`, `go`, `demo`
- runtime inspection: `status`, `pet`, `vault`, `docs`, `tasks`, `scan`
- gateway/mesh ops: `send`, `nodes`, `bots`
- registry/hub/payments: `register`, `registry`, `hub ...`, `pay ...`

See [CLI Reference](/cli) for exact command signatures.

## `pump/` → `nano-core/src/claw/pump/`

The Pump bridge layer has been integrated into `nano-core` at `src/claw/pump/`.

It provides:

- `nano-core/src/claw/pump/sdk-bridge.ts` for convenience analytics and quote
  helpers
- `nano-core/src/claw/pump/swarm-spawner.ts` for in-process role-based agent
  orchestration with optional payment gating
- `nano-core/src/claw/pump/telegram-gateway.ts` for Telegram command handling
  including `/invoice` and `/invoices`
- `nano-core/src/claw/pump/bot-registry.ts` for bot, service, and package
  metadata
- `nano-core/src/claw/pump/types.ts` for shared Pump type definitions

The top-level `pump/` workspace remains as a reference but the canonical runtime
code is in `nano-core`.

## Payments module

`nano-core/src/payments/` provides on-chain tokenized agent payments:

- `agent.ts` — `NanoPaymentAgent` class wrapping `PumpAgent` from
  `@pump-fun/agent-payments-sdk`
- `types.ts` — invoice, payment config, and currency type definitions
- `index.ts` — barrel exports and `createPaymentAgent()` factory
- Program ID: `AgenTMiC2hvxGebTsgmsD4HHBa8WEcqGFf87iwRRxLo7`

## `extensions/`

There are two extension shapes in this repo:

- extension metadata merged from `nanosolana-plugin.json`,
  `openclaw.plugin.json`, and `package.json#nanosolana`
- adjacent packages and scaffolds that live under `extensions/` but are not
  discovered through the runtime plugin loader

The dedicated PumpFun extension at
[`../extensions/pumpfun/src/index.ts`](../extensions/pumpfun/src/index.ts) is
currently a scaffolded package for bridging Pump.fun launches, graduations,
whale trades, and fee claims into the NanoSolana message bus.

## `nanohub/`

NanoHub is separate from the runtime:

- web app for browsing and publishing skills
- `nanohub` CLI for install, sync, publish, inspect, login
- Convex-backed auth, API, and publishing flows
- canonical host: `https://hub.nanosolana.com`

## Knowledge layout

- `nano-docs/` is the concise NanoSolana doc site content
- `pump/docs/` is the much larger Pump protocol and ecosystem doc set
- `skills/` contains general skills plus 24 Pump or PumpFun-oriented packs
- `nano-core` exposes a `nanosolana docs` command that indexes docs and
  extensions for local inspection

## Gateway placement

The gateway is a `nano-core` concern, not a separate workspace. Its default
config comes from `nano-core/src/config/vault.ts`:

- host: `0.0.0.0`
- port: `18790`
- auth: HMAC-SHA256
- startup path: `nanosolana run`, `nanosolana go`, or `npm run gateway` inside
  `nano-core`

For day-one gateway operations, follow [Gateway Runbook](/gateway) and
[Gateway (CLI Surface)](/cli/gateway).

## Payment boundaries

- `nano-core/src/payments/` wraps `@pump-fun/agent-payments-sdk` for on-chain
  invoices
- Invoice PDA derivation prevents duplicate payments
- Payment verification uses on-chain validation with configurable retries
- `AGENT_TOKEN_MINT_ADDRESS` and `CURRENCY_MINT` are required for payment
  operations

## Security boundaries

- secrets live in `~/.nanosolana/vault.enc`
- the wallet private key is kept in the vault by default
- the gateway authenticates every WS session with HMAC
- mesh traffic is expected to run over Tailscale when used remotely
- extension code runs in-process and must be trusted accordingly

## Where to go next

- [CLI Reference](/cli) — first command map
- [Gateway Runbook](/gateway) — health checks and deployment shape
- [Trading Engine](/trading) — strategy/runtime detail
- [Security](/security) — vault, secrets, and auth posture
