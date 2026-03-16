---
summary: "Gateway heartbeat in the current runtime — wallet liveness and agent:heartbeat events"
title: "Heartbeat"
---

# Heartbeat

In the current NanoSolana runtime, heartbeat means the wallet heartbeat and the
gateway event stream built on top of it. It is not a separate prompt scheduler.

## What happens today

When `nanosolana run` or `nanosolana go` starts:

1. the wallet heartbeat is started with `wallet.startHeartbeat(...)`
2. the gateway subscribes to the wallet `"heartbeat"` event
3. the gateway broadcasts `agent:heartbeat` frames to connected WebSocket agents
4. connected-agent metadata updates `lastHeartbeat`

Relevant code paths:

- [`../../nano-core/src/cli/entry.ts`](../../nano-core/src/cli/entry.ts)
- [`../../nano-core/src/gateway/server.ts`](../../nano-core/src/gateway/server.ts)
- [`../../nano-core/src/config/vault.ts`](../../nano-core/src/config/vault.ts)

## Default interval

The wallet heartbeat interval is controlled by:

| Setting | Source | Default |
|--------|--------|---------|
| Agent heartbeat | `NANO_AGENT_HEARTBEAT_INTERVAL_MS` | `5000` ms |

That value is loaded into `config.agent.heartbeatMs`.

## Where you can see it

### Runtime output

```bash
npx nanosolana run
```

The CLI runtime prints a rolling local heartbeat line with:

- current time
- wallet balance
- current TamaGOchi mood emoji

### HTTP

```bash
curl http://127.0.0.1:18790/health
curl -H "X-NanoSolana-Secret: $NANO_GATEWAY_SECRET" \
  http://127.0.0.1:18790/api/status
```

### WebSocket

Authenticated clients receive `agent:heartbeat` broadcasts.

## Related fields and endpoints

- `/health` includes runtime liveness and auth state
- `/api/status` includes connected agents and their `lastHeartbeat`
- WebSocket `agent:heartbeat` carries the wallet heartbeat payload

## What this page does not describe

Older docs used “heartbeat” for:

- `HEARTBEAT.md`
- active-hours scheduling
- prompt-target routing
- lightweight periodic OODA prompts

That is not the current implementation in `nano-core`.
