# Access-control doc

Update `docs/agents/access-control/staff-statistics.md`. It currently says every staff
statistics endpoint is GET-only and that no role can write through them.

- Reword the intro: the endpoints are staff-only, and the read endpoints are GET-only. Add the
  one write: Clear.
- Add a table row: "Clear all visit statistics and reset IDs
  (`DELETE /staff/statistics.json`) | **Staff-or-superuser**".
- Note that Clear returns only row counts, is `@restricted` (`X-Skip-Cache`), is not warmed by
  Navi, and writes a server-log audit line (link to
  `docs/agents/specs/statistics_dashboard/clear-endpoint.md#audit-log`, or to its permanent home
  if the spec content is moved).

## Files to Change

- `docs/agents/access-control/staff-statistics.md`: document the Clear endpoint.
