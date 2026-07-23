#!/usr/bin/env bash
# Portable worktree gate — plain-git replacement for the EnterWorktree/
# ExitWorktree tools, so the orchestrator pipeline (agents/orchestrator.md)
# runs in any environment that has bash and git.
#
# Usage:
#   worktree.sh create <repo-path> <branch>
#       Creates the branch (from the repo's current HEAD) and a worktree for
#       it beside the repo. Last stdout line is "WORKTREE=<absolute-path>" —
#       capture that as the worktree path. Slashes in the branch name are
#       flattened to dashes for the dir, so "feat/x" and "feat-x" collide
#       (git errors out, nothing is lost) — fine for the orchestrator's
#       unique impl/<id> names; avoid reusing near-identical branch names.
#   worktree.sh drop <repo-path> <worktree-path> [branch]
#       Removes the worktree. Pass the branch name to also delete the branch
#       (dropping unmerged work); omit it after a merge to keep the branch.
#
# Exit 0 = success; any git failure propagates non-zero with its error visible.
set -euo pipefail

usage() {
  echo "usage: worktree.sh create <repo-path> <branch>" >&2
  echo "       worktree.sh drop <repo-path> <worktree-path> [branch]" >&2
  exit 1
}

MODE="${1:-}"
REPO="${2:-}"
[ -n "$MODE" ] && [ -n "$REPO" ] || usage
git -C "$REPO" rev-parse --git-dir >/dev/null

case "$MODE" in
  create)
    BRANCH="${3:?branch name required}"
    ROOT="$(cd "$REPO" && pwd -P)"
    WT_DIR="$(dirname "$ROOT")/.$(basename "$ROOT")-worktrees/${BRANCH//\//-}"
    git -C "$ROOT" worktree add -b "$BRANCH" "$WT_DIR" >&2
    echo "WORKTREE=$WT_DIR"
    ;;
  drop)
    WT_PATH="${3:?worktree path required}"
    BRANCH="${4:-}"
    git -C "$REPO" worktree remove --force "$WT_PATH"
    git -C "$REPO" worktree prune
    [ -n "$BRANCH" ] && git -C "$REPO" branch -D "$BRANCH" >&2
    echo "DROPPED=$WT_PATH${BRANCH:+ (branch $BRANCH deleted)}"
    ;;
  *) usage ;;
esac
