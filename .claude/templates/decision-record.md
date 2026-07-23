# Template: Decision Record

For any decision where a real alternative was rejected — architecture, library,
schema, approach. One decision, one file:
`docs/decisions/<YYYYMMDD>-<slug>.md` in the project the decision belongs to.
Keep it under a page: this is a record, not an essay. If no alternative was
ever on the table, there is nothing to record — don't manufacture ADRs for
forced moves.

---

# Decision: {{title — the choice itself, e.g. "X over Y for Z"}}

- Date: {{YYYY-MM-DD}}
- Task: {{task file / issue / PR this arose in}}
- Status: accepted {{| superseded by <file> — update this line when it happens}}

## Context
{{2–4 lines: the constraint or failure that forced a choice. Facts, not vibes.}}

## Decision
{{1–2 lines: what was chosen.}}

## Alternatives rejected
- {{option}} — {{the one reason it lost, one line}}
- {{option}} — {{...}}

## Consequences
- {{what gets easier / harder because of this}}
- Revisit when: {{concrete trigger — "if X exceeds N", "when Y ships Z"}}
