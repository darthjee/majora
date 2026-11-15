# Write the hub and register it

Create `docs/agents/specs/pytest-all-long-test.md`, modelled on `docs/agents/specs/statistics-bug.md`:

- Title "Backend Tests Speed", one paragraph saying these are the specs for Epic #1785: the backend pytest suite is slow, CI's critical path is `pytest_all` at 8m 34s, and the goal is both CI and local speed, CI first.
- **Aspect pages:** a bullet list linking the seven pages with a one-line summary each: `baseline.md`, `cost-drivers.md`, `isolation-policy.md`, `edge-cases.md`, `conversions.md`, `verification.md`, `ci-jobs.md`.
- **Sub-issues:** a table with columns Issue, Title, Agent, Depends on, Page(s), listing #1786 to #1795 with the titles, agents and dependencies from #1785's sub-issue table, and the pages each one updates (see the page table in #1786). Note that the module conversion sub-issues are added to this table once #1787 names the slow modules, and that `pytest-xdist` is a possible follow-up, not created.
- **Sequencing:** #1786 first; #1787 then #1788; #1789, #1791, #1792 and #1794 in parallel; #1790 and #1793 after #1789; module conversions before #1795; #1795 last.
- **Definition of done:** the Expected Behavior list of #1785 (CI and local times measurably lower than `baseline.md`, durations report published, balanced jobs, policy in `docs/agents/testing.md`, every transactional test justified, no forbidden fixture scopes, no manual cache clears, `TokenFactory` used, history off in tests, `make tests-fast`, specs removed).
- **Lifecycle:** during the Epic, a sub-issue that deviates from these pages updates them in the same PR. Removal by #1795: move the policy to `docs/agents/testing.md`, repoint the backend agent instructions (the one temporary exception to "permanent docs do not link into the spec"), unregister from `docs/agents/specs.md`, delete the hub and folder.

Then add `- [Backend Tests Speed](specs/pytest-all-long-test.md)` (same label as the hub title) to "Active specs" in `docs/agents/specs.md`.

## Files to Change

- `docs/agents/specs/pytest-all-long-test.md` — new hub page.
- `docs/agents/specs.md` — register the hub under "Active specs".
