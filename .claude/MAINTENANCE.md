# Maintenance Protocol

How future sessions (of any model tier) update this harness without degrading it.
Read this whole file before editing anything in this repo.

## Prime directives

1. **Never grow the always-loaded footprint silently.** `CLAUDE.md` stays < 3 KB.
   Adding a rule there requires removing or merging one. Everything else must be
   reachable by routing, not resident.
2. **One rule, one home.** Before adding a rule, grep the repo for the same topic.
   If it exists, edit that file; never restate a rule in a second file — link to it.
3. **No dead references.** Any file you save must only mention agents, skills,
   commands, and paths that actually exist. After editing, verify every reference
   (`ls` the path, check the agent file exists). This is how the old setup rotted
   — see `docs/DIAGNOSIS.md` focus-loss #1.
4. **Backup before rewrite.** Rewriting an existing file: first copy it to
   `backups/<name>.<YYYYMMDD>` (gitignored) or rely on a clean git state (commit
   before and after). New content prefers new files.
5. **Commit every accepted change** with a message stating what changed and which
   failure/lesson motivated it — and push the same day. Other machines sync via
   git; unpushed commits are invisible to them (the SessionStart sentinel warns).

## What you may change without asking the user

- Append a lesson to `LESSONS.md` (format below).
- Fix factual rot: broken paths, renamed commands, dead links, typos.
- Fill verified facts into marked blanks (e.g. the Codex/Hermes tier cells in
  `model-dispatch.md` — only after running the environment's own listing command).
- Add a new delegation template for a task type not covered (must follow the
  triple structure).
- Tighten an example or add a missing positive/negative example to `judgment.md`.

## What requires the user's approval first

- Any edit to `CLAUDE.md` (the router) beyond fixing a broken link.
- Changing tier assignments, the escalation ladder, or the report contract in
  `model-dispatch.md`.
- Weakening any rubric in `judgment.md` (removing a checklist item, softening a
  criterion).
- Anything in the **Hard rules** section of `CLAUDE.md`, permissions/allowlists,
  hooks, or `install.sh`.
- Deleting any file, or restructuring directories.

If a needed change is on this list, write the proposal (diff + reason) into
`docs/proposals/<date>-<slug>.md` and tell the user — do not apply it.

## Lessons: where mistakes become rules

After any incident where the harness misled you, or you failed in a way a rule
could have prevented, append to `LESSONS.md`:

```
## YYYY-MM-DD — <one-line title>
- What happened: <2 lines max, concrete>
- Root cause: <the decision or missing rule, not the symptom>
- Rule change: <none | applied: <commit/file> | proposed: docs/proposals/...>
```

Every lesson must end in one of those three states. A lesson with "Rule change:
none" twice (same root cause recurring) MUST become an applied or proposed change
the second time.

## Compaction

When `LESSONS.md` exceeds **30 entries, ~200 lines, or ~5,000 tokens (≈20 KB)**:
consolidate. Merge lessons
sharing a root cause into one entry; lessons already promoted into rules get
deleted (the rule is their tombstone — link the commit). Target after compaction:
under 15 entries. Compaction is self-serve, but commit the pre-compaction state
first so nothing is lost.

Proposals have a lifecycle instead of compaction: `docs/proposals/` holds OPEN
proposals only. Once approved+applied (or rejected), move the file to
`archive/proposals/` and update every referrer — archive-only, never delete.

## Health check (run when asked to "audit the harness", or ~monthly)

1. `wc -c CLAUDE.md` — under 3072 bytes?
2. Grep all rules/templates for referenced paths and agent names — do they exist?
3. Do settings files contradict any rule (see DIAGNOSIS error #1)?
4. Any secrets in tracked files? (`git grep -iE 'bearer|api[_-]?key|token'` — review hits.)
5. LESSONS.md over the compaction threshold?
6. Are the tier-table blanks still blank in environments that are actually in use?

Report findings using the report contract in `rules/model-dispatch.md` §5.
