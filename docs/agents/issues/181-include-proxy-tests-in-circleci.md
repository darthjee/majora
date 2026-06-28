# Issue: Include proxy tests in CircleCI

## Description
The proxy extension has a PHPUnit test suite covering `PhotoUploadHandler` and `TestHeaderMiddleware`, runnable locally via `docker-compose run proxy_tests` using the `darthjee/tent:0.8.0` image. However, these tests are not part of the CircleCI pipeline, so proxy regressions can go undetected until deployment.

## Problem
The current CircleCI `test` workflow runs `pytest` (backend) and `jasmine` (frontend) but has no job for proxy PHPUnit tests. Proxy changes are never validated automatically in CI.

## Expected Behavior
A new CircleCI job runs the PHPUnit proxy test suite inside the `darthjee/tent:0.8.0` container, reports coverage to Codacy, and blocks the `coverage-final` job — mirroring how `pytest` and `jasmine` already work.

## Solution
Add a new CircleCI job (e.g. `proxy-tests`) that:
- Uses the pre-built `darthjee/tent:0.8.0` Docker image (no new image-build job needed)
- Checks out the repo, runs `composer install` in `proxy/extension/`, then runs `vendor/bin/phpunit extension/tests` with coverage output
- Reports coverage to Codacy (same pattern as `pytest` and `jasmine`)
- Is wired into the `test` workflow as a dependency of `coverage-final`, alongside `pytest` and `jasmine`
