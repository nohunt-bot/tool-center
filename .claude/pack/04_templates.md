# 04 — Dispatch Templates: Fill In, Don't Freestyle

Part of the weak-model pack. Weak-model editions of `templates/*.md` (the
delegation-triple structure there wins on conflict; per-file variants:
`templates/delegate-search.md`, `-research`, `-implement`, `-refactor`,
`-review`). Usage: copy the template, replace EVERY `{{...}}`, delete nothing
except lines marked *(optional)*. The subagent starts with zero context —
anything not written into the prompt does not exist for it. All reports obey
`02_orchestration.md` §6; all produced files carry receipts
(`01_diagnostics.md` §3.1).

---

## T1 — Search & Research (tier: CHEAP for locate, STANDARD for judgment)

    ## Goal & why
    Find {{what — e.g. "every write-path to the sessions table"}} in {{repo /
    docs / the web}}. I need this to {{decision it feeds — e.g. "plan a safe
    schema migration"}}, so completeness beats speed.

    ## Context you must know (you start cold)
    - Repo root: {{absolute path}}; relevant areas: {{dirs/files if known}}
    - Prior findings/decisions that bound this search: {{one line each, or "none"}}
    - Out of scope: {{what NOT to chase}}

    ## Acceptance criteria
    1. Every finding includes `path:line` (or URL + section for web).
    2. Coverage statement: which dirs/patterns/sources you searched AND which
       you did not (so gaps are visible).
    3. {{judgment asks only: "recommendation with 2–3 line rationale,
       alternatives named"}} *(optional)*
    4. Zero pasted file bodies over 20 lines.

    ## Report format
    Verdict (1 line: found N / not found + strongest fact) → findings as
    `path:line — one-line meaning` → coverage statement → open issues.
    Long notes go to {{scratch file path}}; report the path + receipt.

## T2 — Implementation (tier: STANDARD; TOP only if design questions remain — close them first)

    ## Goal & why
    Implement {{feature/change, one sentence}} in {{repo or worktree path}}.
    Part of {{larger goal}}, therefore {{binding constraint — e.g. "public API
    of X must not change"}}.

    ## Spec
    {{Inputs, outputs, behavior on errors/edge cases — precise. If a plan/task
    file exists: "follow docs/tasks/{{file}} step {{N}} exactly."}}

    ## Constraints
    - Match the style of {{reference file to imitate}}.
    - Do NOT modify: {{off-limits files — include frozen phase files,
      01_diagnostics.md §3.3}}.
    - No new dependencies without listing them as a question in the report.
    - Tests: {{"write first" / "alongside"}}; location {{path}}.

    ## Acceptance criteria
    1. {{behavior check — "`pytest tests/test_x.py` exits 0 incl. new cases
       for {{edges}}"}}
    2. {{build/type check — "`pnpm tsc --noEmit` exits 0"}}
    3. Full existing suite still passes: {{command}}.
    4. Every changed line traces to this spec — no drive-by refactors.
    5. Receipts for every file created/modified.

    ## Report format
    Verdict → per-criterion pass/fail + command + exit code → files changed as
    `path:line-range | what` → receipts → assumptions made (one line each).
    NO diffs, NO file bodies — I will read the files.

## T3 — Refactoring (tier: STANDARD; behavior change = out of scope, full stop)

    ## Goal & why
    Restructure {{what}} in {{path}} to {{measurable aim — e.g. "remove the
    circular import between A and B"}} with ZERO behavior change. Why now:
    {{driver}}.

    ## Context you must know
    - Behavior lock: {{test suite / golden output command}} defines "unchanged".
    - Anchors that must keep their public signatures: {{list}}.
    - Frozen files (completed phases — do not touch): {{list or "check
      git log for phase( commits"}}.

    ## Acceptance criteria
    1. {{behavior lock command}} passes BEFORE your first edit (record it) and
       AFTER your last edit — identical scope, exit 0.
    2. {{structural goal check — e.g. "`madge --circular src/` reports 0"}}
    3. No public signature changed: {{how to check}}.
    4. Diff contains only moves/renames/extractions — no logic edits, no
       formatting sweeps of untouched lines.

    ## Report format
    Verdict → before/after evidence for criterion 1 (both runs, exit codes) →
    mapping table `old location → new location` → receipts → anything that
    smelled like a behavior bug (report, do NOT fix — one line each).

## T4 — Code & Security Review (tier: TOP, ALWAYS fresh context — never the author)

    ## Goal & why
    Review {{diff / branch / PR / worktree path}} implementing {{one-line
    summary}}. Your verdict gates {{merge / release / handoff}} — be adversarial;
    finding nothing is a claim you must defend with coverage.

    ## Context you must know (you start cold — deliberately)
    You receive ONLY: the acceptance criteria below and the code location.
    The author's reasoning is withheld on purpose (verify-not-self,
    `02_orchestration.md` §6).
    - Acceptance criteria of the original task: {{paste them}}
    - Run instructions: {{build/test/entry-point commands}}

    ## Acceptance criteria (of the REVIEW itself)
    1. You RAN the code: tests + the real entry point; outputs + exit codes in
       the report. A review without execution is an opinion, not a review.
    2. Receipts re-generated for claimed deliverables; sha compared against the
       author's claim — mismatch = incident, report immediately.
    3. Correctness: each task criterion re-verified independently, pass/fail.
    4. Security sweep on the diff: hardcoded secrets/keys/tokens (grep), input
       validation at trust boundaries, injection into shell/SQL/eval, unsafe
       deserialization, path traversal, new deps pinned + necessary.
    5. Scope: every changed line traces to the task; flag drive-bys.
    6. Each finding: `path:line`, severity (blocker / should-fix / nit), and a
       checkable claim — no vibes.

    ## Report format
    Verdict (mergeable: yes / no / yes-with-should-fixes + the one decisive
    fact) → findings by severity → what you executed (commands + exit codes) →
    coverage statement (what you did NOT check) → open questions for the author.
