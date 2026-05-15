---
summary: "Beginner-first gateway runbook for startup, health checks, and authenticated API use"
title: "Gateway Runbook"
---

# Gateway Runbook

This page documents the gateway that ships in `nano-core` and how to operate it
as a new user.

Important: the current CLI does **not** expose a standalone
`scg gateway ...` subtree. In this checkout, the gateway is started in
one of these ways:

- `scg run`
- `scg go`
- `npm run gateway` inside `nano-core/`

## Fast startup (recommended)

```bash
npx scg go
```

Optional startup animation before the runtime boot sequence:

```bash
npx scg go --dvd-intro
```

Or via environment toggle:

```bash
NANO_DVD_INTRO=1 npx scg go
```

## What the gateway does

The gateway in
[`nano-core/src/gateway/server.ts`](../../nano-core/src/gateway/server.ts):

- exposes HTTP endpoints such as `/health`, `/api/status`, `/api/framework`, and
  `/api/memory`
- exposes `/api/tasks` for the automated agent task registry
- also exposes `/api/docs` and `/api/extension/{config,wallet,chat,trade}`
- includes NanoHub public site and discovery URLs in `/api/framework`
- accepts authenticated WebSocket clients for mesh-style coordination
- relays memory updates and runtime status
- fronts the local runtime for UI, automation, and peer communication

## Default bind and port

Current defaults come from
[`nano-core/src/config/vault.ts`](../../nano-core/src/config/vault.ts):

| Setting    | Default               |
| ---------- | --------------------- |
| Host       | `0.0.0.0`             |
| Port       | `18790`               |
| Secret env | `NANO_GATEWAY_SECRET` |

## Local startup

### One-shot runtime

```bash
npx scg go
```

This is the easiest end-to-end path. It initializes secrets, births the wallet,
starts ScgVault, starts trading, and then starts the gateway.

### Manual runtime

```bash
npx scg init
npx scg birth
npx scg run
```

### Gateway-only development

```bash
cd nano-core
npm install
npm run gateway
```

## Quick verification

### Runtime status

```bash
npx scg status
```

### Gateway health

```bash
curl http://127.0.0.1:18790/health
```

### Protected status endpoint

```bash
curl -H "X-Solana Claude Go-Secret: $NANO_GATEWAY_SECRET" \
  http://127.0.0.1:18790/api/status
```

### Useful additional endpoint checks

```bash
curl -H "X-Solana Claude Go-Secret: $NANO_GATEWAY_SECRET" \
  http://127.0.0.1:18790/api/framework

curl -H "X-Solana Claude Go-Secret: $NANO_GATEWAY_SECRET" \
  "http://127.0.0.1:18790/api/docs?q=gateway"

curl -H "X-Solana Claude Go-Secret: $NANO_GATEWAY_SECRET" \
  http://127.0.0.1:18790/api/tasks
```

## Auth model

- WebSocket auth: HMAC-SHA256 signature on the initial auth frame
- HTTP auth: `X-Solana Claude Go-Secret` or `Authorization: Bearer ...`
- API auth is enforced on `/api/*` routes only when `NANO_GATEWAY_SECRET` is
  configured
- Comparison: timing-safe comparison in the gateway implementation
- Default limits: `10` connections/minute and `100` messages/minute

## Main endpoints (day one)

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

## Operator notes

- `scg status` reports the configured gateway host and port.
- `scg send` uses the configured gateway secret for local or mesh
  delivery.
- `scg nodes` and `scg bots` are the current operator-facing mesh
  views.
- `scg docs` now indexes both `nano-docs/` and `pump/docs/`, so the
  gateway can surface both Solana Claude Go and Pump material through one searchable
  corpus.
- UI and browser integrations use the `/api/extension/*` endpoints exposed by
  the gateway.

## Remote access

Preferred: use Tailscale and keep the gateway private to the tailnet.

Tunnel fallback:

```bash
ssh -N -L 18790:127.0.0.1:18790 user@gateway-host
```

Keep HMAC auth enabled even when tunneling.

## Related docs

- [Gateway (CLI Surface)](/cli/gateway)
- [Gateway Configuration](/gateway/configuration)
- [Gateway Protocol](/gateway/protocol)
- [Gateway Security](/gateway/security)
- [Heartbeat](/gateway/heartbeat)
