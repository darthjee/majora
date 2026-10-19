# Document the release process

- **`docs/agents/contributing.md`**: add a `## Releasing the client` section (after `## Definition
  of Done for PRs`, before `## Code Organization`) covering:
  - Bumping: `scripts/bump_version.sh client X.Y.Z`, in a normal PR. The client version is
    independent of the app version.
  - Publishing: happens on the next app version tag. `client-release` runs after the full app
    gate, compares the client version with the previous app tag, and publishes only when it
    changed.
  - Failure cases: the version already exists on npm, or is lower than npm's `latest`.
  - Recovery: re-run `client-release` on the same tag. Waiting for the next tag loses the
    publish.
  - Token: an npm *automation* token in the `NPM_TOKEN` CircleCI project environment variable.
    Never commit it.
  - Never create a git tag for the client (the unanchored app tag filter would release the app).
- **CI checks table** in the same file: add `client-release` to the `.circleci/`, `scripts/`, ...
  row, and add the missing `client/` row (`client_tests`, `client_checks`;
  `make client-tests`, `make client-lint`).
- **`docs/agents/specs/client/packaging.md`**: mark #1611 as implemented in "Implementation
  split", mention `scripts/release_client.sh` and `NPM_TOKEN`, add the script to "Affected
  code", and link to the contributing section.
- **`docs/agents/client.md`**: link the release process from the `infra` ownership bullet.
- **`docs/agents/folder-structure.md`**: add `release_client.sh` to the `scripts/` row.

## Files to Change

- `docs/agents/contributing.md` — release section and CI checks table rows.
- `docs/agents/specs/client/packaging.md` — implementation status, script, token, link.
- `docs/agents/client.md` — link to the release process.
- `docs/agents/folder-structure.md` — `scripts/` row.
