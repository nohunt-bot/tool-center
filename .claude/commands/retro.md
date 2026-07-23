---
description: End-of-task retrospective — done-check, decision records, lessons, task-file closeout
---

Close out the task just finished (the main task of this conversation, or
$ARGUMENTS if given). Evidence, not impressions. Read
`.claude/rules/judgment.md` §2 and §5 before starting.

1. **Done-check (judgment §2)**: list every acceptance criterion with its
   evidence — command + exit status, read-back, real-entry-point run. Any
   criterion without evidence means the task is NOT done: say so and list
   exactly what's missing. Do not soften the verdict.
2. **Quality floor (judgment §5)**: secrets grep on the diff, scope discipline
   (every changed line traces to the request), reader test on prose,
   reversibility (backups / clean git state). Report each as pass/fail.
3. **Ritual audit (weak-model pack)**: re-run
   `.claude/scripts/receipt.sh` on every file the task claimed as a
   deliverable — shas must match the claims (mismatch = false completion:
   report it, don't soften it); every closed phase has its `phase(...)`
   commit; TRIPWIRE lines exist wherever the same call failed 3+ times
   (`.claude/pack/01_diagnostics.md` §3). Skipped
   rituals → lesson.
4. **Decision records**: list decisions made where a real alternative was
   rejected. For each, write `docs/decisions/<YYYYMMDD>-<slug>.md` per
   `.claude/templates/decision-record.md`. If none were made, say
   "none" — don't manufacture records.
5. **Lessons**: did the harness mislead you, or did a preventable failure
   occur? Harness issues → append to `.claude/LESSONS.md` in the
   MAINTENANCE.md format. Project-specific issues → the project's own log.
   No incident → "none".
6. **Task-file closeout**: if `docs/tasks/` holds a file for this task (see
   `.claude/rules/long-tasks.md`), append the final progress line
   and set `Status: done` (or `abandoned` plus why).
7. **Follow-ups**: things noticed but out of scope — one line each, so the
   user can decide what becomes the next task.

Report per the contract in `.claude/rules/model-dispatch.md` §5:
verdict line, evidence per step, `file:line` references, open issues.
