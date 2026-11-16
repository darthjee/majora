# Issue: Backend tests speed: justify transactional tests and add a shared base_game builder

## Description

Part of Epic #1785, which reduces the backend pytest suite runtime (CI first, local runs too). CI is currently held up by the `pytest_all` job at 8m 34s; `pytest_views_characters` takes 5m 04s and `pytest_views_rest` 3m 35s (pipeline 5881).

This issue does three things: it justifies each transactional test with a tagged comment, adds the shared `base_game` builder that the later module conversions will use, and adds two rules to `bin/check_test_policy.py`: transaction justification and fixture scope.

## Problem

10 test files use real transactions (`TransactionTestCase` or `django_db(transaction=True)`), with 11 sites in total. Real transactions are expensive on MySQL: every table is flushed after each test, and migration tests migrate the schema backwards and forwards. Nothing marks why each of them needs it, and nothing stops new ones from being added without a reason.

| File | Site(s) | Why it needs real transactions |
|------|---------|--------------------------------|
| `statistics/tests/middleware_test.py` | `TestStatisticsSessionMiddlewareLoginBurst` | threads (`threading.Barrier`) use their own connections and must see committed rows |
| `statistics/tests/visit_tracking_test.py` | `TestTrackVisitConcurrency` | same (concurrent `track_visit`) |
| `accounts/tests/models/authorization_request_test.py` | `TestAuthorizationRequestConcurrentTransition` | same (concurrent transition) |
| `accounts/tests/authorization_requests/poll_test.py` | `test_only_one_of_two_concurrent_polls_wins_the_approved_to_logged_race` (a method) | same (concurrent polls) |
| `statistics/tests/reset_test.py` | `TestStatisticsReset`, `TestStatisticsResetEmpty` | `StatisticsReset` runs raw `ALTER TABLE ... AUTO_INCREMENT`, which commits implicitly on MySQL, so it cannot run inside the test transaction |
| `staff/tests/staff_statistics_clear_test.py` | `TestStaffStatisticsClearView` | same (the endpoint runs `StatisticsReset`) |
| `domains/tests/migrations/migrate_domain_title_test.py` | `TestMigrateDomainTitleMigration` | migrates the schema with `MigrationExecutor`; DDL commits implicitly on MySQL |
| `accounts/tests/models/password_reset_token_table_migration_test.py` | `TestPasswordResetTokenTableRenameDDL` | same |
| `games/tests/models/character/character_public_slain_migration_test.py` | `TestCharacterPublicSlainBackfillMigration` | same |
| `games/tests/models/game/game_treasure_hidden_backfill_migration_test.py` | `TestGameTreasureHiddenBackfillMigration` | same |

The 4 migration classes already explain this in their docstrings. The 7 pytest sites explain nothing.

Every module also rebuilds its own game, DM user and DM player per test, by hand. About 330 `PlayerFactory(..., is_dm=True)` calls exist, and there is no shared builder.

## Expected Behavior

- **Justification comment.** Each of the 11 sites has a `# transactional: <reason>` comment on the line directly above it: above the first decorator, or above the `class`/`def` line when it has none. The reason must not be empty. The migration docstrings stay. No site is converted to non-transactional.
- **`base_game` builder.** `build_base_game(**overrides)` lives in `backend/games/tests/factories/base_game.py` and is exported from `games.tests.factories`. It returns a frozen dataclass with these fields:
  - `game`
  - `dm_user`
  - `dm_player` (`is_dm=True`, linking `dm_user` to `game`)
  - `domain`: always `DomainFactory(domain='testserver')`, with its domain group attached to the game, so that the default test client resolves the game.

  It is designed to be called from `setUpTestData` (`cls.base = build_base_game()`) and uses the existing factories. Overrides cover at least the game name and slug and the DM username. It is **not** a pytest fixture scoped to a class, module or session.
- **Check script rules.** `bin/check_test_policy.py` gets two new rules:
  - `transaction-justification` flags a `TransactionTestCase` subclass, or a `django_db(...)` mark with `transaction=True` on a class or function, when the line directly above it is not a `# transactional: <non-empty reason>` comment.
  - `scoped-db-fixture` flags a `@pytest.fixture` with `scope` set to `class`, `module`, `package` or `session` that takes or uses `django_db_blocker`. Without the blocker, pytest-django already refuses database access in such fixtures, so that is the only way such a fixture can write to the database.

  Both rules honour the existing `# test-policy: allow <rule-id>` opt-out. Both are added only once the codebase is clean, so the script exits `0` on `main`.
- **Tests.**
  - The builder has tests: it creates the four objects, they are linked, and overrides apply.
  - The existing check-script rules have no automated tests. The PR shows each new rule working by running the script against temporary samples, then removing them. The samples cover: the flagged case, the justified or allowed case, and the cases that must not be flagged (a non-transactional `django_db`, a function-scoped fixture, a scoped fixture without the blocker).
- **Docs.**
  - `edge-cases.md` lists the 11 sites with their reasons, and notes that `base_game` always registers `testserver`, so a converted module that creates its own `testserver` domain must use the builder's domain instead.
  - `isolation-policy.md` replaces the "Base object graph (#1793)" placeholder with the builder's usage. Its Transactions section names the `# transactional:` comment.
  - `verification.md` marks both rules as "added" and lists the rule ids.

## Solution

- Comments, one new helper with its tests, and two check-script rules with their tests. Existing tests keep their current setup: conversions to `base_game` are separate sub-issues, created once the durations report names the slow modules.
- Owner: `backend` agent. Depends on #1789 (check script), which is merged.

### Verification (applies to every test or CI change in this Epic)

- `pytest --collect-only -q` lists the same node IDs before and after, plus the new builder and rule tests.
- The full suite passes in CI; no test is skipped, marked `xfail` or deleted to get there.
- `bin/check_test_policy.py` exits `0`, and adding a transactional test without the comment makes it exit `1`.
- Codacy total coverage does not drop.
- The PR description reports the before and after time of the affected CI jobs, and the new numbers are added to `baseline.md`.
