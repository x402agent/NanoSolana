---
summary: "NanoSolana gateway runbook for the current runtime"
title: "Gateway Runbook"
---

# Gateway runbook

This page documents the gateway that ships in `nano-core`.

Important: the current CLI does **not** expose a standalone `nanosolana gateway ...`
subtree. In this checkout, the gateway is started in one of these ways:

- `nanosolana run`
- `nanosolana go`
- `npm run gateway` inside `nano-core/`

## What the gateway does

The gateway in [`nano-core/src/gateway/server.ts`](../../nano-core/src/gateway/server.ts):

- exposes HTTP endpoints such as `/health`, `/api/status`, `/api/framework`, and `/api/memory`
- also exposes `/api/docs` and `/api/extension/{config,wallet,chat,trade}`
- accepts authenticated WebSocket clients for mesh-style coordination
- relays memory updates and runtime status
- fronts the local runtime for UI, automation, and peer communication

## Default bind and port

Current defaults come from [`nano-core/src/config/vault.ts`](../../nano-core/src/config/vault.ts):

| Setting | Default |
|--------|---------|
| Host | `0.0.0.0` |
| Port | `18790` |
| Secret env | `NANO_GATEWAY_SECRET` |

## Local startup

### One-shot runtime

```bash
npx nanosolana go
```

This is the easiest end-to-end path. It initializes secrets, births the wallet,
starts ClawVault, starts trading, and then starts the gateway.

### Manual runtime

```bash
npx nanosolana init
npx nanosolana birth
npx nanosolana run
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
npx nanosolana status
```

### Gateway health

```bash
curl http://127.0.0.1:18790/health
```

### Protected status endpoint

```bash
curl -H "X-NanoSolana-Secret: $NANO_GATEWAY_SECRET" \
  http://127.0.0.1:18790/api/status
```

## Auth model

- WebSocket auth: HMAC-SHA256 signature on the initial auth frame
- HTTP auth: `X-NanoSolana-Secret` or `Authorization: Bearer ...`
- API auth is enforced on `/api/*` routes only when `NANO_GATEWAY_SECRET` is configured
- Comparison: timing-safe comparison in the gateway implementation
- Default limits: `10` connections/minute and `100` messages/minute

## Operator notes

- `nanosolana status` reports the configured gateway host and port.
- `nanosolana send` uses the configured gateway secret for local or mesh delivery.
- `nanosolana nodes` and `nanosolana bots` are the current operator-facing mesh views.
- `nanosolana docs` now indexes both `nano-docs/` and `pump/docs/`, so the gateway
  can surface both NanoSolana and Pump material through one searchable corpus.
- UI and browser integrations use the `/api/extension/*` endpoints exposed by the gateway.

## Remote access

Preferred: use Tailscale and keep the gateway private to the tailnet.

Tunnel fallback:

```bash
ssh -N -L 18790:127.0.0.1:18790 user@gateway-host
```

Keep HMAC auth enabled even when tunneling.

## Related docs

- [Gateway Configuration](/gateway/configuration)
- [Gateway Protocol](/gateway/protocol)
- [Gateway Security](/gateway/security)
- [Heartbeat](/gateway/heartbeat)
