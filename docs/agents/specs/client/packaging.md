# Packaging

How the `client/` folder is developed, tested and released. Part of the
[client spec](../client.md) (epic #1592). Refined by #1600 and implemented by #1607 (scaffold,
docker-compose service and CI) and #1611 (npm release job).

## Overview

The [library](library.md) and its [CLI](cli.md) are published to npm as one public package.
Development follows the project rule that no runtime runs on the host: everything goes through
docker-compose, and CircleCI runs lint, tests and the release.

## Decisions

### Development

- A `client` service in `docker-compose.yml` runs the client's tooling, like the other services.
  No Node.js runtime is needed on the host.

### CI

- CircleCI runs lint and unit-test jobs for `client/` on every push.

### Release

- The package is published to npm as a **public** package.
- A CircleCI job publishes it when the version in `client/package.json` changes on `main`.
- The job fails if that version already exists on npm.
- The npm token is stored in CircleCI's environment, never in the repository.
- This release flow is separate from the application's release, which runs on version tags.

## Open questions

Settled by #1600:

- The npm package name, after checking which names are free (for example `majora-client` or a
  scoped name such as `@darthjee/majora-client`).
- The test runner and the lint setup.
- `Makefile` targets for the client.
- The base image of the `client` service and the Node version it pins.
- How the release job detects a version change on `main`.

## Affected code

- `docker-compose.yml`: the new `client` service.
- `dockerfiles/`: the image for the `client` service, if a dedicated one is needed.
- `.circleci/config.yml`: the lint, test and release jobs.
- `Makefile`: client targets.
- `client/package.json`: the package name, version, `bin` and scripts.
