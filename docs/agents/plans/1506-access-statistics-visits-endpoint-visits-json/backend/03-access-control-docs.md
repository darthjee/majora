# Document the endpoint's access control

Update `docs/agents/access-control/staff-statistics.md`:

- add a row to the action table: "Visits over time for the Visits tab
  (`GET /staff/statistics/visits.json`)" → **Staff-or-superuser**;
- update the status note so it says `visits.json` (#1506) is live alongside `domains.json`;
- add an entry under `## Endpoints`: the shared filter params (no pagination), the response
  envelope with per-bucket and total `anonymous` / `logged_in` / `visits` counts; only aggregated
  counts are exposed (no user identities, no IPs).

Run `yarn lint_md` (or the repo's markdownlint command) on the changed file.

## Files to Change

- `docs/agents/access-control/staff-statistics.md` — table row, status note, endpoint entry.
