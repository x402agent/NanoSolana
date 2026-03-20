---
summary: "NanoSolana trading engine — current runtime surface"
title: "Trading Engine"
---

# Trading engine

NanoSolana’s current trading runtime lives in `nano-core` and is centered on the
OODA loop plus a strategy engine built around RSI, EMA, and ATR signals.

## What exists today

- `nanosolana run` starts the runtime and trading engine
- `nanosolana daemon` is an alias for the same long-lived runtime
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
- research mutations defined in [`nano-core/RESEARCH.md`](../../nano-core/RESEARCH.md)

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

The Pump bridge layer is integrated into `nano-core/src/claw/pump/`:

- `nano-core/src/claw/pump/sdk-bridge.ts` — token price, graduation progress, and quote helpers
- `nano-core/src/claw/pump/swarm-spawner.ts` — role-based agent orchestration with optional payment gating
- [`../../pump/docs/amm-trading.md`](../../pump/docs/amm-trading.md)
- [`../../pump/docs/bonding-curve-math.md`](../../pump/docs/bonding-curve-math.md)
- [`../../pump/docs/fee-tiers.md`](../../pump/docs/fee-tiers.md)
- [`../../pump/docs/token-incentives.md`](../../pump/docs/token-incentives.md)

## Payment-gated agent spawning

The swarm spawner supports optional payment gating via `@pump-fun/agent-payments-sdk`:

- Configure `paymentGating` in `SwarmConfig` to require on-chain payment before spawning agents.
- `nanosolana pay invoice` creates invoices; `nanosolana pay verify` confirms payment.
- Telegram users can create invoices with `/invoice <pubkey> <amount> [USDC|SOL]`.

## Programmatic surface

For library usage, start from the `nanosolana` package exports in `nano-core` and
the Pump bridge layer in `pump/`. The repo has more functionality than the current
CLI exposes directly.

## Reality check

Older drafts in this repo showed a dedicated `nanosolana trade ...` subtree.
That was roadmap-style documentation, not the current published CLI surface.
