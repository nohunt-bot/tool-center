#!/usr/bin/env bash
# Receipt generator — mechanical proof that a claimed deliverable actually landed.
# Spec: pack/01_diagnostics.md §3.1 (canonical). Portable: macOS + Linux.
#
# Usage: receipt.sh <file> [...]
#   Prints one line per file:  RECEIPT sha=<12-hex> bytes=<n> mtime=<ts> <path>
#   MISSING/EMPTY lines and exit 1 when any file is absent or zero-byte.
# A completion claim without a same-turn receipt is NOT DONE (CLAUDE.md hard rule).
# Verifiers re-run this and compare sha against the author's claim.

set -uo pipefail

if [ "$#" -eq 0 ]; then
  echo "usage: receipt.sh <file> [...]" >&2
  exit 2
fi

fail=0
for f in "$@"; do
  if [ ! -f "$f" ]; then
    echo "MISSING  $f"
    fail=1
    continue
  fi
  if [ ! -s "$f" ]; then
    echo "EMPTY    $f"
    fail=1
    continue
  fi
  if command -v shasum >/dev/null 2>&1; then
    sha=$(shasum -a 256 "$f" | awk '{print substr($1,1,12)}')
  else
    sha=$(sha256sum "$f" | awk '{print substr($1,1,12)}')
  fi
  bytes=$(wc -c < "$f" | tr -d ' ')
  # mtime: BSD date -r first (macOS), GNU stat fallback (Linux)
  mtime=$(date -r "$f" '+%Y-%m-%dT%H:%M:%S' 2>/dev/null) \
    || mtime=$(stat -c '%y' "$f" 2>/dev/null | cut -d'.' -f1 | tr ' ' 'T') \
    || mtime="unknown"
  echo "RECEIPT  sha=$sha bytes=$bytes mtime=$mtime  $f"
done
exit "$fail"
