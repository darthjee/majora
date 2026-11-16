# Autouse fixture and manual clears

Add the fixture and remove the manual calls.

1. In `backend/conftest.py`, add a function-scoped autouse fixture, e.g.
   `clear_memory_cache`, with a docstring explaining why (process-wide cache, isolation policy,
   Epic #1785). It calls `memory_cache.clear()` and then `yield`s; no teardown clear. Import
   `memory_cache` inside the fixture (or at module level after the `DJANGO_SETTINGS_MODULE`
   default is set) so importing the conftest does not touch Django settings too early.
2. Remove every setup-time `memory_cache.clear()` in these 15 files, and the
   `from majora_project.cache import memory_cache` import where it becomes unused:
   - `statistics/tests/middleware_test.py`
   - `accounts/tests/middleware_test.py`
   - `accounts/tests/authorization_requests/poll_test.py`
   - `staff/tests/staff_statistics_export_test.py`
   - `staff/tests/staff_cache_clear_test.py` (keep the priming `memory_cache.set(...)`)
   - `staff/tests/staff_cache_summary_test.py`
   - `staff/tests/staff_statistics_export_access_test.py`
   - `games/tests/middleware_test.py`
   - `games/tests/views/games/games_list_test.py`
   - `games/tests/views/games/games_token_scopes_test.py`
   - `games/tests/caches/character_editor_cache_test.py`
   - `games/tests/caches/game_player_cache_test.py`
   - `games/tests/caches/admin_or_staff_cache_test.py`
   - `games/tests/caches/registered_domains_cache_test.py`
   - `games/tests/caches/domain_games_cache_test.py`

   Some calls sit outside `setup_method`/`setUp` (e.g. module-level helpers or `setUpTestData`
   around `statistics/tests/middleware_test.py:46`, `accounts/tests/middleware_test.py:146`,
   `games/tests/middleware_test.py:174,212`, `games/tests/views/games/games_list_test.py:26`,
   `staff/tests/staff_statistics_export_access_test.py:108`): read each one; if it is a
   mid-test clear that the test's behavior depends on, decide whether it is really testing
   clearing (keep it with the opt-out marker) or only resetting state the fixture now resets
   (remove it). Expectation: only the call below stays.
3. Keep the call in `games/tests/caches/registered_domains_cache_test.py::test_cleared_by_memory_cache_clear`
   and append `# test-policy: allow memory-cache-clear` to that line.
4. Update docstrings that say "and clear the shared memory cache" so they no longer claim it.
5. Run the full suite (`docker-compose run --rm majora_tests pytest`). Fix every test that now
   fails because it relied on cache state from an earlier test or from class setup, and keep a
   list (node ID + one-line cause) for the PR and `edge-cases.md`.
6. Run `ruff check .`.

## Files to Change

- `backend/conftest.py` — autouse `clear_memory_cache` fixture.
- The 15 test files above — remove manual clears and unused imports; one opt-out marker.
- Any test that fails after the change — fix its setup (listed in the PR).
