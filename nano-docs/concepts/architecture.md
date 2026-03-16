---
summary: "NanoSolana architecture across nano-core, Pump bridge, NanoHub, extensions, and docs"
title: "Architecture"
---

# Architecture

NanoSolana is not a single package. It is a monorepo with a published runtime, a registry, a Pump bridge layer, extension packages, and separate doc trees.

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
                       └──────────────┬────────────────┘
                                      │
             ┌────────────────────────┼────────────────────────┐
             │                        │                        │
             ▼                        ▼                        ▼
      ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
      │ extensions/  │         │   nanohub/   │         │    pump/      │
      │ plugins +    │         │ app + CLI    │         │ swarm + bridge│
      │ scaffolds    │         │ for skills   │         │ for Pump SDK  │
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
- Contains wallet management, ClawVault, trading engine, gateway, NanoBot, and on-chain identity
- Starts the gateway automatically during `nanosolana run` and `nanosolana go`
- Uses `HELIUS_*`, `BIRDEYE_*`, `JUPITER_API_KEY`, and AI provider secrets from the encrypted vault

## `pump/`

The top-level `pump/` workspace is the NanoSolana-facing Pump bridge layer.

It provides:

- [`../pump/sdk-bridge.ts`](../pump/sdk-bridge.ts) for convenience analytics and quote helpers
- [`../pump/swarm-spawner.ts`](../pump/swarm-spawner.ts) for in-process role-based agent orchestration
- [`../pump/telegram-gateway.ts`](../pump/telegram-gateway.ts) for Telegram command handling
- [`../pump/bot-registry.ts`](../pump/bot-registry.ts) for bot, service, and package metadata
- [`../pump/main.ts`](../pump/main.ts) as a standalone launcher for the Pump swarm bridge

This layer points into the vendored upstream workspace in `pump-fun-sdk-main/`.

## `extensions/`

There are two extension shapes in this repo:

- manifest-based runtime plugins with `nanosolana-plugin.json`
- adjacent packages and scaffolds that live under `extensions/` but are not discovered through the runtime plugin loader

The dedicated PumpFun extension at [`../extensions/pumpfun/src/index.ts`](../extensions/pumpfun/src/index.ts) is currently a scaffolded package for bridging Pump.fun launches, graduations, whale trades, and fee claims into the NanoSolana message bus.

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
- `nano-core` exposes a `nanosolana docs` command that indexes docs and extensions for local inspection

## Gateway placement

The gateway is a `nano-core` concern, not a separate workspace. Its default config comes from `nano-core/src/config/vault.ts`:

- host: `0.0.0.0`
- port: `18790`
- auth: HMAC-SHA256
- startup path: `nanosolana run`, `nanosolana go`, or `npm run gateway` inside `nano-core`

## Security boundaries

- secrets live in `~/.nanosolana/vault.enc`
- the wallet private key is kept in the vault by default
- the gateway authenticates every WS session with HMAC
- mesh traffic is expected to run over Tailscale when used remotely
- extension code runs in-process and must be trusted accordingly
