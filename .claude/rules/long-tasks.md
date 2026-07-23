# Long-Task Protocol

The closed loop for work that spans phases or sessions. Routed from the core
loop (CLAUDE.md step 2) when a task is too big to hold in one context window.

## When this applies

Any of: the plan has 3+ steps; the work will outlive one session or a
compaction; more than ~5 files will change; the deliverable will go through
user feedback rounds. If none apply, the plain core loop suffices — do NOT
create task files for small tasks (ceremony is accretion; see LETTER.md).

## 1. The task file is the working memory

Conversation context is a cache; the task file is the source of truth.
Compaction WILL discard mid-task details — anything not written to a file is
lost by design, not by accident.

- Location: `docs/tasks/<YYYYMMDD>-<slug>.md` in the target project. Non-repo
  work: the session scratchpad — and say so in the final report.
- Create it at plan time, BEFORE the first edit. If the environment has a
  plan-approval mode, get the plan approved first, then write the file from
  the approved plan.

Skeleton — all five sections, always:

    # Task: <one sentence>
    Status: active | done | abandoned   (+ date)
    ## Acceptance criteria    <- checkable, derived from the user's ask
    ## Plan                   <- steps as "[ ] step -> how it's verified"
    ## Progress log           <- append-only: date | phase | evidence (cmd + exit)
    ## Decisions              <- one-liners; real alternatives -> docs/decisions/
    ## Open questions         <- for the user, batched, not one at a time

Plan-step status marks: `[ ]` pending · `[~]` running · `[x]` passed ·
`[!]` failed — a failed step also gets `(retry: N)` appended to its line.
The retry cap (`model-dispatch.md` §4) is enforced from these counters, not
from conversation memory: compaction resets memory, never the file.

## 2. Phase loop

For each plan step: mark it `[~]` → execute (dispatching per
`model-dispatch.md`) → run that step's promised check → append one progress
line with the evidence (receipts for files produced — `scripts/receipt.sh`) →
mark `[x]` → close with a `phase(<task>): <step>` commit; files last touched
by a done phase's commit are frozen (`pack/01_diagnostics.md`
§3.1/§3.3, canonical there) → next step. A failed check marks the step
`[!]` and increments its `(retry: N)` before any fix attempt starts. A phase
without a progress line did not happen.

**Resume protocol** — after compaction, a new session, or any "continue"
request: read the task file FIRST, trust its progress log over memory, and
continue at the first unchecked step. Never re-derive the plan from
recollection.

## 3. Tool routing by phase

| Phase | Route |
|-------|-------|
| Explore / locate | CHEAP search agent — `templates/delegate-search.md` |
| Research / compare | STANDARD — `templates/delegate-research.md` |
| Plan | plan-approval mode if the environment has one; else write the task file directly |
| Implement — locked plan, repo with tests or an explicit verify command | orchestrator pipeline (`agents/orchestrator.md`): worktree isolation + verify gate + judged merge |
| Implement — ≤ 2 tool calls | inline (dispatch rules §1 exception) |
| Refactor, no behavior change | STANDARD — `templates/delegate-refactor.md` |
| Verify anything | fresh context — `templates/delegate-review.md` (dispatch §6) |
| Track progress | environment task list if present; the task file stays authoritative |

## 4. Iteration rounds — a loop, not a one-shot answer

- Verification fails → one fix round at the author's tier; second failure →
  escalation ladder (dispatch §4); any "direction wrong" signal →
  `judgment.md` §4: change route, don't retry harder.
- Verification passes → retro (§5), THEN declare done per `judgment.md` §2.
- User feedback on a delivered result = the next iteration of the SAME task
  file: extend the criteria, keep appending progress. Open a new file only
  when the goal itself changed.
- The retry cap still binds: two rounds per subtask across all tiers, counted
  from the task file's `(retry: N)` marks — then back to planning.

## 5. Retro — every long task ends with one

Run `/retro` (commands/retro.md), or walk it manually: done-check
(`judgment.md` §2) → decisions with real alternatives → `docs/decisions/` per
`templates/decision-record.md` → harness lessons → `LESSONS.md` → set the task
file to `Status: done`. Skipping the retro on a multi-phase task means the
task is not done.
