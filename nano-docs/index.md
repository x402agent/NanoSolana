---
summary: "New-user documentation hub for running, operating, and extending NanoSolana"
title: "NanoSolana Docs — New User Hub"
---

# NanoSolana Docs (New User Hub)

Welcome. This is the **new-user hub** for getting productive with NanoSolana
quickly, without falling into outdated command paths.

**Website:** [nanosolana.com](https://nanosolana.com) · **Hub:**
[nanosolana.netlify.app](https://nanosolana.netlify.app) · **Docs:**
[docs.nanosolana.com](https://docs.nanosolana.com) · **GitHub:**
[github.com/x402agent/NanoSolana](https://github.com/x402agent/NanoSolana)

## 5-minute quickstart (safe)

Run the simulator first (no keys required):

```bash
npx nanosolana demo
```

This shows the OODA loop behavior, pet lifecycle output, and memory flow without
touching live wallets or APIs.

## 15-minute quickstart (live runtime)

```bash
npx nanosolana init
npx nanosolana birth --name MyAgent
npx nanosolana run
```

In another terminal:

```bash
npx nanosolana status
npx nanosolana pet
npx nanosolana vault
```

Want one command? Use:

```bash
npx nanosolana go
```

## What is shipped right now

The canonical CLI is in `nano-core/src/cli/entry.ts` and currently ships:

- `init`, `birth`, `run`, `status`, `pet`
- `send`, `nodes`, `bots`
- `config`, `vault`, `docs`, `tasks`
- `go`, `demo`, `dvd`, `lobster`
- `scan`, `register`, `registry`, `nanobot`
- `pay invoice|verify|status`

## New-user paths

### I want to run a local agent

Start with [CLI Reference](/cli), then [Gateway Runbook](/gateway), then
[Security](/security).

### I want to understand how it works

Start with [Features](/concepts/features),
[Architecture](/concepts/architecture), and
[Agent Loop (OODA)](/concepts/agent-loop).

### I want to publish and manage skills

Use [Hub + Convex](/cli/hub-convex), `npx nanosolana hub skills`, and NanoHub at `nanosolana.netlify.app`.

### I want to build integrations

Read [Extensions](/extensions), [Tools](/tools), and
[Gateway Protocol](/gateway/protocol).

### I want agents to work from the repo backlog

Use `npx nanosolana tasks`, then inspect [Tools](/tools) and
[Architecture](/concepts/architecture). Personas already consume the same
`agent-tasks/` registry for mission assignment.

## Documentation map

### Concepts

- [Features](/concepts/features)
- [Architecture](/concepts/architecture)
- [Agent Loop (OODA)](/concepts/agent-loop)
- [Memory (ClawVault)](/concepts/memory)
- [Mesh Networking](/concepts/mesh-networking)
- [Model Providers](/concepts/model-providers)
- [System Prompt (SOUL.md)](/concepts/system-prompt)
- [TamaGOchi](/concepts/tamagochi)
- [Sessions](/concepts/sessions)

### CLI

- [CLI Reference](/cli)
- [Gateway Surfaces](/cli/gateway)
- [Wallet Flows](/cli/wallet)
- [Trading Surface](/cli/trade)
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

1. Run `npx nanosolana demo`.
2. Configure secrets with `npx nanosolana init`.
3. Set `NANO_GATEWAY_SECRET` before remote/mesh use.
4. Run `npx nanosolana run` and verify `/health`.
5. Confirm vault permissions (`~/.nanosolana` = `0700`, `vault.enc` = `0600`).

## Pump ecosystem docs

Pump bridge runtime code is integrated in `nano-core/src/claw/pump/`, while deep
protocol docs live in:

- [`../pump/docs/getting-started.md`](../pump/docs/getting-started.md)
- [`../pump/docs/ecosystem.md`](../pump/docs/ecosystem.md)

## Important compatibility note

You may still see older examples for command trees like `nanosolana trade ...`,
`nanosolana wallet ...`, or `nanosolana gateway ...`. Treat those as
roadmap/legacy docs unless they appear in the shipped CLI reference.
