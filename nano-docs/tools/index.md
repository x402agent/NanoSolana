---
summary: "Solana Claude Go tools reference — current runtime and extension tool surfaces"
title: "Tools"
---

# Tools

Solana Claude Go has three tool surfaces in this checkout:

1. runtime capabilities exposed by the `scg` CLI and gateway
2. extension-registered tools used by the UI and plugin layer
3. the automated repo task registry from `agent-tasks/`, used for persona mission assignment

## Runtime operator surface

The current shipped CLI exposes these top-level operational commands:

- `init`
- `birth`
- `run`
- `status`
- `pet`
- `send`
- `bots`
- `nodes`
- `config`
- `vault`
- `docs`
- `tasks`
- `go`
- `demo`
- `scan`
- `register`
- `registry`
- `nanobot`
- `pay` — on-chain invoice creation, verification, and status (`pay invoice`, `pay verify`, `pay status`)

## Extension tool examples in this repo

Tool labels and registrations in the repo show active extension capabilities such as:

- `memory_search`
- `memory_get`
- `trade_execute`
- channel/document helpers from `feishu`
- voice and workflow helpers from `voice-call`, `lobster`, and `llm-task`

These are visible in places like:

- `ui/src/ui/tool-labels.ts`
- `extensions/memory-core`
- `extensions/memory-lancedb`
- `extensions/lobster`
- `extensions/llm-task`
- `extensions/voice-call`

## Important distinction

Older drafts described a dedicated interactive `scg agent` command. That is
not part of the current published CLI surface. Treat tool invocations as
runtime/plugin internals unless a top-level command is documented in `nano-core/src/cli/entry.ts`.
