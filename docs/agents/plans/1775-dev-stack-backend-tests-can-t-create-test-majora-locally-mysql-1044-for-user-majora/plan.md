# Plan: Dev stack: backend tests can't create test_majora locally (MySQL 1044 for user majora)

Issue: [1775-dev-stack-backend-tests-can-t-create-test-majora-locally-mysql-1044-for-user-majora.md](../../issues/1775-dev-stack-backend-tests-can-t-create-test-majora-locally-mysql-1044-for-user-majora.md)

## Overview
Make the local MySQL test setup match CI and production:

- run `majora_tests` as root;
- pin MySQL 8.4 in dev and CI;
- make `majora_tests` start and wait for a healthy `majora_mysql` without publishing host ports;
- add a `check_infra.sh` guard that fails if the base compose file publishes host ports;
- update the docs.

All of it is infrastructure work owned by the `infra` agent.

See [infra.md](infra.md) for the full plan.
