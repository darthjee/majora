# Post-fix check write-up and PR

Add a *Post-fix check* section to `findings.md`, after *Fix*: the local result table (scenario,
hypothesis, result), the production date range and aggregate counts from step 02, and a
conclusion stating whether the pattern is gone.

- **Gone:** say so, and that #1739 step 2 (removing the `Domain` record) and the cleanup (#1742)
  can start.
- **Not gone:** stop and discuss with the owner; document the remaining cause in the section and
  create a follow-up issue (spawned from #1741); the cleanup does not start.

Show the owner the section before opening the PR; the PR waits for the owner's review.

## Files to Change

- `docs/agents/specs/statistics-bug/findings.md` — new *Post-fix check* section.
