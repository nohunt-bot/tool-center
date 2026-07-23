# Template: Implement

Tier: STANDARD (TOP if the spec has open design questions — but prefer closing them
first). Two failures on the same criterion → escalate with full failure trail.

---

## Goal & why
Implement {{feature/change, one sentence}} in {{repo/worktree path}}. This is part
of {{larger goal}}, so {{constraint that follows — e.g. "the public API of X must
not change"}}.

## Spec
{{Precise description. Inputs, outputs, behavior on errors/edge cases. If a plan
file exists, give its path and say "follow it exactly".}}

## Constraints
- Follow existing code style in {{reference file the agent should imitate}}.
- Do not modify: {{files/areas that are off-limits}}.
- Do not add dependencies without listing them in the report as a question.
- Write tests {{first / alongside}}; test file location: {{path}}.

## Acceptance criteria
1. {{Concrete behavior check, e.g. "`pytest tests/test_foo.py` exits 0, including
   the new cases for <edge cases>"}}
2. {{Build/type check, e.g. "`pnpm tsc --noEmit` exits 0"}}
3. Existing test suite still passes: {{command}}.
4. Every changed line traces to this spec (no drive-by refactors).

## Report format
- Verdict: done / partial / failed + the most important fact.
- Each criterion above: pass/fail + the command you ran + exit status.
- Files changed: `path:line-range | what changed`, one per line.
- Decisions you made that the spec didn't cover (one line each).
- Do NOT paste diffs or file bodies; I will read the files.
- Return ONLY the sections above — no extra analysis or recommendations beyond
  the criteria (padding costs the commander context).
