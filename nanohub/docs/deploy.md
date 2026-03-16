---
summary: 'Deploy checklist: Convex backend + NanoHub web app on Vercel or Railway.'
read_when:
  - Shipping to production
  - Debugging /api routing
---

# Deploy

NanoHub is two deployables:

- Web app (TanStack Start + Nitro) → Vercel or Railway.
- Convex backend → Convex deployment (serves `/api/...` routes).

## 1) Deploy Convex

From your local machine:

```bash
bunx convex env set APP_BUILD_SHA "$(git rev-parse HEAD)" --prod
bunx convex env set APP_DEPLOYED_AT "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" --prod
bunx convex deploy
```

Or use the GitHub Actions pipeline:

```bash
gh workflow run deploy.yml
```

GitHub Actions secrets required for `deploy.yml`:

- `CONVEX_DEPLOY_KEY`
- `VERCEL_TOKEN`
- Optional: `PLAYWRIGHT_AUTH_STORAGE_STATE_JSON` for authenticated smoke coverage

Ensure Convex env is set (auth + embeddings):

- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`
- `CONVEX_SITE_URL`
- `JWT_PRIVATE_KEY`
- `JWKS`
- `OPENAI_API_KEY`
- `SITE_URL` (your web app URL)
- Optional webhook env (see `docs/webhook.md`)
- Optional: `GITHUB_TOKEN` (recommended; raises GitHub account lookup limit used by publish gate)

## 2) Deploy web app

### Vercel

Set env vars:

- `VITE_CONVEX_URL`
- `VITE_CONVEX_SITE_URL` (Convex “site” URL)
- `CONVEX_SITE_URL` (same value; used by auth provider config)
- `SITE_URL` (web app URL)
- `VITE_APP_BUILD_SHA` (set to the same commit SHA stamped into Convex)

Deploy order:

1. Convex
2. contract verify
3. web
4. smoke

Do not let Vercel auto-promote a newer web build before Convex is deployed.

### Railway

This repo includes [`railway.json`](../railway.json) for Railway.

Build and runtime:

```bash
bun install
bun run build
HOST=0.0.0.0 PORT=3000 node .output/server/index.mjs
```

Required Railway variables:

- `VITE_CONVEX_URL`
- `VITE_CONVEX_SITE_URL`
- `CONVEX_SITE_URL`
- `SITE_URL`
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`
- `JWT_PRIVATE_KEY`
- `JWKS`
- `OPENAI_API_KEY`

If Railway terminates TLS in front of the app, set `SITE_URL` to the public HTTPS origin for correct auth and share links.

## 3) Route `/api/*` to Convex

This repo currently uses `vercel.json` rewrites:

- `source: /api/:path*`
- `destination: https://<deployment>.convex.site/api/:path*`

For self-host:

- update `vercel.json` to your deployment’s Convex site URL.

## 4) Registry discovery

The CLI can discover the API base from:

- `/.well-known/nanohub.json` (preferred)
- `/.well-known/nanohub.json` (legacy)

If you don’t serve that file, users must set:

```bash
export NANOHUB_REGISTRY=https://your-site.example
```

## 5) Post-deploy checks

```bash
curl -i "https://<site>/api/v1/search?q=test"
curl -i "https://<site>/api/v1/skills/gifgrep"
```

Then:

```bash
nanohub login --site https://<site>
nanohub whoami
```

Rate-limit sanity checks:

```bash
curl -i "https://<site>/api/v1/download?slug=gifgrep"
```

Confirm headers are present:

- `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- `Retry-After` on `429`

Drift checks:

```bash
bun run verify:convex-contract -- --prod
PLAYWRIGHT_BASE_URL=https://hub.nanosolana.com bunx playwright test e2e/menu-smoke.pw.test.ts e2e/upload-auth-smoke.pw.test.ts
```

The Playwright smoke suite should fail on visible error UI, page errors, and
browser console errors.

Proxy/IP caveat:

- Default IP source is `cf-connecting-ip`.
- For non-Cloudflare trusted proxy setups, set `TRUST_FORWARDED_IPS=true`.
- If proxy headers are not forwarded/trusted correctly, multiple users may collapse into one IP and hit false-positive rate limits.
