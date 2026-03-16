---
summary: "Gateway configuration for the current NanoSolana runtime"
title: "Gateway Configuration"
---

# Gateway configuration

The current runtime loads gateway settings from environment variables plus the
encrypted vault-backed config resolver in
[`nano-core/src/config/vault.ts`](../../nano-core/src/config/vault.ts).

## Effective gateway settings

| Setting | Source | Default |
|--------|--------|---------|
| Host | `NANO_GATEWAY_HOST` | `0.0.0.0` |
| Port | `NANO_GATEWAY_PORT` | `18790` |
| Secret | `NANO_GATEWAY_SECRET` | optional |
| Agent heartbeat | `NANO_AGENT_HEARTBEAT_INTERVAL_MS` | `5000` ms |

If the secret is not provided explicitly, the runtime still starts, but anything
depending on authenticated gateway access should set it.

## Related runtime variables

| Variable | Purpose |
|---------|---------|
| `HELIUS_RPC_URL` | Solana RPC used by the runtime |
| `HELIUS_API_KEY` | Helius enhanced APIs |
| `HELIUS_WSS_URL` | Realtime subscriptions |
| `BIRDEYE_API_KEY` | Market data |
| `JUPITER_API_KEY` | Swap API |
| `TAILSCALE_AUTH_KEY` | Mesh networking |
| `NANO_HUB_URL` | Local/remote NanoHub URL |
| `NANO_AGENT_HEARTBEAT_INTERVAL_MS` | Wallet heartbeat interval |
| `AGENT_TOKEN_MINT_ADDRESS` | Agent token mint for payments |
| `CURRENCY_MINT` | Payment currency mint (default: USDC) |

## Example `.env`

```env
NANO_GATEWAY_HOST=0.0.0.0
NANO_GATEWAY_PORT=18790
NANO_GATEWAY_SECRET=change-me

HELIUS_RPC_URL=https://...
HELIUS_API_KEY=...
HELIUS_WSS_URL=wss://...
OPENROUTER_API_KEY=...
NANO_AGENT_HEARTBEAT_INTERVAL_MS=5000
```

## What `nanosolana init` writes

`nanosolana init` stores secrets in `~/.nanosolana/vault.enc` and creates a local
`.env` with non-sensitive defaults such as:

```env
NANO_AGENT_NAME=nano-alpha
NANO_GATEWAY_PORT=18790
AI_PROVIDER=gemini
AI_MODEL=gemini-2.5-pro
NANO_LOG_LEVEL=info
```

## Current limitation

Older docs referenced `~/.nanosolana/config.json` as the main source of truth.
In the current checkout, the actively used configuration path is the environment
plus the encrypted vault loader. Treat any `config.json` examples as conceptual,
not authoritative.

## Related docs

- [Gateway Runbook](/gateway)
- [Gateway Protocol](/gateway/protocol)
- [Gateway Security](/gateway/security)
- [Heartbeat](/gateway/heartbeat)
