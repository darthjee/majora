# Plan: Infra: pin apt package versions and use --no-install-recommends in *-majora-base Dockerfiles

Issue: [1329-infra--pin-apt-package-versions-and-use---no-install-recommends-in---majora-base-dockerfiles.md](../../issues/1329-infra--pin-apt-package-versions-and-use---no-install-recommends-in---majora-base-dockerfiles.md)

## Overview
Pin the `rsync` apt package version and add `--no-install-recommends` to the `apt-get install` line in both `dockerfiles/circleci_majora-base/Dockerfile` and `dockerfiles/vite_majora-base/Dockerfile`, resolving Codacy Hadolint findings `DL3008`/`DL3015`.

See [infra.md](infra.md) for the full plan.
