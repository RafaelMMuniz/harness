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
MAX_AGENT_RETRIES=2               # Re-invoke agent if CLI exits non-zero
MODEL_CODER="opus"
MODEL_VALIDATOR="opus"
BRANCH=$(git branch --show-current 2>/dev/null || echo "main")

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

  log ""
  log "======================== ITERATION $ITERATION ========================"

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
      ;;
    2)  # DONE
      ELAPSED=$(( $(date +%s) - STARTED_AT ))
      log ""
      log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      log "  ALL REQUIREMENTS MET. Project complete."
      log "  Iterations: $ITERATION"
      log "  Time: $((ELAPSED / 60))m $((ELAPSED % 60))s"
      log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      break
      ;;
    *)  # FAIL
      CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
      log "Validation FAILED ($CONSECUTIVE_FAILURES/$MAX_CONSECUTIVE_FAILURES consecutive)."
      log "Coder will read the report and fix issues next iteration."
      ;;
  esac
done

log ""
log "Harness stopped after $ITERATION iterations."
