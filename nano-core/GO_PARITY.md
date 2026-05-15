# Go Package Parity Map — solana-claude-go

This file maps the Go daemon package surface from `solana-claude-go` (github.com/x402agent/solana-claude-go)
into the current TypeScript runtime in `nano-core/src/*`.

The TypeScript runtime (`solana-claude-go` npm package, binary `clawd`) is the
**complementary runtime** to the Go binary. Both runtimes can run together:

- The Go binary handles low-level systems tasks (keypair, RPC, tx signing, hardware).
- The TypeScript runtime handles AI reasoning, memory, trading strategy, UX, and extension ecosystem.
- The `GoBridgeClient` (`src/go-bridge/client.ts`) bridges the two over WebSocket + HTTP REST.

Status meanings:

- `covered`: there is a clear TypeScript home for the capability
- `partial`: the concept exists in TypeScript, but not at full Go parity
- `planned`: no dedicated TypeScript module yet
- `bridged`: capability lives in the Go binary; TypeScript connects via `GoBridgeClient`

## Runtime Core

| Go package | TypeScript area | Status | Notes |
| --- | --- | --- | --- |
| `agent` | `src/trading`, `src/strategy`, `src/ai` | `covered` | OODA-style trading loop and AI-guided decisions live here. |
| `agentregistry` | `src/registry`, `src/hub` | `covered` | Local registry helpers and ScgHub registration flows exist. |
| `auth` | `src/config`, `src/gateway` | `partial` | Vault and gateway secret handling exist; broader auth surface is smaller than Go. |
| `autoreply` | `src/nanobot`, `src/telegram` | `partial` | Conversation handling exists, but not a full standalone autoreply package. |
| `bus` | event emitters across runtime | `partial` | Runtime events exist, but not a shared bus package matching Go. |
| `channels` | `src/claw/channels`, `src/telegram` | `covered` | Channel abstractions and Telegram paths exist. |
| `commands` | `src/cli` | `covered` | CLI command surface lives here. Binary: `clawd`. |
| `config` | `src/config/vault.ts` | `covered` | Encrypted config and secret handling live here. Config type: `ClawdConfig`. |
| `constants` | scattered runtime defaults | `partial` | Constants exist, but not a dedicated namespace. |
| `cron` | scheduled runtime loops | `partial` | Timed loops exist, but not a first-class scheduler package yet. |
| `daemon` | `clawd daemon`, `src/trading`, `src/gateway`, `src/nanobot` | `covered` | Long-running runtime path exists under the CLI. |
| `delegation` | `src/claw/task-loader`, `src/claw/personas`, Pump swarm helpers | `partial` | Persona/task delegation exists; not a full Go planner yet. |
| `fileutil` | internal FS helpers across modules | `partial` | Handled inline today. |
| `gateway` | `src/gateway/server.ts` | `covered` | `ScgGateway` server exists. Auth header: `X-SCG-Secret`. |
| `health` | `status`, wallet heartbeat, registry status | `partial` | Health reporting exists without a dedicated module. |
| `heartbeat` | `src/wallet/manager.ts`, registry heartbeat | `covered` | `ScgWallet` heartbeat and registry heartbeat both exist. |
| `identity` | `src/wallet`, `src/nft`, `src/registry` | `covered` | Wallet identity and registry identity are present. |
| `learning` | `src/memory/clawvault.ts` | `partial` | Lessons and replay exist; not a separate learning manager yet. |
| `llm` | `src/ai/provider.ts` | `covered` | AI provider and system prompt injection live here. |
| `logger` | `chalk`, runtime logs | `partial` | Logging exists, but without a dedicated logger package. |
| `memory` | `src/memory` | `covered` | ScgVault and compatibility memory engines exist. |
| `migrate` | none | `planned` | No dedicated migration package yet. |
| `routing` | `src/claw/router.ts` | `covered` | Routing layer exists for channel-style flows. |
| `runtimeenv` | `src/config`, runtime bootstrap | `partial` | Runtime env loading exists, but not a standalone registry. |
| `session` | `src/telegram/persistence.ts` | `partial` | Conversation/session persistence exists in narrower scope. |
| `state` | `src/pet/tamagochi.ts`, registry state | `partial` | Companion state exists; broader runtime state packaging is smaller. |
| `tools` | `docs`, `tasks`, `hub`, CLI helpers | `partial` | Tooling exists across the runtime rather than under one module. |
| `utils` | shared helpers inside modules | `partial` | No central utils package. |

## Trading and Solana

| Go package | TypeScript area | Status | Notes |
| --- | --- | --- | --- |
| `aster` | none | `planned` | No dedicated Aster client in the TS runtime yet. |
| `bitaxe` | `src/bitaxe/client.ts` | `covered` | BitaxeClient with alerts, snapshots, and pet state. |
| `honcho` | none | `planned` | Not implemented in the current TS runtime. |
| `hyperliquid` | none | `planned` | Not implemented in the current TS runtime. |
| `keypair` | `src/go-bridge/client.ts` (sign RPC) | `bridged` | Keypair ops (sign, send tx) forwarded to Go via `GoBridgeClient.signMessage()`. |
| `onchain` | `src/onchain`, `src/trading` | `covered` | Helius clients and wallet scans exist. |
| `providers` | `src/ai/provider.ts`, trading clients | `partial` | AI provider is first-class; market providers live inside trading modules. |
| `pumplaunch` | `src/claw/pump` | `partial` | Pump SDK and swarm support exist; startup launch daemon parity is not complete. |
| `research` | `src/ai/provider.ts`, `src/memory/clawvault.ts` | `partial` | Research workflows exist as prompts and memory agenda items. |
| `skills` | `src/hub/public-client.ts`, `src/hub/oneshot.ts`, repo `skills/` | `covered` | Skill discovery and manifest-driven bootstrap exist. ScgHub client: `listScgHubSkills()`. |
| `solana` | `src/wallet`, `src/onchain`, `src/trading` | `covered` | Wallet, RPC, market, and execution paths live here. `ScgWallet`. |
| `strategy` | `src/strategy/engine.ts` | `covered` | RSI/EMA/ATR strategy engine exists. |
| `tx` | `src/go-bridge/client.ts` (tx RPCs) | `bridged` | `sendTransaction()`, `swapTokens()` forward to Go binary. |
| `x402` | `src/payments` | `covered` | `ScgPaymentAgent` payment surface exists in TypeScript. |

## Interfaces and Surfaces

| Go package | TypeScript area | Status | Notes |
| --- | --- | --- | --- |
| `devices` | `apps/`, `ui/` | `partial` | Surface-level app workspaces exist; not a TS hardware abstraction layer. |
| `hardware` | none | `planned` | Hardware drivers from Go are not in the TS runtime yet. |
| `mcp` | none | `planned` | No first-class MCP package in the runtime today. |
| `media` | none | `planned` | No dedicated media package in the runtime today. |
| `nanobot` | `src/nanobot/server.ts` | `covered` | `ScgBotServer` UI server exists. |
| `node` | `src/network/mesh.ts` | `covered` | `ClawdNetworkClient`, `ClawdNode`, and tmux-backed node behavior exist. |
| `seeker` | monorepo `apps/android/` | `partial` | App workspace exists outside the core; not a packaged core module. |
| `tamagochi` | `src/pet/tamagochi.ts` | `covered` | Companion state engine exists. |
| `voice` | none | `planned` | No dedicated voice module in the current package. |

## Go Bridge (New — solana-claude-go protocol)

The `src/go-bridge/client.ts` module (`GoBridgeClient`) is the protocol implementation
for TypeScript ↔ Go binary communication. It covers:

| Capability | Bridge method | Go binary endpoint |
| --- | --- | --- |
| Health check | `httpHealth()` | `GET /health` |
| Wallet info | `requestWalletInfo()` | WebSocket `wallet:info` |
| Sign message | `signMessage(base64)` | WebSocket `wallet:sign` |
| Send transaction | `sendTransaction(tx)` | WebSocket `tx:send` |
| Jupiter swap | `swapTokens(req)` | WebSocket `tx:swap` |
| Push memory entries | `pushMemoryEntries(entries)` | WebSocket `memory:push` |
| Push trade signal | `pushSignal(signal)` | WebSocket `signal:push` |
| Agent status | `getAgentStatus()` | WebSocket `agent:status` |
| HTTP GET | `httpGet(path)` | REST GET with `X-SCG-Secret` |
| HTTP POST | `httpPost(path, body)` | REST POST with `X-SCG-Secret` |

Environment variables for the bridge:
```
SCG_GO_ENABLED=true          # Enable bridge (default: false)
SCG_GO_HOST=127.0.0.1        # Go binary host
SCG_GO_PORT=18800            # Go binary WebSocket port
SCG_GO_SECRET=<hmac-secret>  # Shared HMAC-SHA256 secret
SCG_GO_RECONNECT_MS=5000     # Reconnect interval
SCG_GO_PING_MS=15000         # Keepalive ping interval
```

## Practical Interpretation

For the current TypeScript build, the highest-confidence story is:

- bootstrap with `clawd go`
- run the daemon with `clawd daemon`
- use ScgVault, ScgBot, ScgHub manifests, and the strategy engine as the core runtime
- connect to the solana-claude-go Go binary via `GoBridgeClient` for keypair ops and tx signing
- treat Aster, Hyperliquid, Honcho, hardware, MCP, media, and voice as parity targets
