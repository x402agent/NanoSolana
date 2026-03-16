---
summary: "NanoSolana CLI reference for the commands currently shipped by nano-core"
title: "CLI Reference"
---

# CLI reference

NanoSolana ships a unified `nanosolana` CLI from `nano-core/src/cli/entry.ts`.
This page documents the commands that exist today, and calls out older spec
surfaces that have not landed as first-class subcommands yet.

## Detailed pages in this doc tree

- [hub-convex](/cli/hub-convex)
- [pet](/cli/pet)
- [gateway](/cli/gateway)
- [wallet](/cli/wallet)
- [trade](/cli/trade)
- [memory](/cli/memory)
- [channels](/cli/channels)

## Global flags

- `-h`, `--help`
- `-V`, `--version`

## Shipped top-level commands

```text
nanosolana init
nanosolana birth
nanosolana run
nanosolana status
nanosolana pet
nanosolana send
nanosolana bots
nanosolana nodes
nanosolana config
nanosolana vault [query]
nanosolana docs [query]
nanosolana go
nanosolana demo
nanosolana dvd
nanosolana lobster
nanosolana scan [address]
nanosolana register
nanosolana registry
nanosolana nanobot
```

## Command groups

### Bootstrap and runtime

- `nanosolana init` — prompt for secrets and write non-sensitive defaults
- `nanosolana birth` — create an agent wallet and hatch a pet
- `nanosolana run` — start wallet heartbeat, ClawVault, trading engine, and gateway
- `nanosolana go` — one-shot bootstrap flow
- `nanosolana demo` — synthetic simulation mode

### Inspection and local operations

- `nanosolana status` — wallet, pet, ClawVault, Tailscale, and tmux rollup
- `nanosolana pet` — show current pet state
- `nanosolana config` — print redacted config
- `nanosolana vault [query]` — inspect ClawVault and search it
- `nanosolana docs [query]` — inspect `nano-docs`, `pump/docs`, and extensions
- `nanosolana scan [address]` — on-chain wallet snapshot
- `nanosolana register` / `registry` — devnet identity registration and lookup
- `nanosolana nanobot` — start the local NanoBot UI on port `7777` by default
- `nanosolana dvd` / `lobster` — terminal extras

### Mesh and tmux operations

- `nanosolana send <message>` — broadcast or target a mesh node
- `nanosolana nodes` — list Tailscale nodes
- `nanosolana bots list|spawn|attach|kill` — manage tmux-backed bot sessions

## Important clarifications

- There is no shipped `nanosolana wallet ...` subtree yet.
- There is no shipped `nanosolana trade ...` subtree yet.
- There is no shipped `nanosolana memory ...` subtree yet; ClawVault is exposed through `nanosolana vault`.
- There is no shipped `nanosolana gateway ...` subtree yet; the gateway is started by `run` or `go`, or via `npm run gateway` inside `nano-core`.

Those older command shapes appeared in earlier docs as a target UX. The rest of this doc tree maps those capability areas to the commands and scripts that actually exist.

## Environment variables

Most important variables today:

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` / `AI_API_KEY` | AI credential |
| `OPENROUTER_MODEL` / `AI_MODEL` | AI model (default `openrouter/healer-alpha`) |
| `HELIUS_RPC_URL` | Helius Solana RPC endpoint |
| `HELIUS_API_KEY` | Helius API key |
| `HELIUS_WSS_URL` | Helius WebSocket endpoint |
| `BIRDEYE_API_KEY` | Birdeye market data |
| `JUPITER_API_KEY` | Jupiter swap API |
| `NANO_GATEWAY_PORT` | Gateway port (default `18790`) |
| `NANO_GATEWAY_SECRET` | Gateway HMAC secret |
| `TAILSCALE_AUTH_KEY` | Mesh auth |
