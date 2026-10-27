# Plan: Statistics dashboard: write the specs

Issue: [1679-statistics-dashboard-write-the-specs.md](../../issues/1679-statistics-dashboard-write-the-specs.md)

## Overview

This issue is documentation only. It writes the `statistics_dashboard` spec for Epic #1678: an
index at `docs/agents/specs/statistics_dashboard.md`, four topic pages under
`docs/agents/specs/statistics_dashboard/`, and an entry under *Active specs* in
`docs/agents/specs.md`. It changes no code, tests, config or translations. Owner: `architect`
(cross-cutting docs; no specialist agent has work).

## Context

- The precedent is `docs/agents/specs/loot-crawling.md`: an index with `## Aspect pages`
  linking to the pages in `loot-crawling/`.
- The naming decided in the issue: underscore index and folder (`statistics_dashboard`) and
  kebab-case topic pages (`count-endpoint.md`, `clear-endpoint.md`, `tracking-race.md`,
  `dashboard-card.md`).
- Every topic page uses the common template, in this order: **Purpose · Contract · Behaviour ·
  Permissions & caching · Edge cases · Tests · Open questions · Implemented by**.
- The issue's *Contracts*, *Permissions*, *Edge cases*, *Performance and security* and
  *Documentation touch points* sections are the source of truth for the content. Copy them
  precisely, without re-deciding anything.
- Open questions are listed, not resolved: batching / concurrency / partial failure → #1680, and
  the audit log → #1681. If writing surfaces a new question, create a sub-issue of #1678 for it
  (`spawn_issue.sh … --as-subissue`), list it in the index's `## Open questions`, and mark the
  point as pending on the topic page.
- Code references the pages must cite (verified while planning):
  - `backend/staff/urls.py` (the `staff/statistics/*.json` routes)
  - `backend/staff/views/staff_statistics_overview.py` and `staff_cache_clear.py`
    (`require_staff` + `@restricted` + `AllowAny`)
  - `backend/statistics/models.py` (`Session`, `Visit`; index on `started_at`)
  - `backend/statistics/aggregation/visit_query.py` (`VisitQuery.visitor_key`) and
    `params_parser.py` (the `tz` default UTC / `invalid_timezone`; `{"errors": {field: [code]}}`)
  - `backend/statistics/middleware.py` (`_load_or_create_session`, `_session_from_cookie`,
    `_backfill_user`), `visit_tracking.py`, `session_attachment.py`
  - `backend/accounts/authentication.py` (`EXCLUDED_ROUTE_PREFIXES` includes `staff/`)
  - `frontend/assets/js/components/resources/staff_dashboard/pages/dashboardCardConfig.js`,
    `elements/MemoryCacheCard.jsx`, `elements/CardActions.jsx`
  - `frontend/assets/js/utils/requests/config/staffStatisticsConfig.js`,
    `utils/requests/RequestPermissionResolvers.js`, `utils/access/accessRouteConfig.js`
  - `docs/agents/access-control/staff-statistics.md` (currently says "read-only")

## Steps

- [01 — Write the index](plan/01-write-the-index.md)
- [02 — Write count-endpoint.md](plan/02-count-endpoint.md)
- [03 — Write clear-endpoint.md](plan/03-clear-endpoint.md)
- [04 — Write tracking-race.md](plan/04-tracking-race.md)
- [05 — Write dashboard-card.md](plan/05-dashboard-card.md)
- [06 — Register the spec and lint](plan/06-register-and-lint.md)

## CI Checks

- Markdown (all new/changed `.md`): `docker-compose run --rm markdownlint` (runs
  `yarn install && yarn lint_md`; CI job: `markdownlint`).

## Notes

- Do not edit `docs/agents/access-control/staff-statistics.md` here: #1682 and #1684 update it
  for their endpoints. The pages only mention that it must change.
- GitHub issue #1684's body still says the clear endpoint returns 204. The spec states
  `200 {"deleted_visits", "deleted_sessions"}` (the decision made in #1679), and the clear page
  should note that it supersedes #1684's earlier text.
- Keep lines wrapped the way the existing specs are, and follow `.markdownlint-cli2.jsonc`.
