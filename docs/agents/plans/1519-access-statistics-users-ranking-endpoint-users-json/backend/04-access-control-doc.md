# Access-control doc row

Add a `GET /staff/statistics/users.json` bullet to the "Endpoints" list of
`docs/agents/access-control/staff-statistics.md`, after `duration.json`, in the same style:

- It is a paginated plain array (headers `page` / `pages` / `per_page` / `total`, `per_page ≤ 100`)
  of logged-in users with visits started in the range.
- It takes the shared filter params (`granularity` validated but ignored) plus `sort` (`visits`,
  `time_on_site`, `average_duration`, `hits`, `last_seen`), with the new `invalid_sort` code.
  Also add `invalid_sort` to the error-code list above, noting that it is specific to this endpoint.
- List the row keys.
- Unlike the other statistics endpoints, it **exposes user identities** (id, username, display
  name, email) to staff, as `staff/users.json` already does. Also update the "Data exposed"
  paragraph's "user identities (id, username)" to mention display name and email for this tab.
- No IPs.

## Files to Change
- `docs/agents/access-control/staff-statistics.md` — endpoint bullet, the `invalid_sort` code and the "Data exposed" wording.
