# Plan: Client: npm release job

Issue: [1611-client-npm-release-job.md](../../issues/1611-client-npm-release-job.md)

## Overview

Add the `client-release` CircleCI job (app tags only, full app gate), the
`scripts/release_client.sh` script that decides whether to publish and publishes, the
`scripts/bump_version.sh client X.Y.Z` form, and the release documentation.

## Context

- The design is settled in
  [`docs/agents/specs/client/packaging.md`](../../specs/client/packaging.md#release) (#1600).
  The issue body's original "publish when the version changes on `main`" was replaced by
  "release with the app, on its version tags".
- `client/package.json` already declares `name: majora-client`, `version: 0.1.0`, the `files`
  whitelist (`src/`, `bin/`, `README.md`), `bin` and `engines`. `client_checks` already runs
  `npm pack --dry-run`. The library (#1608) and CLI (#1610) are on `main`.
- App tags match `/\d+\.\d+\.\d+/` (`&tags_only` in `.circleci/config.yml`). Every app release
  job shares the same `requires` list.
- Agreed in the issue dialogue: the token lives in the `NPM_TOKEN` CircleCI project environment
  variable, and the human-facing release process goes in `docs/agents/contributing.md`.

## Steps

- [01 — Add the `client` form to `bump_version.sh`](infra/01-bump-version-client.md)
- [02 — Add `scripts/release_client.sh`](infra/02-release-client-script.md)
- [03 — Add the `client-release` CircleCI job](infra/03-client-release-job.md)
- [04 — Document the release process](infra/04-document-release.md)

## CI Checks

- `.circleci/`, `scripts/`: `client-release` runs only on tagged releases, so there is no local
  equivalent. Validate the YAML (for example by parsing it, or `circleci config validate` if
  available) and read the job definition. Run `bash -n scripts/release_client.sh` and
  `shellcheck` (if available) through docker-compose, never on the host runtime.
- `client/`: `make client-lint`, `make client-tests` (CI jobs: `client_checks`,
  `client_tests`). `client/` itself is not expected to change.
- `docs/`: markdownlint (CI job: `markdownlint`), through its docker-compose service/Makefile
  target.

## Notes

- The docs step (`docs/agents/contributing.md`) is architect territory, but it describes infra's
  release mechanics, so infra writes it as part of this plan.
- `npm view majora-client` returns `E404` until the first publish. Treat that as "no published
  versions", not as an error.
- `bump_version.sh` runs on the host (macOS) and uses BSD `sed -i ''`. The `client` form keeps
  that convention.
- Do not create any git tag for the client: the unanchored app tag filter would trigger a full
  app release.
- The first publish happens on the first app tag after this lands, with whatever version
  `client/package.json` holds (currently `0.1.0`). The `NPM_TOKEN` variable must exist in
  CircleCI before that tag. Call this out in the PR description, since it is a manual setup step
  for the repo owner.
