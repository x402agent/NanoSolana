---
summary: "New-user documentation hub for running, operating, and extending Solana Clawd Go"
title: "Solana Clawd Go Docs — New User Hub"
---

# Solana Clawd Go Docs (New User Hub)

Welcome. This is the **new-user hub** for getting productive with Solana Clawd Go
quickly, without falling into outdated command paths.

**Website:** [scg.com](https://scg.com) · **Hub:**
[hub.scg.com](https://hub.scg.com) · **Docs:**
[docs.scg.com](https://docs.scg.com) · **GitHub:**
[github.com/x402agent/Solana Clawd Go](https://github.com/x402agent/Solana Clawd Go)

## 5-minute quickstart (safe)

Run the simulator first (no keys required):

```bash
npx scg demo
```

This shows the OODA loop behavior, pet lifecycle output, and memory flow without
touching live wallets or APIs.

## 15-minute quickstart (live runtime)

```bash
npx scg init
npx scg birth --name MyAgent
npx scg run
```

In another terminal:

```bash
npx scg status
npx scg pet
npx scg vault
```

Want one command? Use:

```bash
npx scg go
```

Want the long-running daemon surface explicitly?

```bash
npx scg daemon
```

Want startup with the DVD-style intro animation?

```bash
npx scg go --dvd-intro
# or
NANO_DVD_INTRO=1 npx scg go
```

## What is shipped right now

The canonical CLI is in `nano-core/src/cli/entry.ts` and currently ships:

- `init`, `birth`, `run`, `status`, `pet`
- `send`, `nodes`, `bots`
- `config`, `vault`, `docs`, `tasks`
- `go`, `demo`, `dvd`, `lobster`
- `scan`, `register`, `registry`, `nanobot`
- `pay invoice|verify|status`
- `hub skills|inspect|register|list|search|heartbeat|status|deregister`

## New-user paths

### I want to run a local agent

Start with [CLI Reference](/cli), then [Gateway Runbook](/gateway), then
[Security](/security).

### I want to understand how it works

Start with [Features](/concepts/features),
[Architecture](/concepts/architecture), and
[Agent Loop (OODA)](/concepts/agent-loop).

### I want to publish and manage skills

Use [Hub + Convex](/cli/hub-convex), `npx scg hub skills`, and NanoHub at
`hub.scg.com`.

### I want to build integrations

Read [Extensions](/extensions), [Tools](/tools), and
[Gateway Protocol](/gateway/protocol).

### I want agents to work from the repo backlog

Use `npx scg tasks`, then inspect [Tools](/tools) and
[Architecture](/concepts/architecture). Personas already consume the same
`agent-tasks/` registry for mission assignment.

## Documentation map

### Concepts

- [Features](/concepts/features)
- [Architecture](/concepts/architecture)
- [Agent Loop (OODA)](/concepts/agent-loop)
- [Memory (ScgVault)](/concepts/memory)
- [Mesh Networking](/concepts/mesh-networking)
- [Model Providers](/concepts/model-providers)
- [System Prompt (SOUL.md)](/concepts/system-prompt)
- [TamaGOchi](/concepts/tamagochi)
- [Sessions](/concepts/sessions)
- [Research Program](/trading/research-program)

### CLI

- [CLI Reference](/cli)
- [Gateway (CLI Surface)](/cli/gateway)
- [Wallet Flows](/cli/wallet)
- [Trading (CLI Surface)](/cli/trade)
- [Memory Surface](/cli/memory)
- [Pet Surface](/cli/pet)
- [Channels](/cli/channels)
- [Hub + Convex](/cli/hub-convex)

### Runtime areas

- [Trading Engine](/trading)
- [Gateway Runbook](/gateway)
- [Extensions](/extensions)
- [Tools](/tools)
- [Security](/security)

## First-day operator checklist

1. Run `npx scg demo`.
2. Configure secrets with `npx scg init`.
3. Set `NANO_GATEWAY_SECRET` before remote/mesh use.
4. Run `npx scg run` and verify `/health`.
5. Confirm vault permissions (`~/.scg` = `0700`, `vault.enc` = `0600`).

## Pump ecosystem docs

Pump bridge runtime code is integrated in `nano-core/src/claw/pump/`, while deep
protocol docs live in:

- [`../pump/docs/getting-started.md`](../pump/docs/getting-started.md)
- [`../pump/docs/ecosystem.md`](../pump/docs/ecosystem.md)

## Important compatibility note

You may still see older examples for command trees like `scg trade ...`,
`scg wallet ...`, or `scg gateway ...`. Treat those as
roadmap/legacy docs unless they appear in the shipped CLI reference.
