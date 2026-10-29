# Frontend Plan: Statistics bug: show the session tracking columns on the staff visits page (frontend)

Main plan: [plan.md](plan.md)

## Shared contracts

The API row (`GET /staff/statistics/visit-list.json`, #1713) carries `first_path`,
`last_path`, `session_first_path` (strings or `null`), `session_creation_reason` (raw value
or `null`) and `session_first_seen_logged` (`true` / `false` / `null`).

Translation keys under `staff_statistics_page.visit_list` (in `frontend/assets/i18n/en/staff_statistics_page.yaml` and `pt/`):

| Key | `en` |
|-----|------|
| `paths` | Paths |
| `session` | Session |
| `first_path` | First |
| `last_path` | Last |
| `session_first_path` | First path |
| `creation_reason` | Reason |
| `first_seen_logged` | Logged in at creation |
| `yes` | yes |
| `no` | no |
| `unknown` | unknown |
| `creation_reasons.no_cookie` | No cookie |
| `creation_reasons.invalid_cookie` | Invalid cookie |
| `creation_reasons.cookie_session_not_found` | Cookie session not found |
| `creation_reasons.domain_changed` | Domain changed |
| `creation_reasons.ip_changed` | IP changed |
| `creation_reasons.login_rotation` | Login rotation |

The frontend looks reasons up as `creation_reasons.<raw value>` and falls back to the raw value
for an unknown one; the translator must keep the `creation_reasons` keys equal to the six raw
values.

## Steps

- [01 — Map the tracking fields](frontend/01-map-tracking-fields.md)
- [02 — Paths and Session columns](frontend/02-paths-and-session-columns.md)
- [03 — Docs](frontend/03-docs.md)

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe npm run lint` and
  `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`)
- docs: `docker-compose run --rm markdownlint` (CI job: `markdownlint`)

## Notes

- `null` means "unknown" (rows from before the tracking columns) and must never render as
  "no": do not wrap `session_first_seen_logged` in `Boolean()`.
- Existing columns, sorting, links and the `—` placeholder of the other columns stay unchanged;
  the new columns are not sortable (not in `VISIT_LIST_COLUMNS` sort keys).
- Spec data uses fake values only (the repo is public): no real IPs, user ids or session ids.
- Coordinate with the translator's keys (shared contract); `check_i18n` must pass.
