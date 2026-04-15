#!/bin/bash
set -eo pipefail

# ================================================================
# MiniPanel Agent Harness — Pre-flight Environment Check
# ================================================================
# Runs once before the main loop (invoked from loop.sh). Fails fast
# if the host environment isn't ready for the harness — so we don't
# burn a Claude call on a machine missing node, jq, playwright, etc.
#
# Exits 0 on success, non-zero with a pointed message on failure.
# ================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

fail() {
  echo "init.sh: $1" >&2
  exit 1
}

require_bin() {
  command -v "$1" >/dev/null 2>&1 || fail "missing binary '$1' — $2"
}

echo "━━━━━━━━━━ init.sh: pre-flight checks ━━━━━━━━━━"

# --- Required binaries ---
require_bin node "install Node 20+ (https://nodejs.org)"
require_bin npm  "ships with Node"
require_bin jq   "install jq (brew install jq / apt install jq)"
require_bin git  "install git"
require_bin claude "install Claude Code CLI (https://claude.ai/code)"

# --- Node version ---
NODE_MAJOR=$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/')
if [ -z "$NODE_MAJOR" ] || [ "$NODE_MAJOR" -lt 20 ]; then
  fail "Node 20+ required (found: $(node -v 2>/dev/null))"
fi
echo "  ✓ node $(node -v) / npm $(npm -v) / jq $(jq --version) / git $(git --version | awk '{print $3}')"
echo "  ✓ claude $(claude --version 2>/dev/null | head -1 || echo 'installed')"

# --- Project-level prerequisites ---
[ -f "$PROJECT_ROOT/prd.json" ] || fail "prd.json missing at project root"
jq empty "$PROJECT_ROOT/prd.json" 2>/dev/null || fail "prd.json is not valid JSON"
echo "  ✓ prd.json valid"

[ -f "$PROJECT_ROOT/.claude/skills/code/SKILL.md" ]        || fail "coder skill missing (.claude/skills/code/SKILL.md)"
[ -f "$PROJECT_ROOT/.claude/skills/validate/SKILL.md" ]    || fail "validator skill missing (.claude/skills/validate/SKILL.md)"
[ -f "$PROJECT_ROOT/.claude/skills/orchestrate/SKILL.md" ] || fail "orchestrator skill missing (.claude/skills/orchestrate/SKILL.md)"
[ -f "$PROJECT_ROOT/.claude/skills/review/SKILL.md" ]      || fail "reviewer skill missing (.claude/skills/review/SKILL.md)"
echo "  ✓ all four agent skills present (code, validate, orchestrate, review)"

# --- Playwright browsers (common paper cut) ---
PW_CACHE=""
[ -d "$HOME/Library/Caches/ms-playwright" ] && PW_CACHE="$HOME/Library/Caches/ms-playwright"
[ -d "$HOME/.cache/ms-playwright" ] && PW_CACHE="$HOME/.cache/ms-playwright"
if [ -z "$PW_CACHE" ]; then
  echo "  → Playwright browsers not installed; running 'npx playwright install chromium'..."
  npx playwright install chromium >/dev/null 2>&1 || fail "playwright install failed — run 'npx playwright install chromium' manually"
fi
echo "  ✓ playwright chromium available"

# --- Workspace dependencies ---
if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
  echo "  → node_modules missing; running 'npm install'..."
  npm install >/dev/null 2>&1 || fail "npm install failed — run it manually and inspect the error"
fi
echo "  ✓ node_modules present"

echo "━━━━━━━━━━ init.sh: environment OK ━━━━━━━━━━"
