# Issue: Infra: extension unit test suite + crawler_extension_tests CircleCI job

## Description

Part of #1291 ("Interactive per-collection Enqueue interface for the
Lootstudios crawler (Navi extension)"). #1293 scaffolded
`crawler/navi-extension/`, #1295 added the backend enqueue route, #1296 added
the frontend Enqueue page, and #1298 added the derived `darthjee/navi-hey`
image plus the `crawler/navi-extension/docker-compose.yml` `extension_tests`
service — all already merged. As part of that work, the backend and frontend
Jasmine specs already exist:
`crawler/navi-extension/tests/backend/{hello,enqueue}_spec.js` and
`crawler/navi-extension/tests/frontend/{hello_page,enqueue_page}_spec.jsx`.

What remains for this issue is wiring a **`crawler_extension_tests`**
CircleCI job that actually runs that suite in CI, modeled on the existing
**`proxy_extension_tests`** job (the repo's precedent for a
non-backend/non-frontend "extension tests" job).

## Solution

- Add a `crawler_extension_tests` job to `.circleci/config.yml`'s `jobs:`
  section, modeled on `proxy_extension_tests` but running, from inside
  `crawler/navi-extension/`, against the already-committed
  `docker-compose.yml` (`darthjee/navi-hey-test:${NAVI_TAG}`, with `NAVI_TAG`
  pinned in the checked-in `.env`):
  - `docker compose run --rm extension_tests lint` (style check), then
  - `docker compose run --rm extension_tests` (the full backend + frontend
    Jasmine suite, i.e. the default/`all` subcommand) — actually exercising
    the existing specs on every PR, not just linting them.

  Because this needs a real docker daemon for `docker compose` — unlike
  `proxy_extension_tests`'s plain `docker:` executor — it needs
  `machine: true`, the same executor `release-image` / `build-and-release`
  already use for docker operations.
- Add it to the `test` workflow and to the same downstream `requires:` gates
  `proxy_extension_tests` feeds (`coverage-final` is the one exception —
  precedent already omits `proxy_extension_tests` from it, so
  `crawler_extension_tests` should follow suit).
- The job must not run the crawler itself and must not build or publish the
  derived image (`dockerfiles/navi_hey_loot_enqueue/Dockerfile`).

## Files

- `.circleci/config.yml`

## Owner / dependencies

- Owner: **infra** (the CircleCI job). The Jasmine suite content itself is
  already merged (#1293/#1295/#1296), so **crawler** involvement should only
  be needed if new coverage gaps turn up during review.
- Depends on: #1293, #1295, #1296, #1298 (all already merged). Blocks:
  nothing (#1300's docs/spec retirement mentions this issue but doesn't
  block on it).

**Done when:** `crawler_extension_tests` is green on the PR and wired into
the same `requires:` gates as `proxy_extension_tests`; it neither runs the
crawler nor builds the image.
