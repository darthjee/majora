# Issue: Client: publish majora-client to npm via CircleCI trusted publishing (OIDC, no NPM_TOKEN)

## Description

The `client-release` CircleCI job (`.circleci/config.yml`) runs `scripts/release_client.sh` on
app `X.Y.Z` tags. Today the script authenticates with a long-lived npm automation token: it
reads `NPM_TOKEN` from the CircleCI project environment, writes it to `~/.npmrc` and runs
`npm publish --access public`.

We want to move the `majora-client` release to **npm trusted publishing** with CircleCI as the
trusted publisher, the same way `darthjee/arcanum` publishes `arcanum-cli` (reference:
`scripts/publish_cli_package.sh`, `scripts/test_publish_cli_package.sh`, the `publish-cli` job
in `.circleci/config.yml` and `docs/agents/architecture/install-and-release.md#npm-trusted-publishing`
in https://github.com/darthjee/arcanum). npm exchanges a short-lived CircleCI OIDC token for a
one-off publish credential, so no npm token exists anywhere.

## Problem

We haven't hit these in Majora yet, but arcanum did when it set up the same flow, and the
current `majora-client` job would hit them too:

1. **`ENEEDAUTH`, nothing published** (fixed in darthjee/arcanum#856). The trusted publisher was
   registered correctly, but `npm publish` failed with
   `npm error code ENEEDAUTH ... This command requires you to be logged in`. npm ignores
   CircleCI's default `CIRCLE_OIDC_TOKEN_V2` (its audience is the CircleCI org ID). For CircleCI,
   npm only reads a token from `NPM_ID_TOKEN` with audience `npm:registry.npmjs.org`. Without it,
   npm skips the exchange and continues unauthenticated. arcanum 2.2.1 and 2.2.2 were released
   on GitHub but never reached npm.
2. **Job red after a successful publish** (darthjee/arcanum#858, fixed in #860). The check
   after publishing polled `npm view` for 60s and then ran `exit 1`. 2.2.3 was published but the
   job failed with `not visible after 60s (registry lag)`. Once `npm publish` succeeds nothing
   can be undone, so this check must only warn.
3. **CI image npm too old.** `darthjee/circleci_node` ships an npm older than 11.5.1, the first
   version that supports trusted publishing, so the job must install a pinned npm.
4. **The trusted publisher needs an existing package.** The first version must be published by
   hand. A new trusted publisher also stays "Pending validation" until a CI publish succeeds
   through it, and must be registered again if the deadline passes.
5. **Re-runs.** npm versions are immutable. Today `release_client.sh` fails when the version is
   already on npm, so "Rerun workflow from failed" after a successful publish stays red.

## Expected Behavior

- On an app `X.Y.Z` tag where the client version changed, `client-release` publishes
  `majora-client` through CircleCI OIDC trusted publishing, with no npm token anywhere (no
  `NPM_TOKEN`/`NODE_AUTH_TOKEN`, no `.npmrc` auth line).
- The job fails if a stray `NPM_TOKEN`/`NODE_AUTH_TOKEN` is set, if npm/Node are below the
  trusted-publishing floors, or if the `circleci` CLI is missing.
- Re-running the job on a version that is already on npm passes as a no-op.
- Once `npm publish` succeeds, registry lag only prints a warning; the job stays green.

## Solution

### CircleCI job (`client-release`)

- Make sure the job runs on Node ≥ 22.14.0 and npm ≥ 11.5.1 (older npm doesn't support trusted
  publishing). Add a step that installs an exact npm pin (e.g. `npm@11.21.1`) only when the
  image's npm is below 11.5.1.
- The `circleci` CLI must be available in the job, since it mints the OIDC token. Check that the
  current image (`darthjee/circleci_node:0.2.1`) has it, or switch to an image that does.
- Don't run the job inside a CircleCI context (otherwise the trusted publisher identity no
  longer matches, unless the context id is also registered).

### `scripts/release_client.sh`

- Keep the existing "publish only when the client version changed since the previous app tag"
  logic.
- **Preflight:** fail if `NPM_TOKEN` or `NODE_AUTH_TOKEN` is set (publishing is OIDC-only), and
  check the Node/npm floors and the presence of the `circleci` CLI.
- **Auth:** drop the `~/.npmrc` token line. Just before `npm publish`, mint an npm-audience
  token and export it as `NPM_ID_TOKEN`:

  ```bash
  NPM_ID_TOKEN="$(circleci run oidc get --claims '{"aud": "npm:registry.npmjs.org"}')"
  export NPM_ID_TOKEN
  npm publish
  ```

  CircleCI's default `CIRCLE_OIDC_TOKEN_V2` has the org ID as audience, and npm ignores it
  (this is what caused `ENEEDAUTH` in arcanum).
- **Already published → success:** when `majora-client@<version>` is already on npm, stop with
  `exit 0` instead of failing, so re-runs are safe. Keep failing when the version is lower than
  npm's `latest`.
- **Verify, without failing the job:** poll `npm view majora-client@<version> version` every 5s
  for up to 300s; print `dist.integrity` on success, and print a warning and `exit 0` on
  timeout, since the publish already succeeded.
- Note: CircleCI publishes get **no npm provenance** (npm only generates it for GitHub Actions
  and GitLab CI). Don't claim provenance in docs or comments.

### `client/package.json`

- Add `publishConfig: { "access": "public", "tag": "latest" }` so CI doesn't rely on flags.
- Review `engines.node` (currently `>=20`).
- `repository.url` must stay `git+https://github.com/darthjee/majora.git` with
  `directory: client`, matching the repo CircleCI builds.

### Docs

- Update `docs/agents/contributing.md` (client release section, "Token" bullet) and
  `docs/agents/security-guidelines/exposed-secrets.md` (`NPM_TOKEN` entry) and
  `docs/agents/client/packaging.md` ("CI" and "Release" sections) to describe trusted
  publishing, the bootstrap and recovery.
- Grep the docs for leftover `NPM_TOKEN` references.

### One-time bootstrap (manual, by the package owner — not part of the PR)

`majora-client` is already published on npm, so no manual first publish is needed.

1. Register the CircleCI trusted publisher (npmjs.com → package → Settings → Trusted Publisher,
   or `npm trust circleci majora-client --org-id … --project-id … --pipeline-definition-id …
   --vcs-origin github.com/darthjee/majora --allow-publish`).
2. Package settings → Publishing access: require 2FA and disallow tokens.
3. Delete the `NPM_TOKEN` CircleCI project environment variable.
4. Cut a release before the trusted publisher's "Pending validation" deadline.

### Testing

No new automated tests: the change is verified by reviewing the script and the job definition,
and on the next app release that bumps the client version.

## Benefits

- No long-lived npm token that could leak.
- Avoids the `ENEEDAUTH` and false-red-after-publish failures arcanum hit with the same setup.
- Safe "Rerun workflow from failed" for client releases.
