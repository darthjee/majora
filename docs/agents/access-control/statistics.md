# Statistics (`statistics` app)

The `statistics` app records site access per visitor. It has two models:

- **`Session`** — the visitor (device/browser) identity, identified by a signed cookie
  token; carries `ip`, optional `user`, optional `domain`, `created_at`, a throttled
  `last_seen_at`, and the nullable tracking columns `first_path` (route pattern, never the
  raw path), `creation_reason` and `first_seen_logged`.
- **`Visit`** — a burst of activity under a `Session` (`started_at`, `last_seen_at`,
  exact `hits`, nullable route-pattern `first_path` / `last_path`), closed after an
  inactivity window. See the
  [access statistics data model](../statistics.md#data-model) for the design.

## Writes

Both models are written **only by `StatisticsSessionMiddleware`**
(`backend/statistics/middleware.py`, with `session_attachment.py` and `visit_tracking.py`),
on every request that reaches Django and does not carry a valid `X-Statistics-Skip-Secret`
header. No role can create, update or delete these rows through any endpoint. The tracking
columns (`first_path`, `creation_reason`, `first_seen_logged`, `last_path`) are not returned
by any serializer; only Django Admin (superuser, read-only) shows them.

## Reads

| Role | Access |
| --- | --- |
| Anonymous | none |
| Authenticated | none |
| Player | none |
| GameMaster | none |
| Staff | read-only: aggregated statistics plus raw per-visit rows (`visit-list.json`: raw IP, statistics session id, user identity; never `Session.token`) and raw session export (`export.json`: sessions with raw IP, domain, `user_id` and up to 100 visits each; never `Session.token`), through the staff statistics endpoints (see [Staff Statistics](staff-statistics.md)). `export.json` is the only one also reachable with a scoped API token carrying `statistics:read`, and only while the token owner is still staff (see [Export](staff-statistics.md#export)) |
| Superuser | read-only, through Django Admin |

**There are no write endpoints for `Session` or `Visit`.** The only serializers are the
read-only, staff-only `StaffStatisticsVisitSerializer` behind `visit-list.json` and
`StaffStatisticsExportSessionSerializer` / `StaffStatisticsExportVisitSerializer` behind
`export.json`. None of them reads `Session.token`. Nothing is exposed to players or DMs. The only client-visible artifact is the `HttpOnly` statistics cookie,
which carries the signed session token and nothing else.

Both models are registered in Django Admin with `ReadOnlyStatisticsAdmin`
(`backend/statistics/admin.py`): add, change and delete permissions are all denied, so the
collected data can be inspected but never hand-edited.

Endpoints surfacing this data (#1477's staff statistics page) are documented in
[Staff Statistics](staff-statistics.md); any other future endpoint needs its own
access-control entry.
