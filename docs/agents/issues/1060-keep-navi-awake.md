# Issue: Keep navi awake

## Description
`scripts/wake_navi.sh` wakes up the Navi cache-warming service before CI needs it. Navi runs on infrastructure that spins down after a period of inactivity, and today the script exits as soon as it observes a single non-`502` response from `$NAVI_URL` — it does not keep Navi warm afterward.

## Problem
In `.circleci/config.yml`, the `wake-navi` job has no `requires:`, so it fires immediately alongside the test/build jobs — well before the `release` job chain (build, upload, deploy) finishes. By the time `warm-up-cache` (which requires `release`) actually needs Navi, Navi has gone back to sleep, defeating the purpose of waking it up early.

## Expected Behavior
- After the initial wake-up succeeds, `wake_navi.sh` keeps pinging the same endpoint periodically for a short window, so Navi stays warm for longer.
- The `wake-navi` CI job runs alongside the `release` job chain (once tests/checks pass), instead of firing at the very start of the workflow — so the keep-alive window lines up with when `warm-up-cache` actually needs Navi.

## Solution

### `scripts/wake_navi.sh` changes

- Follow the existing top-of-file constant style (`MAX_ATTEMPTS`, `SLEEP_SECONDS`), extended as follows:
  - New keep-alive variables, env-overridable with defaults: `KEEPALIVE_PINGS` (default `4`), `KEEPALIVE_SLEEP_SECONDS` (default `30`).
  - `MAX_ATTEMPTS` and `SLEEP_SECONDS` also become env-overridable with their current defaults (`10` and `15`), for consistency.
- After the initial wake-up attempt succeeds (status != `502`), ping the same endpoint `KEEPALIVE_PINGS` times, sleeping `KEEPALIVE_SLEEP_SECONDS` before each ping — pings land at t=30s, 60s, 90s, 120s after wake-up, covering a 2-minute keep-alive window.
- On startup, log which values are in effect, e.g. `Using MAX_ATTEMPTS=10 SLEEP_SECONDS=15 KEEPALIVE_PINGS=4 KEEPALIVE_SLEEP_SECONDS=30`, so anyone reading CI logs knows the active values and which env vars to set to change them.
- Log the HTTP status returned by every wake-up attempt and every keep-alive ping, e.g. `ATTEMPT 3 - status 502`, `KEEPALIVE PING 2/4 - status 200`.
- Failure behavior (unchanged in spirit from today, just extended to keep-alive pings):
  - Initial wake-up: if Navi is still returning `502` after `MAX_ATTEMPTS`, log it and `exit 1`, failing the `wake-navi` job.
  - Keep-alive pings: if any keep-alive ping returns `502`, log it and `exit 1` immediately (do not continue with the remaining scheduled pings).
  - This is safe either way since nothing `requires: [wake-navi]` — a failure surfaces as a visible/alertable red job in CircleCI without blocking the pipeline.

### `.circleci/config.yml` changes

- Give the `wake-navi` job the same `requires:` as the other post-test deploy jobs: `pytest_views_characters`, `pytest_views_rest`, `pytest_all`, `jasmine`, `frontend-checks`, `checks`, `proxy_extension_tests`. This makes it start once tests/checks pass and run *in parallel with* the `release` job chain, rather than ahead of it.
- `warm-up-cache` does **not** get a new dependency on `wake-navi` — `wake-navi` is a best-effort pre-warm, not a hard prerequisite, since `warm-up-cache` is itself capable of waking Navi up if it is still asleep when it runs.
