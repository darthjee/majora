# Issue: Infra: pin FROM darthjee/*-base:latest to explicit tags in majora/vite_majora/production_majora Dockerfiles

## Description
A Codacy Hadolint (`DL3007`) finding flags three Dockerfiles in `darthjee/majora` for pulling their base image with a floating `:latest` tag instead of a pinned version:

- `dockerfiles/vite_majora/Dockerfile:2` — `FROM darthjee/vite_majora-base:latest as base`
- `dockerfiles/production_majora/Dockerfile:2` — `FROM darthjee/production_majora-base:latest as base`
- `dockerfiles/majora/Dockerfile:2` — `FROM darthjee/majora-base:latest as base`

These base images are internally built from `dockerfiles/*-base/Dockerfile` in this same repo (not third-party images), so the risk profile is narrower than a typical `:latest` warning — but the build can still silently pick up an unintended, newer local base image build, making the resulting image non-reproducible.

The repo already has an established convention for pinning these exact base images elsewhere: the root `version` file records a version per base image (currently `majora-base=0.1.0`, `circleci_majora-base=0.1.0`, `production_majora-base=0.1.0`, `vite_majora-base=0.1.0`), `bin/image.sh` pushes each base image to Docker Hub under both `:latest` and `:$version` tags, and `.circleci/config.yml` already references pinned tags for these same images in its executors (e.g. `darthjee/circleci_majora-base:0.1.0`, `darthjee/vite_majora-base:0.1.0`), as does `FROM darthjee/scripts:0.8.0` in all three affected Dockerfiles. Only the `FROM` line for the app's own base image in these three Dockerfiles was left floating on `:latest`.

## Problem
`majora`, `vite_majora`, and `production_majora` are built by Render (see `scripts/deploy.sh`) directly from these Dockerfiles against Docker Hub, not from a locally cached image. A floating `:latest` `FROM` means a deploy build can pick up whatever the newest pushed `*-base` image happens to be at build time, independent of any deliberate version bump in this repo — builds are not reproducible and a base image change can silently affect these three images without a corresponding commit here.

## Expected Behavior
The `FROM darthjee/*-base` lines in `dockerfiles/majora/Dockerfile`, `dockerfiles/vite_majora/Dockerfile`, and `dockerfiles/production_majora/Dockerfile` reference an explicit, deliberately-bumped tag instead of `:latest`, consistent with how these same base images are already pinned in `.circleci/config.yml`.

## Solution
Replace `:latest` in the three `FROM darthjee/*-base` lines with the corresponding version already tracked in the root `version` file (e.g. `darthjee/majora-base:0.1.0`). Bump each pinned tag deliberately whenever the corresponding `dockerfiles/*-base/Dockerfile` changes and a new version is released (mirroring how `.circleci/config.yml`'s executor image tags are already maintained today).

## Benefits
- Reproducible, deterministic builds for `majora`, `vite_majora`, and `production_majora` images.
- Base image changes only reach these images through an explicit, reviewable commit.
- Consistent with the tagging convention already used elsewhere in this repo for the same base images.
