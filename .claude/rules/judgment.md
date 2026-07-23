# Judgment Rubrics

Decisions that normally require senior judgment, written as checklists any model can
execute. When one of these five calls comes up, find the section, walk the list,
act on the result. Do not decide these "by feel".

## 1. When to escalate to a higher model tier

Escalate if ANY of these is true (mechanics of how: `model-dispatch.md` §4):

- [ ] The failure is a *reasoning* error (wrong approach, misread requirements),
      not a mechanical one (typo, wrong path, missing import).
- [ ] Two attempts produced two *different* wrong answers.
- [ ] The subtask requires weighing trade-offs with no single checkable answer.
- [ ] You cannot state what the correct output would look like — if you can't
      specify it, a same-tier retry can't hit it.

Do NOT escalate when the fix is already identified (wrong filename, off-by-one, a
failing assertion pointing at the exact line): just fix and rerun once.

- ✅ **Escalate**: CHEAP agent asked to find all callers of `parse()` returned 3;
  a grep spot-check shows 11. That's a recall/reasoning failure — go up a tier.
- ❌ **Don't escalate**: test fails with `ModuleNotFoundError: requests`. The cause
  is fully diagnosed; install the dependency and rerun. Model choice is irrelevant.

## 2. When the task is actually done

"Done" requires ALL of:

- [ ] Every acceptance criterion has evidence (command output, read-back, test run)
      — not inference. If there were no criteria, that's the bug: write them, then check.
- [ ] Verification was executed in a fresh context, not by the author
      (`model-dispatch.md` §6; no-subagent env: a fresh NEW session per that section).
- [ ] The change was exercised through its *real* entry point at least once (run the
      CLI, hit the endpoint, load the page) — unit tests alone don't count.
- [ ] Nothing you touched is left broken: build passes, no orphaned imports/refs
      created by your edits.
- [ ] Deliverables are written to files, not only in conversation.

- ✅ **Done**: "Criteria 1–3 pass (pytest output attached, exit 0); verifier agent
  read back the doc and each section matches spec; ran `cli --help` and the new flag
  appears; committed as abc123."
- ❌ **Not done**: "I've implemented the function and it should handle all the edge
  cases correctly." — "should" = not verified; author is grading own work; the real
  entry point was never run.

## 3. When to stop and ask the user

Ask (batched, once) when ANY of:

- [ ] The action is destructive or hard to reverse AND not explicitly requested
      (delete/overwrite data, force-push, drop tables, send external messages, spend money).
- [ ] Two interpretations of the request lead to *materially different* work, and
      the wrong pick wastes more than ~30 min of effort.
- [ ] You would exceed the stated scope (new dependency, schema change, touching a
      repo the task didn't mention).
- [ ] Evidence contradicts the user's stated premise (they said the bug is in X;
      proof shows it's in Y and fixing Y changes scope).
- [ ] Secrets, credentials, or payments are involved in a way not already authorized.

Do NOT ask when: the answer is discoverable in the repo/env; it's a reversible
default a competent engineer would pick; or the user already answered it earlier in
the session. Batch questions; never ask one at a time.

- ✅ **Ask**: "Migration requires dropping the `sessions` table. Task said 'clean up
  auth' — data loss wasn't explicitly approved. Proceed?"
- ❌ **Don't ask**: "Should I use snake_case for the new Python module?" — repo
  convention is visible in every existing file. Look, match, move on.

## 4. Signals the direction is wrong (change approach — don't retry harder)

If ANY of these appears, STOP retrying. Write down why the approach failed, return
to the plan step, and pick a different route (or apply rubric §3):

- [ ] Each fix creates a new failure elsewhere (whack-a-mole ≥ 3 cycles).
- [ ] You are fighting the framework/library — disabling checks, monkey-patching
      internals, copying vendored code to make it fit.
- [ ] The diff keeps growing but the failing criterion hasn't changed.
- [ ] You're on attempt 3+ and the plan's time estimate is exceeded ~2×.
- [ ] The solution requires an assumption you've already seen evidence against.

Retry (same approach) is correct only when the last error message names a specific
fixable cause you haven't fixed yet.

- ✅ **Change route**: making a WebSocket reconnect test pass required mocking three
  private methods of the library, and it still flakes. Stop: test against a real
  local server instead, or test the state machine without the transport.
- ❌ **Wrongly changing route**: first `npm test` run fails on a snapshot diff you
  caused and expected. That's the same approach working as designed — update the
  snapshot, don't redesign the feature.

## 5. Quality floor — minimum bar before anything ships

Run this on every deliverable, even "trivial" ones:

- [ ] **Correctness evidence** exists (rubric §2).
- [ ] **No secrets** in any file to be committed (`grep` for `key`, `token`,
      `Bearer`, `password` in the diff — 30 seconds, always).
- [ ] **Scope discipline**: every changed line traces to the request. Reformatting,
      renames, and "improvements" outside scope are reverted.
- [ ] **Reader test** for prose/docs: a person with zero session context can act on
      it — no references to "the plan above", no undefined shorthand.
- [ ] **Reversibility**: originals of modified files are backed up; the change can
      be undone (git revert, backup restore) without archaeology.

- ✅ **Meets floor**: 40-line diff, all lines serve the fix, test proves it, diff
  grepped for secrets, commit message states what+why.
- ❌ **Below floor**: fix works, but the diff also reformats 200 untouched lines
  ("cleanup while I was there") and the API key used for testing is still in
  `config.py`. Two violations — revert the reformat, pull the key, then ship.
