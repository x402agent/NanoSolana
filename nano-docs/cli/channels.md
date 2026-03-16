---
summary: "Messaging and channel surfaces in the current NanoSolana checkout"
title: "channels"
---

# Channels and messaging

The current published CLI does not expose a nested `nanosolana channels ...` command tree.
Channel support exists, but it is split across the gateway, extension packages,
and the Pump Telegram gateway.

## Current user-facing commands

```bash
nanosolana send "hello"
nanosolana nodes
nanosolana bots list
nanosolana run
```

## Supported channels

| Channel | Plugin | Persistence | Features |
|---------|--------|-------------|----------|
| **Telegram** | Built-in | ✅ Full | Conversations, commands, media |
| **Discord** | Built-in | Session | Trading signals, alerts |
| **Nostr** | Extension | Session | Decentralized relay |
| **iMessage** | Extension | Session | Apple Messages |
| **Google Chat** | Extension | Session | Team notifications |
| **BlueBubbles** | Extension | Session | iMessage bridge |

## Pump Telegram control plane

The Pump Telegram gateway is integrated into `nano-core` at:

- `nano-core/src/claw/pump/telegram-gateway.ts`

It supports commands such as `/swarm`, `/spawn`, `/agents`, `/price`, `/quote`, `/curve`, `/fees`, `/events`, `/invoice`, and `/invoices` for the Pump swarm.

### Payment commands

| Command | Description |
|---------|-------------|
| `/invoice <pubkey> <amount> [USDC\|SOL]` | Create an on-chain payment invoice for a user |
| `/invoices` | List all tracked invoices with paid/pending status |

## Telegram persistence

The Telegram plugin stores full conversation history:

```json5
{
  channels: {
    telegram: {
      enabled: true,
      persistence: {
        enabled: true,
        maxHistoryPerChat: 200,
        summaryThreshold: 50,
        persistInterval: 30000
      }
    }
  }
}
```

Features:

- 200 messages per chat
- cross-chat search
- summary plus recent-message context rebuilding
- local storage under `~/.nanosolana/telegram/`
