# Access-control doc

Document the new endpoint in `docs/agents/access-control/staff-statistics.md`, like
`overview.json`.

- **Permissions table:** add a row "Visitors summary for the staff dashboard card
  (`GET /staff/statistics/summary.json`)" set to **Staff-or-superuser**.
- **Endpoint list:** add a **`GET /staff/statistics/summary.json`** entry. It says:
  - the endpoint takes only `period` (`day` | `week` | `month`, default `day`) and `tz`
    (default `UTC`), and other params are ignored;
  - it returns `{"period", "from", "to", "tz", "unique_visitors"}` for the rolling window;
  - it is not cached (`X-Skip-Cache`) and not in navi;
  - only an aggregated count is exposed: no user identities and no IPs.
- Keep lines within the markdownlint limits used by the rest of the file.

## Files to Change

- `docs/agents/access-control/staff-statistics.md` — the permissions row and the endpoint
  entry.
