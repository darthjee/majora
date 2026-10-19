# Client Packaging

How `client/` is developed, tested and released. The `client` agent owns `client/`; the wiring
described here (docker-compose, Makefile, CI, scripts) belongs to `infra` (see
[Client Agent](../client.md#ownership-boundaries)).

## Package

- Published to npm as the public, unscoped package **`majora-client`**, matching the owner's
  other packages (`navi-hey`, `deku-swarm`, ...). The name `majora` was already taken.
- `client/package.json`: `"type": "module"`, `main` / `exports` → `src/index.js`,
  `bin: { "majora": "bin/majora.js" }`, `engines.node >= 20`, license MIT.
- A `files` whitelist (`src/`, `bin/`, `README.md`) keeps specs, lint config and the lockfile
  out of the published package. There is no changelog file.
- Scripts: `test` (Jasmine), `lint` / `lint_fix` (ESLint on `src`, `specs`, `bin`), `coverage`
  (c8 with text and lcov reporters, over `src/**/*.js`).

## Development

No Node.js runtime is needed on the host. The `majora_client` docker-compose service runs the
tooling:

- image `darthjee/node:0.2.1` (the frontend's base), used directly: no Dockerfile, since the
  client has no runtime dependencies;
- `./client` mounted on `/home/node/app`, and `node_modules` in the
  `docker_volumes/client_node_modules/` volume (git-ignored, with `client/node_modules/` and
  `client/coverage/`);
- yarn with a committed `client/yarn.lock`;
- no `depends_on`, `ports` or `command`: unit tests stub `fetch` and need no stack;
- `MAJORA_URL` (default `http://majora_proxy`), `MAJORA_TOKEN` and `MAJORA_GAME` are passed
  through for manual smoke runs against the local stack (`make dev-up`, then `make client` and
  `./bin/majora.js ... --allow-insecure-http`). They come from the host environment or `.env`
  and are never committed. The HTTPS-only rule is not relaxed for docker hostnames.

### Makefile

Under the `# ── Client ──` section, all through the `majora_client` service:

| Target | Command |
|---|---|
| `client` | `docker-compose run --rm majora_client /bin/bash` |
| `client-install` | `docker-compose run --rm majora_client yarn install` (once, and after dependency changes) |
| `client-tests` | `docker-compose run --rm majora_client yarn test` |
| `client-lint` | `docker-compose run --rm majora_client yarn lint` |
| `client-coverage` | `docker-compose run --rm majora_client yarn coverage` |

There is no release target: publishing only happens in CI.

### Tooling

- Jasmine specs under `client/specs/` (`specs/support/jasmine.json`, random order).
- c8 coverage, uploaded to Codacy as a partial report.
- ESLint 9 flat config (`client/eslint.config.mjs`) mirroring the frontend's plugins minus the
  React ones (jsdoc, jasmine, security, security-node, complexity, no-unsanitized).

## CI

All three jobs run in `darthjee/circleci_node:0.2.1`:

- **`client_tests`** (every push and tag): `yarn install --frozen-lockfile`, `yarn coverage`,
  rewrites the lcov `SF:` paths to `client/src/`, and uploads the partial report to Codacy.
  `coverage-final` requires it.
- **`client_checks`** (every push and tag): `yarn install --frozen-lockfile`, `yarn lint` and
  `npm pack --dry-run`, so packaging errors show up on every push rather than on a tag.
- **Full gate.** `client_tests` and `client_checks` are in the `requires` list of every app
  release job, so a tag ships everything or nothing. A broken client spec therefore blocks an
  app deploy; it shows up on branch pushes well before tagging.
- **`client-release`** runs on app version tags only (`/\d+\.\d+\.\d+/`), requires the common
  test and check jobs (including `client_tests` and `client_checks`), and calls
  `scripts/release_client.sh`. Nothing depends on it, so a failed publish never blocks the app
  release.

## Release

The client is released together with the app, on the app's version tags. The contributor
steps are in [Releasing the client](../contributing.md#releasing-the-client).

`scripts/release_client.sh`:

1. Requires `CIRCLE_TAG` to be an `X.Y.Z` tag, and fetches every tag.
2. Finds the previous app tag: the highest `X.Y.Z` tag strictly lower than the current one.
3. Compares `client/package.json`'s `version` at the current tag with the one at the previous
   tag. The same version is a no-op (the job passes). A different version, no previous tag or no
   `client/package.json` at it means publish.
4. Fails when that version already exists on npm, or is lower than npm's `latest`.
5. Fails when `NPM_TOKEN` is unset; otherwise writes it to `~/.npmrc` (under `umask 077`) and
   runs `npm publish --access public` in `client/`.

- `NPM_TOKEN` is an npm automation token stored as a CircleCI project environment variable,
  never in the repository. No `--provenance`: npm provenance does not support CircleCI.
- A failed publish is fixed by re-running the job on the same tag. Waiting for the next app
  tag would lose it, since the versions would then compare equal.
- No git tag is created for the client: the app's unanchored tag filter would match a tag such
  as `client-v1.2.3` and trigger a full app release.

## Versioning

- The client's version is independent of the app's.
- `scripts/bump_version.sh client X.Y.Z` validates the semver and updates only
  `client/package.json`'s `version`. The plain `scripts/bump_version.sh [X.Y.Z]` form never
  touches the client.
