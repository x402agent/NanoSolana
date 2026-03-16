---
summary: "Beginner-first guide to NanoSolana trading runtime entrypoints, safety model, and operator checks"
title: "Trading (CLI Surface)"
---

# Trading (CLI Surface)

This page explains where trading appears in the **current shipped CLI**.

Important: there is no standalone `nanosolana trade ...` subtree yet. Trading is
embedded in runtime commands.

## Start trading runtime

### Full live startup

```bash
npx nanosolana go
```

Optional startup animation before trading runtime boots:

```bash
npx nanosolana go --dvd-intro
```

### Explicit manual startup

```bash
npx nanosolana init
npx nanosolana birth --name MyAgent
npx nanosolana run
```

### Simulation mode (safe)

```bash
npx nanosolana demo --duration 60
```

## Operator checks

```bash
npx nanosolana status
npx nanosolana vault
curl -H "X-NanoSolana-Secret: $NANO_GATEWAY_SECRET" \
  http://127.0.0.1:18790/api/status
```

What these checks give you:

- runtime state and wallet summary (`status`)
- recent memory-backed signal context (`vault`)
- gateway-level runtime snapshot (`/api/status`)

## What each runtime command does

- `nanosolana run` starts wallet heartbeat, ClawVault, trading engine, and
  gateway
- `nanosolana go` runs one-shot setup then starts the same runtime stack
- `nanosolana demo` simulates signal generation and price updates without live
  keys

## Programmatic and HTTP trade surfaces

- programmatic class: `TradingEngine` in `nano-core/src/trading/engine.ts`
- authenticated gateway route: `POST /api/extension/trade`

## Safety and risk notes for new users

- start in `demo` mode first, then move to live runtime
- set and verify `NANO_GATEWAY_SECRET` before exposing any remote control path
- review memory and signal output continuously (`nanosolana vault`)
- run over Tailscale for remote mesh workflows where possible

## Pump and payment-related execution surfaces

Pump bridge integration lives in `nano-core/src/claw/pump/`:

- `sdk-bridge.ts`
- `swarm-spawner.ts`
- `telegram-gateway.ts`

Payment command group:

```bash
npx nanosolana pay invoice --user <pubkey> --amount 10 --currency USDC
npx nanosolana pay verify --user <pubkey> --memo <memo> --amount 10 --start <ts> --end <ts>
npx nanosolana pay status
```

## Cross-links

- [Trading Engine](/trading)
- [Gateway (CLI Surface)](/cli/gateway)
- [Gateway Runbook](/gateway)
- [CLI Reference](/cli)
