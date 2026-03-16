# Pump SDK Snapshot Deploy Audit

This audit covers the vendored upstream snapshot in `pump-fun-sdk-main/`.

The point is to separate:

1. safe generated artifacts that should be deleted now
2. source trees that can remain in git but should not ship in a final deploy
3. directories that NanoSolana still references directly at runtime

## Current Result

Safe generated artifacts were pruned already:

- root `node_modules/`
- nested `node_modules/` under `channel-bot/`, `claim-bot/`, `dashboard/`, `lair-tg/`, `outsiders-bot/`
- nested `dist/` under `channel-bot/`, `claim-bot/`, `dashboard/`, `lair-tg/`, `outsiders-bot/`
- `.vscode/`

After that safe prune, `pump-fun-sdk-main/` is down to about `107M`.

## Keep For Current Runtime

NanoSolana currently resolves these paths directly from `pump-fun-sdk-main/` via:

- `pump/bot-registry.ts`
- `nano-core/src/claw/pump/bot-registry.ts`

Do not delete these until you retarget those registries:

- `telegram-bot/`
- `channel-bot/`
- `claim-bot/`
- `outsiders-bot/`
- `lair-tg/`
- `swarm-bot/`
- `mcp-server/`
- `dashboard/`
- `swarm/`

Keep this too if you want the upstream relay stack available:

- `websocket-server/`

## Keep In Repo, Exclude From Final Deploy

These are source, docs, or upstream-reference material. They are useful to keep
around locally, but they should not be copied into a final runtime image unless
you are explicitly deploying them too:

- `.github/`
- `.well-known/`
- `agent-tasks/`
- `docs/`
- `live/`
- `packages/`
- `prompts/`
- `pump-fun-repos/`
- `pumpfun-site/`
- `pumpkit/`
- `rust/`
- `scripts/`
- `security/`
- `site/`
- `skills/`
- `tests/`
- `tools/`
- `tutorials/`
- `typescript/`
- `website/`
- `x402/`

Also exclude contributor and metadata files from the final runtime image:

- `ACKNOWLEDGMENTS.md`
- `AGENTS.md`
- `CHANGELOG.md`
- `CITATION.cff`
- `CLAUDE.md`
- `CODE_OF_CONDUCT.md`
- `CONTRIBUTING.md`
- `COPILOT.md`
- `GEMINI.md`
- `humans.txt`
- `llms-full.txt`
- `llms.txt`
- `offline.html`
- `SECURITY.md`

## Conditional Keep

Keep these only if you still need to rebuild or republish the upstream standalone
SDK from the vendored snapshot:

- `src/`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `tsup.config.ts`
- `eslint.config.js`
- `jest.config.ts`
- `.editorconfig`
- `.gitattributes`
- `.gitignore`
- `.npmignore`
- `.nvmrc`
- `.prettierignore`
- `.prettierrc`
- `LICENSE`
- `Makefile`
- `README.md`
- `server.json`

If NanoSolana only relies on its own copied Pump bridge under `pump/` and
`nano-core/src/claw/pump/`, those are reference files, not runtime deploy files.

## Recommended Next Step

For a final NanoSolana deployment:

1. Keep the runtime bot/service folders listed above.
2. Exclude the doc/source-only folders from the deploy artifact.
3. Longer term, move the remaining runtime-needed Pump services out of `pump-fun-sdk-main/`
   into first-class NanoSolana paths.
4. Once that path migration is complete, archive or remove the vendored snapshot entirely.
