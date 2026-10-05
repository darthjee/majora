# Access-control and spec docs

Document the new endpoint in `docs/agents/access-control/staff-statistics.md`:
- add `domains/summary.json` (#1516) to the **Status** note's list of live endpoints;
- add a row to the "Action / Who can" table: "Per-domain comparison for the Domains tab (`GET /staff/statistics/domains/summary.json`) | **Staff-or-superuser**";
- add an **Endpoints** bullet like the `duration.json` one: shared filter params (granularity accepted and ignored), not paginated; returns `{"filters": {...}, "domains": [{"id", "domain", "group", "visits", "anonymous", "logged_in", "unique_visitors", "average_duration_seconds", "median_duration_seconds"}], "totals": {same six metric keys}}`; every configured domain zero-filled plus the "unknown" row; totals over all visits, not summed from rows. It exposes domain hostnames and group names (already staff-visible through `domains.json`) and aggregated values only: no user identities and no IPs.

In `docs/agents/specs/access-statistics/domains.md`, update the status line only if the other tab specs mark implemented backends the same way (follow existing convention; otherwise leave it).

Keep lines within the markdownlint limits used by the surrounding text.

## Files to Change
- `docs/agents/access-control/staff-statistics.md` — status note, table row, endpoint bullet.
- `docs/agents/specs/access-statistics/domains.md` — status, only if consistent with the other tab specs.
