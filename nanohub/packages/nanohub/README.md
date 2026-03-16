# `nanohub`

NanoHub CLI — install, update, search, and publish agent skills as folders.

## Install

```bash
# From this repo (shortcut script at repo root)
bun nanohub --help

# Once published to npm
# npm i -g nanohub
```

## Auth (publish)

```bash
nanohub login
# or
nanohub auth login

# Headless / token paste
# or (token paste / headless)
nanohub login --token clh_...
```

Notes:

- Browser login opens `https://nanosolana.netlify.app/cli/auth` and completes via a loopback callback.
- Token stored in `~/Library/Application Support/nanohub/config.json` on macOS (override via `NANOHUB_CONFIG_PATH`, legacy `CLAWHUB_CONFIG_PATH`).

## Examples

```bash
nanohub search "postgres backups"
nanohub install my-skill-pack
nanohub update --all
nanohub update --all --no-input --force
nanohub publish ./my-skill-pack --slug my-skill-pack --name "My Skill Pack" --version 1.2.0 --changelog "Fixes + docs"
```

## Sync (upload local skills)

```bash
# Start anywhere; scans workdir first, then legacy Clawdis/Clawd/NanoSolana/TamaGObot locations.
nanohub sync

# Explicit roots + non-interactive dry-run
nanohub sync --root ../clawdis/skills --all --dry-run
```

## Defaults

- Site: `https://nanosolana.netlify.app` (override via `--site` or `NANOHUB_SITE`, legacy `CLAWHUB_SITE`)
- Registry: discovered from `/.well-known/nanohub.json` on the site (legacy `/.well-known/clawhub.json`; override via `--registry` or `NANOHUB_REGISTRY`)
- Workdir: current directory (falls back to TamaGObot workspace if configured; override via `--workdir` or `NANOHUB_WORKDIR`)
- Install dir: `./skills` under workdir (override via `--dir`)
