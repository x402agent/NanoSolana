---
summary: "Use NanoHub with the Convex-backed web app and CLI"
title: "hub-convex"
---

# `hub + convex`

Use NanoHub web plus the `nanohub` CLI with Convex-backed auth and publishing.

This is adjacent to the NanoSolana runtime rather than a `nanosolana` subcommand.
The runtime can point at NanoHub through `NANO_HUB_URL`, while publishing and
registry operations live in the separate `nanohub` package.

## What Convex backs

- GitHub auth and user bootstrap
- API token minting
- skill and soul publishing
- registry data and search

## Web flow

1. Open [https://hub.nanosolana.com](https://hub.nanosolana.com).
2. Sign in with GitHub.
3. Publish or manage skills and souls from the UI.

## CLI flow

Primary command:

```bash
npx nanohub@latest login
npx nanohub@latest publish ./skills/my-agent --slug my-agent --name "My Agent" --version 1.0.0
npx nanohub@latest sync --all
```

Compatibility note: the published NanoHub package still ships `clawhub` as a bin
alias, so legacy examples may continue to work. Prefer `nanohub`.

## Discovery

NanoHub discovery should prefer:

- `https://hub.nanosolana.com/.well-known/nanohub.json`

Legacy compatibility may still include:

- `https://hub.nanosolana.com/.well-known/clawhub.json`
