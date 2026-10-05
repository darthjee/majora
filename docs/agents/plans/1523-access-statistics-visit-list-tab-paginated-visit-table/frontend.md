# Frontend Plan: Access statistics: Visit list tab (paginated visit table)

Main plan: [plan.md](plan.md)

## Shared contracts

Reads the `staff_statistics_page.visit_list.*` keys from [plan.md](plan.md#shared-contracts)
(added by the translator): `title`, `user`, `ip`, `domain`, `started_at`, `last_seen`,
`duration`, `hits`, `anonymous`, `unknown_domain`, `ongoing`, `profile`,
`sorted_descending`, `empty`, `load_error`.

API (already merged, #1522): `GET /staff/statistics/visit-list.json` returns a plain array of
`{ id, started_at, last_seen_at, duration_seconds, hits, ongoing, ip, domain: { id, domain }, session_id, user: { id, name, display_name, email } | null }`,
with `page` / `pages` / `per_page` / `total` headers. `sort` is one of `started_at` (default), `last_seen`, `duration` or `hits`.

## Steps

- [01 — Shared sort helper](frontend/01-shared-sort-helper.md)
- [02 — Request config and controller](frontend/02-request-config-and-controller.md)
- [03 — Visit list table](frontend/03-visit-list-table.md)
- [04 — Page helper, body and page](frontend/04-page-helper-body-and-page.md)
- [05 — Specs](frontend/05-specs.md)

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`) and `npm run lint` (CI job:
  `frontend-checks`), run through docker-compose / make as in `docs/agents/contributing.md`.

## Notes

- All paths below are relative to
  `frontend/assets/js/components/resources/staff_statistics/pages/` unless they start with `frontend/`.
- The spec's layering lists only page, controller and table. The issue decided to mirror the
  Users tab instead (Body element, page Helper, element Helper), so the Visit list matches the
  existing tabs.
- Rows are **not** clickable (unlike Users), so there is no `StatisticsVisitListTableController`.
- Sorting resets to page 1 because `sortHref` never carries `page`. A filter change already
  resets the page through the shell's filter bar.
