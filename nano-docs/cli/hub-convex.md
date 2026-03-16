---
summary: "Use NanoHub with the Convex-backed web app and CLI"
title: "hub-convex"
---

# `hub + convex`

Use NanoHub web plus the `nanohub` CLI with Convex-backed auth and publishing.

NanoSolana now exposes read-only public skill discovery directly through the
runtime CLI:

```bash
npx nanosolana@latest hub skills
npx nanosolana@latest hub skills telegram --limit 5
npx nanosolana@latest hub inspect token-tracker
```

The runtime can point at NanoHub through `NANO_HUB_URL`, while install,
publish, sync, and auth-heavy registry operations live in the separate
`nanohub` package.

## What Convex backs

- GitHub auth and user bootstrap
- API token minting
- skill and soul publishing
- registry data and search

## Web flow

1. Open [https://nanosolana.netlify.app](https://nanosolana.netlify.app).
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

Use `nanosolana` when you want lightweight discovery from the main agent
package. Use `nanohub` when you need:

- install and update flows
- publish and sync
- auth tokens and ownership actions
- moderation and transfer commands

## Discovery

NanoHub discovery should prefer:

- `https://nanosolana.netlify.app/.well-known/nanohub.json`

Legacy compatibility may still include:

- `https://nanosolana.netlify.app/.well-known/clawhub.json`
