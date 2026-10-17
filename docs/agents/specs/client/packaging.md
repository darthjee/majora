# Packaging

How the `client/` folder is developed, tested and released. Part of the
[client spec](../client.md) (epic #1592). Refined by #1600 and implemented by #1607 (scaffold,
docker-compose service and CI) and #1611 (npm release job).

## Overview

The [library](library.md) and its [CLI](cli.md) are published to npm as one public package,
**`majora-client`**. Development follows the project rule that no runtime runs on the host:
everything goes through the `majora_client` docker-compose service. CircleCI runs lint and tests
on every push, and, for now, releases the client together with the app on its version tags.

## Decisions

### Package name

- The package is published as **`majora-client`** (unscoped), matching the owner's other npm
  packages (`navi-hey`, `navi-hey-client`, `deku-swarm`, ...).
- `majora` is already taken on npm; `majora-client` and `@darthjee/majora-client` were both free
  when checked (2026-10-17). The scoped name was rejected for consistency with the existing
  unscoped packages.
- The package is **public**.

### Development

The `majora_client` service in `docker-compose.yml` runs the client's tooling. No Node.js runtime
is needed on the host.

```yaml
  majora_client:
    image: darthjee/node:0.2.1
    container_name: majora_client
    working_dir: /home/node/app
    volumes:
      - ./client:/home/node/app
      - ./docker_volumes/client_node_modules:/home/node/app/node_modules
    environment:
      - MAJORA_URL=${MAJORA_URL:-http://majora_proxy}
      - MAJORA_TOKEN=$MAJORA_TOKEN
      - MAJORA_GAME=$MAJORA_GAME
```

- **Base image.** The service reuses **`darthjee/node:0.2.1`** (Node 22.21.1), the same base as
  the frontend image. The library needs Node 20 or later (native `fetch`, `AbortSignal.any`,
  `util.parseArgs`; see [library](library.md) and [CLI](cli.md)).
- **`image:` directly, no `build:` and no Dockerfile.** The client has no runtime dependencies, so
  a baked yarn-cache image (like `vite_majora`) is not worth maintaining. Dev dependencies land in
  the volume through `make client-install`. Nothing is added under `dockerfiles/`.
- **`node_modules` volume** at `docker_volumes/client_node_modules/`, following the
  `markdownlint_node_modules` pattern, and added to `.gitignore`.
- **yarn with a committed `client/yarn.lock`**, like the frontend. CI runs
  `yarn install --frozen-lockfile`. The release job still uses `npm publish` (registry tooling).
- **No `depends_on`.** Unit tests stub `fetch` and need no stack; `make client-tests` must not
  boot MySQL, the app and the proxy. The service shares the compose network, so `majora_proxy`
  resolves when the stack is up via `make dev-up`.
- **`MAJORA_*` environment wiring** is kept for manual smoke runs of the CLI against the local
  stack (`make dev-up`, then `make client` and `./bin/majora.js ... --allow-insecure-http`).
  `MAJORA_URL` defaults to `http://majora_proxy`; `MAJORA_TOKEN` and `MAJORA_GAME` come from the
  host environment or `.env` (a token created in the local app) and are never committed. They are
  inert when unset.
- **The HTTPS-only rule from [library](library.md) is not relaxed** for docker hostnames: local
  manual runs pass `--allow-insecure-http` explicitly.
- No `ports` and no `command`: `docker-compose run` always passes the command.

### Tooling

- **Jasmine** specs under `client/specs/` (as settled by [library](library.md) and
  [CLI](cli.md)).
- **c8** produces lcov coverage, uploaded to Codacy as a partial report.
- **ESLint 9 flat config** (`client/eslint.config.mjs`) mirroring the frontend's plugin set, minus
  the React-specific plugins (jsdoc, jasmine, security, security-node, complexity,
  no-unsanitized).
- These are dev dependencies only; the published package stays runtime-dependency-free.

### Makefile

One-shot targets plus a shell, so agents and contributors can run each check without an
interactive session, and each target maps onto a CI job. All run through the `majora_client`
service:

| Target | Command |
|---|---|
| `client` | `docker-compose run --rm majora_client /bin/bash` |
| `client-install` | `docker-compose run --rm majora_client yarn install` |
| `client-tests` | `docker-compose run --rm majora_client yarn test` |
| `client-lint` | `docker-compose run --rm majora_client yarn lint` |
| `client-coverage` | `docker-compose run --rm majora_client yarn coverage` |

- `client-install` is a separate target, needed once to populate the `node_modules` volume (and
  after dependency changes).
- No `client-release` target: publishing only happens in CI.
- The targets are added to `.PHONY` under a new `# ── Client ──` section.

### CI

- Two new jobs run on every push and tag (`filters: *all_tags`), in
  `darthjee/circleci_node:0.2.1` like `jasmine` and `frontend-checks`:
  - `client_tests`: `yarn install --frozen-lockfile`, Jasmine with c8, lcov uploaded to Codacy as
    a partial report.
  - `client_checks`: `yarn install --frozen-lockfile`, ESLint, and `npm pack --dry-run`, so
    packaging errors (bad `files`, missing `bin`) show up on every push rather than on a tag.
- **Full gate.** `client_tests` and `client_checks` join the shared `requires` list of **every
  app release job**, following the precedent of `crawler_extension_tests`. A tag ships everything
  or nothing.
- `coverage-final` requires `client_tests`, so the Codacy total includes the client.
- Neither client job depends on the base-image release jobs.
- Accepted cost: a broken client spec blocks an app deploy. It is mitigated by the client jobs
  running on every branch push, so a red client is visible well before tagging.

### Release

For now the client is released **together with the app**, on the app's version tags. This
replaces the earlier design (publish when the version changes on `main`, separate from the app's
release). A better flow may come later.

The `client-release` job, in the app's tag workflow:

- Runs on app version tags (`filters: *tags_only`) and `requires` the same full list as the app
  release jobs (app jobs plus `client_tests` and `client_checks`), so a client is never published
  on a tag whose app release is blocked.
- Finds the **previous app tag**: the highest `X.Y.Z` tag below the current one
  (`git tag --list --sort=-v:refname`, after an explicit `git fetch --tags`).
- Compares the `version` field of `client/package.json` at the current tag with the same field at
  the previous tag:
  - **Equal**: skip; the job passes as a no-op.
  - **Different**: `npm publish`.
  - **No previous tag, or no `client/package.json` at it** (first release after the client
    lands): publish.
- **Fails** if the version to publish already exists on npm, or is lower than npm's `latest`.
- **Recovery**: a failed publish is fixed by re-running the job on the same tag (the comparison
  against the previous tag is stable). Waiting for the next app release would lose the publish,
  since the versions would then compare equal.
- **No git tag is created for the client.** The app's tag filter `/\d+\.\d+\.\d+/` is unanchored,
  so a tag such as `client-v1.2.3` would trigger the full app release.
- **npm token**: an npm *automation* token (bypasses 2FA for CI), stored as a CircleCI project
  environment variable, never in the repository, and written to `~/.npmrc` only inside the
  release job. No `--provenance` (npm provenance does not support CircleCI as an identity
  provider).
- **Published contents**: `client/package.json` declares a `files` whitelist (`src/`, `bin/`,
  `README.md`), so specs, lint config and the lockfile are never published. No changelog file
  for now.

### Versioning

- `scripts/bump_version.sh client <X.Y.Z>` is a new form that updates only
  `client/package.json`'s `version`, with the same semver validation.
- `scripts/bump_version.sh [X.Y.Z]` keeps its current behaviour (README, `frontend/package.json`,
  `backend/pyproject.toml`) and never touches the client.
- The client's version is independent of the app's version.

### Implementation split

- **#1607**: the `client/` scaffold (`package.json`, ESLint and Jasmine config, `yarn.lock`), the
  `majora_client` service, the `.gitignore` entry, the Makefile targets, `client_tests` /
  `client_checks` and their gating.
- **#1611**: the `client-release` job and the `scripts/bump_version.sh client <X.Y.Z>` form.
- #1611 already comes after #1608 (core library), so no empty package is ever published. The
  first published version is whatever `client/package.json` holds when #1611 lands (e.g.
  `0.1.0`).

## Open questions

None remain: #1600 settled them all.

## Affected code

- `docker-compose.yml`: the new `majora_client` service.
- `.gitignore`: `docker_volumes/client_node_modules/`.
- `.circleci/config.yml`: the `client_tests`, `client_checks` and `client-release` jobs, and the
  `requires` lists of the app release jobs and `coverage-final`.
- `Makefile`: the `client*` targets under `# ── Client ──`.
- `scripts/bump_version.sh`: the `client <X.Y.Z>` form.
- `client/package.json`: the package name, version, `files`, `bin`, `engines` and scripts.
- `client/yarn.lock`: the committed lockfile.
- `client/eslint.config.mjs`: the ESLint flat config.
