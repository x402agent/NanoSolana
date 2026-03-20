# Go Package Parity Map

This file maps the Go daemon package surface from `nanosolana-go/pkg/*` into the current TypeScript runtime in `nano-core/src/*`.

Status meanings:

- `covered`: there is a clear TypeScript home for the capability
- `partial`: the concept exists in TypeScript, but not at full Go parity
- `planned`: no dedicated TypeScript module yet

## Runtime Core

| Go package | TypeScript area | Status | Notes |
| --- | --- | --- | --- |
| `agent` | `src/trading`, `src/strategy`, `src/ai` | `covered` | OODA-style trading loop and AI-guided decisions live here. |
| `agentregistry` | `src/registry`, `src/hub` | `covered` | Local registry helpers and NanoHub registration flows exist. |
| `auth` | `src/config`, `src/gateway` | `partial` | Vault and gateway secret handling exist; broader auth surface is smaller than Go. |
| `autoreply` | `src/nanobot`, `src/telegram` | `partial` | Conversation handling exists, but not a full standalone autoreply package. |
| `bus` | event emitters across runtime | `partial` | Runtime events exist, but not a shared bus package matching Go. |
| `channels` | `src/claw/channels`, `src/telegram` | `covered` | Channel abstractions and Telegram paths exist. |
| `commands` | `src/cli` | `covered` | CLI command surface lives here. |
| `config` | `src/config/vault.ts` | `covered` | Encrypted config and secret handling live here. |
| `constants` | scattered runtime defaults | `partial` | Constants exist, but not a dedicated namespace. |
| `cron` | scheduled runtime loops | `partial` | Timed loops exist, but not a first-class scheduler package yet. |
| `daemon` | `nanosolana daemon`, `src/trading`, `src/gateway`, `src/nanobot` | `covered` | Long-running runtime path exists under the CLI. |
| `delegation` | `src/claw/task-loader`, `src/claw/personas`, Pump swarm helpers | `partial` | Persona/task delegation exists; not a full Go planner yet. |
| `fileutil` | internal FS helpers across modules | `partial` | Handled inline today. |
| `gateway` | `src/gateway/server.ts` | `covered` | Gateway server exists. |
| `health` | `status`, wallet heartbeat, registry status | `partial` | Health reporting exists without a dedicated module. |
| `heartbeat` | `src/wallet/manager.ts`, registry heartbeat | `covered` | Wallet heartbeat and registry heartbeat both exist. |
| `identity` | `src/wallet`, `src/nft`, `src/registry` | `covered` | Wallet identity and registry identity are present. |
| `learning` | `src/memory/clawvault.ts` | `partial` | Lessons and replay exist; not a separate learning manager yet. |
| `llm` | `src/ai/provider.ts` | `covered` | AI provider and system prompt injection live here. |
| `logger` | `chalk`, runtime logs | `partial` | Logging exists, but without a dedicated logger package. |
| `memory` | `src/memory` | `covered` | ClawVault and compatibility memory engines exist. |
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
| `aster` | none | `planned` | No dedicated Aster client in `nano-core` yet. |
| `bitaxe` | none | `planned` | No dedicated Bitaxe integration yet. |
| `honcho` | none | `planned` | Not implemented in the current TS runtime. |
| `hyperliquid` | none | `planned` | Not implemented in the current TS runtime. |
| `onchain` | `src/onchain`, `src/trading` | `covered` | Helius clients and wallet scans exist. |
| `providers` | `src/ai/provider.ts`, trading clients | `partial` | AI provider is first-class; market providers live inside trading modules. |
| `pumplaunch` | `src/claw/pump` | `partial` | Pump SDK and swarm support exist; startup launch daemon parity is not complete. |
| `research` | `src/ai/provider.ts`, `src/memory/clawvault.ts` | `partial` | Research workflows exist as prompts and memory agenda items. |
| `skills` | `src/hub/public-client.ts`, `src/hub/oneshot.ts`, repo `skills/` | `covered` | Skill discovery and manifest-driven bootstrap exist. |
| `solana` | `src/wallet`, `src/onchain`, `src/trading` | `covered` | Wallet, RPC, market, and execution paths live here. |
| `strategy` | `src/strategy/engine.ts` | `covered` | RSI/EMA/ATR strategy engine exists. |
| `x402` | `src/payments` | `covered` | Payment surface exists in TypeScript. |

## Interfaces and Surfaces

| Go package | TypeScript area | Status | Notes |
| --- | --- | --- | --- |
| `devices` | `apps/`, `ui/` | `partial` | Surface-level app workspaces exist; not a TS hardware abstraction layer. |
| `hardware` | none | `planned` | Hardware drivers from Go are not in `nano-core` yet. |
| `mcp` | none | `planned` | No first-class MCP package in `nano-core` today. |
| `media` | none | `planned` | No dedicated media package in the runtime today. |
| `nanobot` | `src/nanobot/server.ts` | `covered` | NanoBot UI server exists. |
| `node` | `src/network/mesh.ts` | `covered` | Peer and tmux-backed node behavior exists. |
| `seeker` | monorepo `apps/android/` | `partial` | App workspace exists outside `nano-core`; not a packaged core module. |
| `tamagochi` | `src/pet/tamagochi.ts` | `covered` | Companion state engine exists. |
| `voice` | none | `planned` | No dedicated voice module in the current package. |

## Practical Interpretation

For the current TypeScript build, the highest-confidence story is:

- bootstrap with `nanosolana go`
- run the daemon with `nanosolana daemon`
- use ClawVault, NanoBot, NanoHub manifests, and the strategy engine as the core runtime
- treat Aster, Hyperliquid, Honcho, Bitaxe, hardware, MCP, media, and voice as parity targets rather than already-complete TypeScript modules
