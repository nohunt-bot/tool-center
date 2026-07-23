# Template: Search / Locate

Tier: CHEAP. Escalate to STANDARD after one bad result (dispatch rules §4).

---

## Goal & why
Find {{what — e.g. "every place the retry timeout is read or set"}} in
{{repo/path}}. I need this because {{why — e.g. "I'm about to change the default
and must not miss a consumer"}}.

## Scope
- Search under: {{directories, or "entire repo"}}
- Include: {{file types / naming conventions to check, e.g. "*.ts, *.tsx, config files"}}
- Also check for: {{aliases, alternative spellings, indirect usage — e.g. "the env
  var RETRY_MS, the constant DEFAULT_RETRY"}}

## Acceptance criteria
1. Every match is listed as `path:line` with a one-line description of how it's used.
2. You searched for ALL the alternative names listed above, not just the first term.
3. You state the search commands you ran, so misses are diagnosable.
4. If you found zero matches for any term, you say so explicitly (silence ≠ none).
5. The verdict line's match/file counts equal what the table actually contains —
   recount the table before sending (verdict-line miscounts are a known failure).

## Report format
- Verdict line: "N matches across M files" (or "no matches — searched: [terms]").
- Table: `path:line | what it does there | category {{your categories, optional}}`.
- Search commands used.
- Do NOT paste file contents beyond the matching line ±2 lines of context.
- Return ONLY the sections above — no extra analysis, groupings, or
  recommendations beyond what the criteria ask for (padding costs the
  commander context).
