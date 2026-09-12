# Infra Plan: Infra: extension unit test suite + crawler_extension_tests CircleCI job

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Add the `crawler_extension_tests` job

In `.circleci/config.yml`'s `jobs:` section, add a `crawler_extension_tests`
job modeled on `proxy_extension_tests` (the existing "extension tests"
precedent), but for the navi-extension's own Jasmine suite instead of PHP:

- `machine: true` — needed because the job runs `docker compose` directly
  (`proxy_extension_tests` gets away with a plain `docker:` executor because
  it only runs `phpunit`/`phpcs` inside one already-pulled image; this job
  needs a real docker daemon to run `docker compose run`, the same reason
  `release-image` and `build-and-release` use `machine: true`).
- `checkout`, then run from inside `crawler/navi-extension/` (either
  `working_directory: ~/project/crawler/navi-extension` with
  `checkout: {path: ~/project}`, mirroring `pytest_views_characters`'s
  pattern, or a plain `checkout` + `cd crawler/navi-extension` inside the
  `run` steps — either works under `machine: true`).
- Two `run` steps, both via `docker compose run --rm extension_tests`
  against the already-committed `crawler/navi-extension/docker-compose.yml`
  (`darthjee/navi-hey-test:${NAVI_TAG}`, `NAVI_TAG` read from the
  checked-in `crawler/navi-extension/.env` — `docker compose` loads it
  automatically, no extra wiring needed):
  1. `docker compose run --rm extension_tests lint`
  2. `docker compose run --rm extension_tests` (no subcommand — the
     default/`all` run: the full backend + frontend Jasmine suite)
- Do **not** add a step that builds or publishes the derived image
  (`dockerfiles/navi_hey_loot_enqueue/Dockerfile`) and do **not** start
  `crawler_navi_web` or anything from the root `docker-compose.yml` — this
  job only exercises the extension's own test image.

### Step 2 — Wire the job into the `test` workflow and its `requires:` gates

In the `workflows.test.jobs` list:

- Add `- crawler_extension_tests:` with `filters: *all_tags` (same shape as
  `proxy_extension_tests`'s entry at line 26 — no `requires:` of its own,
  since it depends on `darthjee/navi-hey-test` directly, not on any
  `release-*_majora-base` image).
- Append `crawler_extension_tests` to the `requires:` list of every job that
  currently requires `proxy_extension_tests`, right after it, so a failing
  extension suite blocks the same downstream jobs `proxy_extension_tests`
  already blocks:
  - `build-and-release` (line 70)
  - `upload_proxy_files` (line 77)
  - `upload_fe_files` (line 80)
  - `link_photos` (line 83)
  - `link_files` (line 86)
  - `link_domain` (line 89)
  - `upload_admin_assets` (line 92)
  - `wake-navi` (line 124)
- Do **not** add it to `coverage-final`'s `requires:` — precedent already
  omits `proxy_extension_tests` from that list (it only aggregates
  pytest/jasmine lcov reports), so `crawler_extension_tests` should follow
  suit.

(Line numbers above are from the pre-change file and are a reading aid, not
a literal patch target — re-locate each `requires:` line by job name before
editing, since earlier edits in this same file shift them.)

## Files to Change

- `.circleci/config.yml` — add the `crawler_extension_tests` job definition
  (Step 1) and wire it into the `test` workflow + `requires:` gates (Step 2).

## CI Checks

- `crawler/navi-extension`: `docker compose run --rm extension_tests lint`
  and `docker compose run --rm extension_tests` (= `yarn test`), run locally
  from inside `crawler/navi-extension/`, are the exact commands the new
  `crawler_extension_tests` job runs — use them to verify the job's steps
  work before pushing, since there is no local CircleCI-config linter in
  this repo.

## Notes

- The Jasmine suite content itself (`tests/backend/{hello,enqueue}_spec.js`,
  `tests/frontend/{hello_page,enqueue_page}_spec.jsx`) and the
  `docker-compose.yml` `extension_tests` service already exist and are
  already merged (#1293/#1295/#1296/#1298) — nothing to add there for this
  issue.
- `NAVI_TAG` (currently `1.11.1`) is single-sourced from
  `crawler/navi-extension/.env`; no CI-side pinning is needed beyond letting
  `docker compose` read that file as usual.
