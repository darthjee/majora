# Add the `client-release` CircleCI job

Wire the script into `.circleci/config.yml`.

- **Job definition** (next to `client_tests` / `client_checks`):
  - `docker: - image: darthjee/circleci_node:0.2.1`
  - `checkout` (at `~/project`, matching the other client jobs' `checkout: path: ~/project`
    with `working_directory: ~/project/client`, or plain `checkout` with the default working
    directory; the script resolves the repo root itself).
  - `yarn install --frozen-lockfile` is not needed: `npm publish` packs the `files` whitelist
    and the package has no runtime dependencies.
  - One `run` step: `scripts/release_client.sh` (from the repo root).
- **Workflow entry** in `test`:
  - `client-release` with `filters: *tags_only`.
  - `requires`: the same full list as the app release jobs: `pytest_views_characters`,
    `pytest_views_rest`, `pytest_all`, `jasmine`, `frontend-checks`, `checks`,
    `proxy_extension_tests`, `crawler_extension_tests`, `client_tests`, `client_checks`,
    `markdownlint`.
  - Nothing else depends on `client-release`, so a client publish failure never blocks the app
    release or `warm-up-cache`.

## Files to Change

- `.circleci/config.yml` — the `client-release` job and its workflow entry.
