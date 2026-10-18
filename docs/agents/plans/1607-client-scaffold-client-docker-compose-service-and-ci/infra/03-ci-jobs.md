# Add the client CI jobs and gating

Add two jobs under `jobs:`, both on `darthjee/circleci_node:0.2.1` (like `jasmine` and
`frontend-checks`):

- `client_tests`: `checkout`, then in `client/`: `yarn install --frozen-lockfile`, `yarn coverage`,
  then a partial Codacy upload of `client/coverage/lcov.info`
  (`bash <(curl -Ls https://coverage.codacy.com/get.sh) report --partial -r <lcov>`).
  Codacy needs file paths relative to the repository root, while c8 writes paths relative to
  `client/`. Make the uploaded report resolve to `client/src/...`: for example, run the upload from
  the repository root after rewriting relative `SF:` lines with
  `sed -i 's#^SF:\(src/\)#SF:client/\1#' client/coverage/lcov.info`. Check the actual `SF:` lines
  that c8 produces (relative vs absolute) and adapt the rewrite.
- `client_checks`: `checkout`, then in `client/`: `yarn install --frozen-lockfile`, `yarn lint`,
  `npm pack --dry-run`.

Run the steps in `client/` either with `working_directory` on the job (checkout with
`path: ~/project`, as `crawler_extension_tests` does) or with `cd client &&` in each command,
whichever keeps the Codacy upload step simplest.

In `workflows.test.jobs`:

- Add `client_tests` and `client_checks` with `filters: *all_tags` and no `requires` (they do not
  depend on the base-image release jobs). Place them next to `crawler_extension_tests`.
- Add both to the `requires` list of every app release job that currently lists
  `crawler_extension_tests`: `build-and-release`, `upload_proxy_files`, `upload_fe_files`,
  `link_photos`, `link_files`, `link_domain`, `upload_admin_assets` and `wake-navi`.
- Add `client_tests` to `coverage-final`'s `requires`.

## Files to Change

- `.circleci/config.yml` — the two jobs, the workflow entries and the `requires` lists
