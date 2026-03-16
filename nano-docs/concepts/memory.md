---
summary: "ClawVault 3-tier epistemological memory system"
title: "Memory (ClawVault)"
---

# Memory (ClawVault)

NanoSolana uses ClawVault to separate fresh observations from learned patterns and
 looser inferences.

## Three tiers

### KNOWN

- fresh, short-lived observations
- examples: prices, balances, quotes, current market snapshots

### LEARNED

- patterns distilled from prior outcomes
- examples: repeatable setups, confidence adjustments, post-trade lessons

### INFERRED

- tentative correlations and hypotheses
- examples: weak regime relationships or token correlations

## Runtime behavior

ClawVault is surfaced today through:

- `nanosolana run`
- `nanosolana go`
- `nanosolana status`
- `nanosolana vault [query]`

The current published CLI does **not** expose a standalone `nanosolana memory ...`
tree.

## What `nanosolana vault` gives you

```bash
npx nanosolana vault
npx nanosolana vault RSI
```

That command shows:

- KNOWN / LEARNED / INFERRED counts
- inbox, lessons, trades, and research-gap stats
- optional search results
- recent lessons and research agenda items

## Persistence notes

The conceptual doc model still applies:

- fresh observations are transient
- learned patterns are persisted
- inferred ideas decay faster and can be contradicted away

The exact file/database layout can evolve; the authoritative runtime entrypoint is
[`../../nano-core/src/memory/`](../../nano-core/src/memory/).

## Extension tie-ins

ClawVault is also extended by repo-level plugins and UI surfaces, including:

- `extensions/memory-core`
- `extensions/memory-lancedb`
- the standalone UI tool labels for `memory_search`

## Compatibility note

Older docs referenced:

```bash
nanosolana memory status
nanosolana memory search "RSI"
```

Those commands are not part of the current shipped CLI. Use `nanosolana vault`
instead.
