---
summary: "NanoSolana gateway protocol — current HTTP and WebSocket shape"
title: "Gateway Protocol"
---

# Gateway protocol

The gateway exposes a shared HTTP + WebSocket surface from the current runtime.

## Transport

- Protocol: HTTP and WebSocket
- Default endpoint: `http://127.0.0.1:18790` and `ws://127.0.0.1:18790`
- Default bind host: `0.0.0.0`
- Auth secret env: `NANO_GATEWAY_SECRET`

## HTTP endpoints

Current documented endpoints:

| Endpoint | Method | Notes |
|---------|--------|-------|
| `/health` | `GET` | Unauthenticated liveness probe |
| `/api/status` | `GET` | Authenticated runtime status |
| `/api/framework` | `GET` | Authenticated framework metadata |
| `/api/memory` | `GET` | Authenticated memory summary |

Example:

```bash
curl http://127.0.0.1:18790/health
curl -H "X-NanoSolana-Secret: $NANO_GATEWAY_SECRET" \
  http://127.0.0.1:18790/api/status
```

## WebSocket auth handshake

The current docs and implementation use an HMAC-authenticated first frame:

```json
{
  "type": "auth",
  "from": "agent-abc123",
  "payload": {
    "publicKey": "Ed25519PublicKey..."
  },
  "timestamp": 1710000000000,
  "signature": "hmac-sha256-hex"
}
```

The signature is computed from the small auth payload and validated with a
timing-safe comparison on the gateway side.

## Runtime message families

The exact payloads continue to evolve, but the current docs and source align on
these message families:

| Type family | Typical use |
|------------|-------------|
| `trade:*` | signals, fills, runtime trading state |
| `memory:*` | queries, lessons, synchronization |
| `agent:*` | heartbeats and lifecycle |
| `bot:*` | swarm and orchestration events |

## Limits

| Scope | Default |
|------|---------|
| Connections per IP | `10` per minute |
| Messages per agent | `100` per minute |

## Compatibility note

Older docs in this repo referenced `ws://127.0.0.1:18789`. The current runtime
default is `18790`.
