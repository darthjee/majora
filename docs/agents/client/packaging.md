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
  release. It publishes through npm trusted publishing (see [Release](#release)):
  - the image ships Node 22.14.0; a step before the publish prints the Node/npm versions and
    installs `npm@${NPM_PIN}` (`11.21.1`) globally only when the image's npm is below
    `NPM_MIN` (`11.5.1`, the first npm with trusted publishing);
  - the `circleci` CLI, which mints the OIDC token, is injected by CircleCI into the job
    container;
  - the job runs **without a `context:`**: the trusted publisher registered on npm matches the
    project/pipeline identity, and a context would change it (unless its id is also registered).

## Release

The client is released together with the app, on the app's version tags. The contributor
steps are in [Releasing the client](../contributing.md#releasing-the-client).

`scripts/release_client.sh`:

1. Requires `CIRCLE_TAG` to be an `X.Y.Z` tag, and fetches every tag.
2. Finds the previous app tag: the highest `X.Y.Z` tag strictly lower than the current one.
3. Compares `client/package.json`'s `version` at the current tag with the one at the previous
   tag. The same version is a no-op (the job passes). A different version, no previous tag or no
   `client/package.json` at it means publish.
4. **Preflight** (only once a publish is needed, so tags that don't bump the client stay green):
   fails when `NPM_TOKEN` or `NODE_AUTH_TOKEN` is set (publishing is OIDC-only), when Node is
   below 22.14.0 or npm below 11.5.1, or when the `circleci` CLI is not on `PATH`.
5. Exits 0 without publishing when that version is already on npm (npm versions are
   immutable, so re-runs are safe). Fails when it is lower than npm's `latest`.
6. Mints a short-lived OIDC token with the npm audience and exports it as `NPM_ID_TOKEN`, then
   runs a bare `npm publish` in `client/` (`access` and `tag` come from `publishConfig` in
   `client/package.json`):

   ```bash
   NPM_ID_TOKEN="$(circleci run oidc get --claims '{"aud": "npm:registry.npmjs.org"}')"
   export NPM_ID_TOKEN
   npm publish
   ```

   npm exchanges it for a one-off publish credential. npm only reads `NPM_ID_TOKEN` on
   CircleCI; the default `CIRCLE_OIDC_TOKEN_V2` has the org ID as audience and is ignored, which
   makes npm continue unauthenticated (`ENEEDAUTH`).
7. Polls `npm view majora-client@<version> version` every 5s for up to 300s and prints
   `dist.integrity` once it is visible. On timeout it only prints a warning and exits 0: once
   `npm publish` succeeded nothing can be undone, so registry lag never turns the job red. A
   failing `npm publish` (or anything before it) still fails the job.

- No npm token exists anywhere: no `NPM_TOKEN`/`NODE_AUTH_TOKEN`, no `.npmrc` auth line.
- CircleCI publishes get **no npm provenance** (npm only generates it for GitHub Actions and
  GitLab CI).
- **Recovery.** A failed publish is fixed with "Rerun workflow from failed" (or re-running the
  job) on the same tag; an already-published version is a no-op, so re-runs are safe. Waiting
  for the next app tag would lose it, since the versions would then compare equal. Until the
  trusted publisher is registered, `npm publish` fails with `E404`/`E403`/`ENEEDAUTH`; register
  it and re-run.
- No git tag is created for the client: the app's unanchored tag filter would match a tag such
  as `client-v1.2.3` and trigger a full app release.

## Versioning

- The client's version is independent of the app's.
- `scripts/bump_version.sh client X.Y.Z` validates the semver and updates only
  `client/package.json`'s `version`. The plain `scripts/bump_version.sh [X.Y.Z]` form never
  touches the client.
