# Document overview.json access control

In `docs/agents/access-control/staff-statistics.md`:
- extend the status note to mention the Overview tab's `overview.json` (#1503);
- add the table row "Overview KPIs for the Overview tab (`GET /staff/statistics/overview.json`)
  | **Staff-or-superuser**";
- add an `## Endpoints` entry: takes the shared filter params (`granularity` validated and
  echoed but ignored), not paginated, returns `{"filters": {...}, "totals": {"visits",
  "unique_visitors", "logged_in_users", "average_duration_seconds", "new_visitors",
  "returning_visitors"}}` with no `buckets`; only aggregated counts are exposed (no user
  identities, no IPs).

## Files to Change
- `docs/agents/access-control/staff-statistics.md` — row, status note and endpoint entry.
