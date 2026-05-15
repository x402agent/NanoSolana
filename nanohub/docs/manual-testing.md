---
summary: 'Copy/paste CLI smoke checklist for local verification.'
read_when:
  - Pre-merge validation
  - Reproducing a reported CLI bug
---

# Manual testing (CLI)

## Setup
- Ensure logged in: `bun nanohub whoami` (or `bun nanohub login`).
- Optional: set env
  - `NANOHUB_SITE=https://nanoclawd.netlify.app`
  - `NANOHUB_REGISTRY=https://nanoclawd.netlify.app`

## Smoke
- `bun nanohub --help`
- `bun nanohub --cli-version`
- `bun nanohub whoami`

## Search
- `bun nanohub search gif --limit 5`

## Install / list / update
- `mkdir -p /tmp/nanohub-manual && cd /tmp/nanohub-manual`
- `bunx nanohub@beta install gifgrep --force`
- `bunx nanohub@beta list`
- `bunx nanohub@beta update gifgrep --force`

## Publish (changelog optional)
- `mkdir -p /tmp/nanohub-skill-demo/SKILL && cd /tmp/nanohub-skill-demo`
- Create files:
  - `SKILL.md`
  - `notes.md`
- Publish:
  - `bun nanohub publish . --slug nanohub-manual-<ts> --name "Manual <ts>" --version 1.0.0 --tags latest`
- Publish update with empty changelog:
  - `bun nanohub publish . --slug nanohub-manual-<ts> --name "Manual <ts>" --version 1.0.1 --tags latest`

## Delete / undelete (owner/admin)
- `bun nanohub delete nanohub-manual-<ts> --yes`
- Verify hidden:
- `curl -i "https://nanoclawd.netlify.app/api/v1/skills/nanohub-manual-<ts>"`
- Restore:
  - `bun nanohub undelete nanohub-manual-<ts> --yes`
- Cleanup:
  - `bun nanohub delete nanohub-manual-<ts> --yes`

## Sync
- `bun nanohub sync --dry-run --all`

## Playwright (menu smoke)

Run against prod:

```
PLAYWRIGHT_BASE_URL=https://nanoclawd.netlify.app bun run test:pw
```

This smoke gate should fail on visible error UI, page errors, and browser
console errors.

Recommended workflow coverage in Playwright:

- home/install-switcher + browse CTA
- `/search` redirect into skills browse
- skills browse -> detail -> owner profile
- souls browse -> detail -> owner profile
- upload signed-out gate
- import signed-out gate
- authenticated upload/import canaries when storage state is configured

Authenticated prod canary:

```
PLAYWRIGHT_BASE_URL=https://nanoclawd.netlify.app \
PLAYWRIGHT_AUTH_STORAGE_STATE=/path/to/storage-state.json \
bunx playwright test e2e/upload-auth-smoke.pw.test.ts
```

Capture `storage-state.json` once with Playwright or browser devtools after GitHub login.

Run against a local preview server:

```
bun run test:e2e:local
```
