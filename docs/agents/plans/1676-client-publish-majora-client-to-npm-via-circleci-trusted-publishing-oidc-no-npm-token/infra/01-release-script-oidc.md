# Switch release_client.sh to OIDC trusted publishing

Rework `scripts/release_client.sh` (keep its style: small functions, `fail`, `set -euo pipefail`),
keeping the "publish only when the client version changed since the previous app tag" decision
and the "lower than npm's `latest`" failure.

- **Header comment:** describe the OIDC flow instead of "writes NPM_TOKEN to ~/.npmrc".
- **Preflight** (run before any npm work):
  - fail when `NPM_TOKEN` or `NODE_AUTH_TOKEN` is set:
    `NPM_TOKEN or NODE_AUTH_TOKEN is set; publishing is OIDC-only, unset it`;
  - fail when Node < 22.14.0 or npm < 11.5.1 (reuse `version_lt`);
  - fail when the `circleci` CLI is not on `PATH` (it mints the OIDC token).
  Run the preflight only once a publish is actually needed (after the "version unchanged" no-op),
  so tags that don't bump the client stay green on any image.
- **Already published → success:** in `check_registry`, when `majora-client@<version>` is already
  on npm, print `majora-client@<version> is already published; nothing to do` and `exit 0`
  instead of failing (npm versions are immutable, so re-runs become safe).
- **Auth:** remove the `~/.npmrc` token write. Just before publishing:

  ```bash
  # npm only uses an OIDC token passed as NPM_ID_TOKEN, with the npm audience
  # (CircleCI's default CIRCLE_OIDC_TOKEN_V2 has the org ID as its audience).
  NPM_ID_TOKEN="$(circleci run oidc get --claims '{"aud": "npm:registry.npmjs.org"}')"
  export NPM_ID_TOKEN
  npm publish
  ```

  in `client/`, with no `--access public` (now in `publishConfig`).
- **Verify, never failing the job:** after `npm publish` succeeds, poll
  `npm view majora-client@<version> version` every 5s up to `VERIFY_TIMEOUT=300`s. On success print
  `dist.integrity`; on timeout print to stderr
  `Warning: majora-client@<version> was published but is not visible after 300s (registry lag); check it later with: npm view majora-client@<version> version`
  and `exit 0`. A failing `npm publish` (or anything before it) still fails the job.

## Files to Change

- `scripts/release_client.sh` — preflight, already-published no-op, OIDC auth, non-fatal verify.
