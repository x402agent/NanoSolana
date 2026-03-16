## NanoHub Vision

NanoHub is the skill registry and discovery platform for NanoSolana — the autonomous Solana agent runtime.

**Live site:** [nanosolana.netlify.app](https://nanosolana.netlify.app)

This document explains the current state and direction of NanoHub.
We are still early, so iteration is fast.
Project overview and developer docs: [`README.md`](README.md)

NanoHub exists to give NanoSolana agents a fast, searchable registry of skills they can install, run, and compose.
It also serves as the publishing platform for the community to share skills, SOUL.md bundles, and agent tooling.

## Current Focus

Priority:
- Skill publishing reliability and first-run UX
- Vector search quality and relevance
- Security: upload scanning, malware detection, moderation
- Tokenized agent payments integration

Next priorities:
- Skill creator web UI for authoring and validating skills in-browser
- Batch publishing and version management
- Analytics dashboard for skill authors
- Integration with NanoSolana's on-chain payment system
- Community features: ratings, reviews, install tracking

## Skills Catalog

NanoHub currently hosts **78 skills** spanning general-purpose tools, messaging integrations, Solana/DeFi tooling, and Pump ecosystem packs:

### General & Productivity
1password, apple-notes, apple-reminders, bear-notes, blogwatcher, camsnap, canvas, coding-agent, eightctl, gemini, gh-issues, gifgrep, github, gog, goplaces, healthcheck, himalaya, model-usage, nano-banana-pro, nano-pdf, notion, obsidian, oracle, ordercli, peekaboo, sag, session-logs, skill-creator, summarize, things-mac, trello, video-frames, weather, xurl

### Communication & Messaging
bluebubbles, blucli, discord, imsg, slack, songsee, voice-call, wacli

### Audio & Media
openai-whisper, openai-whisper-api, sherpa-onnx-tts, sonoscli, spotify-player, openhue

### Infrastructure & DevOps
clawhub, mcporter, swarm-orchestrator, tmux

### Solana & Pump Ecosystem (24 packs)
pump-admin-ops, pump-ai-agents, pump-bonding-curve, pump-build-release, pump-claims-readonly, pump-fee-sharing, pump-fee-system, pump-mcp-server, pump-rust-vanity, pump-sdk-core, pump-security, pump-shell-scripts, pump-solana-architecture, pump-solana-dev, pump-solana-wallet, pump-testing, pump-token-incentives, pump-token-lifecycle, pump-ts-vanity, pump-website, pumpfun-analytics, pumpfun-fees, pumpfun-launcher, pumpfun-trading

## Tokenized Agent Payments

NanoSolana supports on-chain tokenized agent payments via `@pump-fun/agent-payments-sdk`.
NanoHub integrates with this system to enable:

- **Payment-gated skill access**: Skill authors can require on-chain payment before granting access
- **Invoice creation and verification**: Agents create invoices, users pay on-chain, verification is automatic
- **USDC and Wrapped SOL**: Supports both payment currencies with proper decimal handling
- **PDA-based deduplication**: Invoice ID PDAs prevent duplicate payments on-chain
- **Swarm spawning gates**: Require payment before spawning new agent instances

Program ID: `AgenTMiC2hvxGebTsgmsD4HHBa8WEcqGFf87iwRRxLo7`

## Architecture

NanoHub is a two-part deployment:

1. **Convex Backend** — Database, auth (GitHub OAuth), HTTP API, vector search, file storage
2. **Web Frontend** — TanStack Start + React + Vite, deployed to Netlify

Key infrastructure:
- Convex cloud: `original-ibex-124.convex.cloud`
- Site: `nanosolana.netlify.app`
- Auth callback: GitHub OAuth via Convex's `@convex-dev/auth`
- Search: OpenAI embeddings for vector similarity search

## Publishing

Skills are published via the NanoHub CLI or the web upload UI:

```bash
nanohub login
nanohub publish ./skills/my-skill --slug my-skill --name "My Skill" --version 1.0.0
```

Or use the batch publish script to publish all skills at once:

```bash
./scripts/batch-publish-skills.sh --dry-run   # preview
./scripts/batch-publish-skills.sh              # publish all 78 skills
```

New skills should be published to NanoHub first, not added to core by default.
Core skill additions should be rare and require a strong product or security reason.

## Skill Creator

NanoHub includes a web-based skill creator at `/skills/create` that provides:
- SKILL.md frontmatter editor with model and allowed-tools configuration
- Live validation matching the Python `quick_validate.py` checks
- Markdown preview of the generated skill file
- Resource file management
- ZIP download and direct publish to the registry

## Security

- Upload scanning and malware detection on publish
- Moderation pipeline with auto-ban for malicious content
- GitHub OAuth with deleted/banned account blocking
- Rate limiting on all API endpoints
- HMAC-authenticated gateway connections in the NanoSolana runtime

## What We Will Not Merge (For Now)

- New core skills when they can live on NanoHub
- Commercial service integrations that do not clearly fit the model-provider category
- Heavy orchestration layers that duplicate existing agent and tool infrastructure

This list is a roadmap guardrail, not a law of physics.
Strong user demand and strong technical rationale can change it.
