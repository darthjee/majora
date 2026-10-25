# Infra Plan: Client: publish majora-client to npm via CircleCI trusted publishing (OIDC, no NPM_TOKEN)

Main plan: [plan.md](plan.md)

## Shared contracts

- `client/package.json` will carry `"publishConfig": { "access": "public", "tag": "latest" }`
  (client agent), so the script runs a bare `npm publish` in `client/`.
- `repository.url` / `directory` stay `git+https://github.com/darthjee/majora.git` /
  `client`; `engines.node` stays `>=20` (the job's Node/npm floors are enforced here, not in
  `engines`).

## Steps

- [01 — Switch release_client.sh to OIDC trusted publishing](infra/01-release-script-oidc.md)
- [02 — Make the client-release job trusted-publishing ready](infra/02-client-release-job.md)
- [03 — Update the release docs](infra/03-release-docs.md)

## CI Checks

- `.circleci/`, `scripts/`: no local equivalent — `client-release` only runs on app version
  tags. Verify by reading `scripts/release_client.sh` and the job in `.circleci/config.yml`,
  and run `bash -n scripts/release_client.sh` (and `shellcheck` if available through docker).
- Docs: `markdownlint` (CI job: `markdownlint`).

## Notes

- Per the issue, no new automated tests are added.
- `majora-client` already exists on npm, so no manual first publish is needed. The owner must
  register the CircleCI trusted publisher (npm trust / npmjs.com) and delete the `NPM_TOKEN`
  project env var — manual, outside the PR. Until the publisher is registered, a release that
  bumps the client version will fail at `npm publish` (`E404`/`E403`/`ENEEDAUTH`); recovery is
  "Rerun workflow from failed" once it is registered.
- Once `NPM_TOKEN` is gone from the env, the new preflight stops refusing; while it is still set,
  the job will fail on purpose — so delete it as part of the bootstrap.
- CircleCI publishes get no npm provenance; do not claim it anywhere.
