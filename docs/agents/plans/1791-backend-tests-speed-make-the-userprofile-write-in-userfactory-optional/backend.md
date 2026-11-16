# Plan: Backend tests speed: make the UserProfile write in UserFactory optional

Issue: [1791-backend-tests-speed-make-the-userprofile-write-in-userfactory-optional.md](../../issues/1791-backend-tests-speed-make-the-userprofile-write-in-userfactory-optional.md)

## Overview

`UserFactory` writes two rows per user: the `auth_user` row and an `approved` `UserProfile`. This plan adds a `with_profile` factory parameter (default `True`) that skips the profile row, applies it only in `games/tests/views/game/` and `games/tests/views/games/` to users that never authenticate, and documents the result. No application code changes.

## Context

- Part of Epic #1785; depends on #1786. Cost driver 3 in `docs/agents/specs/pytest-all-long-test/cost-drivers.md`.
- `backend/games/tests/factories/user.py`: `UserFactory._create` calls `manager.create_user(...)` then `_ensure_approved_profile(user)`; `SuperUserFactory` does the same with `create_superuser`. `UserProfileFactory` uses `update_or_create(user_id=...)`, so it works whether or not a profile exists.
- `backend/accounts/authentication.py` `is_approved()` runs `UserProfile.objects.get_or_create(user=user)`; the model default status is `pending`. A user without a profile who authenticates (DRF token, session, `ApiToken`) is therefore treated as anonymous. This is the hard safety rule for the opt-out.
- App code that reads the profile: `staff/views/staff_users_list.py` (`profile__status`, `profile__display_name`), `staff/serializers/statistics_user_identity.py` (`user.profile.display_name`, tolerates a missing row), `games/views/games/games_list.py` (`getattr(user, 'profile', None)`), `accounts/serializers/auth/my_account_*` (`get_or_create`).
- `settings_test.py` already uses the MD5 password hasher, so hashing is not a cost.
- There are about 1,492 `UserFactory(` call sites; 797 are in the two hot directories. No factory tests exist yet.

## Steps

- [01 — Add the with_profile parameter](backend/01-factory-parameter.md)
- [02 — Apply the opt-out in the hot view modules](backend/02-apply-in-hot-modules.md)
- [03 — Docs and verification](backend/03-docs-and-verify.md)

## CI Checks

- `checks` job: ruff and `bin/check_test_policy.py`; locally `docker-compose run --rm majora_tests ruff check .` (see AGENTS.md for the exact make targets).
- `pytest_views` (parallel containers) and `pytest_non_views`: locally `docker-compose run --rm majora_tests pytest <path>`.

## Notes

- Run every command through `docker-compose` / `make`, never on the host.
- Never opt out a user that sends a request in the test (logs in, gets a token, is `force_authenticate`d, or owns an `ApiToken` used in the test). A failing test after opting out is the signal to revert that call, not to change the assertion.
- Do not opt out users in tests whose endpoint reads `user.profile` for that user (staff users list, statistics, games list, my account).
