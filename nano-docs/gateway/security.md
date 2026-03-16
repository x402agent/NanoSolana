---
summary: "NanoSolana gateway security for the current runtime"
title: "Gateway Security"
---

# Gateway security

## Current auth methods

### WebSocket

- HMAC-SHA256 on the initial auth frame
- timing-safe comparison on the gateway side

### HTTP

- `X-NanoSolana-Secret`
- `Authorization: Bearer ...`

## Current defaults

| Setting | Value |
|--------|-------|
| Host | `0.0.0.0` |
| Port | `18790` |
| Rate limit: connections | `10/min` |
| Rate limit: messages | `100/min` |

## At-rest protection

- vault path: `~/.nanosolana/vault.enc`
- cipher: `AES-256-GCM`
- current key derivation in code: SHA-256 over password and salt

## Operational checks

There is no shipped `nanosolana security audit` command yet.

Use:

```bash
npx nanosolana config
npx nanosolana status
curl http://127.0.0.1:18790/health
curl -H "X-NanoSolana-Secret: $NANO_GATEWAY_SECRET" \
  http://127.0.0.1:18790/api/status
```

## Compatibility note

If you see `18789`, `nanosolana gateway run`, or `nanosolana security audit` in
older notes, treat them as stale docs rather than the current runtime surface.
