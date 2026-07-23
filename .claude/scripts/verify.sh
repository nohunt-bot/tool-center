#!/usr/bin/env bash
# Verification gate — run project tests in a worktree.
# Usage: verify.sh <worktree-path> ["custom verify command"]
# With a custom command: runs it in the worktree (shell string, e.g. "make lint && make build").
# Without: auto-detects the project's test runner.
# Exit 0 = verification passed. Exit 1 = failure or no verification method found.

set -euo pipefail

WORKTREE="${1:-}"
CUSTOM_CMD="${2:-}"

if [[ -z "$WORKTREE" ]]; then
  echo "ERROR: worktree path required" >&2
  exit 1
fi

if [[ ! -d "$WORKTREE" ]]; then
  echo "ERROR: worktree path does not exist: $WORKTREE" >&2
  exit 1
fi

cd "$WORKTREE"

if [[ -n "$CUSTOM_CMD" ]]; then
  echo "[verify] running custom command: $CUSTOM_CMD"
  if bash -c "$CUSTOM_CMD"; then
    echo "[verify] PASSED"
    exit 0
  else
    rc=$?
    echo "[verify] FAILED (exit $rc)" >&2
    exit "$rc"
  fi
fi

# --- Detect test runner ---

run_tests() {
  if [[ -f "package.json" ]]; then
    # Prefer explicit test script
    if node -e "require('./package.json').scripts?.test" 2>/dev/null | grep -qv "^undefined$"; then
      echo "[verify] running: npm test"
      npm test --silent
      return
    fi
    # Vitest
    if [[ -f "vitest.config.ts" || -f "vitest.config.js" ]]; then
      echo "[verify] running: npx vitest run"
      npx vitest run
      return
    fi
    # Jest
    if node -e "require('./package.json').devDependencies?.jest || require('./package.json').dependencies?.jest" 2>/dev/null | grep -qv "^undefined$"; then
      echo "[verify] running: npx jest"
      npx jest --passWithNoTests=false
      return
    fi
  fi

  if [[ -f "pyproject.toml" || -f "setup.py" || -f "pytest.ini" || -f "setup.cfg" ]]; then
    echo "[verify] running: pytest"
    python -m pytest
    return
  fi

  if [[ -f "go.mod" ]]; then
    echo "[verify] running: go test ./..."
    go test ./...
    return
  fi

  if [[ -f "Cargo.toml" ]]; then
    echo "[verify] running: cargo test"
    cargo test
    return
  fi

  if [[ -f "Makefile" ]] && grep -q "^test:" Makefile 2>/dev/null; then
    echo "[verify] running: make test"
    make test
    return
  fi

  # No test runner found — block
  echo "ERROR: no test runner detected in $WORKTREE" >&2
  echo "  Checked: package.json (npm/vitest/jest), pyproject.toml/pytest, go.mod, Cargo.toml, Makefile" >&2
  exit 1
}

run_tests
echo "[verify] PASSED"
