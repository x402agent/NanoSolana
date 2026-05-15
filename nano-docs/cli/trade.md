---
summary: "Beginner-first guide to Solana Clawd Go trading runtime entrypoints, safety model, and operator checks"
title: "Trading (CLI Surface)"
---

# Trading (CLI Surface)

This page explains where trading appears in the **current shipped CLI**.

Important: there is no standalone `scg trade ...` subtree yet. Trading is
embedded in runtime commands.

## Start trading runtime

### Full live startup

```bash
npx scg go
```

Optional startup animation before trading runtime boots:

```bash
npx scg go --dvd-intro
```

### Explicit manual startup

```bash
npx scg init
npx scg birth --name MyAgent
npx scg run
```

### Simulation mode (safe)

```bash
npx scg demo --duration 60
```

## Operator checks

```bash
npx scg status
npx scg vault
curl -H "X-Solana Clawd Go-Secret: $NANO_GATEWAY_SECRET" \
  http://127.0.0.1:18790/api/status
```

What these checks give you:

- runtime state and wallet summary (`status`)
- recent memory-backed signal context (`vault`)
- gateway-level runtime snapshot (`/api/status`)

## What each runtime command does

- `scg run` starts wallet heartbeat, ScgVault, trading engine, and
  gateway
- `scg go` runs one-shot setup then starts the same runtime stack
- `scg demo` simulates signal generation and price updates without live
  keys

## Programmatic and HTTP trade surfaces

- programmatic class: `TradingEngine` in `nano-core/src/trading/engine.ts`
- authenticated gateway route: `POST /api/extension/trade`

## Safety and risk notes for new users

- start in `demo` mode first, then move to live runtime
- set and verify `NANO_GATEWAY_SECRET` before exposing any remote control path
- review memory and signal output continuously (`scg vault`)
- run over Tailscale for remote mesh workflows where possible

## Pump and payment-related execution surfaces

Pump bridge integration lives in `nano-core/src/claw/pump/`:

- `sdk-bridge.ts`
- `swarm-spawner.ts`
- `telegram-gateway.ts`

Payment command group:

```bash
npx scg pay invoice --user <pubkey> --amount 10 --currency USDC
npx scg pay verify --user <pubkey> --memo <memo> --amount 10 --start <ts> --end <ts>
npx scg pay status
```

## Cross-links

- [Trading Engine](/trading)
- [Gateway (CLI Surface)](/cli/gateway)
- [Gateway Runbook](/gateway)
- [CLI Reference](/cli)
