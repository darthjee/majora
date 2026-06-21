# Plan: Release Base Images

Issue: [76-release-base-images.md](../issues/76-release-base-images.md)

## Overview
Add CircleCI automation to build and push the project's base images (`majora-base`, `circleci_majora-base`, `production_majora-base`, `vite_majora-base`) to Docker Hub on tagged releases, mirroring the pattern already used in `darthjee/docker` (`../docker`): a single `bin/image.sh`-style script with `build`/`push` actions, a `version` file tracking each image's version, a parameterized CircleCI `release` job (with QEMU for `arm64`), and tag-gated release jobs wired into the existing `release` requires-chain.

## Context
CircleCI currently only builds/runs the app's test and deploy jobs; the base images used by those jobs (`darthjee/majora-base`, `darthjee/circleci_majora-base`, `darthjee/production_majora-base`, `darthjee/vite_majora-base`) are never built or pushed by CI — they are maintained manually. `../docker` already solves this exact problem with `bin/image.sh` (actions: `build`, `tag`, `push`, `test`; supports an `arch` argument for `linux/arm64` builds, tagged `<image>:latest-arm64` etc.) plus a root `version` file (`<image>=<version>` lines) and a single parameterized `release` job in `.circleci/config.yml` invoked once per image/arch via `requires:`.

## Implementation Steps

### Step 1 — Add a `version` file
Create a root `version` file with one `<image>=<version>` line per base image: `majora-base`, `circleci_majora-base`, `production_majora-base`, `vite_majora-base`. Seed versions from the tags currently used in `.circleci/config.yml` and `Makefile` (e.g. `0.0.1`).

### Step 2 — Add `bin/image.sh`
Port `../docker/bin/image.sh` into `bin/image.sh`, adapted to this repo's image layout (`dockerfiles/<image>/Dockerfile` instead of `<image>/<version>/Dockerfile`):
- `image_version <image>` reads the version from `version`.
- `build <image> [arch]` builds `dockerfiles/<image>/Dockerfile` tagged `$DOCKER_ID_USER/<image>:latest[-<arch>]` and `:<version>[-<arch>]`, retagging any previous `:latest` as `:cached` first (cache reuse) and dropping the cached tag after a successful build.
- `push <image> [arch]` logs into Docker Hub (`$DOCKER_HUB_USERNAME`/`$DOCKER_HUB_PASSWORD`) and pushes both tags.
- Default platform `linux/amd64`, overridable via `PLATFORM`/`arch` for `arm64`.

### Step 3 — Refactor the Makefile to use `bin/image.sh`
Replace the existing `build-base`/`push-base`/`build-fe-base`/`push-fe-base` targets (currently hardcoded around `BASE_VERSION` and two images) with thin wrappers that call `bin/image.sh build|push <image>` for each of the four base images, keeping `build`/`push`/`build-fe`/`push-fe` (app images, not base images) and the `dev*`/`setup`/`tests` targets unchanged.

### Step 4 — Add a parameterized `release` job to CircleCI
In `.circleci/config.yml`, add a `release` job (machine executor) parameterized by `image` (string) and `arch` (string, default empty), mirroring `../docker/.circleci/config.yml`:
- Checkout.
- If `arch` is `arm64`: run `docker run --privileged --rm tonistiigi/binfmt --install all` (QEMU) first.
- Run `bin/image.sh push << parameters.image >> << parameters.arch >>`.

### Step 5 — Wire tag-gated release jobs into the workflow
Add one `release` job invocation per base image (`release-majora-base`, `release-circleci_majora-base`, `release-production_majora-base`, `release-vite_majora-base`), each filtered to `tags: only: /\d+\.\d+\.\d+/` and `branches: ignore: /.*/` (same filter already used by `build-and-release` etc.), plus an `-arm64` variant of each for multi-arch support. Add these jobs as a prerequisite (`requires:`) of the existing `release` job, so the base images are published before the app's `release` step runs on a tagged build.

## Files to Change
- `version` — new file: per-image version tracking (`majora-base`, `circleci_majora-base`, `production_majora-base`, `vite_majora-base`).
- `bin/image.sh` — new file: build/push script for base images, ported from `../docker/bin/image.sh`.
- `Makefile` — refactor base-image targets to delegate to `bin/image.sh`.
- `.circleci/config.yml` — add the parameterized `release` job and the tag-gated `release-<image>[-arm64]` workflow entries, wired as a dependency of the existing `release` job.

## CI Checks
- `.circleci/config.yml` itself has no local lint command in this repo; validate by running `circleci config validate` if the CLI is available, otherwise rely on CircleCI's own config validation on push.

## Notes
- This plan only adds the build/push automation for the four *base* images; it does not change how the app images (`majora`, `vite_majora`, `production_majora`) are built/released — those already go through `build-and-release`/`release`.
- Docker Hub credentials (`DOCKER_HUB_USERNAME`, `DOCKER_HUB_PASSWORD`) and `DOCKER_ID_USER` are assumed to already exist as CircleCI environment variables (used elsewhere in `../docker`'s CI); confirm they're configured for the `darthjee/majora` CircleCI project before merging.
