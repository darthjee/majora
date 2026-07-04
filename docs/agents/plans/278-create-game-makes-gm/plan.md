# Plan: Create game makes GM

Issue: [278-create-game-makes-gm.md](../../issues/278-create-game-makes-gm.md)

## Overview
This issue asks that the user who creates a `Game` be automatically registered as its `GameMaster`. Verification shows this behavior is already fully implemented and covered by passing tests — no code changes are required.

## Context
The issue description itself states the behavior "is already fully implemented and tested; there is nothing left to build," and was filed as a follow-up check after the `#236` refactor (commit `6c09436`) introduced this behavior ahead of the issue being opened.

## Verification performed

- Read `source/games/views/games/games_list.py:26-38` (`_create_game`): immediately after `game = serializer.save()`, it runs `GameMaster.objects.create(game=game, user=request.user)`, tying the creating (authenticated) user to the new game as its GameMaster.
- Read `source/games/tests/views/games/games_list_test.py:149-159`: confirms `test_post_creates_game_master_for_creator` (asserts a `GameMaster` row exists for the creator after `POST /games.json`) and `test_post_creates_exactly_one_game_master` (asserts exactly one `GameMaster` row is created per creation call).
- Ran the full file via `docker-compose run --rm majora_tests poetry run pytest games/tests/views/games/games_list_test.py -q` — all 17 tests pass, including both tests above.

## Implementation Steps

None. No production code, tests, migrations, or documentation changes are needed — the feature already exists and is already verified by an existing, passing test suite.

## Files to Change

None.

## Notes
- This plan intentionally results in a no-op PR (or a PR that only removes planning/issue artifacts, per the pipeline's own bookkeeping conventions) — the underlying feature request is already satisfied.
- If a future refactor of `_create_game` accidentally drops the `GameMaster.objects.create(...)` call, the two regression tests referenced above (`games_list_test.py:149-159`) will catch it.
