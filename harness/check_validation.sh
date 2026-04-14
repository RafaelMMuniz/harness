#!/bin/bash
# Parse VALIDATION_REPORT.md for the verdict line.
# Exit codes: 0=PASS, 1=FAIL, 2=DONE
#
# Usage: ./check_validation.sh [path/to/VALIDATION_REPORT.md]

REPORT="${1:-VALIDATION_REPORT.md}"

if [ ! -f "$REPORT" ]; then
  echo "No validation report found at: $REPORT"
  exit 1
fi

VERDICT=$(grep -i "^## Verdict:" "$REPORT" | head -1 | sed 's/^## Verdict:[[:space:]]*//' | tr '[:lower:]' '[:upper:]' | xargs)

case "$VERDICT" in
  PASS*)  echo "Verdict: PASS";  exit 0 ;;
  DONE*)  echo "Verdict: DONE";  exit 2 ;;
  *)      echo "Verdict: FAIL ($VERDICT)"; exit 1 ;;
esac
