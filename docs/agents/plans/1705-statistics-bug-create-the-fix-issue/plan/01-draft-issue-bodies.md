# Draft the Epic and sub-issue bodies

Write the bodies in a scratch location (not committed), following the issue file template used
in `docs/agents/issues/`. Run the privacy check on every body before step 02.

**Epic — "Statistics bug: fix"** (label `Epic`): root cause summary, links to `findings.md`
and the reproducing `emulate.py` scenario (`ip_change`), the owner's decisions (from the #1705
issue file), the ordered sub-issue table with responsible agents and dependencies, race 2a as
known and not addressed, and a reference to Epic #1696 and #1705.

**Sub-issues**, in order:

1. **Backend: session tracking fix** (backend; security and data-access review):
   unresolved routes create or touch no statistics session; a valid signed cookie from a
   different IP reuses its session and updates the IP, keeping the change visible; parallel
   authenticated requests with one anonymous cookie create at most one `login_rotation`
   session; explain the `login_mid_navigation` open point. Required regression tests failing
   before the fix (the three scenarios of `findings.md` *Regression test scenario*). Updates
   `docs/agents/statistics.md` with the new reuse rules.
2. **Proxy: custom handlers forward the signed client IP** (proxy): `BackendClient` sets
   `X-Forwarded-For` and `X-Proxy-Secret` like `SetClientIpMiddleware`, with proxy tests.
3. **Ops: stop exposing the direct host** (owner checklist, no code): remove or redirect the
   custom domain on the hosting, remove its `Domain` record, confirm the main site still works.
4. **Release: version bump** (infra), depends on 1 and 2.
5. **Post-fix check** (architect, interactive with the owner, like #1704): after 3 and 4 and
   about a week of fresh data, re-run `emulate.py` and `analyse-prod`, confirm the pattern is
   gone, record the result in `findings.md`. The owner approves and revokes the tokens.
6. **Cleanup** (backend, frontend, translator, infra; data-access and security review),
   after 5: follow the *Lifecycle* of `docs/agents/specs/statistics-bug.md` (move durable
   knowledge, unregister from `docs/agents/specs.md`, delete the specs and
   `investigations/statistics-bug/` with its CI and Codacy exclusions); remove the
   `statistics:read` scope (`backend/accounts/scopes.py`), the export endpoint
   (`backend/staff/views/staff_statistics_export.py` and its route/tests), the frontend scope
   wording and translations, and update the token-scopes docs. Existing tokens and pending
   authorization requests that carry the scope must keep working without it (strip or ignore
   it). The session tracking columns stay.
7. **Release: version bump** (infra), for the cleanup.

## Files to Change

- None in the repository (bodies are drafted in a scratch location).
