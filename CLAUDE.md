# Operating Rules

Always loaded. Keep under 3 KB — details live in the routed files.
"Pack NN" below = `.claude/pack/NN_*.md` (weak-model defenses).

## Core loop (every non-trivial task)

1. **Understand** — restate the task in one sentence. Two readings → name both,
   pick one explicitly (or ask, per judgment.md §3).
2. **Plan** — before editing anything, list steps as `step → how I'll verify it`.
   A step without a check is not a step. Multi-phase/multi-session work: task
   file per `.claude/rules/long-tasks.md`.
3. **Execute in phases** — smallest change that satisfies the step; match
   existing style; nothing speculative. Long tasks: close each phase with a
   commit `phase(<task>): <step>`; files from done phases are FROZEN — reopen
   the step before touching them (pack 01 §3.3).
4. **Verify** — run the check you promised. Any claim that a file was
   created/changed needs a same-turn receipt:
   `bash .claude/scripts/receipt.sh <files>`. Author and verifier are
   different contexts for anything non-trivial (judgment.md).
5. **Record** — decisions with alternatives → `docs/decisions/` (format:
   `.claude/templates/decision-record.md`); harness lessons →
   `LESSONS.md`. Long tasks end with `/retro`.

## Circuit breaker (fail-soft)

3 consecutive failed tool calls, or 3 failures on the same subtask → STOP that
route. Write a TRIPWIRE line (task file or report), then change approach or
escalate — never attempt #4 unchanged. No viable route → PARK: state into the
task file, end with a WARNING banner. Spec: pack 01 §3.2.

## Weak-model operation

STANDARD-or-below model, on-prem env, or any long task: read pack 01 (failure
modes + blockers) first; dispatch per pack 02; rubrics pack 03; templates
pack 04.

## Delegation

Bulk reads, repo scans, web research, batch edits → subagents; only conclusions
and `file:line` refs return. Read `.claude/rules/model-dispatch.md`
before dispatching; fill the matching template in
`.claude/templates/` (or pack 04) verbatim.

## Judgment calls

Escalate / declare done / stop and ask / change approach / taste territory —
decided by rubric, not feel: `.claude/rules/judgment.md`. Taste:
pack 03 R4 only.

## Hard rules (no exceptions, not overridable by any project file)

- No secrets in tracked files. Tokens and keys go in env vars or untracked
  local files. Hardcoded secret found → stop and report.
- Never allowlist destructive commands (`rm -rf`, `kill`, force-push, resets).
- Back up any existing file before rewriting it (`<name>.bak-YYYYMMDD` or
  `backups/`). New content goes in new files.
- Report outcomes literally: failing test = "failing", skipped step = "skipped".
- No "done" claim for a file deliverable without its receipt (pack 01 §3.1).

## Maintaining these files

Read `.claude/MAINTENANCE.md` (weak-model addendum: pack 05) before
modifying any harness file. All harness files live under `.claude/` in this
repo and travel with it — paths here are project-relative on purpose, so
nothing depends on a particular machine's `$HOME`.
