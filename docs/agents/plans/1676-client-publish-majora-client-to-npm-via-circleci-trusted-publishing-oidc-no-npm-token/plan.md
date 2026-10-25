# Plan: Client: publish majora-client to npm via CircleCI trusted publishing (OIDC, no NPM_TOKEN)

Issue: [1676-client-publish-majora-client-to-npm-via-circleci-trusted-publishing-oidc-no-npm-token.md](../../issues/1676-client-publish-majora-client-to-npm-via-circleci-trusted-publishing-oidc-no-npm-token.md)

## Overview

Move the `majora-client` npm release from the long-lived `NPM_TOKEN` to CircleCI OIDC trusted
publishing, applying the fixes arcanum needed for the same setup (darthjee/arcanum#856, #860):
an npm-audience `NPM_ID_TOKEN` minted with `circleci run oidc get`, an npm pin for trusted
publishing support, a token-refusing preflight, an "already published" no-op and a non-fatal
registry check after publishing. The `client` agent pins publishing defaults in
`client/package.json`; `infra` owns the release script, the CI job and the release docs.

## Agents involved

- [client](client.md)
- [infra](infra.md)

## Shared contracts

- `client/package.json` gets `"publishConfig": { "access": "public", "tag": "latest" }`.
  `scripts/release_client.sh` then runs a bare `npm publish` (no `--access public` flag) in
  `client/`, relying on it.
- `repository` stays `{ "type": "git", "url": "git+https://github.com/darthjee/majora.git",
  "directory": "client" }` — it must match the repo CircleCI builds for trusted publishing.
- `engines.node` stays `>=20`: it is a requirement for consumers of the package, not for the
  publish job. The publish job's own Node ≥ 22.14.0 / npm ≥ 11.5.1 floors live in the script and
  CI job (infra).
- Package name stays `majora-client` (the script's `PACKAGE_NAME`).
