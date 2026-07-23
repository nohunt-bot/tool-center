# Template: Research / Investigate

Tier: STANDARD (CHEAP for pure fact-collection with no judgment). Findings go to a
file; the conversation gets the recommendation only.

---

## Goal & why
Answer: {{the question, phrased so a yes/no/pick-one answer is possible — e.g.
"which of Playwright/Cypress fits our CI constraints better", not "look into
testing"}}. This decides {{what depends on the answer}}.

## Sources & method
- Start with: {{docs / repos / URLs / local code to inspect}}.
- Prefer primary sources (official docs, source code, changelogs) over blog posts.
- For every load-bearing claim, record where it came from (URL or file:line) and
  the version/date it applies to.

## Decision criteria *(what makes an answer "better" — fill honestly)*
1. {{e.g. "must run headless in GitHub Actions on macOS runners"}}
2. {{e.g. "team already knows TypeScript — JS-native preferred"}}
3. {{e.g. "maintenance: >1 release in the last 6 months"}}

## Acceptance criteria
1. Every option evaluated against every criterion above — no criterion skipped.
2. Each claim has a source; claims without sources are marked "unverified".
3. A single recommendation is made, with the strongest argument AGAINST it stated.
4. Full findings written to {{output file path}}.

## Report format
- Verdict: the recommendation in one sentence.
- Criteria table: option × criterion, pass/fail/partial.
- The strongest counter-argument and why it doesn't win.
- Path to the full findings file. Nothing else — no essay in the conversation.
