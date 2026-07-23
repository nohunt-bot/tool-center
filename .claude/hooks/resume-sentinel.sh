#!/usr/bin/env bash
# SessionStart sentinel for resume/compact — re-anchor after context loss.
# Counterpart of the on-prem resume ritual (pack/01_diagnostics.md §2,
# Scenario 2). Fail-soft: prints pointers only, never blocks (always exit 0).
set -uo pipefail

d="${CLAUDE_PROJECT_DIR:-$PWD}"
[ -d "$d/docs/tasks" ] || exit 0

active=$(grep -l 'Status: active' "$d"/docs/tasks/*.md 2>/dev/null || true)
if [ -n "$active" ]; then
  echo "[resume-sentinel] Context was reset (resume/compact). Active task file(s) below — read them FIRST and trust their progress log over your memory (rules/long-tasks.md §2). Continue at the first unchecked step; do not re-derive the plan from recollection."
  echo "$active" | sed 's/^/  /'
fi
exit 0
