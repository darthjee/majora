# Add `scripts/release_client.sh`

A script holding the release decision and the publish, so the CircleCI job stays a thin
wrapper. It follows the style of `scripts/deploy.sh` (small bash functions, `set -euo pipefail`)
and resolves paths from the repository root (`git rev-parse --show-toplevel`). It runs in
`darthjee/circleci_node:0.2.1` (Node, npm, git and coreutils `sort -V` are available).

Behaviour, given `CIRCLE_TAG`:

1. **Guard**: fail if `CIRCLE_TAG` is unset or not `X.Y.Z`.
2. **Fetch tags**: `git fetch --tags` (CircleCI checkouts may not carry all tags).
3. **Previous tag**: from `git tag --list --sort=-v:refname`, keep only `^[0-9]+\.[0-9]+\.[0-9]+$`
   tags and pick the first one strictly lower than `CIRCLE_TAG` (version order, not string
   order).
4. **Versions**: read `version` from `client/package.json` at `CIRCLE_TAG` (the checked-out
   tree) and at the previous tag (`git show <prev>:client/package.json`, parsed with
   `node -p`). A missing previous tag or a missing file at it counts as "changed".
5. **Skip**: if the versions are equal, print a message ("client version X unchanged since
   <prev>; nothing to publish") and exit 0.
6. **Registry checks**:
   - If `npm view majora-client@<v> version` returns the version, fail ("already published").
   - Read `npm view majora-client dist-tags.latest`. If it exists and `<v>` sorts lower than it
     (`sort -V`), fail ("lower than latest").
   - An `E404` (package not yet published) means no versions exist: continue.
7. **Publish**: fail if `NPM_TOKEN` is unset. Write
   `//registry.npmjs.org/:_authToken=${NPM_TOKEN}` to `~/.npmrc` (never into the repository),
   then run `npm publish --access public` from `client/`. No `--provenance`.

Every failure prints a clear reason on stderr and exits non-zero. On recovery, re-running the
job on the same tag reaches the same decision, because the comparison only depends on the two
tags.

## Files to Change

- `scripts/release_client.sh` — new, executable (`chmod +x`).
