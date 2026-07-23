# 03 — Rubrics: High-Tier Judgment as Checkable Lists

Part of the weak-model pack. R1–R3 distill `rules/judgment.md` (**that file wins
on conflict**) with weak-model-calibrated thresholds; R4 is new and canonical
here (procedure: `01_diagnostics.md` §5). Rules of use: when one of these calls
comes up, open the section, walk the list, act on the result — never decide "by
feel". **A checkbox without pasted command output or a file:line is UNCHECKED.**

## R1 — "The direction is wrong": stop, don't retry harder

STOP the current approach if ANY box ticks:

- [ ] Whack-a-mole: each fix creates a new failure elsewhere, 3+ cycles.
- [ ] The diff keeps growing but the SAME acceptance criterion keeps failing.
- [ ] You are fighting the framework: disabling checks, monkey-patching
      internals, copying vendored code to force a fit.
- [ ] Attempt 3+ and elapsed effort ≥ ~2× the plan's estimate for this step.
- [ ] The approach now requires an assumption you have already seen evidence
      against (quote the evidence).
- [ ] A TRIPWIRE fired (`01_diagnostics.md` §3.2 — 3 consecutive failures).

On stop: write one line on WHY the route failed → return to the plan step →
pick a different route, or park per R3. Retrying the same approach is correct
ONLY when the last error names a specific fixable cause you haven't fixed yet.

- ✅ **Perfect positive**: "Reconnect test still fails after mocking 3 private
  methods of the ws lib (attempts logged, TRIPWIRE at 3). Route abandoned;
  switching to a real local server fixture. Task file updated, step reopened."
- ❌ **Typical negative**: first `npm test` run fails on the snapshot diff your
  own change caused — that is the approach WORKING. Update the snapshot;
  don't redesign the feature. (Signal vs noise: an *expected* failure named by
  your plan is not a wrong-direction signal.)

## R2 — "Truly done": the deliverable bar

Declare done ONLY when ALL boxes tick, each with evidence pasted in-turn:

- [ ] Every acceptance criterion has evidence: command + exit code, read-back,
      or test output. No criteria existed? That's the bug — write them first,
      then check.
- [ ] **Receipts** for every file created/modified in the claim
      (`scripts/receipt.sh`, same turn — `01_diagnostics.md` §3.1).
- [ ] Verification ran in a **fresh context**, not by the author
      (`02_orchestration.md` §6). Solo/no-subagent env: a separate phase that
      re-derives checks from the task file's Acceptance-criteria section, not
      from memory of writing.
- [ ] The change was exercised through its REAL entry point once (run the CLI,
      hit the endpoint, load the page). Unit tests alone don't count.
- [ ] Nothing touched is left broken: build passes, no orphaned imports/refs.
- [ ] Long task: the closing `phase(...)` commit exists (`01_diagnostics.md`
      §3.3) and the task file's progress log has the final line.

- ✅ **Perfect positive**: "Criteria 1–3 pass (pytest output pasted, exit 0).
  RECEIPT sha=ab12cd34ef56 bytes=2140 for docs/api.md. Fresh verifier re-ran
  receipt + tests: match. Ran `cli --export` once: output attached. Committed
  phase(api-docs): step 3."
- ❌ **Typical negative**: "I've implemented the function and it should handle
  all edge cases correctly." — "should" = unverified; author grading own work;
  no receipt; real entry point never run. This sentence pattern is itself a
  false-completion alarm (`01_diagnostics.md` §2, Scenario 3).

## R3 — Fuse to the user: when to stop autonomous work and ask (or park)

ASK (one batched message) when ANY box ticks:

- [ ] Destructive or hard-to-reverse action not explicitly requested (delete/
      overwrite data, force-push, drop tables, external messages, spend money).
- [ ] Two readings of the request diverge into materially different work and
      the wrong pick wastes > ~30 min.
- [ ] Scope would grow beyond the ask: new dependency, schema change, touching
      an unmentioned repo.
- [ ] Evidence contradicts the user's stated premise (they said bug in X;
      proof says Y, and fixing Y changes scope).
- [ ] Secrets, credentials, or payments beyond what's already authorized.
- [ ] Taste territory per R4 and options materially diverge.

Do NOT ask when the answer is discoverable in the repo/env, or it's a
reversible default any competent engineer would pick, or the user already
answered it this session. Never ask questions one at a time.

**Unattended (no user available)**: asking = PARK, not spin. Write state +
open question to the task file, mark the step `[!]`, end the turn with a
`WARNING:` banner listing exactly what input is needed. Fail-soft always —
parking with a clean handoff is success (`01_diagnostics.md` §3.2).

- ✅ **Perfect positive**: "Migration requires dropping `sessions` table — data
  loss wasn't approved. PARKED: state in docs/tasks/…, step 4 `[!]`,
  WARNING banner with the single yes/no question."
- ❌ **Typical negative**: asking "should the new Python module use
  snake_case?" — repo convention is visible in every existing file. Look,
  match, move on. (Asking discoverable questions is how weak models leak
  responsibility back to the user.)

## R4 — Taste territory: detect that no checklist can save you

You are in taste territory if ANY box ticks:

- [ ] Two options both pass every stated criterion, and choosing needs a value
      judgment (elegance, brand voice, "feels right", market bet).
- [ ] The ask contains unquantified quality words — "clean", "modern",
      "premium", "intuitive" — with no reference example to imitate.
- [ ] Visual/UX composition, naming for public APIs, or copywriting tone where
      the user gave no style anchor.
- [ ] An architecture bet whose payoff depends on unknowable future load/team/
      product direction.

Response procedure is canonical in `01_diagnostics.md` §5: produce 2–3 real
options + trade-offs; batch-ask if reachable; otherwise pick the most
reversible, tag `DECISION-PENDING(taste)`, keep moving. Weak models do not
resolve taste — they surface it.

- ✅ **Perfect positive**: "Landing page hero: 3 variants (dense/minimal/
  illustrated) with trade-offs; chose minimal as most reversible;
  DECISION-PENDING(taste) recorded in task file and final report."
- ❌ **Typical negative**: silently shipping the model's favorite variant and
  reporting "improved the design as requested" — confident mediocrity, the
  exact failure `01_diagnostics.md` §5 predicts; the pending marker is the
  only honest state.
