# Infra Plan: Refactor: fix unquoted glob in dockerfiles/production_majora/Dockerfile

Main plan: [plan.md](plan.md)

## Overview
Codacy's Hadolint scan flags `SC2035` (High, ErrorProne) at `dockerfiles/production_majora/Dockerfile:15`: `RUN rm -rf */tests` uses a glob that is not prefixed with `./` or `--`, so a directory whose name starts with `-` would be parsed by `rm` as an option.

## Context
The `builder` stage runs the instruction as the `app` user, in the base image's working directory, after `COPY ./backend/ /home/app/app/`. Prefixing the glob with `./` expands to the same paths (`./<dir>/tests`), so behaviour is unchanged. No other Dockerfile under `dockerfiles/` has an unprefixed glob passed to `rm`/`cp`/`mv`/`chmod`/`chown`.

## Implementation Steps

### Step 1 — Prefix the glob
In `dockerfiles/production_majora/Dockerfile`, change line 15 from `RUN rm -rf */tests` to `RUN rm -rf ./*/tests`. Touch nothing else in the file.

### Step 2 — Verify the image still builds
Build the image locally through Docker with `make build PROJECT=production_majora` (equivalent to `docker build -f dockerfiles/production_majora/Dockerfile .`) and confirm it completes. After merge, confirm Codacy no longer reports `SC2035` for the file.

## Files to Change
- `dockerfiles/production_majora/Dockerfile` — prefix the glob on line 15 with `./` (`rm -rf ./*/tests`)

## CI Checks
- `dockerfiles/`: `make build PROJECT=production_majora`

## Notes
- No CircleCI job builds this Dockerfile on PR branches: `build-and-release` only runs on version tags and just triggers the Render deploy. The local build above is therefore the only pre-merge verification.
- The `builder` stage depends on the private base image `darthjee/production_majora-base:0.1.0`, which must be pullable for the local build.
- Local image builds must go through Docker, never host tooling.
