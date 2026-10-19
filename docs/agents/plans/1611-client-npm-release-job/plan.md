# Plan: Client: npm release job

Issue: [1611-client-npm-release-job.md](../../issues/1611-client-npm-release-job.md)

## Overview

Publish `majora-client` to npm from a new `client-release` CircleCI job that runs on app version
tags behind the full app gate, and only publishes when `client/package.json`'s version changed
since the previous app tag. Add a `scripts/bump_version.sh client X.Y.Z` form and document the
release process in `docs/agents/contributing.md`.

See [infra.md](infra.md) for the full plan.
