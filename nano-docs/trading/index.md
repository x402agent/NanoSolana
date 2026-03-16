---
summary: "NanoSolana trading engine — current runtime surface"
title: "Trading Engine"
---

# Trading engine

NanoSolana’s current trading runtime lives in `nano-core` and is centered on the
OODA loop plus a strategy engine built around RSI, EMA, and ATR signals.

## What exists today

- `nanosolana run` starts the runtime and trading engine
- `nanosolana go` performs the one-shot bootstrap and starts trading
- `nanosolana demo` runs a synthetic simulation without live keys
- `nanosolana status` reports runtime state
- `nanosolana vault` exposes ClawVault stats and search results

Important: the current CLI does **not** ship a separate `nanosolana trade ...`
subtree yet.

## Strategy model

The current docs and code describe:

- RSI momentum signals
- EMA crossover confirmation
- ATR-driven volatility context
- confidence scoring before execution
- Jupiter-backed execution when configured
- ClawVault memory feedback after trade outcomes

## Execution flow

Typical runtime flow:

1. observe market data
2. orient with memory and model context
3. decide based on strategy thresholds
4. act through the execution path
5. learn into ClawVault

## Risk controls documented in the repo

- max position sizing guardrails
- slippage limits
- minimum gas reserve
- daily loss pause logic
- TamaGOchi mood modifiers

## Where Pump fits

Pump-specific trading material is not only in `nano-core`.

Use these additional sources:

- [`../../pump/sdk-bridge.ts`](../../pump/sdk-bridge.ts)
- [`../../pump/swarm-spawner.ts`](../../pump/swarm-spawner.ts)
- [`../../pump/docs/amm-trading.md`](../../pump/docs/amm-trading.md)
- [`../../pump/docs/bonding-curve-math.md`](../../pump/docs/bonding-curve-math.md)
- [`../../pump/docs/fee-tiers.md`](../../pump/docs/fee-tiers.md)
- [`../../pump/docs/token-incentives.md`](../../pump/docs/token-incentives.md)

## Programmatic surface

For library usage, start from the `nanosolana` package exports in `nano-core` and
the Pump bridge layer in `pump/`. The repo has more functionality than the current
CLI exposes directly.

## Reality check

Older drafts in this repo showed commands such as:

```bash
nanosolana trade status
nanosolana trade history
nanosolana trade backtest
```

Those are roadmap-style docs, not the current published CLI surface.
