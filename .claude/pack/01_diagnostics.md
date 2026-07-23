# 01 — Diagnostics: How Weak-Model Sessions Fail Here, and the Blockers

Part of the weak-model pack (`pack/`). Written 2026-07-03 by Fable 5 from a
live audit; compressed 2026-07-04 with every mechanism and number preserved
(recall-tested: `docs/experiments/20260704-hypothesis-log.md` E16/E17).
Audience: any STANDARD-or-below model running long tasks.

**Precedence**: for topics that also exist in `rules/`, `MAINTENANCE.md`, or
`docs/DIAGNOSIS.md`, those source files win on conflict — a conflict is a
bug: log it in `LESSONS.md`, fix the pack. The three §3 blockers are NEW
mechanisms canonical HERE and nowhere else. `docs/DIAGNOSIS.md` covers the
pre-2026-07 setup; this file covers the model-degradation era after
2026-07-03.

## 1. Core finding

Prompt-space defenses decay exactly as the model decays; mechanical defenses
(scripts, git, permissions, hooks, exit codes) do not. Design test for every
harness change: prompt space or mechanical space? Prefer mechanical. On-prem
(no hooks) the only mechanical layer is scripts + git — §3 is plain bash + git.

## 2. Failure scenarios

1. **Scenario 1 — Tool-call collapse**: context growth loses tool schemas;
   the model pattern-matches params from stale examples; each error adds
   noise. Signs: same tool fails twice with different param guesses; errors
   pasted unread; unchanged retries. Blocker: TRIPWIRE §3.2 (counting, not
   self-awareness).
2. **Scenario 2 — Semantic drift**: compaction/restart discards mid-task
   context; the model re-derives plans from recollection and edits files
   done phases froze. Signs: re-checking things the progress log answers;
   edits no plan step names. Blockers: FREEZE §3.3 + resume ritual — after
   ANY context reset, read the active task file FIRST, trust its log over
   memory (`grep -l 'Status: active' docs/tasks/*.md` before the first
   edit). On Claude Code `hooks/resume-sentinel.sh` also injects this.
3. **Scenario 3 — False completion**: the model narrates intended outcomes
   as done; weak models hallucinate success claims and read-backs alike.
   Signs: "I have written…" with no same-turn tool output; verification in
   future tense. Blocker: RECEIPT §3.1 (hashes are hard to hallucinate,
   cheap to re-check).

## 3. The three blockers (canonical)

### 3.1 RECEIPT
`bash .claude/scripts/receipt.sh <file> [...]` (on-prem: the
cloned repo's `scripts/receipt.sh`) prints
`RECEIPT sha=<12-hex> bytes=<n> mtime=<ts> <path>` per file; exits non-zero
on missing/empty. Required: (a) every phase close — the progress line
carries the receipts; (b) final report of any task claiming a file changed;
(c) any statement to the user that a file landed — receipt in the SAME
turn, never recalled from earlier. Pure Q&A needs none. Claim without
receipt = NOT DONE (hard rule, `CLAUDE.md`). Verifiers re-run receipt.sh;
sha mismatch or MISSING = false completion — report as an incident.

### 3.2 TRIPWIRE
Count 3 consecutive failed tool calls, or 3 failures of the same
call/subtask; the tally lives in the task file (`TRIPWIRE n/3 <what>`),
never in memory. Step-level `(retry: N)` marks stay reserved for failed
step checks (`rules/long-tasks.md` §1) — they are not this tally. At 2 failures of the same call: re-read the schema/--help
and change something material before attempt 3. At 3: STOP the route; write
a TRIPWIRE line (the 3 attempts, exact errors, one-line hypothesis); change
approach per `rules/judgment.md` §4 or escalate (`02_orchestration.md` §4).
Never attempt #4 unchanged. Fail-soft (user decision 2026-07-03): warn
loudly, never hard-block. No route + user absent = PARK: full state +
TRIPWIRE to the task file, step marked `[!]`, turn ends with a `WARNING:`
banner. Parking is success; thrashing is the failure mode.

### 3.3 PHASE-COMMIT FREEZE
Closing a plan step = one commit `phase(<task>): <step>` (`<task>` = the
task-file slug); uncommitted changes = phase not closed. Files last touched
by a done phase's `phase(` commit are frozen (heuristic:
`git log --oneline -1 -- <file>`; a later non-phase commit can mask frozen
status — when unsure, treat every file a done step names as frozen).
Editing frozen files requires REOPEN first: mark the step `[ ]` with one
line of reason; re-run its verification after. Ritual, not a block — but a
phase diff touching files its step never named is a scope violation
(`rules/judgment.md` §5). Bonus: drift recovery = `git revert`, not
archaeology.

## 4. Top pain points → cuts

1. **Raw dumps in the commander thread** (biggest token leak; feeds
   Scenario 2) → delegate (`02_orchestration.md` §1–2); findings to files;
   conclusions + `file:line` back; receipts replace pasted proof.
2. **Prompt-only enforcement** (feeds all three scenarios) → the three
   blockers in §3, all runnable as plain bash + git on-prem.
3. **Wide MCP surface with complex schemas** (feeds Scenario 1) → prefer
   CLI/scripts over MCP when both work; two-error schema re-read (§3.2);
   batch-load tool schemas before first use instead of guessing.

## 5. Capability ceiling — taste

Decomposition + isolation + fresh-context verification reach near-TOP
quality only where correctness is checkable (tests pass, file matches spec,
criteria enumerable). They do NOT rescue taste: ambiguous business
trade-offs, visual/UX aesthetics, naming, architecture bets under
uncertainty — a weak model there produces confident mediocrity no checklist
catches. In taste territory (detection: `03_rubrics.md` §R4):

1. Do NOT decide — produce 2–3 genuinely different options, each with a
   one-line trade-off and a reversibility note.
2. User reachable → batch the options into ONE question.
3. Unattended → pick the most reversible option, mark it
   `DECISION-PENDING(taste)` in the task file and final report, continue —
   never silently upgrade it into a settled decision.
4. Uncertain facts get checked (repo, docs, web); unfindable facts get
   `UNVERIFIED`, never invented.
