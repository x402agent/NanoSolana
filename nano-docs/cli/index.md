---
summary: "Beginner-first CLI guide for Solana Clawd Go with copy/paste startup paths and shipped command reference"
title: "CLI Reference"
---

# CLI Reference

This page is the **source-of-truth for shipped commands** in the current
`scg` CLI (`nano-core/src/cli/entry.ts`).

If you are new, use one of these three startup tracks.

## Quickstart tracks (copy/paste)

### Track A — Safe simulation (no keys)

```bash
npx scg demo --duration 30
```

### Track B — Fast live startup (one command)

```bash
npx scg go
```

Optional startup animation:

```bash
npx scg go --dvd-intro
```

Or enable DVD intro by environment variable:

```bash
NANO_DVD_INTRO=1 npx scg go
```

Explicit daemon startup:

```bash
npx scg daemon
```

### Track C — Explicit manual startup

```bash
npx scg init
npx scg birth --name MyAgent --pet-name MyPet
npx scg run
```

In a second terminal:

```bash
npx scg status
npx scg pet
npx scg vault
```

## Detailed pages in this section

- [Gateway (CLI Surface)](/cli/gateway)
- [Trading (CLI Surface)](/cli/trade)
- [Wallet](/cli/wallet)
- [Memory](/cli/memory)
- [Pet](/cli/pet)
- [Channels](/cli/channels)
- [Hub + Convex](/cli/hub-convex)

## Global flags

- `-h`, `--help`
- `-V`, `--version`

## Shipped top-level commands

```text
scg init
scg birth
scg run
scg daemon
scg status
scg pet
scg send
scg bots
scg nodes
scg config
scg vault [query]
scg docs [query]
scg tasks [query]
scg go [--dvd-intro] [--skip-init]
scg bootstrap [--dvd-intro] [--skip-init]
scg demo [--duration]
scg dvd
scg lobster [--static]
scg scan [address]
scg register
scg registry
scg nanobot [--port]
scg pay invoice|verify|status
scg hub skills|inspect|register|list|search|heartbeat|status|deregister
```

## Command groups

### Bootstrap and runtime

- `scg init` — prompt for and encrypt secrets in
  `~/.scg/vault.enc`
- `scg birth` — create wallet + hatch pet
- `scg run` — start wallet heartbeat, ScgVault, trading engine, and
  gateway
- `scg daemon` — alias for `run` when you want the long-lived runtime
  described explicitly
- `scg go` — one-shot initialization + runtime startup
- `scg bootstrap` — alias for `go`
- `scg demo` — simulation mode without API keys

### Startup visuals and terminal UX

- `scg go --dvd-intro` — plays short DVD-style intro before startup
  sequence
- `NANO_DVD_INTRO=1 scg go` — enables same behavior via env flag
- `scg dvd` — full-screen terminal DVD screensaver mode
- `scg lobster` — animated mascot (or `--static`)

### Inspection and local operations

- `scg status` — wallet, pet, memory, Tailscale, and tmux summary
- `scg pet` — current pet state
- `scg config` — redacted runtime config
- `scg vault [query]` — inspect/search ScgVault entries
- `scg docs [query]` — inspect indexed docs + extension corpus
- `scg tasks [query]` — inspect registry-backed task assignments
- `scg scan [address]` — on-chain wallet snapshot (Helius)
- `scg register` / `registry` — devnet identity registration and lookup
- `scg nanobot` — launch local UI companion server

### Mesh and tmux operations

- `scg send <message> [--target <hostname>]`
- `scg nodes`
- `scg bots list|spawn|attach|kill`

### Tokenized agent payments

- `scg pay invoice --user <pubkey> --amount <amount> [--currency USDC|SOL] [--duration 3600]`
- `scg pay verify --user <pubkey> --memo <memo> --amount <amount> --start <ts> --end <ts>`
- `scg pay status`

### NanoHub discovery and registry

- `scg hub skills [query]`
- `scg hub inspect <slug>`
- `scg hub register|list|search|heartbeat|status|deregister`

## Important clarifications (new-user safety)

- There is **no shipped** `scg wallet ...` subtree yet.
- There is **no shipped** `scg trade ...` subtree yet.
- There is **no shipped** `scg memory ...` subtree yet
  (`scg vault` is the memory surface).
- There is **no shipped** `scg gateway ...` subtree yet (gateway starts
  via `run` or `go`, or `npm run gateway` in `nano-core`).
- Install/publish/sync for skills still live in the dedicated `nanohub` package.

## Core environment variables

| Variable                            | Description                                      |
| ----------------------------------- | ------------------------------------------------ |
| `OPENROUTER_API_KEY` / `AI_API_KEY` | AI credential                                    |
| `OPENROUTER_MODEL` / `AI_MODEL`     | AI model                                         |
| `HELIUS_RPC_URL`                    | Solana RPC endpoint                              |
| `HELIUS_API_KEY`                    | Helius API key                                   |
| `HELIUS_WSS_URL`                    | Helius WebSocket endpoint                        |
| `BIRDEYE_API_KEY`                   | Birdeye market data                              |
| `JUPITER_API_KEY`                   | Jupiter API key                                  |
| `NANO_GATEWAY_PORT`                 | Gateway port (default `18790`)                   |
| `NANO_GATEWAY_SECRET`               | Gateway HMAC secret                              |
| `NANO_DVD_INTRO`                    | Enable `go` DVD intro (`1`, `true`, `yes`, `on`) |
| `NANO_AGENT_HEARTBEAT_INTERVAL_MS`  | Wallet heartbeat interval                        |
| `NANO_HUB_URL`                      | NanoHub site URL                                 |
| `TAILSCALE_AUTH_KEY`                | Mesh auth key                                    |
| `AGENT_TOKEN_MINT_ADDRESS`          | Agent token mint for payment flows               |
| `CURRENCY_MINT`                     | Payment currency mint                            |
