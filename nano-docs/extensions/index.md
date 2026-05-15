---
summary: "Solana Clawd Go extension system — repo reality and integration points"
title: "Extensions"
---

# Extensions

The repo currently contains **41** extension directories under `extensions/`.

Not all of them are exposed through a first-class `scg plugins ...` CLI yet.
Today, extensions are best understood as repo packages and runtime integration
points rather than a finished package manager surface.

## What exists today

- merged extension metadata from `scg-plugin.json`, `openclaw.plugin.json`, and `package.json#scg`
- extension metadata indexed by `scg docs`
- tool registration hooks used by several extensions
- channel packages for Telegram, Discord, Slack, Matrix, WhatsApp, Nostr, and more
- gateway surfaces that now expose the normalized extension catalog for UI and automation clients

## Representative extensions

| Path | Role |
|------|------|
| `extensions/pumpfun` | Pump.fun extension scaffold |
| `extensions/telegram` | Telegram integration |
| `extensions/discord` | Discord integration |
| `extensions/whatsapp` | WhatsApp integration |
| `extensions/lobster` | Workflow tooling |
| `extensions/llm-task` | Multi-step task tooling |
| `extensions/memory-core` | Memory tools |
| `extensions/memory-lancedb` | Memory/vector tooling |

## Tool and hook surface

Several extensions register tools or lifecycle hooks in code. Examples in this repo include:

- `registerTool(...)`
- `before_prompt_build`
- `agent_end`
- `message_received`
- `message_sending`

That makes the extension layer part of the runtime API surface even when the top-level
CLI does not have dedicated plugin-management commands.

## Catalog normalization

The repo uses more than one metadata format today:

- `scg-plugin.json`
- `openclaw.plugin.json`
- `package.json` under the `scg` key

`nano-core` now merges those sources into one catalog so the docs index, gateway,
and other runtime surfaces all see the same extension inventory.

That matters because many extensions only had `openclaw.plugin.json` or package
metadata before, which meant they were present in the repo but under-described in
the unified knowledge view.

## Current operator reality

Use:

- `scg docs`
- direct workspace/package commands inside an extension directory
- the standalone UI and runtime integrations

Do not rely on older docs that describe a finished `scg plugins` command
tree. That manager surface is not part of the current shipped CLI.
