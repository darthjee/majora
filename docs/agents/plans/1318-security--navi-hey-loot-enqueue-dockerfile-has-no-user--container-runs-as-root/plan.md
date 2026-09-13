# Plan: Security: navi_hey_loot_enqueue Dockerfile has no USER, container runs as root

Issue: [1318-security--navi-hey-loot-enqueue-dockerfile-has-no-user--container-runs-as-root.md](../../issues/1318-security--navi-hey-loot-enqueue-dockerfile-has-no-user--container-runs-as-root.md)

## Overview
Add an explicit non-root `USER node` directive to `dockerfiles/navi_hey_loot_enqueue/Dockerfile`, resolving the Codacy SRM (IaC) finding and bringing this image in line with every other image in `dockerfiles/`.

See [infra.md](infra.md) for the full plan.
