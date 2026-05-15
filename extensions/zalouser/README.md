# @nanoclawd/zalouser

NanoClawd extension for Zalo Personal Account messaging via native `zca-js` integration.

> **Warning:** Using Zalo automation may result in account suspension or ban. Use at your own risk. This is an unofficial integration.

## Features

- Channel plugin integration with onboarding + QR login
- In-process listener/sender via `zca-js` (no external CLI)
- Multi-account support
- Agent tool integration (`zalouser`)
- DM/group policy support

## Prerequisites

- NanoClawd Gateway
- Zalo mobile app (for QR login)

No external `zca`, `openzca`, or `zca-cli` binary is required.

## Install

### Option A: npm

```bash
nanoclawd plugins install @nanoclawd/zalouser
```

### Option B: local source checkout

```bash
nanoclawd plugins install ./extensions/zalouser
cd ./extensions/zalouser && pnpm install
```

Restart the Gateway after install.

## Quick start

### Login (QR)

```bash
nanoclawd channels login --channel zalouser
```

Scan the QR code with the Zalo app on your phone.

### Enable channel

```yaml
channels:
  zalouser:
    enabled: true
    dmPolicy: pairing # pairing | allowlist | open | disabled
```

### Send a message

```bash
nanoclawd message send --channel zalouser --target <threadId> --message "Hello from NanoClawd"
```

## Configuration

Basic:

```yaml
channels:
  zalouser:
    enabled: true
    dmPolicy: pairing
```

Multi-account:

```yaml
channels:
  zalouser:
    enabled: true
    defaultAccount: default
    accounts:
      default:
        enabled: true
        profile: default
      work:
        enabled: true
        profile: work
```

## Useful commands

```bash
nanoclawd channels login --channel zalouser
nanoclawd channels login --channel zalouser --account work
nanoclawd channels status --probe
nanoclawd channels logout --channel zalouser

nanoclawd directory self --channel zalouser
nanoclawd directory peers list --channel zalouser --query "name"
nanoclawd directory groups list --channel zalouser --query "work"
nanoclawd directory groups members --channel zalouser --group-id <id>
```

## Agent tool

The extension registers a `zalouser` tool for AI agents.

Available actions: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

## Troubleshooting

- Login not persisted: `nanoclawd channels logout --channel zalouser && nanoclawd channels login --channel zalouser`
- Probe status: `nanoclawd channels status --probe`
- Name resolution issues (allowlist/groups): use numeric IDs or exact Zalo names

## Credits

Built on [zca-js](https://github.com/RFS-ADRENO/zca-js).
