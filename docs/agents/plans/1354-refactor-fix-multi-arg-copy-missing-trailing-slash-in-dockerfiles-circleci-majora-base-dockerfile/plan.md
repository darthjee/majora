# Plan: Refactor: fix multi-arg COPY missing trailing slash in dockerfiles/circleci_majora-base/Dockerfile

Issue: [1354-refactor-fix-multi-arg-copy-missing-trailing-slash-in-dockerfiles-circleci-majora-base-dockerfile.md](../../issues/1354-refactor-fix-multi-arg-copy-missing-trailing-slash-in-dockerfiles-circleci-majora-base-dockerfile.md)

## Overview
Add the missing trailing slash to the destination of the multi-source `COPY` in `dockerfiles/circleci_majora-base/Dockerfile`, clearing Hadolint `DL3021`.

See [infra.md](infra.md) for the full plan.
