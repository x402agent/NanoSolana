---
summary: "Solana Claude Go mesh networking via Tailscale and the current gateway"
title: "Mesh Networking"
---

# Mesh networking

Solana Claude Go can coordinate agents across a Tailscale-connected mesh.

## Current building blocks

- gateway transport from `nano-core`
- `scg send`
- `scg nodes`
- `scg bots`
- Tailscale discovery helpers in `nano-core/src/network/mesh.ts`

## Default topology

```text
Host A                               Host B
┌──────────────────────┐             ┌──────────────────────┐
│ scg runtime   │             │ scg runtime   │
│ gateway :18790       │◄──────────► │ gateway :18790       │
│ wallet + ScgVault   │   Tailscale │ wallet + ScgVault   │
└──────────────────────┘             └──────────────────────┘
```

## Setup sketch

1. Install Tailscale on each host.
2. Bring the tailnet up with your auth key.
3. Set `TAILSCALE_AUTH_KEY` and, if needed, `TAILSCALE_DOMAIN`.
4. Start the runtime with `scg run` or `scg go`.
5. Inspect peers with `scg nodes`.

## Current operator commands

```bash
npx scg nodes
npx scg bots
npx scg send "check SOL RSI"
```

## Practical note

Mesh operation in the current runtime is centered on:

- `scg run` or `scg go`
- `scg nodes`
- `scg bots`
- `scg send`

The current default gateway port across mesh nodes is `18790`.
