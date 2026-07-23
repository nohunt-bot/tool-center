# 05 — Maintenance: How Weak Models May Update This Harness Without Degrading It

Part of the weak-model pack. Distills `MAINTENANCE.md` (**that file wins on
conflict**) and adds the pack-specific rules (§3, plus the pack-file accretion
clause in §4, canonical here). Read this
before editing ANY harness file — including the pack itself.

## 1. The line: self-serve vs. user-approval

**You may do alone (self-serve):**
- Append a lesson to `LESSONS.md` (format: §2 — never skip the third field).
- Fix factual rot: broken paths, renamed commands/models, dead links, typos.
- Fill marked blanks after running the environment's OWN listing command
  (tier cells: `rules/model-dispatch.md` §2 — the only fill location).
- Add a missing ✅/❌ example to a rubric (`03_rubrics.md`, `rules/judgment.md`)
  — examples sharpen; they never weaken.
- Add a new dispatch template for an uncovered task type (must contain the
  full delegation triple).

**You must get user approval FIRST (write a proposal to
`docs/proposals/<date>-<slug>.md` — diff + reason — and stop):**
- Any edit to `CLAUDE.md` beyond fixing a broken link.
- Changing thresholds or mechanisms: tripwire count, receipt scope, freeze
  protocol, strike rules, tier assignments, escalation ladder, report contract.
- Weakening any rubric (removing a checklist item, softening a criterion,
  deleting an example).
- Permissions/allowlists, hooks, `install.sh`, hard rules.
- Deleting files or restructuring directories.
- Changing the precedence rule between this pack and the source files (§3).

The asymmetry is deliberate: weak models strengthen and repair; only the user
relaxes. If unsure which side of the line an edit is on, it is on the approval
side.

## 2. Lessons: write-down format and lifecycle

Location: `LESSONS.md` (repo root). One incident, one entry, three fields —
this is the Context / Error / Solution triple, using the canonical field names
from `MAINTENANCE.md`:

    ## YYYY-MM-DD — <one-line title>
    - What happened: <the Context — 2 lines max, concrete>
    - Root cause: <the Error — the decision or missing rule, not the symptom>
    - Rule change: <the Solution — none | applied: <commit/file> | proposed: docs/proposals/...>

Lifecycle rules:
- Every entry ends in one of the three Rule-change states. "none" twice for
  the same root cause → the second occurrence MUST become applied or proposed.
- Log an incident whenever: the harness misled you; a TRIPWIRE fired; a
  verifier caught a false completion (receipt mismatch); a ritual was skipped
  and something broke.

## 3. Pack ↔ source precedence and drift control

- Source files (`CLAUDE.md`, `rules/*.md`, `MAINTENANCE.md`, `templates/*.md`)
  are canonical for everything that predates the pack. The pack is canonical
  ONLY for: tripwire, receipts, phase-commit freeze, strike rules,
  pattern-to-script de-escalation, taste boundary (R4 + response procedure).
- A contradiction between pack and source is a BUG, never a choice you get to
  make silently: follow the source, log a lesson, fix the pack (self-serve).
- Drift check (run during `/harness-health`, or monthly on-prem): for each
  mechanism above, grep both homes; every non-canonical home must either just
  link or restate with IDENTICAL numbers — a restatement with different
  numbers is the bug to fix. Every path referenced in the pack must
  exist (`ls` it) — dead references poison credible rules
  (`docs/DIAGNOSIS.md` focus-loss #1).

## 4. Compaction: when records must shrink

Nothing always-loaded may grow silently (`MAINTENANCE.md` prime directive #1;
`CLAUDE.md` hard-capped at 3 KB). For the accumulating files:

- **Trigger** — compact `LESSONS.md` when ANY of: >30 entries, ~200 lines, or
  ~5,000 tokens (≈20 KB) — the same thresholds as `MAINTENANCE.md`
  §Compaction (source). Pack-file clause (canonical here): the same thresholds
  apply per-file to any pack file that accretes examples.
- **Method — abstraction, not deletion**: (1) merge entries sharing a root
  cause into one; (2) promote recurring lessons into a rule in the proper home
  — the rule is the lesson's tombstone, link the commit, then delete the entry;
  (3) target: under 15 entries after compaction.
- **Safety**: commit the pre-compaction state first; compaction itself is
  self-serve.
- Task files in `docs/tasks/` are never compacted — set `Status: done` and
  leave them as history.

## 5. The one metric that matters

After any harness edit, ask: *did the always-loaded footprint grow, and did
every rule keep exactly one home?* If either answer is wrong, the edit is not
done — no matter how good the new content is. Accretion is how the previous
setup died (`docs/DIAGNOSIS.md`); the pack is not exempt from its own rules.
