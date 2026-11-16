# Issue: Backend tests speed: make the UserProfile write in UserFactory optional

## Description

Part of Epic #1785, which reduces the backend pytest suite runtime (CI first, local runs too). CI is currently held up by the `pytest_all` job at 8m 34s; `pytest_views_characters` takes 5m 04s and `pytest_views_rest` 3m 35s (pipeline 5881).

Let tests whose users never authenticate skip the extra `UserProfile` write done by `UserFactory`.

## Problem

`games/tests/factories/user.py` overrides `_create` to call `manager.create_user(...)` and then `_ensure_approved_profile(user)`. That is two `INSERT`s per user (about 1,492 `UserFactory(` call sites in the test tree), even for users that never log in. Password hashing is not a cost: `settings_test.py` already uses the MD5 hasher.

The profile cannot simply be dropped everywhere. `is_approved()` in `accounts/authentication.py` runs `UserProfile.objects.get_or_create(user=user)`, and a new profile defaults to `pending`. So a user without a profile who authenticates (token, session or `ApiToken`) is treated as logged out. Code that reads `user.profile` (for example the staff users list and statistics serializers, which filter on `profile__status` or read `display_name`) also depends on the row.

## Expected Behavior

- `UserFactory` (and `SuperUserFactory`, by inheritance) accepts `with_profile=False`, which skips the `UserProfile` `INSERT` entirely: no row is created.
- **Approved stays the default.** Without the parameter, behavior is unchanged, so every existing test keeps passing as is. Skipping the profile is an explicit opt-out.
- The opt-out is applied only in the hot view modules (`games/tests/views/game/` and `games/tests/views/games/`), and only to users that never authenticate and whose profile the code under test does not read (for example secondary players or object owners who never send the request).
- The factory docstring states the rule: never opt out a user that authenticates, because the approval gate would create a `pending` profile and the request would be anonymous.
- The PR lists the modules where the opt-out was applied and the measured effect.
- `cost-drivers.md` hypothesis 3 is updated with the outcome.

## Solution

- Add `with_profile` as a factory-boy `Params` entry (default `True`), consumed in `_create` of both `UserFactory` and `SuperUserFactory` so it is never passed to `create_user`/`create_superuser`. Do not change application code.
- Add factory tests: default creates an `approved` profile; `with_profile=False` creates none; `UserProfileFactory(user=UserFactory(with_profile=False), ...)` still works (it uses `update_or_create`).
- Apply `with_profile=False` in the hot view modules where it is safe; leave the rest of the suite to the later module conversions (#1793 and following).
- Owner: `backend` agent. Depends on #1786.

### Verification (applies to every test or CI change in this Epic)

- `pytest --collect-only -q` lists the same node IDs before and after, except for renames the PR lists explicitly.
- The full suite passes in CI; no test is skipped, marked `xfail` or deleted to get there.
- Codacy total coverage does not drop.
- The PR description reports the before and after time of the affected CI jobs, and the new numbers are added to `baseline.md`.
