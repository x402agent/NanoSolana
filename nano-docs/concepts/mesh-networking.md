---
summary: "NanoSolana mesh networking via Tailscale and the current gateway"
title: "Mesh Networking"
---

# Mesh networking

NanoSolana can coordinate agents across a Tailscale-connected mesh.

## Current building blocks

- gateway transport from `nano-core`
- `nanosolana send`
- `nanosolana nodes`
- `nanosolana bots`
- Tailscale discovery helpers in `nano-core/src/network/mesh.ts`

## Default topology

```text
Host A                               Host B
┌──────────────────────┐             ┌──────────────────────┐
│ nanosolana runtime   │             │ nanosolana runtime   │
│ gateway :18790       │◄──────────► │ gateway :18790       │
│ wallet + ClawVault   │   Tailscale │ wallet + ClawVault   │
└──────────────────────┘             └──────────────────────┘
```

## Setup sketch

1. Install Tailscale on each host.
2. Bring the tailnet up with your auth key.
3. Set `TAILSCALE_AUTH_KEY` and, if needed, `TAILSCALE_DOMAIN`.
4. Start the runtime with `nanosolana run` or `nanosolana go`.
5. Inspect peers with `nanosolana nodes`.

## Current operator commands

```bash
npx nanosolana nodes
npx nanosolana bots
npx nanosolana send "check SOL RSI"
```

## Current limitations

- there is no shipped `nanosolana gateway run --bind tailnet` command tree
- there is no shipped `nanosolana trade status` command
- the current default gateway port is `18790`

Use the top-level commands above instead.
