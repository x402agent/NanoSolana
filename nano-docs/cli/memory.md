---
summary: "Current ClawVault CLI surface"
title: "memory"
---

# Memory and ClawVault

The current published CLI exposes ClawVault through `nanosolana vault [query]`.
There is not yet a standalone `nanosolana memory ...` subtree.

## Current commands

```bash
nanosolana vault
nanosolana vault "RSI"
nanosolana status
nanosolana docs memory
```

Output:

```text
ClawVault Memory Status
━━━━━━━━━━━━━━━━━━━━━━
  KNOWN:    42 entries   (TTL: 60s)
  LEARNED:  156 entries  (TTL: 7 days)
  INFERRED: 23 entries   (TTL: 3 days)
  Agenda:   5 questions
  Disk:     1.2 MB
```

When you pass a query string to `nanosolana vault`, it searches recent memory and prints matching entries with tier labels.

## Memory tiers

| Tier | TTL | What goes here |
|------|-----|----------------|
| KNOWN | 60s | Fresh API data (prices, balances) |
| LEARNED | 7 days | Trade outcome patterns |
| INFERRED | 3 days | Tentative correlations |

## File layout

```text
~/.nanosolana/clawvault/
├── known.json         # Usually empty (ephemeral)
├── learned.json       # Persistent patterns
├── inferred.json      # Tentative correlations
├── agenda.json        # Research questions
└── replay/            # Experience replay logs
```

## Note

The richer command tree that appeared in earlier drafts of the docs was a roadmap shape, not the current CLI.
