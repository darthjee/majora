# Update the release docs

Describe trusted publishing instead of the `NPM_TOKEN` flow, and grep `docs/` and `.claude/` for
leftover `NPM_TOKEN` references (ignore `docs/agents/issues/` and `docs/agents/plans/`).

- `docs/agents/client/packaging.md`, "CI" and "Release": the new script steps (preflight with
  the token refusal and Node/npm/`circleci` floors, already-published no-op, `NPM_ID_TOKEN` via
  `circleci run oidc get` with audience `npm:registry.npmjs.org`, bare `npm publish` relying on
  `publishConfig`, the non-fatal 300s verify), the npm pin step, "no context", no provenance on
  CircleCI, and recovery ("Rerun workflow from failed" is now safe).
- `docs/agents/contributing.md`, "Releasing the client": update "Failure cases", "Recovery" and
  replace the "Token" bullet with the trusted-publisher setup (registered once on npm by the
  owner; require 2FA and disallow tokens; no `NPM_TOKEN` anywhere).
- `docs/agents/security-guidelines/exposed-secrets.md`: replace the `NPM_TOKEN` bullet — no npm
  token exists; the release refuses to run when `NPM_TOKEN`/`NODE_AUTH_TOKEN` is set.

## Files to Change

- `docs/agents/client/packaging.md` — CI and Release sections.
- `docs/agents/contributing.md` — Releasing the client.
- `docs/agents/security-guidelines/exposed-secrets.md` — `NPM_TOKEN` bullet.
