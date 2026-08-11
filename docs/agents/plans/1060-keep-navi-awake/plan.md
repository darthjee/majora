# Plan: Keep navi awake

Issue: [1060-keep-navi-awake.md](../../issues/1060-keep-navi-awake.md)

## Overview

`scripts/wake_navi.sh` wakes Navi once and exits, and the `wake-navi` CI job fires immediately at the start of the workflow (no `requires:`), so Navi is back asleep by the time `warm-up-cache` (which requires the full `release` chain) actually needs it. This plan adds a configurable keep-alive ping loop to the script and re-gates the `wake-navi` job to start after tests/checks, running in parallel with `release` instead of ahead of it.

## Context

- `scripts/wake_navi.sh` currently hardcodes `MAX_ATTEMPTS=10` and `SLEEP_SECONDS=15`, polls `$NAVI_URL`, and `exit 0`s as soon as it sees a non-`502` status.
- `.circleci/config.yml`'s `wake-navi` job has no `requires:` at all — it runs as soon as the tag filter allows, in parallel with the test/build jobs, well before `release`/`warm-up-cache`.
- `warm-up-cache` requires `release`, which requires nearly every other job in the workflow (tests, checks, builds, uploads, deploys) — by the time it runs, a lot of time has passed since `wake-navi` fired.
- `warm-up-cache` is itself capable of waking Navi if it's still asleep, so `wake-navi` is a best-effort pre-warm, not a hard prerequisite for anything.

## Implementation Steps

### Step 1 — Make the wake-up variables env-overridable and add keep-alive variables

In `scripts/wake_navi.sh`, change the two existing top-of-file constants to be env-overridable with their current values as defaults, and add two new ones for the keep-alive phase:

```bash
MAX_ATTEMPTS="${MAX_ATTEMPTS:-10}"
SLEEP_SECONDS="${SLEEP_SECONDS:-15}"
KEEPALIVE_PINGS="${KEEPALIVE_PINGS:-4}"
KEEPALIVE_SLEEP_SECONDS="${KEEPALIVE_SLEEP_SECONDS:-30}"
```

Log the effective values on startup, before the wake-up loop begins, e.g.:

```
Using MAX_ATTEMPTS=10 SLEEP_SECONDS=15 KEEPALIVE_PINGS=4 KEEPALIVE_SLEEP_SECONDS=30
```

### Step 2 — Log the HTTP status on every wake-up attempt

Extend the existing `ATTEMPT $ATTEMPT` log line in the wake-up loop to include the status this attempt received, e.g. `ATTEMPT 3 - status 502`, so both success and failure attempts are visible in CI logs.

### Step 3 — Add the keep-alive ping loop after a successful wake-up

After the wake-up loop detects a non-`502` status (the existing `if [ "$STATUS" != "502" ]` branch), instead of exiting immediately, run `KEEPALIVE_PINGS` additional pings against the same `$NAVI_URL` endpoint, sleeping `KEEPALIVE_SLEEP_SECONDS` before each one — so pings land at t=30s, 60s, 90s, 120s after the initial wake-up (with the defaults). Log each ping's status, e.g. `KEEPALIVE PING 2/4 - status 200`.

- If any keep-alive ping returns `502`, log it and `exit 1` immediately — do not continue with the remaining scheduled pings.
- If all keep-alive pings succeed, `exit 0` after the last one.
- The existing failure path (still `502` after `MAX_ATTEMPTS` wake-up attempts) is unchanged: log it and `exit 1`.

### Step 4 — Gate the `wake-navi` CI job on tests/checks

In `.circleci/config.yml`, add a `requires:` list to the `wake-navi` job entry under the `test` workflow (currently at line ~117), matching the same set already used by `build-and-release` and the other post-test deploy jobs:

```yaml
- wake-navi:
    requires: [pytest_views_characters, pytest_views_rest, pytest_all, jasmine, frontend-checks, checks, proxy_extension_tests]
    filters: *tags_only
```

This makes `wake-navi` start once tests/checks pass, running in parallel with the `release` job chain (build/upload/deploy) instead of firing at the very beginning of the workflow. Do **not** add `wake-navi` to `warm-up-cache`'s `requires:` — `warm-up-cache` stays independent and capable of waking Navi itself if needed.

### Step 5 — Update the infra agent's CI/scripts reference doc

`.claude/agents/infra.md` documents the current `wake-navi` job as "Non-blocking, no `requires:`" and describes `scripts/wake_navi.sh` as a plain retry loop. Update both table entries to reflect the new `requires:` gating and the keep-alive behavior, so the reference stays accurate.

## Files to Change

- `scripts/wake_navi.sh` — env-overridable variables, status logging, keep-alive ping loop after wake-up.
- `.circleci/config.yml` — add `requires:` to the `wake-navi` job.
- `.claude/agents/infra.md` — update the CI jobs and scripts reference tables to describe the new behavior.

## Notes

- There's no automated test harness for `scripts/wake_navi.sh` (it depends on a live `$NAVI_URL` and real Navi service, and isn't covered by the `checks` CI job, which only lints Python). Verify manually by running the script with `NAVI_URL` pointed at a real (or intentionally-502ing) endpoint and confirming the log output and exit codes match the intended behavior.
- The 2-minute default keep-alive window (`KEEPALIVE_PINGS=4` × `KEEPALIVE_SLEEP_SECONDS=30`) was chosen assuming `wake-navi` runs in parallel with `release`; if `release`'s duration changes significantly, the window is tunable via env vars without code changes.
