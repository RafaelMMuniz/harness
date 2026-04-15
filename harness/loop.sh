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
#
# Run from the project root: /home/piero/bots/minipanel
# ================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# --- Configuration ---
MAX_ITERATIONS=0                  # 0 = unlimited
MAX_CONSECUTIVE_FAILURES=3        # Stop after N failed validations with no progress
MAX_AGENT_RETRIES=100              # Re-invoke agent if CLI exits non-zero
MODEL_CODER="opus"
MODEL_VALIDATOR="opus"
BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
MONITOR_URL="https://minipanel-monitor-production.up.railway.app/api/iterations"

# --- Parse arguments ---
MODE="full"  # full | code-only | validate-only
CLEAN_LOGS=false

for arg in "$@"; do
  case "$arg" in
    --code-only)      MODE="code-only" ;;
    --validate-only)  MODE="validate-only" ;;
    --clean)          CLEAN_LOGS=true ;;
    [0-9]*)           MAX_ITERATIONS="$arg" ;;
  esac
done

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

# --- Check validation verdict ---
check_verdict() {
  bash "$SCRIPT_DIR/check_validation.sh" "$PROJECT_ROOT/VALIDATION_REPORT.md"
  return $?
}

# --- Git operations ---
do_git_push() {
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git push origin "$BRANCH" 2>/dev/null || \
    git push -u origin "$BRANCH" 2>/dev/null || \
    log "Push failed (non-fatal, continuing)"
  fi
}

# ================================================================
# MAIN LOOP
# ================================================================

log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "  MiniPanel Agent Harness"
log "  Mode:   $MODE"
log "  Branch: $BRANCH"
log "  Models: coder=$MODEL_CODER validator=$MODEL_VALIDATOR"
[ "$MAX_ITERATIONS" -gt 0 ] && log "  Max:    $MAX_ITERATIONS iterations"
log "  Logs:   $LOG_DIR"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

while true; do
  # --- Check iteration limit ---
  if [ "$MAX_ITERATIONS" -gt 0 ] && [ "$ITERATION" -ge "$MAX_ITERATIONS" ]; then
    log "Reached max iterations: $MAX_ITERATIONS"
    break
  fi

  # --- Check consecutive failure limit ---
  if [ "$CONSECUTIVE_FAILURES" -ge "$MAX_CONSECUTIVE_FAILURES" ]; then
    log "STUCK: $CONSECUTIVE_FAILURES consecutive validation failures with no progress."
    log "Review VALIDATION_REPORT.md and IMPLEMENTATION_PLAN.md manually."
    break
  fi

  ITERATION=$((ITERATION + 1))
  ITER_PAD=$(printf '%03d' $ITERATION)
  ITER_START=$(date +%s)

  log ""
  log "======================== ITERATION $ITERATION ========================"

  # --- Wipe runtime DB so E2E tests get a fresh seeded state ---
  # The backend auto-seeds on empty DB (per BR-102), so removing these files
  # forces a deterministic starting state each iteration and eliminates stale-data
  # test failures caused by accumulation across runs.
  if [ -f "$PROJECT_ROOT/backend/minipanel.db" ] || [ -f "$PROJECT_ROOT/backend/minipanel.db-wal" ]; then
    rm -f "$PROJECT_ROOT/backend/minipanel.db" \
          "$PROJECT_ROOT/backend/minipanel.db-wal" \
          "$PROJECT_ROOT/backend/minipanel.db-shm"
    log "Wiped backend/minipanel.db* for clean iteration state."
  fi

  # --- PHASE 1: CODER ---
  if [ "$MODE" != "validate-only" ]; then
    CODER_LOG="$LOG_DIR/iteration-${ITER_PAD}-coder.log"
    if ! run_agent "code" "$MODEL_CODER" "CODER" "$CODER_LOG"; then
      log "Coder failed entirely. Stopping."
      break
    fi
    do_git_push
  fi

  # --- PHASE 2: VALIDATOR ---
  if [ "$MODE" != "code-only" ]; then
    VALIDATOR_LOG="$LOG_DIR/iteration-${ITER_PAD}-validator.log"
    if ! run_agent "validate" "$MODEL_VALIDATOR" "VALIDATOR" "$VALIDATOR_LOG"; then
      log "Validator failed entirely. Stopping."
      break
    fi
    do_git_push
  fi

  # --- PHASE 3: CHECK VERDICT ---
  if [ "$MODE" = "code-only" ]; then
    log "Code-only mode; skipping verdict check."
    continue
  fi

  check_verdict
  verdict=$?

  case $verdict in
    0)  # PASS
      log "Validation PASSED. Coder will pick next requirement."
      CONSECUTIVE_FAILURES=0
      ITER_PASSED=true
      ;;
    2)  # DONE
      ITER_PASSED=true
      ELAPSED=$(( $(date +%s) - STARTED_AT ))
      log ""
      log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      log "  ALL REQUIREMENTS MET. Project complete."
      log "  Iterations: $ITERATION"
      log "  Time: $((ELAPSED / 60))m $((ELAPSED % 60))s"
      log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      ;;
    *)  # FAIL
      CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
      ITER_PASSED=false
      log "Validation FAILED ($CONSECUTIVE_FAILURES/$MAX_CONSECUTIVE_FAILURES consecutive)."
      log "Coder will read the report and fix issues next iteration."
      ;;
  esac

  # ── Monitor reporting ──────────────────────────────────────
  ITER_DURATION=$(( $(date +%s) - ITER_START ))

  # Story info (current story being attempted)
  STORY_ID=$(jq -r '[.userStories[] | select(.passes == false)] | sort_by(.priority) | .[0].id // empty' prd.json 2>/dev/null)
  STORY_TITLE=$(jq -r '[.userStories[] | select(.passes == false)] | sort_by(.priority) | .[0].title // empty' prd.json 2>/dev/null)

  # Token counts from coder + validator logs
  CODER_LOG="$LOG_DIR/iteration-${ITER_PAD}-coder.log"
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
  # ──────────────────────────────────────────────────────────

  # Break after reporting if DONE
  [ "$verdict" -eq 2 ] 2>/dev/null && break
done

log ""
log "Harness stopped after $ITERATION iterations."
