# Plan: Backend tests speed: justify transactional tests and add a shared base_game builder

Issue: [1793-backend-tests-speed-justify-transactional-tests-and-add-a-shared-base-game-builder.md](../../issues/1793-backend-tests-speed-justify-transactional-tests-and-add-a-shared-base-game-builder.md)

## Overview
Comments, one test helper with its tests, and two check-script rules. Existing tests keep their setup: no module is converted to `base_game` here.

## Context
- Epic #1785. The check script (#1789) already exists, with the rules `memory-cache-clear` and `token-create` and the `# test-policy: allow <rule-id>` opt-out. It runs in the CI `checks` job.
- There are 11 transactional sites in 10 files, listed with their reasons in the issue. The 4 migration classes already justify themselves in docstrings; the 7 `django_db(transaction=True)` sites justify nothing.
- No class-, module- or session-scoped fixture exists today, so `scoped-db-fixture` starts clean.
- `GameFactory`, `PlayerFactory` and `UserFactory` live in `games/tests/factories/`, and `DomainFactory` in `domains/tests/factories/domain.py`. `GameFactory` accepts `game_domain_groups=[...]`.

## Steps

- [01 — Justification comments](backend/01-justification-comments.md)
- [02 — base_game builder](backend/02-base-game-builder.md)
- [03 — Check-script rules](backend/03-check-script-rules.md)
- [04 — Docs and verification](backend/04-docs-and-verify.md)

## CI Checks
- `backend`: `docker-compose run --rm majora_tests poetry run python bin/check_test_policy.py` (CI job: `checks`)
- `backend`: `docker-compose run --rm majora_tests poetry run pytest <paths>` (CI jobs: `pytest_all` and the `pytest_views_*` jobs)
- `backend`: `make`/flake8/pylint lint as configured in the `checks` job

## Notes
- All commands run through `docker-compose`, never on the host. If the `majora_mysql` container name is taken by another worktree, don't remove that container. Stop and report it instead.
- Do not convert any transactional site and do not change any existing test's setup.
- `base_game` always registers `testserver`. Since `Domain.domain` is unique, a test that also creates `testserver` must use `base.domain` instead. Record this in `edge-cases.md`.
