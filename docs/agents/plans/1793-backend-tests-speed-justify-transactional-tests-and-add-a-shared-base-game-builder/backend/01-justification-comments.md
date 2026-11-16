# Justification comments
Add a `# transactional: <reason>` comment on the line directly above each transactional site. The comment goes above the first decorator, or above the `class`/`def` line when the site has none. Keep the existing migration docstrings, and do not change any test logic.

Reasons:
- **Concurrency sites:** "threads use their own connections and must see committed rows".
- **Reset and clear sites:** "StatisticsReset runs raw ALTER TABLE, which commits implicitly on MySQL".
- **Migration classes:** "migrates the schema with MigrationExecutor; DDL commits implicitly on MySQL".

Sites:
- `statistics/tests/middleware_test.py`: `TestStatisticsSessionMiddlewareLoginBurst` (concurrency)
- `statistics/tests/visit_tracking_test.py`: `TestTrackVisitConcurrency` (concurrency)
- `accounts/tests/models/authorization_request_test.py`: `TestAuthorizationRequestConcurrentTransition` (concurrency)
- `accounts/tests/authorization_requests/poll_test.py`: method `test_only_one_of_two_concurrent_polls_wins_the_approved_to_logged_race`. The comment goes above its decorator, at the method's indentation (concurrency).
- `statistics/tests/reset_test.py`: `TestStatisticsReset` and `TestStatisticsResetEmpty` (reset)
- `staff/tests/staff_statistics_clear_test.py`: `TestStaffStatisticsClearView` (reset)
- `domains/tests/migrations/migrate_domain_title_test.py`: `TestMigrateDomainTitleMigration` (migration)
- `accounts/tests/models/password_reset_token_table_migration_test.py`: `TestPasswordResetTokenTableRenameDDL` (migration)
- `games/tests/models/character/character_public_slain_migration_test.py`: `TestCharacterPublicSlainBackfillMigration` (migration)
- `games/tests/models/game/game_treasure_hidden_backfill_migration_test.py`: `TestGameTreasureHiddenBackfillMigration` (migration)

Before editing, save `pytest --collect-only -q` for the whole suite to compare in step 04. Re-run `grep -rn "TransactionTestCase\|transaction=True" backend` to confirm that no other site exists.

## Files to Change
- The 10 files above: one comment line per site
