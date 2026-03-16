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
curl -H "X-NanoSolana-Secret: $NANO_GATEWAY_SECRET" \
  http://127.0.0.1:18790/api/status
```

## What each one does

- `nanosolana run` starts wallet heartbeat, ClawVault, trading engine, and gateway
- `nanosolana go` performs one-shot setup and then starts the same runtime
- `nanosolana demo` simulates signals and price movement without API keys
- `nanosolana status` gives a summary view that includes ClawVault and wallet context

## Programmatic surface

For direct embedding, use `TradingEngine` from `nanosolana` in `nano-core`.

The gateway also exposes an authenticated manual trade surface for browser and UI integrations:

- `/api/extension/trade`

## Safety

- Trading execution is disabled by default.
- All trades are logged in ClawVault for audit.

## Pump-specific trading surfaces

The Pump bridge layer is integrated into `nano-core/src/claw/pump/`:

- `nano-core/src/claw/pump/sdk-bridge.ts`
- `nano-core/src/claw/pump/swarm-spawner.ts`
- `nano-core/src/claw/pump/telegram-gateway.ts`

See [Trading Engine](/trading) for the full architecture and [`../pump/docs/getting-started.md`](../pump/docs/getting-started.md) for protocol-specific flows.

## Payment-gated operations

The `nanosolana pay` command group provides on-chain invoice creation and verification:

```bash
nanosolana pay invoice --user <pubkey> --amount 10 --currency USDC
nanosolana pay verify --user <pubkey> --memo <memo> --amount 10 --start <ts> --end <ts>
nanosolana pay status
```

This enables payment-gated agent spawning and service access through the `@pump-fun/agent-payments-sdk`.
