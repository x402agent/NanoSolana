<p align="center">
  <img src="public/clawd-logo.png" alt="NanoHub" width="120">
</p>

<h1 align="center">NanoHub</h1>

<p align="center">
  <a href="https://github.com/nanosolana/nanosolana/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/nanosolana/nanosolana/ci.yml?style=for-the-badge" alt="CI status"></a>
  <a href="https://discord.gg/nanosolana"><img src="https://img.shields.io/badge/Discord-Join-5865F2?logo=discord&logoColor=white&style=for-the-badge" alt="Discord"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
</p>

NanoHub is the public skill registry for NanoSolana agents: publish, version, search, inspect, and install text-based agent skills built around `SKILL.md` plus supporting files.
It is optimized for fast browsing, a CLI-friendly registry API, moderation workflows, and vector search.

NanoSolana Docs is the companion registry for `SOUL.md` bundles and long-form system lore.

<p align="center">
  <a href="https://nanosolana.netlify.app">NanoHub</a> ·
  <a href="https://docs.nanosolana.com">NanoSolana Docs</a> ·
  <a href="VISION.md">Vision</a> ·
  <a href="docs/README.md">Docs</a> ·
  <a href="CONTRIBUTING.md">Contributing</a> ·
  <a href="https://discord.gg/nanosolana">Discord</a>
</p>

## What you can do

- Browse skills and render their `SKILL.md`.
- Publish new skill versions with changelogs and tags.
- Browse soul bundles and render their `SOUL.md`.
- Publish soul versions with changelogs and tags.
- Search with embeddings and vector search instead of keyword-only matching.
- Star, comment, moderate, review, and approve registry content.
- Use the registry through the web app or the `nanohub` CLI.

## Architecture

- Web app: TanStack Start, React, Vite, Nitro.
- Backend: Convex database, file storage, HTTP actions, and auth.
- Search: OpenAI embeddings plus Convex vector search.
- Shared schemas: `packages/schema/` published internally as `nanohub-schema`.
- CLI: `packages/nanohub/`, with `nanohub` as the primary binary and `clawhub` kept as a compatibility alias.

## Repo layout

- `src/` — TanStack Start app routes, components, and styles.
- `convex/` — schema, queries, mutations, actions, HTTP API.
- `packages/nanohub/` — CLI workspace.
- `packages/schema/` — shared route and schema package.
- `server/` — Nitro server routes and OG image rendering.
- `public/` — static assets and `.well-known` discovery files.
- `docs/` — architecture, CLI, auth, deploy, API, and troubleshooting docs.

## Local development

Prereqs: [Bun](https://bun.sh/).

```bash
cd nanohub
bun install
cp .env.local.example .env.local

# terminal A
bunx convex dev --typecheck=disable

# terminal B
bun run dev
```

Optional seed data:

```bash
bunx convex run --no-push devSeed:seedNixSkills
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for full local setup, OAuth, JWT keys, and Convex env requirements.

## Environment

- `VITE_CONVEX_URL` — Convex deployment URL.
- `VITE_CONVEX_SITE_URL` — Convex site URL used for `/api` access.
- `VITE_DOCS_SITE_URL` — docs host for SOUL mode. Legacy: `VITE_SOULHUB_SITE_URL`.
- `VITE_DOCS_HOST` — docs hostname match. Legacy: `VITE_SOULHUB_HOST`.
- `VITE_SITE_MODE` — optional override: `skills` or `souls`.
- `SITE_URL` — primary NanoHub URL, local default `http://localhost:3000`.
- `CONVEX_SITE_URL` — same as `VITE_CONVEX_SITE_URL`.
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` — GitHub OAuth app credentials.
- `JWT_PRIVATE_KEY` / `JWKS` — Convex Auth signing keys.
- `OPENAI_API_KEY` — embeddings and indexing.

## CLI

Common flows:

- Auth: `nanohub login`, `nanohub whoami`
- Discover: `nanohub search ...`, `nanohub explore`
- Manage installs: `nanohub install <slug>`, `nanohub uninstall <slug>`, `nanohub list`, `nanohub update --all`
- Inspect without installing: `nanohub inspect <slug>`
- Publish and sync: `nanohub publish <path>`, `nanohub sync`

Legacy `clawhub` remains available as a compatibility alias.

Docs: [docs/quickstart.md](docs/quickstart.md), [docs/cli.md](docs/cli.md).

## One-shot deploy

Publish the CLI package and deploy backend updates in one command:

```bash
cd nanohub
export NPM_TOKEN=your_npm_access_token
bun run deploy:oneshot
```

Skip Convex deployment when you only want the package publish:

```bash
SKIP_CONVEX_DEPLOY=1 bun run deploy:oneshot
```

## Railway

NanoHub now includes a Railway runtime config at [`railway.json`](railway.json).
For Railway, the app builds with Bun and serves the Nitro output with Node:

```bash
bun run build
HOST=0.0.0.0 PORT=3000 node .output/server/index.mjs
```

See [docs/deploy.md](docs/deploy.md) for Vercel, Convex, and Railway deployment notes.

## Telemetry

NanoHub tracks minimal install telemetry to compute install counts when you run `nanohub sync` while logged in.
Disable it with:

```bash
export NANOHUB_DISABLE_TELEMETRY=1
```

Legacy `CLAWHUB_DISABLE_TELEMETRY=1` is still supported.

## Skill metadata

Skills declare runtime requirements in `SKILL.md` frontmatter. NanoHub’s security analysis compares those declarations with observed behavior so users can see required env vars, binaries, install specs, and platform constraints before installing.

Full reference: [docs/skill-format.md](docs/skill-format.md#frontmatter-metadata)

## Scripts

```bash
bun run dev
bun run build
bun run start
bun run test
bun run coverage
bun run lint
```
