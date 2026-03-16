#!/usr/bin/env bash
#
# batch-publish-skills.sh
#
# Publishes all skills from the nanosolana skills directory to NanoHub.
# Reads name/description from each SKILL.md frontmatter, derives slug from
# the directory name, and calls `nanohub publish` for each skill.
#
# Usage:
#   ./batch-publish-skills.sh [OPTIONS]
#
# Options:
#   --dry-run       Preview what would be published without actually publishing
#   --version VER   Override version for all skills (default: 1.0.0)
#   --skills-dir D  Override skills directory (default: sibling nanosolana/skills)
#   --concurrency N Not used yet; reserved for future parallel publishing
#   --skip SLUG     Skip a specific slug (can be repeated)
#   --only SLUG     Only publish a specific slug (can be repeated)
#   -h, --help      Show this help message
#
set -euo pipefail

# ─── Paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
NANOHUB_CLI="$REPO_ROOT/nanohub/packages/nanohub/bin/nanohub.js"
SKILLS_DIR="$REPO_ROOT/skills"
BUN="${BUN:-$HOME/.bun/bin/bun}"
DEFAULT_VERSION="1.0.0"

# ─── Defaults ─────────────────────────────────────────────────────────────────
DRY_RUN=false
VERSION_OVERRIDE=""
declare -a SKIP_SLUGS=()
declare -a ONLY_SLUGS=()

# ─── Parse arguments ─────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --version)
      VERSION_OVERRIDE="$2"
      shift 2
      ;;
    --skills-dir)
      SKILLS_DIR="$2"
      shift 2
      ;;
    --skip)
      SKIP_SLUGS+=("$2")
      shift 2
      ;;
    --only)
      ONLY_SLUGS+=("$2")
      shift 2
      ;;
    -h|--help)
      sed -n '2,/^$/{ s/^# \?//; p }' "$0"
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

# ─── Colour helpers (disable if not a terminal) ──────────────────────────────
if [[ -t 1 ]]; then
  GREEN='\033[0;32m'
  RED='\033[0;31m'
  YELLOW='\033[0;33m'
  CYAN='\033[0;36m'
  BOLD='\033[1m'
  RESET='\033[0m'
else
  GREEN='' RED='' YELLOW='' CYAN='' BOLD='' RESET=''
fi

# ─── Preflight checks ────────────────────────────────────────────────────────
if [[ ! -f "$NANOHUB_CLI" ]]; then
  echo -e "${RED}Error:${RESET} NanoHub CLI not found at $NANOHUB_CLI"
  echo "  Build it first:  cd $REPO_ROOT/nanohub/packages/nanohub && bun run build"
  exit 1
fi

if [[ ! -d "$SKILLS_DIR" ]]; then
  echo -e "${RED}Error:${RESET} Skills directory not found at $SKILLS_DIR"
  exit 1
fi

if [[ ! -x "$BUN" ]]; then
  echo -e "${RED}Error:${RESET} Bun not found at $BUN"
  echo "  Install bun: curl -fsSL https://bun.sh/install | bash"
  exit 1
fi

# Check NanoHub auth: config lives at ~/Library/Application Support/nanohub/config.json on macOS
CONFIG_PATH="${NANOHUB_CONFIG_PATH:-}"
if [[ -z "$CONFIG_PATH" ]]; then
  if [[ "$(uname)" == "Darwin" ]]; then
    CONFIG_PATH="$HOME/Library/Application Support/nanohub/config.json"
  else
    CONFIG_PATH="${XDG_CONFIG_HOME:-$HOME/.config}/nanohub/config.json"
  fi
fi

if [[ ! -f "$CONFIG_PATH" ]]; then
  # Also check legacy clawhub path
  LEGACY_PATH=""
  if [[ "$(uname)" == "Darwin" ]]; then
    LEGACY_PATH="$HOME/Library/Application Support/clawhub/config.json"
  else
    LEGACY_PATH="${XDG_CONFIG_HOME:-$HOME/.config}/clawhub/config.json"
  fi

  if [[ -n "$LEGACY_PATH" && -f "$LEGACY_PATH" ]]; then
    echo -e "${YELLOW}Note:${RESET} Using legacy clawhub config at $LEGACY_PATH"
  elif [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${YELLOW}Warning:${RESET} Not logged in to NanoHub (dry-run mode, continuing anyway)."
    echo ""
  else
    echo -e "${RED}Error:${RESET} Not logged in to NanoHub."
    echo ""
    echo "  Run first:  $BUN $NANOHUB_CLI login"
    echo ""
    exit 1
  fi
fi

# ─── Helper: extract frontmatter field from SKILL.md ─────────────────────────
# Reads YAML frontmatter between --- delimiters and extracts a top-level field.
extract_frontmatter_field() {
  local file="$1"
  local field="$2"
  # Get content between first pair of --- delimiters, then extract field value.
  # Handles both `field: value` and `field: "value"` (strips quotes).
  awk -v field="$field" '
    /^---$/ { delim++; next }
    delim == 1 {
      # Match field at start of line (top-level YAML key)
      pat = "^" field ":"
      if ($0 ~ pat) {
        sub("^" field ":[[:space:]]*", "")
        # Strip surrounding quotes
        gsub(/^["'\'']|["'\'']$/, "")
        print
        exit
      }
    }
    delim >= 2 { exit }
  ' "$file"
}

# ─── Helper: sanitize slug (mirrors nanohub slug.ts logic) ───────────────────
sanitize_slug() {
  echo "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9-]/-/g' \
    | sed -E 's/^-+//; s/-+$//; s/-{2,}/-/g'
}

# ─── Helper: title case (mirrors nanohub slug.ts logic) ──────────────────────
title_case() {
  echo "$1" \
    | sed -E 's/[-_]+/ /g' \
    | sed -E 's/ +/ /g' \
    | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1'
}

# ─── Helper: check if slug is in array ───────────────────────────────────────
in_array() {
  local needle="$1"
  shift
  for item in "$@"; do
    [[ "$item" == "$needle" ]] && return 0
  done
  return 1
}

# ─── Main ─────────────────────────────────────────────────────────────────────
echo -e "${BOLD}NanoHub Batch Publish${RESET}"
echo "  Skills dir: $SKILLS_DIR"
echo "  NanoHub CLI: $NANOHUB_CLI"
echo "  Dry run: $DRY_RUN"
echo ""

SUCCESS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
declare -a FAILED_SKILLS=()
declare -a SUCCEEDED_SKILLS=()
declare -a SKIPPED_SKILLS=()

# Count total skills
TOTAL=0
for skill_dir in "$SKILLS_DIR"/*/; do
  [[ -d "$skill_dir" ]] || continue
  [[ -f "$skill_dir/SKILL.md" ]] || continue
  TOTAL=$((TOTAL + 1))
done

echo -e "${CYAN}Found $TOTAL skills with SKILL.md${RESET}"
echo ""

CURRENT=0
for skill_dir in "$SKILLS_DIR"/*/; do
  [[ -d "$skill_dir" ]] || continue
  [[ -f "$skill_dir/SKILL.md" ]] || continue

  dir_name="$(basename "$skill_dir")"
  slug="$(sanitize_slug "$dir_name")"
  CURRENT=$((CURRENT + 1))

  # --only filter
  if [[ ${#ONLY_SLUGS[@]} -gt 0 ]]; then
    if ! in_array "$slug" "${ONLY_SLUGS[@]}"; then
      SKIP_COUNT=$((SKIP_COUNT + 1))
      SKIPPED_SKILLS+=("$slug (not in --only list)")
      continue
    fi
  fi

  # --skip filter
  if [[ ${#SKIP_SLUGS[@]} -gt 0 ]]; then
    if in_array "$slug" "${SKIP_SLUGS[@]}"; then
      SKIP_COUNT=$((SKIP_COUNT + 1))
      SKIPPED_SKILLS+=("$slug (--skip)")
      continue
    fi
  fi

  # Extract metadata from SKILL.md frontmatter
  skill_md="$skill_dir/SKILL.md"
  fm_name="$(extract_frontmatter_field "$skill_md" "name")"
  fm_description="$(extract_frontmatter_field "$skill_md" "description")"

  # Use frontmatter name as display name if available, otherwise title-case dir name
  if [[ -n "$fm_name" ]]; then
    display_name="$(title_case "$fm_name")"
  else
    display_name="$(title_case "$dir_name")"
  fi

  # Determine version
  fm_version="$(extract_frontmatter_field "$skill_md" "version")"
  if [[ -n "$VERSION_OVERRIDE" ]]; then
    version="$VERSION_OVERRIDE"
  elif [[ -n "$fm_version" ]]; then
    version="$fm_version"
  else
    version="$DEFAULT_VERSION"
  fi

  # Print progress
  echo -e "${BOLD}[$CURRENT/$TOTAL]${RESET} ${CYAN}$slug${RESET} ($display_name) v$version"

  if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "  ${YELLOW}[DRY RUN]${RESET} Would publish: $BUN $NANOHUB_CLI publish \"$skill_dir\" --slug \"$slug\" --name \"$display_name\" --version \"$version\""
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    SUCCEEDED_SKILLS+=("$slug@$version")
    continue
  fi

  # Publish
  if "$BUN" "$NANOHUB_CLI" publish "$skill_dir" \
      --slug "$slug" \
      --name "$display_name" \
      --version "$version" 2>&1; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    SUCCEEDED_SKILLS+=("$slug@$version")
    echo -e "  ${GREEN}OK${RESET}"
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
    FAILED_SKILLS+=("$slug")
    echo -e "  ${RED}FAILED${RESET}"
  fi

  echo ""
done

# ─── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}═══════════════════════════════════════${RESET}"
echo -e "${BOLD}  Batch Publish Summary${RESET}"
echo -e "${BOLD}═══════════════════════════════════════${RESET}"
echo ""

if [[ "$DRY_RUN" == "true" ]]; then
  echo -e "  ${YELLOW}DRY RUN MODE${RESET} — no skills were actually published"
  echo ""
fi

echo -e "  ${GREEN}Succeeded:${RESET} $SUCCESS_COUNT"
echo -e "  ${RED}Failed:${RESET}    $FAIL_COUNT"
echo -e "  ${YELLOW}Skipped:${RESET}   $SKIP_COUNT"
echo -e "  Total:     $TOTAL"
echo ""

if [[ ${#FAILED_SKILLS[@]} -gt 0 ]]; then
  echo -e "  ${RED}Failed skills:${RESET}"
  for s in "${FAILED_SKILLS[@]}"; do
    echo "    - $s"
  done
  echo ""
fi

if [[ ${#SKIPPED_SKILLS[@]} -gt 0 ]]; then
  echo -e "  ${YELLOW}Skipped skills:${RESET}"
  for s in "${SKIPPED_SKILLS[@]}"; do
    echo "    - $s"
  done
  echo ""
fi

if [[ $FAIL_COUNT -gt 0 ]]; then
  echo -e "  ${YELLOW}Tip:${RESET} Re-run to retry failed skills (already-published skills will get a version conflict, bump --version)."
  exit 1
fi

echo -e "  ${GREEN}All done.${RESET}"
