#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-pump-fun-sdk-main}"

if [[ ! -d "$ROOT" ]]; then
  echo "missing directory: $ROOT" >&2
  exit 1
fi

echo "Pruning generated artifacts from $ROOT"

paths=(
  "$ROOT/node_modules"
  "$ROOT/.vscode"
  "$ROOT/channel-bot/node_modules"
  "$ROOT/channel-bot/dist"
  "$ROOT/claim-bot/node_modules"
  "$ROOT/claim-bot/dist"
  "$ROOT/dashboard/node_modules"
  "$ROOT/dashboard/dist"
  "$ROOT/lair-tg/node_modules"
  "$ROOT/lair-tg/dist"
  "$ROOT/outsiders-bot/node_modules"
  "$ROOT/outsiders-bot/dist"
)

for path in "${paths[@]}"; do
  if [[ -e "$path" ]]; then
    echo "  rm -rf $path"
    rm -rf "$path"
  fi
done

echo
echo "Safe prune complete."
echo "See $ROOT/DEPLOY_PRUNE_AUDIT.md for source/runtime keep-delete guidance."
