# Findings write-up and PR

**Exploitable check first.** If anything is exploitable (for example cookie or session leakage
through the cache, hypothesis 5), stop: tell the user in the chat and write nothing about it to a
file, commit, PR or issue. Continue with only what the user approves.

Fill `findings.md` (aggregated or anonymised evidence only, per `privacy.md`):

- **Root cause.**
- **Evidence per hypothesis:** each one *confirmed*, *ruled out* or *inconclusive*, with the
  code-review reasoning, the emulation scenario result and the production pattern (counts,
  shares, route patterns). An inconclusive one states the missing evidence.
- **Reproducing scenario:** the scenario name and how to run it, or the production-only note.
- **Proposed solution direction** and its trade-offs.
- **Regression test scenario** for the fix issue (#1705): the backend test to write, failing
  before the fix.

Update `investigation-plan.md`'s definition of done to allow *inconclusive* (with the missing
evidence stated) as long as the root cause is confirmed and reproduced.

Before opening the PR, show the user the diff of anything leaving the machine, then open it with
an aggregated summary only. No `shipit`: the PR waits for the user's review.

## Files to Change

- `docs/agents/specs/statistics-bug/findings.md` — the write-up.
- `docs/agents/specs/statistics-bug/investigation-plan.md` — definition of done allows
  *inconclusive*.
