---
summary: "NanoSolana docs index for the current CLI, gateway, Pump bridge, NanoHub, and core concepts"
title: "NanoSolana Docs"
---

# NanoSolana Docs

> Documentation for the workspaces that actually ship in this checkout.

**Website:** [nanosolana.com](https://nanosolana.com) · **Hub:** [hub.nanosolana.com](https://hub.nanosolana.com) · **Docs:** [docs.nanosolana.com](https://docs.nanosolana.com) · **GitHub:** [github.com/x402agent/NanoSolana](https://github.com/x402agent/NanoSolana)

## Start Here

### Use the published CLI

```bash
npx nanosolana demo
npx nanosolana go
```

### Use NanoHub

```bash
npx nanohub@latest login
npx nanohub@latest publish ./skills/my-agent --slug my-agent --name "My Agent" --version 1.0.0
npx nanohub@latest sync --all
```

Legacy `clawhub` remains a compatibility alias, but `nanohub` is the canonical name.

## What These Docs Cover

This doc tree focuses on:

- the current `nanosolana` CLI in `nano-core`
- OODA, ClawVault, TamaGOchi, gateway, mesh, and extension concepts
- NanoHub and skill publishing
- the Pump bridge layer exposed from `pump/`

For the much deeper Pump protocol and ecosystem docs, use the separate repo-local tree at [`../pump/docs/getting-started.md`](../pump/docs/getting-started.md).

## Repo Reality Snapshot

| Area | Current state |
|------|---------------|
| Core runtime | `nano-core/` is the active TypeScript runtime and published npm package |
| Gateway default | `0.0.0.0:18790` |
| Personas | 43 JSON personas under `nano-core/src/claw/personas/` |
| Extensions | 41 extension directories, 14 manifest-based runtime plugins |
| Pump docs | 83 files under `pump/docs/` |
| Pump skills | 24 Pump and PumpFun-specific skill packs under `skills/` |
| NanoHub | Separate app + CLI in `nanohub/` |

## Documentation Map

### Concepts

- [**Features**](/concepts/features) — what exists in this checkout
- [**Architecture**](/concepts/architecture) — repo and runtime structure
- [**Agent Loop (OODA)**](/concepts/agent-loop) — Observe → Orient → Decide → Act → Learn
- [**Memory (ClawVault)**](/concepts/memory) — current memory model and CLI access
- [**Mesh Networking**](/concepts/mesh-networking) — Tailscale + tmux + gateway routing
- [**System Prompt (SOUL.md)**](/concepts/system-prompt) — agent identity
- [**Model Providers**](/concepts/model-providers) — AI provider wiring
- [**Sessions**](/concepts/sessions) — persistence and session keys
- [**TamaGOchi**](/concepts/tamagochi) — pet state and risk coupling

### CLI

- [**CLI Index**](/cli) — shipped commands and what is still only a planned UX shape
- [**Hub + Convex**](/cli/hub-convex) — NanoHub login, publish, sync
- [**Gateway Surfaces**](/cli/gateway) — how the gateway starts today
- [**Pet**](/cli/pet) — current `nanosolana pet`
- [**Memory**](/cli/memory) — current `nanosolana vault`
- [**Trade**](/cli/trade) — how trading is exposed today
- [**Wallet**](/cli/wallet) — wallet flows in the current CLI
- [**Channels**](/cli/channels) — messaging and extension surfaces

### Runtime Areas

- [**Trading**](/trading) — OODA execution and Pump-facing trading surfaces
- [**Gateway**](/gateway) — startup, configuration, protocol, heartbeat, security
- [**Extensions**](/extensions) — manifest-based plugins plus the PumpFun scaffold
- [**Tools**](/tools) — AI-facing and developer-facing tooling model
- [**Security**](/security) — vault, HMAC, trust boundaries, and current caveats

## Adjacent Pump Docs

The top-level `pump/` directory is an integration layer around the broader Pump ecosystem vendored in `pump-fun-sdk-main/`.

Useful entrypoints:

- [`../pump/index.ts`](../pump/index.ts)
- [`../pump/sdk-bridge.ts`](../pump/sdk-bridge.ts)
- [`../pump/swarm-spawner.ts`](../pump/swarm-spawner.ts)
- [`../pump/telegram-gateway.ts`](../pump/telegram-gateway.ts)
- [`../pump/bot-registry.ts`](../pump/bot-registry.ts)
- [`../pump/main.ts`](../pump/main.ts)
- [`../pump/docs/getting-started.md`](../pump/docs/getting-started.md)
- [`../pump/docs/ecosystem.md`](../pump/docs/ecosystem.md)
- [`../pump/agent-tasks/README.md`](../pump/agent-tasks/README.md)

## Current Caveat

Older docs and comments in this repository sometimes describe planned CLI trees such as `nanosolana trade ...`, `nanosolana wallet ...`, or `nanosolana gateway ...`. This doc set is being aligned to distinguish between:

- shipped CLI commands
- runtime capabilities that are automatic inside `run` / `go`
- developer-only scripts or source entrypoints

That distinction matters for avoiding dead ends during setup.
