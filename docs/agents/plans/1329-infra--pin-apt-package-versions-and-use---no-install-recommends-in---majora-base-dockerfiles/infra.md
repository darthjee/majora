# Infra Plan: Infra: pin apt package versions and use --no-install-recommends in *-majora-base Dockerfiles

Main plan: [plan.md](plan.md)

## Overview
Both `dockerfiles/circleci_majora-base/Dockerfile` and `dockerfiles/vite_majora-base/Dockerfile` currently run `apt-get install -y rsync` with no version pin and no `--no-install-recommends`, tripping Hadolint `DL3008`/`DL3015`. The two files build from different base images/distros (`darthjee/circleci_django:0.1.0`, Ubuntu 22.04 jammy, vs `darthjee/node:0.2.1`, Debian 12 bookworm), so each needs its own `rsync=<version>` pin matching its own base image's apt candidate.

## Context
Confirmed current apt candidate versions for each base image (checked 2026-09-15):
- `darthjee/circleci_django:0.1.0` (Ubuntu 22.04 jammy) → `rsync=3.2.7-0ubuntu0.22.04.7`
- `darthjee/node:0.2.1` (Debian 12 bookworm) → `rsync=3.2.7-1+deb12u6`

## Implementation Steps

### Step 1 — Pin rsync in circleci_majora-base
In `dockerfiles/circleci_majora-base/Dockerfile:5`, change:
```dockerfile
RUN apt-get update && apt-get install -y rsync && rm -rf /var/lib/apt/lists/*
```
to:
```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends rsync=3.2.7-0ubuntu0.22.04.7 && rm -rf /var/lib/apt/lists/*
```

### Step 2 — Pin rsync in vite_majora-base
In `dockerfiles/vite_majora-base/Dockerfile:5`, change:
```dockerfile
RUN apt-get update && apt-get install -y rsync && rm -rf /var/lib/apt/lists/*
```
to:
```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends rsync=3.2.7-1+deb12u6 && rm -rf /var/lib/apt/lists/*
```

## Files to Change
- `dockerfiles/circleci_majora-base/Dockerfile` — pin `rsync` version, add `--no-install-recommends`
- `dockerfiles/vite_majora-base/Dockerfile` — pin `rsync` version, add `--no-install-recommends`

## CI Checks
- `dockerfiles/circleci_majora-base`: `bin/image.sh build circleci_majora-base` (CI job: `release-circleci_majora-base`) — verifies the pinned version still resolves and the image builds.
- `dockerfiles/vite_majora-base`: `bin/image.sh build vite_majora-base` (CI job: `release-vite_majora-base`) — verifies the pinned version still resolves and the image builds.

## Notes
- These are the exact apt candidate versions as of 2026-09-15 on the live Ubuntu/Debian security/updates mirrors referenced by these fixed-tag base images. Apt repos are live/rolling even though the base image tags are fixed, so the pinned patch-revision could drift out of the mirror over time; if a future build fails to resolve the pinned version, re-check `apt-cache policy rsync` inside the base image and bump the pin.
- The two pinned versions intentionally differ (Ubuntu vs Debian package-revision schemes) — this is expected, not a bug to reconcile.
