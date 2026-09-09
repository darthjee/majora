# Frontend Plan: /#/staff/crawler two-column debug page

Main plan: [plan.md](plan.md)

## Steps

- [01 — Route and access wiring](frontend/01-route-and-access-wiring.md)
- [02 — Crawler debug HTTP client](frontend/02-crawler-client.md)
- [03 — Page controller: drain-then-poll feed](frontend/03-staff-crawler-controller.md)
- [04 — Page layout: two-column components](frontend/04-page-layout-components.md)
- [05 — Translations (en/pt)](frontend/05-translations.md)
- [06 — Specs](frontend/06-specs.md)

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe yarn coverage` (CI job: `jasmine`)

## Notes

- The backend endpoint (`/staff/crawler.json`, issue #1273) is already merged
  (`backend/staff/views/staff_crawler.py`): `GET` returns a bare JSON array,
  oldest-first, capped at `PAGE_SIZE=50` rows, filtered to `id > last_id` when
  a `last_id` query param is given, `POST` unused by this page. Its view is
  wrapped in `@restricted`, which unconditionally sets `X-Skip-Cache: true` on
  the response — no frontend `skipCacheEndpoints`/`skipCachePrefixes`/
  `skipCacheSuffixes` config changes are needed for correct polling behavior.
- `enforce_retention_cap` caps stored rows at 200 — the drain phase will
  never need more than 4 pages (`200 / 50`) to reach "caught up" on a freshly
  loaded page.
- No existing generic polling utility fits here: `AuthorizationRequestPoller`
  (`frontend/assets/js/utils/polling/AuthorizationRequestPoller.js`) is
  hardcoded to `AuthClient`'s device-authorization polling and isn't worth
  generalizing for this one temporary debug page — implement the interval
  loop directly in the page controller instead (see step 03).
