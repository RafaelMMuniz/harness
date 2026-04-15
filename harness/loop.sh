#!/bin/bash
set -eo pipefail

# ================================================================
# MiniPanel Agent Harness — Orchestrator
# ================================================================
# Usage:
#   ./harness/loop.sh                    # Full run, unlimited iterations
#   ./harness/loop.sh 30                 # Max 30 iterations
#   ./harness/loop.sh --code-only        # Run just the coder (debugging)
#   ./harness/loop.sh --validate-only    # Run just the validator (debugging)
#   ./harness/loop.sh --clean            # Wipe logs before starting
#   ./harness/loop.sh --fresh            # Full reset: wipe code, state, logs, DB; then iterate
#
# The --fresh flag is the "nuclear restart" — use it when you want to wipe
# all prior implementation work and let the harness iterate from a clean slate.
# It:
#   1. Deletes everything inside server/ and client/ except .gitkeep
#   2. Resets VALIDATION_REPORT.md to "NOT YET RUN"
#   3. Resets IMPLEMENTATION_PLAN.md to the initial template
#   4. Resets AGENTS.md to the initial template
#   5. Wipes harness/logs/ and any runtime DB files
#   6. Starts the normal iteration loop
#
# Run from the project root: /home/piero/bots/minipanel
# ================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# --- Configuration ---
MAX_ITERATIONS=0                  # 0 = unlimited
MAX_ATTEMPTS_PER_STORY=5          # Abandon a story after this many failed coder passes and move on
MAX_AGENT_RETRIES=100             # Re-invoke agent if CLI exits non-zero
MODEL_ORCHESTRATOR="opus"         # One-shot planner, runs before the main loop
MODEL_VALIDATOR="opus"            # Writes ONE test file per story
MODEL_CODER="opus"                # Implements ONE story per iteration
MODEL_REVIEWER="opus"             # Advisory code review after the coder, before the test
BRANCH=$(git branch --show-current 2>/dev/null || echo "main")

# --- Extended thinking ---
# High reasoning effort for every agent invocation. MAX_THINKING_TOKENS overrides
# the alwaysThinkingEnabled setting, which has a known persistence bug (anthropics/claude-code#13532).
# 20000 tokens = generous budget; model uses what it needs, harmless if overshot.
export MAX_THINKING_TOKENS=20000
MONITOR_URL=""  # Disabled locally — don't POST to the shared monitor while iterating on this branch

# --- Parse arguments ---
MODE="full"  # full | code-only | validate-only
CLEAN_LOGS=false
FRESH_START=false

for arg in "$@"; do
  case "$arg" in
    --code-only)      MODE="code-only" ;;
    --validate-only)  MODE="validate-only" ;;
    --clean)          CLEAN_LOGS=true ;;
    --fresh)          FRESH_START=true; CLEAN_LOGS=true ;;
    [0-9]*)           MAX_ITERATIONS="$arg" ;;
  esac
done

# --- Fresh start: wipe all implementation, reset state files ---
fresh_reset() {
  echo "━━━━━━━━━━ --fresh: resetting project to clean slate ━━━━━━━━━━"

  # 1. Wipe server/ and client/ contents (keep .gitkeep)
  if [ -d "$PROJECT_ROOT/server" ]; then
    find "$PROJECT_ROOT/server" -mindepth 1 -not -name '.gitkeep' -delete 2>/dev/null || true
    echo "  - Wiped server/"
  fi
  if [ -d "$PROJECT_ROOT/client" ]; then
    find "$PROJECT_ROOT/client" -mindepth 1 -not -name '.gitkeep' -delete 2>/dev/null || true
    echo "  - Wiped client/"
  fi

  # 2. Remove stray runtime artifacts (DB lives at project root per server/src/db.ts)
  rm -f "$PROJECT_ROOT"/*.db "$PROJECT_ROOT"/*.db-wal "$PROJECT_ROOT"/*.db-shm 2>/dev/null || true
  rm -rf "$PROJECT_ROOT/e2e" 2>/dev/null || true
  echo "  - Removed runtime DB + e2e/ (validator will recreate)"

  # 2b. Wipe orchestrator briefings — the orchestrator regenerates them on this fresh run
  rm -rf "$PROJECT_ROOT/orchestration" 2>/dev/null || true
  rm -f "$PROJECT_ROOT/REVIEW_REPORT.md" 2>/dev/null || true
  echo "  - Removed orchestration/ briefings and REVIEW_REPORT.md (will regenerate)"

  # 3. Reset VALIDATION_REPORT.md
  cat > "$PROJECT_ROOT/VALIDATION_REPORT.md" <<'EOF'
# Validation Report

## Verdict: NOT YET RUN

No validation has been performed yet. This is the first iteration.
EOF
  echo "  - Reset VALIDATION_REPORT.md"

  # 4. Reset prd.json — flip every story's passes back to false
  if [ -f "$PROJECT_ROOT/prd.json" ]; then
    if command -v jq >/dev/null 2>&1; then
      jq '.userStories |= map(.passes = false)' "$PROJECT_ROOT/prd.json" > "$PROJECT_ROOT/prd.json.tmp" \
        && mv "$PROJECT_ROOT/prd.json.tmp" "$PROJECT_ROOT/prd.json"
      echo "  - Reset prd.json passes -> false for all stories"
    else
      echo "  - WARN: jq not found; cannot reset prd.json.passes. Install jq."
    fi
  fi

  # 5. Reset IMPLEMENTATION_PLAN.md to minimal skeleton (status lives in prd.json)
  cat > "$PROJECT_ROOT/IMPLEMENTATION_PLAN.md" <<'EOF'
# Implementation Plan

> **Status lives in `prd.json`.** Each story has a `passes` field (boolean) — that
> is the single source of truth for what is and isn't done. Do not track status
> here.
>
> This file exists for two things only:
> - **Known Issues** — cross-cutting bugs or regressions that don't map to a single
>   story. Append-only.
> - **Decisions** — architectural choices made during implementation, with rationale.
>   Append-only.
>
> Never delete or rewrite past entries. Prepend iteration number and date to new
> entries so chronology is preserved.

## Known Issues


## Decisions

EOF
  echo "  - Reset IMPLEMENTATION_PLAN.md"

  # 5. Reset AGENTS.md
  cat > "$PROJECT_ROOT/AGENTS.md" <<'EOF'
## Build & Run

(Not yet bootstrapped — coder iteration 1 will populate this)

## Validation

(Not yet set up — validator iteration 1 will populate this)

## Operational Notes

(none yet)

### Codebase Patterns

(none yet)
EOF
  echo "  - Reset AGENTS.md"

  echo "━━━━━━━━━━ fresh reset complete ━━━━━━━━━━"
  echo ""
}

# --- Pre-flight: verify environment is ready before burning any Claude calls ---
if ! bash "$SCRIPT_DIR/init.sh"; then
  echo "init.sh failed — fix the environment and retry." >&2
  exit 1
fi

if [ "$FRESH_START" = true ]; then
  fresh_reset
fi

# --- Logging setup ---
LOG_DIR="$PROJECT_ROOT/harness/logs"
mkdir -p "$LOG_DIR"

if [ "$CLEAN_LOGS" = true ]; then
  rm -f "$LOG_DIR"/iteration-*.log
  echo "Cleaned previous iteration logs."
fi

# --- State ---
ITERATION=0
CONSECUTIVE_FAILURES=0
STARTED_AT=$(date +%s)

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# --- Run an agent via skill ---
# Arguments: $1=skill_name $2=model $3=label $4=log_file
run_agent() {
  local skill="$1"
  local model="$2"
  local label="$3"
  local log_file="$4"
  local attempt=0

  while [ $attempt -lt $MAX_AGENT_RETRIES ]; do
    attempt=$((attempt + 1))
    log "--- $label [/$skill] (attempt $attempt/$MAX_AGENT_RETRIES) ---"

    if claude -p "/$skill" \
        --dangerously-skip-permissions \
        --model "$model" \
        --verbose \
        --output-format stream-json \
        --include-partial-messages 2>&1 | node "$SCRIPT_DIR/parse_stream.js" 2>&1 | tee "$log_file"; then
      log "$label completed successfully."
      return 0
    else
      log "$label exited with error (attempt $attempt)."
      if [ $attempt -lt $MAX_AGENT_RETRIES ]; then
        log "Retrying $label in 5 seconds..."
        sleep 1
      fi
    fi
  done

  log "$label FAILED after $MAX_AGENT_RETRIES attempts."
  return 1
}

# --- Git operations ---
do_git_push() {
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git push origin "$BRANCH" 2>/dev/null || \
    git push -u origin "$BRANCH" 2>/dev/null || \
    log "Push failed (non-fatal, continuing)"
  fi
}

# --- Pick the current story (highest-priority `passes: false`, priority >= 1) ---
# Echoes: <story_id>\t<title>
#
# NOTE: We only pick stories with priority >= 1. Negative-priority stories
# (US-T00..US-T08) in the legacy prd.json were "write test scaffolding" tasks
# owned by the old Phase-1 coder. In the new design, the validator sets up
# test infrastructure implicitly on its first run (playwright.config.ts,
# test helpers, etc.). Those stories can stay in prd.json but the harness
# ignores them.
pick_current_story() {
  jq -r '
    [.userStories[] | select(.passes == false) | select(.priority >= 1)]
    | sort_by(.priority)
    | .[0]
    | if . then "\(.id)\t\(.title)" else "" end
  ' prd.json 2>/dev/null
}

# --- Run the current story's test, return 0 if passing ---
# Expects: $1 = story_id
run_story_test() {
  local story_id="$1"
  local any_found=false
  local all_passed=true

  # Backend test: server/src/__tests__/<story_id>.test.ts
  local backend_test="server/src/__tests__/${story_id}.test.ts"
  if [ -f "$PROJECT_ROOT/$backend_test" ]; then
    any_found=true
    log "Running backend test: $backend_test"
    if ! (cd "$PROJECT_ROOT" && npx vitest run "$backend_test" --config server/vitest.config.ts 2>&1 | tee -a "$TEST_LOG"); then
      all_passed=false
    fi
  fi

  # E2E test: e2e/<story_id>.spec.ts
  local e2e_test="e2e/${story_id}.spec.ts"
  if [ -f "$PROJECT_ROOT/$e2e_test" ]; then
    any_found=true
    log "Running E2E test: $e2e_test"
    if ! (cd "$PROJECT_ROOT" && npx playwright test "$e2e_test" 2>&1 | tee -a "$TEST_LOG"); then
      all_passed=false
    fi
  fi

  if [ "$any_found" = false ]; then
    log "No test file found for $story_id (expected $backend_test or $e2e_test)"
    return 1  # treat no test as fail — validator should have written one
  fi
  if [ "$all_passed" = true ]; then
    return 0
  fi
  return 1
}

# --- Flip passes:true for the given story in prd.json ---
flip_passes_true() {
  local story_id="$1"
  local tmp="$(mktemp)"
  jq --arg id "$story_id" '
    .userStories |= map(if .id == $id then .passes = true else . end)
  ' prd.json > "$tmp" && mv "$tmp" prd.json

  git add prd.json
  git commit -m "[harness] $story_id passes — flipped passes:true after test run" 2>/dev/null || true
}

# --- Regenerate VALIDATION_REPORT.md with test outcome for current story ---
# $1=story_id, $2=outcome (PASS|FAIL), $3=attempts_remaining
write_validation_report() {
  local story_id="$1"
  local outcome="$2"
  local attempts_left="$3"
  cat > "$PROJECT_ROOT/VALIDATION_REPORT.md" <<EOF
# Validation Report

## Verdict: $outcome

## Current Story: $story_id
## Attempts Remaining: $attempts_left

## Summary

Harness ran the test(s) for $story_id after the coder's latest implementation. Result: **$outcome**.

Failure output (if any) is in the latest \`harness/logs/iteration-*-test.log\`. The next coder iteration should read that log — NOT the test source file — to understand what failed.
EOF
}

# ================================================================
# MAIN LOOP
# ================================================================

log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "  MiniPanel Agent Harness"
log "  Mode:   $MODE"
log "  Branch: $BRANCH"
log "  Models: orchestrator=$MODEL_ORCHESTRATOR validator=$MODEL_VALIDATOR coder=$MODEL_CODER reviewer=$MODEL_REVIEWER"
[ "$MAX_ITERATIONS" -gt 0 ] && log "  Max:    $MAX_ITERATIONS iterations"
log "  Logs:   $LOG_DIR"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# --- PHASE 0: ORCHESTRATOR — one-shot planner, maps dependencies + mission brief ---
# Runs once per harness invocation, before any per-story iteration.
# Skipped in code-only / validate-only debug modes.
if [ "$MODE" = "full" ]; then
  ORCHESTRATOR_LOG="$LOG_DIR/orchestrator.log"
  if ! run_agent "orchestrate" "$MODEL_ORCHESTRATOR" "ORCHESTRATOR" "$ORCHESTRATOR_LOG"; then
    log "Orchestrator failed — continuing anyway (it's advisory, not blocking)."
  fi
  do_git_push
fi

CURRENT_STORY_ID=""
CURRENT_STORY_ATTEMPTS=0

while true; do
  # --- Check iteration limit ---
  if [ "$MAX_ITERATIONS" -gt 0 ] && [ "$ITERATION" -ge "$MAX_ITERATIONS" ]; then
    log "Reached max iterations: $MAX_ITERATIONS"
    break
  fi

  # --- Pick the current story ---
  STORY_LINE="$(pick_current_story)"
  if [ -z "$STORY_LINE" ]; then
    ELAPSED=$(( $(date +%s) - STARTED_AT ))
    log ""
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "  ALL STORIES PASSING. Project complete."
    log "  Iterations: $ITERATION"
    log "  Time: $((ELAPSED / 60))m $((ELAPSED % 60))s"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    break
  fi

  STORY_ID="${STORY_LINE%%$'\t'*}"
  STORY_TITLE="${STORY_LINE#*$'\t'}"

  # Reset attempts counter when we move to a new story
  if [ "$STORY_ID" != "$CURRENT_STORY_ID" ]; then
    CURRENT_STORY_ID="$STORY_ID"
    CURRENT_STORY_ATTEMPTS=0
  fi

  CURRENT_STORY_ATTEMPTS=$((CURRENT_STORY_ATTEMPTS + 1))

  if [ "$CURRENT_STORY_ATTEMPTS" -gt "$MAX_ATTEMPTS_PER_STORY" ]; then
    log "BLOCKED: $STORY_ID failed $MAX_ATTEMPTS_PER_STORY attempts. Leaving passes:false and stopping."
    log "Review VALIDATION_REPORT.md, the test file for $STORY_ID, and the latest coder log manually."
    break
  fi

  ITERATION=$((ITERATION + 1))
  ITER_PAD=$(printf '%03d' $ITERATION)
  ITER_START=$(date +%s)

  log ""
  log "======================== ITERATION $ITERATION — $STORY_ID (attempt $CURRENT_STORY_ATTEMPTS/$MAX_ATTEMPTS_PER_STORY) ========================"
  log "Story: $STORY_TITLE"

  # --- Wipe runtime DB so E2E tests get a fresh seeded state ---
  # The backend auto-seeds on empty DB (per BR-102), so removing these files
  # forces a deterministic starting state each iteration. DB lives at project
  # root (server/src/db.ts uses __dirname/../../minipanel.db).
  if [ -f "$PROJECT_ROOT/minipanel.db" ] || [ -f "$PROJECT_ROOT/minipanel.db-wal" ]; then
    rm -f "$PROJECT_ROOT/minipanel.db" \
          "$PROJECT_ROOT/minipanel.db-wal" \
          "$PROJECT_ROOT/minipanel.db-shm"
    log "Wiped minipanel.db* at project root for clean iteration state."
  fi

  # --- PHASE 1: VALIDATOR — writes test for the current story (no-op if test already exists) ---
  if [ "$MODE" != "code-only" ]; then
    VALIDATOR_LOG="$LOG_DIR/iteration-${ITER_PAD}-validator.log"
    if ! run_agent "validate" "$MODEL_VALIDATOR" "VALIDATOR" "$VALIDATOR_LOG"; then
      log "Validator failed entirely. Stopping."
      break
    fi
    do_git_push
  fi

  # --- PHASE 2: CODER — implements to make the test pass ---
  if [ "$MODE" != "validate-only" ]; then
    CODER_LOG="$LOG_DIR/iteration-${ITER_PAD}-coder.log"
    if ! run_agent "code" "$MODEL_CODER" "CODER" "$CODER_LOG"; then
      log "Coder failed entirely. Stopping."
      break
    fi
    do_git_push
  fi

  # --- PHASE 2.5: REVIEWER — advisory code review, writes REVIEW_REPORT.md ---
  # Does NOT block the test run; findings are a guardrail for the coder's next
  # retry if this iteration's test fails.
  if [ "$MODE" = "full" ]; then
    REVIEWER_LOG="$LOG_DIR/iteration-${ITER_PAD}-reviewer.log"
    if ! run_agent "review" "$MODEL_REVIEWER" "REVIEWER" "$REVIEWER_LOG"; then
      log "Reviewer failed — continuing to test anyway (reviewer is advisory)."
    fi
    do_git_push
  fi

  # --- PHASE 3: HARNESS RUNS THE TEST ---
  if [ "$MODE" = "code-only" ] || [ "$MODE" = "validate-only" ]; then
    log "$MODE mode; skipping test run."
    continue
  fi

  TEST_LOG="$LOG_DIR/iteration-${ITER_PAD}-test.log"
  : > "$TEST_LOG"
  if run_story_test "$STORY_ID"; then
    log "Test PASSED for $STORY_ID — flipping passes:true"
    flip_passes_true "$STORY_ID"
    write_validation_report "$STORY_ID" "PASS" "$((MAX_ATTEMPTS_PER_STORY - CURRENT_STORY_ATTEMPTS))"
    ITER_PASSED=true
    CURRENT_STORY_ID=""  # force next iteration to pick the next story
  else
    log "Test FAILED for $STORY_ID — coder will retry next iteration"
    write_validation_report "$STORY_ID" "FAIL" "$((MAX_ATTEMPTS_PER_STORY - CURRENT_STORY_ATTEMPTS))"
    ITER_PASSED=false
  fi

  git add VALIDATION_REPORT.md 2>/dev/null && git commit -m "[harness] iteration $ITERATION: $STORY_ID $([ "$ITER_PASSED" = true ] && echo PASS || echo FAIL)" 2>/dev/null || true
  do_git_push

  # ── Monitor reporting (disabled when MONITOR_URL is empty) ─────
  if [ -n "$MONITOR_URL" ]; then
    ITER_DURATION=$(( $(date +%s) - ITER_START ))
    INPUT_TOKENS=$(grep -oE 'input_tokens[": ]+[0-9]+' "$CODER_LOG" 2>/dev/null | grep -oE '[0-9]+' | tail -1)
    OUTPUT_TOKENS=$(grep -oE 'output_tokens[": ]+[0-9]+' "$CODER_LOG" 2>/dev/null | grep -oE '[0-9]+' | tail -1)
    CACHE_READ=$(grep -oE 'cache_read[": ]+[0-9]+' "$CODER_LOG" 2>/dev/null | grep -oE '[0-9]+' | tail -1)

    curl -s --max-time 5 -X POST "$MONITOR_URL" \
      -H 'Content-Type: application/json' \
      -d "{
        \"iteration\": $ITERATION,
        \"max_iterations\": $MAX_ITERATIONS,
        \"story_id\": \"${STORY_ID:-unknown}\",
        \"story_title\": \"${STORY_TITLE:-unknown}\",
        \"input_tokens\": ${INPUT_TOKENS:-0},
        \"output_tokens\": ${OUTPUT_TOKENS:-0},
        \"cache_read_tokens\": ${CACHE_READ:-0},
        \"cache_write_tokens\": 0,
        \"duration_seconds\": $ITER_DURATION,
        \"passed\": $ITER_PASSED,
        \"cost\": 0
      }" > /dev/null 2>&1 || true
  fi
  # ──────────────────────────────────────────────────────────
done

log ""
log "Harness stopped after $ITERATION iterations."
