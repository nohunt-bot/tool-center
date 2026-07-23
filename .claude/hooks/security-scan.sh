#!/usr/bin/env bash
# Security scanner — PreToolUse hook for Claude Code
# Triggers before Bash commands that install packages or clone repos

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# ── Detect install/clone operations ──
is_install=false
install_type=""
install_target=""

if echo "$COMMAND" | grep -qE '(^|\s)(npm install|npm i\b)'; then
  is_install=true; install_type="npm"
  install_target=$(echo "$COMMAND" | grep -oE '(npm install|npm i)[^|&;]*' | head -1)
elif echo "$COMMAND" | grep -qE '(^|\s)(bun install|bun add)'; then
  is_install=true; install_type="bun"
  install_target=$(echo "$COMMAND" | grep -oE '(bun add)[^|&;]*' | head -1)
elif echo "$COMMAND" | grep -qE '(^|\s)(pip install|pip3 install)'; then
  is_install=true; install_type="pip"
  install_target=$(echo "$COMMAND" | grep -oE '(pip3? install)[^|&;]*' | head -1)
elif echo "$COMMAND" | grep -qE '(^|\s)git clone'; then
  is_install=true; install_type="git"
  install_target=$(echo "$COMMAND" | grep -oE 'https?://[^ ]+|git@[^ ]+' | head -1)
elif echo "$COMMAND" | grep -qE '(^|\s)claude (plugin|skills?)'; then
  is_install=true; install_type="claude-skill"
  install_target=$(echo "$COMMAND" | sed 's/.*claude [a-z]* //')
elif echo "$COMMAND" | grep -qE '(^|\s)(brew install|brew reinstall)'; then
  is_install=true; install_type="brew"
  install_target=$(echo "$COMMAND" | grep -oE '(brew (re)?install)[^|&;]*' | head -1)
fi

if [ "$is_install" = false ]; then
  exit 0
fi

# ── Log the operation ──
LOGFILE="${CLAUDE_PROJECT_DIR:-$PWD}/.claude/security-scan.log"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] SCAN [$install_type] $install_target" >> "$LOGFILE"

# ── npm audit check ──
if [ "$install_type" = "npm" ]; then
  PKG_DIR=$(echo "$COMMAND" | grep -oE '\-\-prefix [^ ]+' | awk '{print $2}')
  # Fall back to the working directory — without this the audit branch never fires
  if [ -z "$PKG_DIR" ] && [ -f "package.json" ]; then
    PKG_DIR="$PWD"
  fi
  if [ -n "$PKG_DIR" ] && [ -f "$PKG_DIR/package.json" ]; then
    AUDIT=$(cd "$PKG_DIR" && npm audit --json 2>/dev/null || true)
    VULN_COUNT=$(echo "$AUDIT" | jq '.metadata.vulnerabilities.total // 0' 2>/dev/null || echo "0")
    if [ "$VULN_COUNT" -gt 0 ] 2>/dev/null; then
      HIGH=$(echo "$AUDIT" | jq '.metadata.vulnerabilities.high // 0' 2>/dev/null || echo "0")
      CRITICAL=$(echo "$AUDIT" | jq '.metadata.vulnerabilities.critical // 0' 2>/dev/null || echo "0")
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] VULN npm $install_target — critical:$CRITICAL high:$HIGH total:$VULN_COUNT" >> "$LOGFILE"
      if [ "$CRITICAL" -gt 0 ] 2>/dev/null; then
        jq -n --arg msg "🚨 資安警告：npm 套件含 $CRITICAL 個 CRITICAL 漏洞，安裝已阻擋。執行 npm audit 查看詳情。" \
          '{"continue": false, "stopReason": $msg}'
        exit 0
      fi
    fi
  fi
fi

# ── pip audit check (warn-only: pip-audit severity data is too spotty to block) ──
if [ "$install_type" = "pip" ]; then
  if command -v pip-audit >/dev/null 2>&1; then
    REQ_FILE=$(echo "$COMMAND" | grep -oE '\-r +[^ ]+' | awk '{print $2}' | head -1)
    if [ -n "$REQ_FILE" ] && [ -f "$REQ_FILE" ]; then
      AUDIT=$(pip-audit -r "$REQ_FILE" --no-deps -f json 2>/dev/null || true)
      VULN_COUNT=$(echo "$AUDIT" | jq '[.dependencies[]?.vulns[]?] | length' 2>/dev/null || echo "0")
      if [ "$VULN_COUNT" -gt 0 ] 2>/dev/null; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] VULN pip $REQ_FILE — $VULN_COUNT known vulnerabilities" >> "$LOGFILE"
        jq -n --arg msg "⚠️ 資安提示：$REQ_FILE 內有 $VULN_COUNT 個已知漏洞（pip-audit --no-deps）。請確認後再繼續。" \
          '{"hookSpecificOutput": {"hookEventName": "PreToolUse", "additionalContext": $msg}}'
      fi
    fi
  else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SKIP pip audit — pip-audit not installed" >> "$LOGFILE"
  fi
fi

# ── Warn for unrecognized git clone sources ──
if [ "$install_type" = "git" ]; then
  if ! echo "$install_target" | grep -qE 'github\.com|gitlab\.com|bitbucket\.org'; then
    jq -n --arg msg "⚠️ 資安提示：正在從非主流來源 clone: $install_target — 請確認來源可信後繼續。" \
      '{"hookSpecificOutput": {"hookEventName": "PreToolUse", "additionalContext": $msg}}'
  fi
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ALLOW [$install_type] $install_target" >> "$LOGFILE"
exit 0
