# Plan: Docker images run as root (missing/misplaced USER directive)

Issue: [1156-docker-images-run-as-root--missing-misplaced-user-directive.md](../../issues/1156-docker-images-run-as-root--missing-misplaced-user-directive.md)

## Overview

Silence Codacy's Semgrep (`dockerfile.security.missing-user`) and Hadolint (`DL3002`) findings on 4 Dockerfiles by adding an explicit non-root `USER` directive to the specific intermediate/base build-stage blocks the linters are scoped to. The containers that are actually shipped and run already end each final stage on a non-root `USER` (`app` or `node`); this is a build-time-only, no-functional-risk change.

See [infra.md](infra.md) for the full plan.
