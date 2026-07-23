# Template: Refactor (no behavior change)

Tier: STANDARD. The defining property of a refactor: observable behavior is
identical before and after. If the task changes behavior, use delegate-implement.

---

## Goal & why
Refactor {{what, e.g. "extract the retry logic from client.py into retry.py"}} in
{{repo path}}. Motivation: {{why — e.g. "three modules are about to need it"}}.

## Baseline (do this FIRST, before touching anything)
1. Run {{test command}} and record the result. If it doesn't pass BEFORE your
   changes, STOP and report — never refactor on a red baseline.
2. Note the current public interface(s) that must not change: {{list}}.

## Constraints
- No behavior changes, no "while I'm here" fixes. If you find a real bug, report
  it in Open issues — do not fix it in this task.
- Keep the diff minimal; prefer several small moves over one big rewrite.
- Off-limits: {{files/areas}}.

## Acceptance criteria
1. {{Test command}} passes AFTER, with the same set of tests as the baseline run
   (no tests deleted, skipped, or weakened).
2. Public interfaces listed above are byte-compatible ({{how to check, e.g. "grep
   call sites, run the type checker"}}).
3. No orphans: nothing your change made unused is left behind; nothing unrelated
   was deleted.

## Report format
- Verdict + baseline result vs. after result (both command outputs' last lines).
- Move map: `old location → new location`, one per line.
- Each criterion: pass/fail + evidence.
- Open issues: real bugs found but NOT fixed (path:line each).
- Return ONLY the sections above — no extra analysis or recommendations beyond
  the criteria (padding costs the commander context).
