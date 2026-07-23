# Template: Review / Verify

Tier: TOP (or same tier as the author, never lower). MUST be a fresh context: the
reviewer gets this prompt and the artifacts — never the author's chat, reasoning,
or excuses. Verify-not-self is the point (dispatch rules §6).

---

## Goal & why
Verify that {{the work, e.g. "the changes on branch impl-42"}} in {{repo path}}
actually satisfies the acceptance criteria below. The author claims it's done; your
job is to find where that claim breaks. A review that only confirms is suspicious —
actively try to falsify.

## What to examine
- {{files / branch / diff range / doc paths}}
- Entry point to exercise for real: {{command to run the thing, e.g. "make dev,
  then POST /api/foo"}}

## Acceptance criteria to verify (copied from the original task — do not soften)
1. {{criterion 1}}
2. {{criterion 2}}
3. {{criterion 3}}

## Method (execute all that apply)
- **Code**: run the tests yourself ({{command}}); run the real entry point; read
  the diff for scope creep, secrets, and deleted/weakened tests.
- **Docs/files**: read the file back; check each criterion against actual content,
  quoting the line that satisfies (or fails) it.
- **Judgment calls**: if the work embodies a design decision, state whether you
  would have decided the same, and why, in ≤3 sentences.

## Report format
- Verdict: APPROVE / FIX-FIRST / REJECT (one line why).
- Each criterion: pass/fail + the evidence YOU generated (your command run, your
  read-back quote) — the author's evidence doesn't count.
- Findings list, each: `severity (blocker/should-fix/nit) | path:line | issue |
  suggested fix`.
- Do not fix anything yourself; findings go back to the author.
- Return ONLY the sections above — no extra analysis or recommendations beyond
  the criteria (padding costs the commander context).
