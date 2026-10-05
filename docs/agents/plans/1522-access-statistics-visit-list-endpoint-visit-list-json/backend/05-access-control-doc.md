# Document access control

Update `docs/agents/access-control/staff-statistics.md`:
- Status note: add the Visit list tab's `visit-list.json` (#1522) to the list of live endpoints.
- "Who can" table: add the row "Raw visit list for the Visit list tab (`GET /staff/statistics/visit-list.json`) | **Staff-or-superuser**".
- Input validation: `invalid_sort` now applies to the `sort` param of `users.json` **and** `visit-list.json`.
- Data exposed: the Visit list tab exposes raw stored IPs, **statistics session ids** (new: other tabs only expose user ids) and user identities (id, username, display name, email). The session cookie token is never exposed.
- Endpoints: an entry for `visit-list.json` covering the shared filter params plus `sort` (`started_at` default, `last_seen`, `duration`, `hits`; always descending, ties by visit id descending), `page` / `per_page`, the plain-array response with pagination headers, the row keys, and the facts that it is not warmed by Navi and sets `X-Skip-Cache`.

## Files to Change
- `docs/agents/access-control/staff-statistics.md`: the status, table row, validation, data-exposed and endpoint entries.
