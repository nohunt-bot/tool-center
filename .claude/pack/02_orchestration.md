# 02 — Orchestration: Dispatch Contract and the Escalation Ladder

Part of the weak-model pack. Distilled for STANDARD-and-below commanders from
`rules/model-dispatch.md` (tiers, delegation triple, report contract — **that
file wins on conflict**). New here and canonical here: the tier-specific strike
rules (§4) and the pattern-to-script de-escalation procedure (§5).
Blockers (TRIPWIRE / RECEIPT / FREEZE) are specified in `01_diagnostics.md` §3.

## 1. The commander does not do grunt work

The main conversation plans, dispatches, integrates, decides. It does NOT:
read >~3 files or >~500 lines directly; grep/scan a repo; browse the web for
research; batch-edit many files; run long exploratory command chains. All of
that goes to a subagent; only conclusions, decisions, and `file:line` refs come
back. Exception: a job finishable in ≤2 tool calls is done inline.

If you catch yourself pasting file contents into the main thread: stop,
dispatch instead. Every pasted dump is future task-memory that compaction will
destroy (`01_diagnostics.md` §4 item 1).

**No-subagent environments** (common on-prem): the same rules apply in spirit —
work in explicit phases, write intermediate findings to files instead of
holding them in context, and hold your own phase summaries to the report
contract (§6).

## 2. Delegation triple — mandatory in every dispatch

Every subagent prompt contains, explicitly labeled:

1. **Goal + why** — what to produce and what it will be used for, so the agent
   can make micro-decisions without calling home. The subagent starts with ZERO
   context: paths, constraints, and prior decisions must be written in;
   "as discussed" means nothing to it.
2. **Acceptance criteria** — checkable conditions ("`pytest tests/x.py` exits
   0", "every match includes file:line"). Never "do it well".
3. **Report format** — exactly what to return and what NOT to return (no file
   dumps, no diffs >20 lines; artifacts go to files, report carries paths +
   receipts).

A dispatch prompt missing any of the three is a bug: fix the prompt, don't send
it. Fill-in templates: `04_templates.md`.

## 3. Tier map

Tier→model cells live in `rules/model-dispatch.md` §2 — the ONLY place they
are filled. For a new environment (including on-prem), add a column THERE, and
only after running that environment's own model-listing command — never from
memory (self-serve per `05_maintenance.md`). Task-type defaults:
search/summarize → CHEAP; implement-from-spec / research-with-judgment →
STANDARD; architecture, ambiguous debugging, plan writing, judging others'
output → TOP (fresh context).

## 4. Strike rules — escalation ladder (fail-soft, counted, capped)

- **CHEAP: 1 strike.** One tool-call, syntax, or wrong-answer failure →
  re-dispatch to STANDARD immediately. Never re-prompt CHEAP with a reworded
  version of the same ask.
- **STANDARD: 2 strikes on the same subtask.** Second failure → escalate to
  TOP **with the full error trail**: both attempts' prompts, outputs, and exact
  error messages. Escalating without the trail wastes the expensive model's
  first turn. **Single-model environment** (no higher tier): the ladder
  collapses to the retry cap — ONE retry total, in fresh context, with the
  full trail in-prompt; a second failure on the same subtask = stop, apply
  `rules/judgment.md` §4 (source: `rules/model-dispatch.md` §4, canonical for
  this clause). Never a third run.
- **Hard cap: two retry rounds per subtask across all tiers.** After that the
  task definition is probably wrong — stop retrying, return to planning, apply
  `rules/judgment.md` §4 / `03_rubrics.md` §R1.
- **Counting**: the original dispatch is round 0; EVERY re-dispatch after a
  failure — same-tier retry or escalation — is one retry round. Two rounds =
  three dispatches total per subtask. Worked examples: start STANDARD → S
  fails (round 0), S retry fails (round 1), TOP with trail (round 2), stop.
  Start CHEAP → C fails (0), STANDARD fails (1), TOP with trail (2), stop —
  a subtask promoted from CHEAP gets ONE attempt at STANDARD, not two.
- **Tripwire interlock**: 3 consecutive tool failures inside ANY agent trips
  `01_diagnostics.md` §3.2 regardless of where the ladder stands.
- Counts live in the task file, never in memory: strike/retry rounds as the
  step's `(retry: N)` mark (`rules/long-tasks.md` §1), tool-failure tallies as
  TRIPWIRE lines (`01_diagnostics.md` §3.2). Compaction resets memory, never
  the file.

## 5. De-escalation: pattern → temporary script → cheap batch

When TOP (or a lucky STANDARD run) solves one instance of a repeating problem:

1. Freeze the solution as a **temporary script or exact recipe** (a file, e.g.
   `scratch/apply-<pattern>.sh` or a precise sed/comby command) — not prose.
2. Hand the script to CHEAP tier to batch-apply across remaining cases.
3. Spot-check a sample (≥2 cases or 10%, whichever is larger) with a
   fresh-context verifier before accepting the batch.
4. Delete the temporary script at task end, or promote it into the repo
   properly — never leave orphans.

Same-work-retried-max-twice applies to the batch as a whole.

## 6. Reports and isolation of verification

Subagents return, in order: **Verdict** (one line: done/partial/failed + the
single most important fact) → **Evidence** (each acceptance criterion pass/fail
with command + exit code, receipts for produced files) → **References**
(`path:line`) → **Artifacts** (paths only) → **Open issues** (one line each).
Reject nonconforming reports — demand a re-report; do not paste-and-fix in the
main thread.

- The context that produced work never certifies it. Verification goes to a
  **fresh-context** agent that receives only the acceptance criteria and where
  the work lives — not the author's reasoning. No-subagent environments: a
  NEW session serves as the fresh context (`rules/model-dispatch.md` §6,
  canonical there); same-session self-review never qualifies.
- Files/docs → verifier re-reads the file and re-runs
  `scripts/receipt.sh` (sha must match the author's claim).
- Code → verifier actually runs tests/build/entry point
  (`scripts/verify.sh <worktree>` auto-detects runners; exit 0 = pass).
- High-stakes calls (architecture, destructive migration, release) → second
  independent TOP opinion, or 2–3 candidate implementations judged by a fresh
  TOP agent (the orchestrator → implementer → code-judge pipeline in `agents/`
  implements this on Claude Code).
- Verifier findings return to the author's tier for fixes; a failed
  verification counts as one strike in §4.
