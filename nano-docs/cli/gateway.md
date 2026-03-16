---
summary: "Beginner-focused guide to NanoSolana gateway startup, auth, and day-one operations"
title: "Gateway (CLI Surface)"
---

# Gateway (CLI Surface)

This page explains how operators use the gateway **from the CLI today**.

Important: there is no shipped `nanosolana gateway ...` command subtree yet. The
gateway is started as part of runtime startup.

## Start the gateway (copy/paste)

### Recommended (all-in-one)

```bash
npx nanosolana go
```

With optional DVD intro startup sequence:

```bash
npx nanosolana go --dvd-intro
```

### Manual startup flow

```bash
npx nanosolana init
npx nanosolana birth --name MyAgent
npx nanosolana run
```

### Gateway-only development

From `nano-core/`:

```bash
npm run gateway
```

## Day-one health checks

```bash
npx nanosolana status
curl http://127.0.0.1:18790/health
curl -H "X-NanoSolana-Secret: $NANO_GATEWAY_SECRET" \
  http://127.0.0.1:18790/api/status
```

## Defaults and auth

Current defaults come from `nano-core/src/config/vault.ts`:

- host: `0.0.0.0`
- port: `18790`
- API auth secret: `NANO_GATEWAY_SECRET`

Auth behavior:

- if `NANO_GATEWAY_SECRET` is set, `/api/*` routes require auth
- use `X-NanoSolana-Secret: <secret>` header or `Authorization: Bearer <secret>`
- `/health` remains open for liveness checks

## Gateway endpoints you will use first

- `GET /health`
- `GET /api/status`
- `GET /api/framework`
- `GET /api/docs`
- `GET /api/memory`
- `GET /api/tasks`
- `GET /api/extension/config`
- `GET /api/extension/wallet`
- `POST /api/extension/chat`
- `POST /api/extension/trade`

## Useful operator commands around the gateway

```bash
npx nanosolana status
npx nanosolana send "ping"
npx nanosolana nodes
npx nanosolana bots list
npx nanosolana docs "gateway"
```

## Cross-links

- [Gateway Runbook](/gateway)
- [Gateway Configuration](/gateway/configuration)
- [Heartbeat](/gateway/heartbeat)
- [Gateway Protocol](/gateway/protocol)
- [Gateway Security](/gateway/security)
- [CLI Reference](/cli)
