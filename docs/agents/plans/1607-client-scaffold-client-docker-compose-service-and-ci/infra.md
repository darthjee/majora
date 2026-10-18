# Infra Plan: Client: scaffold client/, docker-compose service and CI

Main plan: [plan.md](plan.md)

## Shared contracts

- **Produce** the `majora_client` service exactly as in [plan.md](plan.md#majora_client-service-infra-produces-client-consumes).
- **Produce** the make targets `client`, `client-install`, `client-tests`, `client-lint`,
  `client-coverage`.
- **Rely on** `client/package.json` scripts `test`, `lint` and `coverage` (lcov at
  `client/coverage/lcov.info`), a committed `client/yarn.lock`, and `npm pack --dry-run` passing.

## Steps

- [01 — Add the majora_client service and ignore entries](infra/01-docker-compose-service.md)
- [02 — Add the client Makefile targets](infra/02-makefile-targets.md)
- [03 — Add the client CI jobs and gating](infra/03-ci-jobs.md)

## CI Checks

- Root: `docker-compose config -q` validates `docker-compose.yml`.
- `.circleci/config.yml`: `circleci config validate` if available, otherwise a YAML parse in a
  container. The new jobs run on the PR itself (`client_tests`, `client_checks`).

## Notes

- Do not touch anything under `client/` (client agent) or `.claude/agents/` / `docs/` (architect).
- `client-release` and `scripts/bump_version.sh client` are #1611, not this issue.
