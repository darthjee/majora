# Plan: Backend tests speed: justify transactional tests and add a shared base_game builder

Issue: [1793-backend-tests-speed-justify-transactional-tests-and-add-a-shared-base-game-builder.md](../../issues/1793-backend-tests-speed-justify-transactional-tests-and-add-a-shared-base-game-builder.md)

## Overview
Add a `# transactional: <reason>` comment above each of the 11 transactional test sites, add the `build_base_game()` builder for `setUpTestData`, and add two rules to `bin/check_test_policy.py`: `transaction-justification` and `scoped-db-fixture`. The Epic spec docs are updated to match. All of this work is in `backend/` and the Epic specs.

See [backend.md](backend.md) for the full plan.
