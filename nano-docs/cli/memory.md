---
summary: "Current ScgVault CLI surface"
title: "memory"
---

# Memory and ScgVault

The current published CLI exposes ScgVault through `scg vault [query]`.
There is not yet a standalone `scg memory ...` subtree.

## Current commands

```bash
scg vault
scg vault "RSI"
scg status
scg docs memory
curl -H "X-Solana Claude Go-Secret: $NANO_GATEWAY_SECRET" \
  http://127.0.0.1:18790/api/memory
```

Typical CLI output shape:

```text
ScgVault Memory Status
━━━━━━━━━━━━━━━━━━━━━━
  KNOWN:     0 (fresh API data, expires in ~60s)
  LEARNED:   0 (trade-derived patterns)
  INFERRED:  0 (correlations, held loosely)
  Inbox:     0 (pending reflection)
  Trades:    0
  Lessons:   0
  Win Rate:  0.0%
  Research:  0 open gaps
```

When you pass a query string to `scg vault`, it searches recent memory and prints matching entries with tier labels.

## Memory tiers

| Tier | TTL | What goes here |
|------|-----|----------------|
| KNOWN | 60s | Fresh API data (prices, balances) |
| LEARNED | 7 days | Trade outcome patterns |
| INFERRED | 3 days | Tentative correlations |

## Persistence note

The current `ScgVault` implementation is primarily an in-memory runtime structure.
Older docs sometimes described a fixed on-disk `clawvault/` directory layout; treat
that as conceptual rather than the current source of truth.

## Gateway surface

The gateway also exposes memory state over:

- `/api/memory`
- WebSocket `memory:query`
- WebSocket `memory:results`
- WebSocket `memory:lesson`

Use the gateway when another process or UI needs memory state without shelling out to the CLI.

## Note

The richer command tree that appeared in earlier drafts of the docs was a roadmap shape, not the current CLI.
