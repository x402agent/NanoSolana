---
summary: "Beginner-first CLI guide for NanoSolana with copy/paste startup paths and shipped command reference"
title: "CLI Reference"
---

# CLI Reference

This page is the **source-of-truth for shipped commands** in the current
`nanosolana` CLI (`nano-core/src/cli/entry.ts`).

If you are new, use one of these three startup tracks.

## Quickstart tracks (copy/paste)

### Track A — Safe simulation (no keys)

```bash
npx nanosolana demo --duration 30
```

### Track B — Fast live startup (one command)

```bash
npx nanosolana go
```

Optional startup animation:

```bash
npx nanosolana go --dvd-intro
```

Or enable DVD intro by environment variable:

```bash
NANO_DVD_INTRO=1 npx nanosolana go
```

Explicit daemon startup:

```bash
npx nanosolana daemon
```

### Track C — Explicit manual startup

```bash
npx nanosolana init
npx nanosolana birth --name MyAgent --pet-name MyPet
npx nanosolana run
```

In a second terminal:

```bash
npx nanosolana status
npx nanosolana pet
npx nanosolana vault
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
nanosolana init
nanosolana birth
nanosolana run
nanosolana daemon
nanosolana status
nanosolana pet
nanosolana send
nanosolana bots
nanosolana nodes
nanosolana config
nanosolana vault [query]
nanosolana docs [query]
nanosolana tasks [query]
nanosolana go [--dvd-intro] [--skip-init]
nanosolana bootstrap [--dvd-intro] [--skip-init]
nanosolana demo [--duration]
nanosolana dvd
nanosolana lobster [--static]
nanosolana scan [address]
nanosolana register
nanosolana registry
nanosolana nanobot [--port]
nanosolana pay invoice|verify|status
nanosolana hub skills|inspect|register|list|search|heartbeat|status|deregister
```

## Command groups

### Bootstrap and runtime

- `nanosolana init` — prompt for and encrypt secrets in
  `~/.nanosolana/vault.enc`
- `nanosolana birth` — create wallet + hatch pet
- `nanosolana run` — start wallet heartbeat, ClawVault, trading engine, and
  gateway
- `nanosolana daemon` — alias for `run` when you want the long-lived runtime
  described explicitly
- `nanosolana go` — one-shot initialization + runtime startup
- `nanosolana bootstrap` — alias for `go`
- `nanosolana demo` — simulation mode without API keys

### Startup visuals and terminal UX

- `nanosolana go --dvd-intro` — plays short DVD-style intro before startup
  sequence
- `NANO_DVD_INTRO=1 nanosolana go` — enables same behavior via env flag
- `nanosolana dvd` — full-screen terminal DVD screensaver mode
- `nanosolana lobster` — animated mascot (or `--static`)

### Inspection and local operations

- `nanosolana status` — wallet, pet, memory, Tailscale, and tmux summary
- `nanosolana pet` — current pet state
- `nanosolana config` — redacted runtime config
- `nanosolana vault [query]` — inspect/search ClawVault entries
- `nanosolana docs [query]` — inspect indexed docs + extension corpus
- `nanosolana tasks [query]` — inspect registry-backed task assignments
- `nanosolana scan [address]` — on-chain wallet snapshot (Helius)
- `nanosolana register` / `registry` — devnet identity registration and lookup
- `nanosolana nanobot` — launch local UI companion server

### Mesh and tmux operations

- `nanosolana send <message> [--target <hostname>]`
- `nanosolana nodes`
- `nanosolana bots list|spawn|attach|kill`

### Tokenized agent payments

- `nanosolana pay invoice --user <pubkey> --amount <amount> [--currency USDC|SOL] [--duration 3600]`
- `nanosolana pay verify --user <pubkey> --memo <memo> --amount <amount> --start <ts> --end <ts>`
- `nanosolana pay status`

### NanoHub discovery and registry

- `nanosolana hub skills [query]`
- `nanosolana hub inspect <slug>`
- `nanosolana hub register|list|search|heartbeat|status|deregister`

## Important clarifications (new-user safety)

- There is **no shipped** `nanosolana wallet ...` subtree yet.
- There is **no shipped** `nanosolana trade ...` subtree yet.
- There is **no shipped** `nanosolana memory ...` subtree yet
  (`nanosolana vault` is the memory surface).
- There is **no shipped** `nanosolana gateway ...` subtree yet (gateway starts
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
