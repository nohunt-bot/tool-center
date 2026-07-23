# Model Dispatch Rules

Read this before spawning any subagent. Applies to every environment this harness
is installed in (Claude Code, Codex, Hermes) via the tier table below.

## 1. The commander does not do grunt work

The main conversation is the commander. Its context is the scarcest resource in a
long task. The commander plans, dispatches, integrates, and decides. It does NOT:

- read more than ~3 files or ~500 lines directly
- scan or grep across a repo ("find all usages of X")
- fetch or browse web pages for research
- apply the same edit across many files
- run long exploratory command sequences

All of the above go to a subagent. Only conclusions, decisions, and `file:line`
references come back into the main conversation. If you catch yourself pasting file
contents into the main thread, stop and dispatch instead.

Exception: a task the commander can finish in ≤ 2 tool calls (one targeted read,
one edit) is cheaper done inline than delegated.

No-subagent environments: if the current environment cannot spawn subagents at
all, these rules still apply in spirit — work in explicit phases, write
intermediate findings to files instead of holding them in context, and hold your
own phase summaries to the report contract (§5). The tier table then governs
which model to recommend running, not what to dispatch.

## 2. Model tiers

Rules below reference tiers, not model names. Map tiers to this environment's
actual models here — and only here.

| Tier | Claude Code (verified 2026-07)                                  | Codex | Hermes |
|------|-----------------------------------------------------------------|-------|--------|
| CHEAP | `haiku` (claude-haiku-4-5)                                      | *fill after running the env's model-list command* | *fill from `~/.hermes/config.yaml`* |
| STANDARD | `sonnet` (claude-sonnet-5)                                      | *fill* | *fill* |
| TOP | `opus` (claude-opus-4-8); `fable` (claude-fable-5) if available | *fill* | *fill* |

Do not fill the blank cells from memory. Run the environment's own listing command,
verify the id works, then record it (this edit is self-serve per MAINTENANCE.md).

Effort (Claude Code): `low` / `medium` / `high`. Default `high` for TOP-tier
planning and review work, `medium` for STANDARD implementation, `low` only for
mechanical batch jobs.

### Default assignment by task type

| Task | Tier | Why |
|------|------|-----|
| File search, grep sweeps, "where is X defined" | CHEAP | Recall task, wrong answers are cheap to detect |
| Summarize docs/logs, extract structured data | CHEAP | |
| Implement from a precise spec, single component | STANDARD | |
| Batch-apply an already-proven pattern | CHEAP | Pattern was solved by a higher tier first (§4) |
| Research with judgment (compare libraries, read papers) | STANDARD | |
| Architecture, plan writing, ambiguous debugging | TOP | |
| Reviewing/judging other agents' output | TOP, fresh context | Verifier must outrank or equal the author |

## 3. Delegation triple — mandatory in every dispatch prompt

Every subagent prompt contains all three, explicitly labeled:

1. **Goal + why**: what to produce and what the result will be used for. The "why"
   lets the agent make sane micro-decisions without calling home.
2. **Acceptance criteria**: checkable conditions. "Tests in `tests/foo_test.py`
   pass", "every match includes file:line", "output file exists and is valid JSON".
   Not "do it well".
3. **Report format**: exactly what to send back (see §5) — and what NOT to send
   back (no file dumps).

A dispatch prompt missing any of the three is a bug. Fix the prompt, don't send it.
Use the fill-in templates in `templates/` — they encode this triple.

## 4. Escalation and de-escalation ladder

- **CHEAP tier fails once** on a subtask → re-dispatch to STANDARD immediately.
  Do not retry CHEAP with a reworded prompt.
- **STANDARD tier fails twice on the same subtask** → escalate to TOP, and include
  the full failure trail (both attempts' prompts, outputs, and error messages).
  Escalating without the trail wastes the expensive model's first turn.
- **Pattern solved at a high tier** (e.g., the correct transform for one file) →
  de-escalate: batch-apply the proven pattern via CHEAP tier across the remaining
  cases, with a spot-check verification on a sample.
- **Single-model environments** (every tier maps to the same model): the
  ladder collapses to the retry cap. One retry with the full failure trail
  in-prompt; a second failure on the same subtask counts as a TOP-tier
  failure — stop retrying and apply `rules/judgment.md` §4 (change approach
  or decompose further). "Escalate" never means a third run of the same
  prompt.
- **Hard cap: two retry rounds per subtask across all tiers.** After that, stop
  retrying — the task definition is probably wrong. Return to planning or apply
  the "wrong direction" rubric in `rules/judgment.md`.
- Tool-call-level circuit breaker (3 consecutive failures → TRIPWIRE, fail-soft)
  and per-tier strike rules: `pack/01_diagnostics.md` §3.2 and
  `pack/02_orchestration.md` §4 (canonical there).

## 5. Report contract (what subagents return)

Subagents return, in order:

1. **Verdict**: one line — done / partially done / failed, plus the single most
   important fact.
2. **Evidence**: acceptance criteria, one per line, each marked pass/fail with the
   proof (command run + exit status, or file:line).
3. **References**: `path/to/file:line` for everything mentioned. Never paste file
   bodies over ~20 lines into the report.
4. **Artifacts**: long output (reports, generated code, research notes) is written
   to a file; the report carries the path only.
5. **Open issues**: anything noticed but out of scope — one line each.

Reports contain the five sections and nothing else — unrequested extra
analysis is padding the commander pays for. The commander rejects reports
that violate this (ask the agent to re-report; do not paste-and-fix in the
main thread).

## 6. Verification is never self-verification

- The context that produced work does not certify it. Dispatch a **fresh-context**
  verifier that receives only: the acceptance criteria and where the work lives —
  not the author's reasoning.
- **Files/docs** → verifier reads the file back and checks each criterion against
  the actual content.
- **Code** → verifier runs the tests / build / the app itself. "It compiles" is
  evidence only if compiling was the criterion.
- **High-risk judgment calls** (architecture choice, destructive migration, public
  release) → either a second independent opinion (TOP tier), or generate 2–3
  candidate solutions and have a fresh TOP-tier judge pick (the
  orchestrator/implementer/code-judge pipeline in `agents/` implements this).
- Verifier findings go back to the **author's tier** for fixes; a failed
  verification counts as one failure in the §4 ladder.
- **No-subagent environments**: "fresh context" = a NEW session (or fully
  cleared context) whose prompt contains ONLY the acceptance criteria, the
  artifact paths, and the `scripts/receipt.sh` claims to re-check — never the
  author's reasoning. The task file carries the handoff
  (`rules/long-tasks.md` §2). Same-session self-review does not satisfy this
  section. (Approved 2026-07-04,
  `archive/proposals/20260704-cost-efficiency-actions.md` §2.)
