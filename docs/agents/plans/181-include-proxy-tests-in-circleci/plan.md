# Plan: Include proxy tests in CircleCI

Issue: [181-include-proxy-tests-in-circleci.md](../issues/181-include-proxy-tests-in-circleci.md)

## Overview

Add a `proxy-tests` CircleCI job that runs the PHPUnit suite inside the `darthjee/tent:0.8.0` container, uploads partial coverage to Codacy, and blocks `coverage-final` — mirroring how `pytest` and `jasmine` already work. The proxy agent first updates `phpunit.xml` to declare coverage source paths (required by PHPUnit 11), then the infra agent wires the new job into `.circleci/config.yml`.

## Agents involved

- [proxy](proxy.md)
- [infra](infra.md)

## Shared contracts

- **Coverage file format**: Clover XML (`--coverage-clover`)
- **Coverage file path** (inside the container during CI): `/tmp/coverage.xml`
- **Codacy upload command**: `bash <(curl -Ls https://coverage.codacy.com/get.sh) report --partial -l PHP -r /tmp/coverage.xml`
- **PHPUnit source root** (for coverage filter): `/var/www/html/extension` (excludes `tests/` and `vendor/`)
- **Agent sequence**: proxy must commit phpunit.xml changes before infra writes the CI job (the CI job depends on phpunit.xml being coverage-ready), but in practice both changes are independent files so they can be done in parallel.
