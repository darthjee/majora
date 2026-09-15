# Issue: Infra: pin apt package versions and use --no-install-recommends in *-majora-base Dockerfiles

## Description
Codacy's Hadolint scan flags line 5 of both `dockerfiles/circleci_majora-base/Dockerfile` and `dockerfiles/vite_majora-base/Dockerfile`:

```dockerfile
RUN apt-get update && apt-get install -y rsync && rm -rf /var/lib/apt/lists/*
```

Two rules trigger:
- `DL3008` — the `apt-get install` does not pin `rsync` to a specific version, so the installed version floats with whatever is current in the base image's apt sources at build time.
- `DL3015` — the install does not pass `--no-install-recommends`, so `rsync`'s recommended-but-unneeded packages get pulled in too.

## Problem
Unpinned package versions make builds non-reproducible: the same Dockerfile can produce a different `rsync` version (with different behavior or vulnerabilities) depending on when it's built. Skipping `--no-install-recommends` also bloats the image with unnecessary packages.

## Expected Behavior
Both `dockerfiles/circleci_majora-base/Dockerfile` and `dockerfiles/vite_majora-base/Dockerfile` install a pinned `rsync` version with `--no-install-recommends`, resolving the Hadolint `DL3008`/`DL3015` findings for both files.

## Solution
Update the `RUN apt-get ... install rsync ...` line in each Dockerfile to pin `rsync`'s version and add `--no-install-recommends`. The two Dockerfiles use different base images (`darthjee/circleci_django:0.1.0`, Ubuntu 22.04 jammy, for `circleci_majora-base`; `darthjee/node:0.2.1`, Debian 12 bookworm, for `vite_majora-base`), so each needs its own version pin matching its own base image's apt candidate — a single literal version string doesn't resolve in both:

`dockerfiles/circleci_majora-base/Dockerfile`:
```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends rsync=3.2.7-0ubuntu0.22.04.7 && rm -rf /var/lib/apt/lists/*
```

`dockerfiles/vite_majora-base/Dockerfile`:
```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends rsync=3.2.7-1+deb12u6 && rm -rf /var/lib/apt/lists/*
```

These are the current apt candidate versions (checked 2026-09-15) for each base image's tag. Since the base images are pinned to fixed tags but their upstream apt security/updates repos are live, the exact patch-revision suffix could drift if a newer point release is published — the pinned version may need periodic re-verification/bumping if a future build fails to resolve it.

## Benefits
- Reproducible builds: the same Dockerfile always installs the same `rsync` version.
- Smaller, leaner images by skipping unneeded recommended packages.
- Resolves the Codacy Hadolint `DL3008`/`DL3015` findings on both Dockerfiles.
