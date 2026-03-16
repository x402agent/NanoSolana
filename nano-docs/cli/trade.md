---
summary: "How trading is exposed in the current NanoSolana CLI and runtime"
title: "trade"
---

# Trading

The trading engine is active inside `nanosolana run`, `nanosolana go`, and `nanosolana demo`.
The current published CLI does not expose a separate `nanosolana trade ...` subtree yet.

## Current entrypoints

```bash
nanosolana run
nanosolana go
nanosolana demo
nanosolana status
```

## What each one does

- `nanosolana run` starts wallet heartbeat, ClawVault, trading engine, and gateway
- `nanosolana go` performs one-shot setup and then starts the same runtime
- `nanosolana demo` simulates signals and price movement without API keys
- `nanosolana status` gives a summary view that includes ClawVault and wallet context

## Programmatic surface

For direct embedding, use `TradingEngine` from `nanosolana` in `nano-core`.

## Safety

- Trading execution is disabled by default.
- All trades are logged in ClawVault for audit.

## Pump-specific trading surfaces

The repo also includes a separate Pump bridge layer:

- `pump/sdk-bridge.ts`
- `pump/swarm-spawner.ts`
- `pump/telegram-gateway.ts`
- `pump/main.ts`

See [Trading Engine](/trading) for the full architecture and [`../pump/docs/getting-started.md`](../pump/docs/getting-started.md) for protocol-specific flows.
