---
summary: "Messaging and channel surfaces in the current Solana Claude Go checkout"
title: "channels"
---

# Channels and messaging

The current published CLI does not expose a nested `scg channels ...` command tree.
Channel support exists, but it is split across the gateway, extension packages,
and the Pump Telegram gateway.

## Current user-facing commands

```bash
scg send "hello"
scg nodes
scg bots list
scg run
```

The shipped messaging-oriented commands are:

- `scg send <message>`
- `scg nodes`
- `scg bots list|spawn|attach|kill`

## Channel surfaces in this checkout

| Channel surface | Where it lives | Notes |
|----------------|----------------|-------|
| Telegram conversation persistence | `nano-core/src/telegram/` and gateway chat flow | Local conversation history and chat context |
| Pump Telegram control plane | `pump/telegram-gateway.ts` | Pump swarm commands and control |
| Channel integrations | `extensions/*` | Telegram, Discord, Slack, Matrix, WhatsApp, Nostr, and others |
| Mesh broadcast | `scg send` | Gateway-assisted local or Tailscale delivery |

## Pump Telegram control plane

The Pump Telegram gateway is integrated into `nano-core` at:

- `nano-core/src/claw/pump/telegram-gateway.ts`

It supports commands such as `/swarm`, `/spawn`, `/agents`, `/price`, `/quote`, `/curve`, `/fees`, `/events`, `/invoice`, and `/invoices` for the Pump swarm.

### Payment commands

| Command | Description |
|---------|-------------|
| `/invoice <pubkey> <amount> [USDC\|SOL]` | Create an on-chain payment invoice for a user |
| `/invoices` | List all tracked invoices with paid/pending status |

## Gateway-backed chat surfaces

The gateway exposes extension-facing chat and config routes:

- `/api/extension/config`
- `/api/extension/wallet`
- `/api/extension/chat`
- `/api/extension/trade`

These routes are authenticated through the gateway secret when one is configured.

## Telegram persistence

The repo includes a persistent Telegram conversation store and gateway chat flow.
Current defaults in `nano-core/src/telegram/persistence.ts` include:

Features:

- 200 messages per chat
- cross-chat search
- summary plus recent-message context rebuilding
- local storage under `~/.scg/telegram/`
- persisted files such as `messages.json` and `contexts.json`

## Related docs

- [gateway](/cli/gateway)
- [Gateway Runbook](/gateway)
- [Gateway Protocol](/gateway/protocol)
