# Issue: Add logs to navi client

## Description

Follow-up to #1241 ("Revisit statistics"). Getting to the root cause there is
blocked on visibility we don't have today: whether the `STATISTICS_SKIP_SECRET`
`$VAR` placeholder in `navi/resources/clients.yml` is actually seen as set by
`navi-client` when the `warm-up-cache` CircleCI job pushes config, and whether the
resolved header value that ends up in the `POST /api/config` payload is correct.

`navi-client` (`darthjee/navi-hey-client`) 0.2.0 already ships the mechanism needed
to answer this: a `--log-level debug` CLI flag / `LOG_LEVEL` env var. This issue
wires that up on majora's side, ahead of using it to unblock #1241.

## Problem

`scripts/warm_navi_cache.sh` invokes `navi-client -a config --file ...` from the
`warm-up-cache` CircleCI job with no visibility into what actually happens during
`$VAR`/`${VAR}` interpolation or what gets sent over the wire. If a referenced env
var (e.g. `STATISTICS_SKIP_SECRET`) is unset in that job's scope, `navi-client`
silently substitutes an empty string — there's currently no signal in CI output
that would catch this, which is exactly the open question blocking #1241.

Separately, the pinned images are stale/unpinned: `docker-compose.yml`'s
`majora_navi` service was on `darthjee/navi-hey:1.5.1`, and
`.circleci/config.yml`'s `warm-up-cache` executor floated on
`darthjee/navi-hey-client:latest` rather than a pinned version.

## Expected Behavior

The `warm-up-cache` CircleCI job's output includes, at debug level:

- One line per `$VAR`/`${VAR}` interpolation `navi-client` performs while reading
  each resource file — variable name, whether it was found set or unset, and (when
  set) the resolved value's length + a short hash, never the raw value.
- The outbound `POST /api/config` request's method, URL, and body (the
  already-interpolated JSON payload) for every namespace pushed.

This is enough to tell, from CI logs alone, whether `STATISTICS_SKIP_SECRET` (or
any other client header value) was actually seen as set and what ended up in the
pushed config — without majora printing raw secret values itself. The full request
body does include the resolved header value in plaintext in the log stream;
`STATISTICS_SKIP_SECRET` being a registered CircleCI project env var, its value is
expected to come out masked in the CircleCI UI the same way any other secret
reference would.

## Solution

1. Bump `docker-compose.yml`'s `majora_navi` service to
   `darthjee/navi-hey:1.9.0`, and pin `.circleci/config.yml`'s `warm-up-cache`
   executor to `darthjee/navi-hey-client:0.2.0` (was floating on `latest`).
2. Set `export LOG_LEVEL=debug` in `scripts/warm_navi_cache.sh`, so both the
   `config` and `engine-start` `navi-client` invocations it runs log at debug
   level, permanently (not just for diagnosing #1241) — the interpolation-line
   log is cheap and secret-safe, and gives ongoing visibility for future issues.
3. Replace the vendored guides under `docs/agents/external/` (`HOW_TO_USE_NAVI.md`,
   `HOW_TO_USE_NAVI-CLIENT.md`, `navi/`, `navi-client/`) wholesale with the current
   upstream navi guides matching the 1.9.0/0.2.0 bump — pure vendored copies, no
   majora-specific edits to preserve, picking up `option-d-hosted-server.md`,
   `emit-configuration.md`, and both sides' new `samples.md`/`samples/` directories.
4. Verify by running the `warm-up-cache` job on a real branch/release and
   confirming the interpolation-line log for `STATISTICS_SKIP_SECRET` shows up as
   expected — this is also the verification step #1241 has been waiting on.

Steps 1–3 are already committed on the `issue-1242` branch (`e02cd9d2` vendored
docs, `0f4a2f08` version bumps + debug logging) and are considered ready to ship —
step 4 is a post-merge observation to make on the next real release, not a
condition blocking this PR, since it can only happen after a live
`warm-up-cache` run.

No mitigation beyond enabling debug logging is planned for the request-body log
exposing the resolved secret value in plaintext — reliance is on CircleCI's
automatic masking of registered env var values in job output. If that ever turns
out not to cover this case in practice, this would need to be revisited before
debug logging stays enabled long-term.

## Benefits

- Unblocks the actual root-cause confirmation #1241 has been waiting on, without
  guessing further from static config reading.
- Ongoing debug-level visibility into `navi-client` config pushes for any future
  issue involving `$VAR` interpolation or what's actually sent to a Navi instance.
- Pins `navi-hey`/`navi-hey-client` to known versions instead of a stale pin
  (`1.5.1`) and a floating tag (`latest`), and refreshes majora's vendored copies
  of navi's own docs to match.
