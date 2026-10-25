# Client Plan: Client: publish majora-client to npm via CircleCI trusted publishing (OIDC, no NPM_TOKEN)

Main plan: [plan.md](plan.md)

## Shared contracts

- Add `"publishConfig": { "access": "public", "tag": "latest" }` to `client/package.json`; infra's
  `scripts/release_client.sh` runs `npm publish` without flags and relies on it.
- Keep `name` (`majora-client`), `repository` (`git+https://github.com/darthjee/majora.git`,
  `directory: client`) and `engines.node` (`>=20`) unchanged.

## Implementation Steps

### Step 1 — Pin publishing defaults in package.json

Add the `publishConfig` block above to `client/package.json` so CI never depends on
`npm publish` flags for public access or the `latest` dist-tag. Do not bump `version`.

## Files to Change

- `client/package.json` — add `publishConfig`.

## CI Checks

- `client/`: `make client-lint` and `docker-compose run --rm majora_client npm pack --dry-run`
  (CI job: `client_checks`); `make client-tests` (CI job: `client_tests`).

## Notes

- Purely declarative; no source or spec change.
