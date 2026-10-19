# Issue: Client: npm release job

## Description

Part of epic #1592 (Majora client for automations, with fine-grained API tokens). Publish the
`client/` package (`majora-client`) to npm from CircleCI, as settled by #1600 in
[`docs/agents/specs/client/packaging.md`](../specs/client/packaging.md#release).

The original idea, publishing whenever `client/package.json`'s version changes on `main`, was
replaced in #1600: for now the client is released **together with the app, on the app's version
tags**. Its prerequisites are already on `main`: the library (#1608), the CLI (#1610) and the
`client_tests` / `client_checks` jobs (#1607).

## Problem

The client has nothing to publish it. `client_checks` only runs `npm pack --dry-run`, and
`scripts/bump_version.sh` only knows the app's version (README, `frontend/package.json`,
`backend/pyproject.toml`), so the client version can't be bumped on its own.

## Expected Behavior

- When an app version tag (`X.Y.Z`) is pushed and every app gate passes, the `client-release` job
  publishes `majora-client` to npm if, and only if, `client/package.json`'s `version` changed
  since the previous app tag.
- When the version is unchanged, the job passes as a no-op.
- When the version already exists on npm, or is lower than npm's `latest`, the job fails.
- `scripts/bump_version.sh client X.Y.Z` bumps only the client version. The plain
  `scripts/bump_version.sh [X.Y.Z]` form keeps its current behaviour and never touches the client.
- The release process is documented.

## Solution

### `client-release` CircleCI job

- Added to the `test` workflow with `filters: *tags_only`. Its `requires` list is the same full
  gate as the app release jobs (`pytest_*`, `jasmine`, `frontend-checks`, `checks`,
  `proxy_extension_tests`, `crawler_extension_tests`, `client_tests`, `client_checks`,
  `markdownlint`), so it never publishes on a tag whose app release is blocked.
- Runs in `darthjee/circleci_node:0.2.1` with `working_directory: ~/project/client`, like the
  other client jobs.
- Steps:
  1. `git fetch --tags`, then find the previous app tag: the highest `X.Y.Z` tag below
     `$CIRCLE_TAG` (`git tag --list --sort=-v:refname`).
  2. Compare `version` in `client/package.json` at `$CIRCLE_TAG` with the same field at the
     previous tag. Equal: exit 0 (no-op). Different, no previous tag, or no
     `client/package.json` at the previous tag: publish.
  3. Fail if the version already exists on npm (`npm view majora-client@<v>`) or is lower than
     npm's `latest` (when a `latest` exists).
  4. Write the token to `~/.npmrc` inside the job only, then `npm publish --access public`.
- The decision logic lives in a script (e.g. `scripts/release_client.sh`) rather than inline
  YAML, so it can be read and reasoned about on its own.
- **npm token**: an npm *automation* token in the `NPM_TOKEN` CircleCI project environment
  variable, never in the repository. The job writes
  `//registry.npmjs.org/:_authToken=${NPM_TOKEN}` to `~/.npmrc`. No `--provenance` (npm provenance does not support CircleCI).
- **No git tag is created for the client**: the app's tag filter `/\d+\.\d+\.\d+/` is
  unanchored, so a tag such as `client-v1.2.3` would trigger the full app release.
- **Recovery**: a failed publish is fixed by re-running the job on the same tag. Waiting for the
  next app tag would lose the publish, since the versions would then compare equal.
- The first publish is whatever `client/package.json` holds on the first app tag after this
  lands (currently `0.1.0`).

### `scripts/bump_version.sh client <X.Y.Z>`

A new form that only updates `client/package.json`'s `version`, with the same semver validation
as the existing form. The client version is independent of the app version.

### Documentation

- Add a client release section to `docs/agents/contributing.md`: how to bump the client version
  (`scripts/bump_version.sh client X.Y.Z`), that publishing happens on the next app tag, what
  `client-release` does (comparison, skip, failure cases), the `NPM_TOKEN` setup and the re-run
  recovery.
- Add `client-release` to the `.circleci/` / `scripts/` row of the CI checks table in
  `docs/agents/contributing.md` (it runs only on tagged releases).
- Keep `docs/agents/specs/client/packaging.md` and `docs/agents/client.md` in sync, linking to
  the new contributing section.

### Owners

- `infra`: `.circleci/config.yml`, the release script, `scripts/bump_version.sh`.
- `architect`: `docs/agents/contributing.md` and the spec updates.

## Benefits

- `majora-client` reaches npm without manual publishing, behind the same gate as the app.
- A release is reproducible from the tag and recoverable by re-running the job.
- The npm token never leaves CircleCI.
