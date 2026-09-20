# Plan: Refactor: fix unquoted glob in dockerfiles/production_majora/Dockerfile

Issue: [1355-refactor-fix-unquoted-glob-in-dockerfiles-production-majora-dockerfile.md](../../issues/1355-refactor-fix-unquoted-glob-in-dockerfiles-production-majora-dockerfile.md)

## Overview
Prefix the glob in the `builder` stage's `rm -rf */tests` with `./` in `dockerfiles/production_majora/Dockerfile`, clearing Hadolint `SC2035`.

See [infra.md](infra.md) for the full plan.
