# Delegation Templates

Fill-in-the-blank prompts for dispatching subagents. Pick the file matching the task
type, replace every `{{...}}` placeholder, delete any section marked *(optional)*
that you don't need, and send the result as the subagent's prompt.

Rules that apply to all templates (from `../rules/model-dispatch.md`):

- All three parts of the delegation triple must survive your edits: **Goal & why**,
  **Acceptance criteria**, **Report format**. Never delete those sections.
- Choose tier per the task table in model-dispatch.md §2; state model + effort when
  the environment supports it.
- The subagent starts with zero context. Anything it needs (paths, constraints,
  prior decisions) must be written into the prompt — "as discussed" means nothing
  to it.

| Task type | File | Default tier |
|-----------|------|--------------|
| Find things in a codebase | `delegate-search.md` | CHEAP |
| Build from a spec | `delegate-implement.md` | STANDARD |
| Restructure without behavior change | `delegate-refactor.md` | STANDARD |
| Investigate and recommend | `delegate-research.md` | STANDARD |
| Verify someone else's work | `delegate-review.md` | TOP, fresh context |

Non-delegation template: `decision-record.md` — the format for `docs/decisions/`
entries (routed from the core loop's Record step and `/retro`).
