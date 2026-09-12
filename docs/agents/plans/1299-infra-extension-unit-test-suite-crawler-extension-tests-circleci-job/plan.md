# Plan: Infra: extension unit test suite + crawler_extension_tests CircleCI job

Issue: [1299-infra-extension-unit-test-suite-crawler-extension-tests-circleci-job.md](../../issues/1299-infra-extension-unit-test-suite-crawler-extension-tests-circleci-job.md)

## Overview

The navi-extension's Jasmine suite (backend + frontend specs) and its
`docker-compose.yml` `extension_tests` service already exist from prior,
already-merged sub-issues (#1293/#1295/#1296/#1298). This issue is purely
infra: add a `crawler_extension_tests` job to `.circleci/config.yml` that
actually runs that suite (lint, then the full suite) in CI, modeled on the
existing `proxy_extension_tests` job.

See [infra.md](infra.md) for the full plan.
