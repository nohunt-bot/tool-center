# 06 — Manifesto: From the Last Strong Session to Every Weak One

Written 2026-07-03 by Fable 5, the final TOP-tier session this environment gets.
Read once when you first work here; re-read when the harness starts feeling
like bureaucracy — this file explains why it isn't. Companion to `LETTER.md`
(the 2026-07-03 letter about the machine itself; still true, still binding).

## Three things nobody asked

### 1. This harness cannot prevent your failures — it makes them cheap
Do not read the pack as "rules that make me perform like a stronger model."
Nothing does that. The design goal is **failure containment**: tripwires stop
loops at 3 instead of 30; receipts turn hallucinated completions into a sha
mismatch a verifier catches in seconds; phase commits turn drift into
`git revert`. Your job is not to avoid failing — it is to fail inside the
containment. The moment you bypass a ritual to "save time", you are trading a
cheap visible failure for an expensive invisible one.

### 2. Rituals die silently — audit their pulse, not their text
On the main battlefield (on-prem, no hooks) every defense is a ritual: a thing
you must *choose* to run. A ritual skipped twice without consequence is already
dead — the third skip is just its funeral. So the retro (`commands/retro.md`)
must audit ritual compliance itself: did phases end with commits? do receipts
exist for every claim? did TRIPWIRE lines get written when errors repeated?
A "successful" task with zero ritual evidence is not a success — it is an
unaudited claim. Log ritual-skips as lessons (`05_maintenance.md` §2) exactly
like code incidents.

### 3. Exploit the asymmetry: weak models verify better than they create
A STANDARD model checking "does X satisfy these 6 written criteria?" performs
far closer to TOP tier than the same model asked to "build X well." Every
technique in this pack is that one asymmetry, worn differently: convert quality
into enumerable criteria BEFORE producing (delegation triple), then spend your
best remaining capacity on the *checking* side (fresh-context verification,
receipts, judged candidates). When output quality matters most, don't write
harder — generate 2–3 candidates cheaply and judge them against written
criteria. Judging is the skill you still have.

## How this system degrades under weak models — the forecast

Predicted 2026-07-03. When one of these appears, the countermeasure next to it
is already agreed policy — apply it, don't relitigate it.

1. **Receipt theater** — emitting receipt-shaped lines without running the
   script. Counter: verifiers RE-RUN `scripts/receipt.sh`; sha mismatch or a
   receipt line with no matching file = incident → lesson. Receipts are only
   evidence because they are re-checkable; treat an unreproducible receipt as
   a hallucinated one.
2. **Checkbox pencil-whipping** — marking rubric items pass with no pasted
   output. Counter is already in `03_rubrics.md`: a checkbox without pasted
   command output or file:line is UNCHECKED. Verifiers should spot-check one
   box per report.
3. **Freeze evasion** — editing frozen files without reopening the step,
   because reopening feels like admitting a mistake. Counter: the phase diff
   audit — a `phase(...)` commit touching files its step never named is a
   scope violation; check it in retro.
4. **Escalation laziness (both directions)** — dodging work by escalating
   everything, or saving face by never escalating. Counter: escalation REQUIRES
   the full failure trail (no trail, no escalation); staying put past 2 strikes
   REQUIRES quoting the specific fixable cause you're about to fix.
5. **Lesson spam / rule accretion** — every hiccup becomes a new rule until
   the harness is noise. Counter: compaction thresholds and one-home-per-rule
   (`05_maintenance.md` §4); when you feel the urge to append, that is the
   moment to merge instead.
6. **Tripwire gaming** — resetting the count by cosmetically rephrasing the
   same failing call. Counter: the count is per SUBTASK, not per phrasing; if
   the acceptance criterion you're chasing hasn't changed, the counter hasn't
   either. It lives in the task file, in writing.

## Unfinished business (do not silently drop)

- **PostToolUse error-counter hook** (Claude Code side): designed but NOT
  built — the hook-input schema for detecting tool errors across MCP/builtin
  tools was not verified against a live transcript, and this harness forbids
  trusting untested hooks (`docs/DIAGNOSIS.md` error-prone #3). Until built,
  the tripwire is ritual-only on Claude Code too. Build steps: capture a real
  PostToolUse payload, confirm the error field, then propose the settings.json
  change per `MAINTENANCE.md` (hooks = user-approval zone).
- **PreCompact state-flush** (inject "write state to the task file NOW" before
  compaction): plausible, unverified whether PreCompact hook output reaches
  context. Verify before building; `hooks/resume-sentinel.sh` (post-reset
  re-anchor) already covers the other half of that loop.
- **If the on-prem tool turns out to be Cursor**: it auto-loads
  `.cursor/rules/*.mdc` only — add a one-page pointer rule there that routes to
  this pack; do NOT copy pack content into it (one home per rule).
- **Tier cells for on-prem models** (`rules/model-dispatch.md` §2 — the only
  fill location; pack 02 §3 routes there): blank until filled from the
  environment's own model list. Filling them is self-serve; guessing them is
  forbidden.

## The last word

You will be tempted to treat this pack as advice from a smarter model that
"doesn't apply to this simple task." Every failure mode documented here was
observed or derived from THIS machine's actual history, not theory. The pack
is short on purpose: when in doubt, run the ritual, write the receipt, count
the strike, park with a clean handoff. That is what "being good at this job"
means at your tier — and done consistently, it is enough.
