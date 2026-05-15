# Changelog

All notable changes to NanoSolana will be documented in this file.

## [1.0.3] — 2026-03-20

### Improved

- Reframed the published package around the TypeScript runtime, one-shot bootstrap, and explicit daemon workflow.
- Bundled `SOUL.md`, `RESEARCH.md`, and the Go-to-TypeScript parity map in the npm package.
- Added clearer `daemon` and `bootstrap` aliases for the long-running runtime and one-shot setup paths.

## [1.0.2] — 2026-03-16

### Fixed

- Aligned the CLI-reported version with the published npm package so `npx nanosolana --version` matches the release installed by `npx nanosolana go`.

## [1.0.1] — 2026-03-16

### Fixed

- Added the missing `cron-parser` runtime dependency required by the claw IPC and task scheduler paths.
- Fixed strict TypeScript declaration build errors in the CLI demo flow, docs integration, container runner, Pump swarm spawner, and Pump Telegram gateway.
- Aligned the bundled docs corpus with the current repo surface, including `pump/docs/` integration in `nanosolana docs`.

### Improved

- Updated package metadata and release artifacts so `npx nanosolana go` resolves to a buildable, test-passing package.

## [1.0.0] — 2025-03-15

### 🎉 First Stable Release

NanoSolana hits 1.0! Production-ready autonomous trading agents on Solana.

### ✨ New Features

- **`nanosolana demo`** — Zero-config simulation mode. Try the full OODA loop without any API keys.
- **SDK Examples** — 5 runnable examples: basic agent, custom strategy, webhook alerts, multi-agent mesh, and programmatic SDK usage.
- **Enhanced npm presence** — 30 discovery keywords, 12+ badges, comparison table, SDK usage docs.
- **GitHub Actions CI/CD** — Automated testing on Node 22/23, auto-publish on release with npm provenance.
- **PR & Issue Templates** — Standardized contribution workflow.
- **GitHub Sponsors** — `FUNDING.yml` for community support.

### 🛡️ Security

- AES-256-GCM vault for all secrets
- HMAC-SHA256 gateway authentication
- Ed25519 wallet signatures with timing-safe comparison
- Rate limiting: 10 conn/min, 100 msg/min

### 📦 Package

- Proper TypeScript `types` field and conditional exports
- `publishConfig` for public npm access
- `prepublishOnly` build step
- Expanded `files` to include CHANGELOG

### 🏗️ Architecture

- OODA Trading Loop (Observe → Orient → Decide → Act → Learn)
- ScgVault 3-tier epistemological memory (Known/Learned/Inferred)
- TamaGOchi virtual pet risk modifier
- Mesh networking via Tailscale VPN
- On-chain NFT identity via Metaplex (devnet)
- 40+ channel plugins (Telegram, Discord, Slack, WhatsApp, Nostr...)
- 50+ composable agent skills

## [0.2.0] — 2025-03-12

### Added

- OODA trading engine with Jupiter Ultra Swap
- ScgVault 3-tier memory with experience replay
- TamaGOchi pet engine with mood-based risk modification
- Helius blockchain scanner (DAS API, Enhanced Transactions)
- On-chain agent registry (Metaplex NFT)
- Interactive NanoBot web UI
- Gateway server (WebSocket + HTTP)
- Tailscale mesh networking
- 25+ CLI commands

## [0.1.0] — 2025-03-10

### Added

- Initial release
- Solana wallet management
- Birdeye price feeds
- Basic trading signals
- Terminal animations
