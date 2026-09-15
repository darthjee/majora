# Infra Plan: Infra: pin FROM darthjee/*-base:latest to explicit tags in majora/vite_majora/production_majora Dockerfiles

Main plan: [plan.md](plan.md)

## Overview
Three Dockerfiles pull their internally-built base image with a floating `:latest` tag (Codacy Hadolint `DL3007`), which lets a Render deploy build silently pick up whatever base image was last pushed to Docker Hub instead of a deliberately chosen version. The repo already tracks a version per base image in the root `version` file and already pins these same base images elsewhere (`.circleci/config.yml` executors, `FROM darthjee/scripts:0.8.0`), so the fix is to apply that same convention to the three remaining `FROM` lines.

## Context
- `dockerfiles/majora/Dockerfile:2`, `dockerfiles/vite_majora/Dockerfile:2`, and `dockerfiles/production_majora/Dockerfile:2` each read `FROM darthjee/<image>-base:latest as base`.
- The root `version` file currently maps: `majora-base=0.1.0`, `circleci_majora-base=0.1.0`, `production_majora-base=0.1.0`, `vite_majora-base=0.1.0`.
- `bin/image.sh` already pushes each `*-base` image to Docker Hub under both `:latest` and `:$version` (read from the `version` file), so the pinned tags already exist on Docker Hub today — no new image push is needed for this change.
- `majora`, `vite_majora`, and `production_majora` are built by Render directly from these Dockerfiles against Docker Hub (see `scripts/deploy.sh`), not from a locally cached image, so the floating tag is resolved fresh on every deploy build.

## Implementation Steps

### Step 1 — Pin the three `FROM darthjee/*-base` lines to their tracked version
In each of the three Dockerfiles, replace `:latest` on the `FROM darthjee/<image>-base` line with the version currently recorded for that image in the root `version` file:
- `dockerfiles/majora/Dockerfile:2`: `FROM darthjee/majora-base:latest as base` → `FROM darthjee/majora-base:0.1.0 as base`
- `dockerfiles/vite_majora/Dockerfile:2`: `FROM darthjee/vite_majora-base:latest as base` → `FROM darthjee/vite_majora-base:0.1.0 as base`
- `dockerfiles/production_majora/Dockerfile:2`: `FROM darthjee/production_majora-base:latest as base` → `FROM darthjee/production_majora-base:0.1.0 as base`

Going forward, whoever bumps a `dockerfiles/*-base/Dockerfile` and its entry in the root `version` file must also update the corresponding `FROM` line here in the same change — mirroring how `.circleci/config.yml`'s executor image tags (e.g. `darthjee/circleci_majora-base:0.1.0`) are already maintained manually today. No automation or sync check is being added for this.

## Files to Change
- `dockerfiles/majora/Dockerfile` — pin `FROM darthjee/majora-base` to `0.1.0` instead of `latest`.
- `dockerfiles/vite_majora/Dockerfile` — pin `FROM darthjee/vite_majora-base` to `0.1.0` instead of `latest`.
- `dockerfiles/production_majora/Dockerfile` — pin `FROM darthjee/production_majora-base` to `0.1.0` instead of `latest`.

## Notes
- No CI job in this repo currently runs Hadolint locally — the `DL3007` finding originates from Codacy's own analysis, not a `.circleci/config.yml` job — so there is no local command to re-run for this check.
- If a base image is later rebuilt/republished without a version bump (i.e. the pinned tag is reused for a new build), these Dockerfiles would still pick up the new content under the same tag; this plan does not change that possibility, it only removes the always-implicit `:latest` drift.
