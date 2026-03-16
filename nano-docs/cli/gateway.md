---
summary: "Gateway entrypoints and operations for the NanoSolana runtime"
title: "gateway"
---

# Gateway surfaces

The current published CLI does not expose a standalone `nanosolana gateway ...` command tree.
The gateway is still real, but it is started through runtime flows or a package script.

## Current startup paths

### Through the CLI

```bash
nanosolana run
# or
nanosolana go
```

Both start the gateway alongside the wallet, trading engine, and memory system.

### Standalone in development

From `nano-core/`:

```bash
npm run gateway
```

That invokes `src/gateway/server.ts` directly.

## Defaults

Current defaults come from `nano-core/src/config/vault.ts`:

- host: `0.0.0.0`
- port: `18790`
- auth: `NANO_GATEWAY_SECRET`

## What the gateway serves

- WebSocket mesh transport
- HTTP endpoints such as `/health`, `/api/status`, `/api/framework`, `/api/memory`, `/api/docs`
- extension endpoints such as `/api/extension/config`, `/api/extension/wallet`, `/api/extension/chat`, `/api/extension/trade`
- streaming events from trading, wallet heartbeat, and memory
- NanoHub-facing integration paths

## Current operator commands

```bash
nanosolana run
nanosolana go
nanosolana status
nanosolana send "ping"
nanosolana nodes
nanosolana bots list
```

## See also

- [Gateway Runbook](/gateway)
- [Gateway Configuration](/gateway/configuration)
- [Heartbeat](/gateway/heartbeat)
- [Gateway Protocol](/gateway/protocol)
- [Gateway Security](/gateway/security)
