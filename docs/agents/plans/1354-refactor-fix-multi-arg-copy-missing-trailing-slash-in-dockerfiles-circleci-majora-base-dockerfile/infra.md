# Infra Plan: Refactor: fix multi-arg COPY missing trailing slash in dockerfiles/circleci_majora-base/Dockerfile

Main plan: [plan.md](plan.md)

## Overview
Codacy's Hadolint scan flags `DL3021` (High, ErrorProne) at `dockerfiles/circleci_majora-base/Dockerfile:12`: a `COPY` with more than 2 arguments whose destination (`/home/circleci/project`) does not end with `/`. Docker requires a directory destination ending in `/` when copying multiple sources.

## Context
This is the only multi-source `COPY` under `dockerfiles/` missing the trailing slash — `majora`, `majora-base`, `production_majora-base`, `vite_majora` and `vite_majora-base` already end their destination in `/`. Behaviour of the build is unchanged: the destination is already treated as a directory because of the multiple sources.

## Implementation Steps

### Step 1 — Add the trailing slash
In `dockerfiles/circleci_majora-base/Dockerfile` (line 12–14), change the destination of the `builder` stage's `COPY` from `/home/circleci/project` to `/home/circleci/project/`. Touch nothing else in the file.

### Step 2 — Verify the image still builds
Build the image locally with `make build-circleci-base` (wraps `bin/image.sh build circleci_majora-base`) and confirm it completes. The CI `release-circleci_majora-base` (and `-arm64`) `release-image` jobs re-verify this on the PR; after merge, confirm Codacy no longer reports `DL3021` for the file.

## Files to Change
- `dockerfiles/circleci_majora-base/Dockerfile` — add trailing `/` to the `COPY` destination on line 14 (instruction starts at line 12)

## CI Checks
- `dockerfiles/`: `make build-circleci-base` (CI jobs: `release-circleci_majora-base`, `release-circleci_majora-base-arm64`)

## Notes
- Local image builds must go through Docker (`make` target above), never host tooling.
- The `arm64` release job builds the same Dockerfile; no separate change is needed.
