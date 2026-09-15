# Plan: Infra: pin FROM darthjee/*-base:latest to explicit tags in majora/vite_majora/production_majora Dockerfiles

Issue: [1328-infra--pin-from-darthjee---base-latest-to-explicit-tags-in-majora-vite-majora-production-majora-dockerfiles.md](../issues/1328-infra--pin-from-darthjee---base-latest-to-explicit-tags-in-majora-vite-majora-production-majora-dockerfiles.md)

## Overview
Pin the `FROM darthjee/*-base` lines in `dockerfiles/majora/Dockerfile`, `dockerfiles/vite_majora/Dockerfile`, and `dockerfiles/production_majora/Dockerfile` to the explicit version already tracked in the root `version` file, instead of `:latest`, so Render deploy builds are reproducible.

See [infra.md](infra.md) for the full plan.
