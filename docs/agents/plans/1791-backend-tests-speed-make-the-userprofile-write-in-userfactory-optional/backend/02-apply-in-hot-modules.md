# Apply the opt-out in the hot view modules

Save `docker-compose run --rm majora_tests pytest --collect-only -q games/tests/views/game games/tests/views/games` output to compare later.

In `backend/games/tests/views/game/` and `backend/games/tests/views/games/` (including their helper modules such as `_character_recipe_fixtures.py`, `_character_recipe_exchange_fixtures.py`, `_scoped_token_fixtures.py`), add `with_profile=False` to `UserFactory(...)` calls for users that, in every test that uses them, never authenticate and whose profile the endpoint does not read. Typical candidates: secondary players, object owners, `outsider`/`other_user` users that only appear as data. Leave a call unchanged when in doubt, and leave every user that logs in, gets a token, is force-authenticated or owns a used `ApiToken`.

For shared fixture helpers used by many modules, check every consumer before changing the call.

Run each changed module after editing; a new failure means that user needs the profile, so revert that call. Do not change assertions, skip, `xfail` or delete tests.

Keep a list of the changed modules and how many calls changed in each, for the PR description.

## Files to Change
- `backend/games/tests/views/game/**` — `with_profile=False` on safe `UserFactory(...)` calls.
- `backend/games/tests/views/games/**` — same.
