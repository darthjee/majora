# Backend Plan: Statistics bug: statistics:read scope and staff export endpoint (backend)

Main plan: [plan.md](plan.md)

## Overview

Backend-only change implementing the `statistics:read` scope and the
`GET staff/statistics/export.json` endpoint from
`docs/agents/specs/statistics-bug/export-endpoint.md`. Reviews: `cache` (`X-Skip-Cache`, no
Navi entry), `data-access` and `security` (access matrix, payload fields).

## Context

- `backend/accounts/scopes.py` builds `SCOPES` as `FAMILIES × (read, write)`; it needs per-family
  actions so `statistics` offers `read` only.
- `backend/accounts/authentication.py` refuses every scoped token on `EXCLUDED_ROUTE_PREFIXES`
  (`account/`, `users/`, `staff/`, `admin/`) before reading `@token_scopes`.
- `require_staff` (`backend/games/views/common.py`) returns 401 / 403 `not_allowed` through
  `AdminOrStaffCache`.
- The other statistics views (`backend/staff/views/staff_statistics_*.py`) use `@restricted`,
  `require_staff`, `StatisticsParamsParser` and `paginated_list_response`.
- `backend/statistics/models.py`: `Session` (`token`, `user`, `ip`, `domain`, `created_at`,
  `last_seen_at`) and `Visit` (`session`, `started_at`, `last_seen_at`, `hits`).
- Device authorization issuing scoped tokens is **out of scope** (#1708).

## Steps

- [01 — Read-only statistics scope](backend/01-statistics-scope.md)
- [02 — Staff-only granting](backend/02-staff-only-granting.md)
- [03 — Exact-route carve-out](backend/03-route-carve-out.md)
- [04 — Export endpoint](backend/04-export-endpoint.md)
- [05 — Middleware exemption and caching](backend/05-tracking-and-caching.md)
- [06 — Documentation](backend/06-docs.md)

## CI Checks

- `backend`: `pytest` and the lint checks, run inside the container (`make tests`, then
  `pytest` / `flake8`) (CI jobs: `pytest_views_characters`, `pytest_views_rest`, `pytest_all`,
  `checks`)
- docs: `yarn lint_md` (CI job: `markdownlint`)

## Notes

- The carve-out must be an exact route match, never a prefix: every other `staff/*` route,
  including the other statistics routes and the `DELETE staff/statistics.json` clear, keeps
  refusing scoped tokens with `token_not_allowed`.
- Staff status is re-checked on every request through `require_staff`, so a demoted owner gets
  `403` `not_allowed` even though the scope remains on the token.
- The repo is public: tests and docs use documentation-only IPs (RFC 5737) and made-up ids.
- If the implementation deviates from the spec, update
  `docs/agents/specs/statistics-bug/export-endpoint.md` in the same PR.
