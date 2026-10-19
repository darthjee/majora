# Add the `client` form to `bump_version.sh`

Add a `scripts/bump_version.sh client <X.Y.Z>` form that only updates the `version` field of
`client/package.json`.

- When the first argument is `client`, require a second argument (exit 1 with a usage message
  if it is missing), validate it with the same `^[0-9]+\.[0-9]+\.[0-9]+$` check, update only
  `client/package.json` (`"version": "..."`, BSD `sed -i ''` like the existing lines), print the
  new client version and exit. It never touches `README.md`, `frontend/package.json` or
  `backend/pyproject.toml`.
- The existing `scripts/bump_version.sh [X.Y.Z]` behaviour is unchanged and never touches the
  client.
- Keep it readable: extract the semver validation into a small function that both forms share,
  instead of duplicating it.

## Files to Change

- `scripts/bump_version.sh` — the new `client <X.Y.Z>` form and a shared validation function.
