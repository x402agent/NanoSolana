---
summary: "Solana Clawd Go gateway security for the current runtime"
title: "Gateway Security"
---

# Gateway security

## Current auth methods

### WebSocket

- HMAC-SHA256 on the initial auth frame
- timing-safe comparison on the gateway side

### HTTP

- `X-Solana Clawd Go-Secret`
- `Authorization: Bearer ...`
- enforced on `/api/*` endpoints when a shared secret is configured

## Current defaults

| Setting | Value |
|--------|-------|
| Host | `0.0.0.0` |
| Port | `18790` |
| Rate limit: connections | `10/min` |
| Rate limit: messages | `100/min` |

## At-rest protection

- vault path: `~/.scg/vault.enc`
- cipher: `AES-256-GCM`
- current key derivation in code: SHA-256 over password and salt

## Operational checks

There is no shipped `scg security audit` command yet.

Use:

```bash
npx scg config
npx scg status
curl http://127.0.0.1:18790/health
curl -H "X-Solana Clawd Go-Secret: $NANO_GATEWAY_SECRET" \
  http://127.0.0.1:18790/api/status
```

## Related docs

- [Gateway Runbook](/gateway)
- [Gateway Configuration](/gateway/configuration)
- [Gateway Protocol](/gateway/protocol)
- [Heartbeat](/gateway/heartbeat)

## Payment verification

The runtime includes on-chain payment verification via `@pump-fun/agent-payments-sdk`:

- Invoice ID PDAs derived deterministically to prevent duplicate payments
- `validateInvoicePayment` verifies payments on-chain with retry logic
- Payment env vars (`AGENT_TOKEN_MINT_ADDRESS`, `CURRENCY_MINT`) should be set in the vault

## Compatibility note

If you see `18789`, `scg gateway run`, or `scg security audit` in
older notes, treat them as stale docs rather than the current runtime surface.
