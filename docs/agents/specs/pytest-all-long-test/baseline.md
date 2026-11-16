# Baseline

Part of the [Backend Tests Speed](../pytest-all-long-test.md) specs (Epic #1785).

Success is measured by runtime, not by counting `INSERT` statements. This page records the
numbers every sub-issue compares against.

## CI

Recorded from CircleCI pipeline 5881 (workflow `e2f98440-57eb-497c-99cc-eb548b62991d`),
2026-11-15:

| Job | Scope (`.circleci/config.yml`) | Duration |
|-----|--------------------------------|----------|
| `pytest_all` (#95739) | `pytest --ignore=games/tests/views/` | **8m 34s** |
| `pytest_views_characters` (#95741) | `pytest games/tests/views/game/` | 5m 04s |
| `pytest_views_rest` (#95737) | `pytest games/tests/views/ --ignore=games/tests/views/game/` | 3m 35s |

Every other job in the workflow finishes in under one minute, so `pytest_all` is the critical
path of the whole pipeline: the workflow wall-clock time is about **8m 43s**, and
`coverage-final` waits on it.

Observations:

- `pytest_all` excludes `games/tests/views/` entirely, yet it is the slowest job. This
  contradicts the assumption that view tests with `setup_method` are the dominant cost, or at
  least shows the non-view tests are the bigger bottleneck for CI wall-clock time (see
  [Cost drivers](cost-drivers.md)).
- The job name `pytest_views_characters` is misleading: it runs `games/tests/views/game/`, not
  character views.
- The three jobs are unbalanced (8m 34s vs 5m 04s vs 3m 35s). Rebalancing them (#1788) is a
  cheap way to reduce wall-clock time without changing any test (see [CI jobs](ci-jobs.md)).

### First durations report

Recorded from CircleCI pipeline 5900 (workflow `ac2f9b80-a8ca-4c39-9769-14fddcf6fdd6`, the
head commit of PR #1797), 2026-11-15, from the `test-reports/` artifacts of each pytest job.
All 3 jobs show the 4 artifacts (`durations-by-file.md`, `durations.txt`, `junit.xml`,
`pytest-output.txt`), and their Tests tabs list 4,805, 2,614 and 1,671 tests.

#### Job durations compared with pipeline 5881

| Job | Pipeline 5881 | Pipeline 5900 | pytest wall time (5900) |
|-----|---------------|---------------|-------------------------|
| `pytest_all` (#96138) | 8m 34s | 8m 08s | 459.8s (4,805 tests) |
| `pytest_views_characters` (#96131) | 5m 04s | 4m 58s | 226.5s (2,614 tests) |
| `pytest_views_rest` (#96130) | 3m 35s | 2m 55s | 122.1s (1,671 tests) |
| Workflow `test` | 8m 43s | 8m 54s | — |

#1787 does not change any test; the differences are run-to-run noise (the extra report step
takes a few seconds). `pytest_all` is still the critical path.

#### Setup and call split

Sums of the `setup`, `call` and `teardown` entries of each job's `durations.txt`. pytest hides
entries under 0.005s (9,001, 2,598 and 2,509 of them), so these sums are lower bounds. The
first `setup` entry of every job (about 50s) is the one-off creation and migration of the test
database, shown separately.

| Job | Test DB creation | Other setup | Call | Teardown |
|-----|------------------|-------------|------|----------|
| `pytest_all` | 51.00s | 53.19s | 219.86s | 91.14s |
| `pytest_views_characters` | 49.69s | 85.20s | 66.74s | 1.88s |
| `pytest_views_rest` | 48.82s | 20.07s | 34.84s | 1.44s |

- In `pytest_all`, 142.21s of the call time and 80.97s of the teardown time come from the two
  slowest migration test files alone.
- In the 360 files that define `setup_method`, excluding the test DB creation, setup takes
  152.09s across the three jobs against 131.34s of call time (49.44s vs 51.04s in `pytest_all`,
  85.07s vs 64.17s in `pytest_views_characters`, 17.58s vs 16.13s in `pytest_views_rest`).
  Files without `setup_method` spend 6.37s in setup in total.

#### Transactional and migration tests in `pytest_all`

The 10 transactional files listed in [Edge cases](edge-cases.md#transactional-tests) take
**244.41s**, or **57.3%** of the job's sum of test times (426.84s) and 53.2% of its pytest wall
time (459.63s). The 4 migration test files alone take **232.93s** (54.6% of the sum), and two of
them, `game_treasure_hidden_backfill_migration_test.py` (113.50s) and
`character_public_slain_migration_test.py` (110.33s), take 52.4%. The 6 concurrency and
reset/clear files take 11.48s (2.7%).

#### `pytest_all`: 10 slowest files

| File | Tests | Total (s) | Share |
|------|------:|----------:|------:|
| `games/tests/models/game/game_treasure_hidden_backfill_migration_test.py` | 2 | 113.50 | 26.6% |
| `games/tests/models/character/character_public_slain_migration_test.py` | 3 | 110.33 | 25.8% |
| `accounts/tests/api_token_authentication_test.py` | 58 | 54.56 | 12.8% |
| `accounts/tests/models/password_reset_token_table_migration_test.py` | 4 | 7.17 | 1.7% |
| `staff/tests/staff_statistics_visit_list_test.py` | 53 | 5.99 | 1.4% |
| `uploads/tests/views_finalize_staff_test.py` | 68 | 5.15 | 1.2% |
| `staff/tests/staff_photos_list_test.py` | 90 | 4.57 | 1.1% |
| `staff/tests/staff_statistics_users_test.py` | 41 | 4.43 | 1.0% |
| `staff/tests/staff_statistics_clear_test.py` | 14 | 4.37 | 1.0% |
| `uploads/tests/views_finalize_copy_test.py` | 49 | 3.61 | 0.8% |

`api_token_authentication_test.py` is third only because its first test pays the 51.00s test
database creation.

#### `pytest_all`: 10 slowest tests

| Phase | Time | Test |
|-------|-----:|------|
| setup | 51.00s | `accounts/tests/api_token_authentication_test.py::TestApiTokenAuthenticationNotBearer::test_no_header_returns_none` (test DB creation) |
| setup | 0.33s | `accounts/tests/api_token_authentication_test.py::TestApiTokenScopeCheck::test_head_follows_get` |
| setup | 0.30s | `staff/tests/staff_statistics_export_test.py::TestStaffStatisticsExportPayload::test_visits_are_earliest_first` |
| setup | 0.29s | `staff/tests/staff_copies_common_items_test.py::TestStaffCopiesCommonItemsList::test_photo_is_the_ready_cover_path` |
| setup | 0.12s | `accounts/tests/models/lowercase_username_email_migration_test.py::TestLowercaseUsernameEmailMigration::test_leaves_an_already_lowercase_username_and_email_untouched` |
| setup | 0.11s | `accounts/tests/models/password_reset_token_expires_at_migration_test.py::TestPasswordResetTokenExpiresAtBackfill::test_backfill_leaves_already_expired_tokens_expired` |
| setup | 0.10s | `accounts/tests/models/user_profile_status_migration_test.py::TestUserProfileStatusBackfill::test_backfill_approves_a_pending_profile` |
| setup | 0.10s | `staff/tests/staff_statistics_visit_list_test.py::TestStaffStatisticsVisitListPagination::test_pages_keep_the_order` |
| setup | 0.10s | `uploads/tests/views_game_document_file_photo_test.py::TestUploadFinalizeGameDocumentFilePhoto::test_orphaned_document_file_photo_upload_returns_403` |
| setup | 0.10s | `staff/tests/staff_statistics_users_test.py::TestStaffStatisticsUsersSort::test_unknown_sort_returns_400` |
| call | 72.21s | `games/tests/models/game/game_treasure_hidden_backfill_migration_test.py::TestGameTreasureHiddenBackfillMigration::test_backfill_sets_hidden_from_the_treasures_own_previous_hidden_value` |
| call | 70.00s | `games/tests/models/character/character_public_slain_migration_test.py::TestCharacterPublicSlainBackfillMigration::test_backfill_copies_false_slain_into_public_slain` |
| call | 4.15s | `accounts/tests/models/password_reset_token_table_migration_test.py::TestPasswordResetTokenTableRenameDDL::test_forward_then_reverse_renames_the_physical_table` |
| call | 1.71s | `accounts/tests/api_token_authentication_test.py::TestApiTokenAuthenticationUnicodeWhitespace::test_unicode_variant_does_not_authenticate_end_to_end[Bearer\xa0{token}]` |
| call | 1.46s | `domains/tests/migrations/migrate_domain_title_test.py::TestMigrateDomainTitleMigration::test_backfill_uses_first_non_empty_title_in_id_order` |
| call | 0.62s | `games/tests/models/character/character_public_slain_migration_test.py::TestCharacterPublicSlainBackfillMigration::test_backfill_copies_true_slain_into_public_slain` |
| call | 0.61s | `accounts/tests/api_token_exclusions_test.py::TestApiTokenExclusions::test_admin_ignores_scoped_tokens` |
| call | 0.37s | `games/tests/admin_test.py::TestGameCommonItemAdmin::test_changelist_returns_ok` |
| call | 0.33s | `miniatures/tests/views/miniatures_token_scopes_test.py::TestMiniaturesTokenScopesReads::test_read_with_write_only_is_refused[collection]` |
| call | 0.30s | `accounts/tests/models/password_reset_token_table_migration_test.py::TestPasswordResetTokenTableState::test_table_after_rename_is_accounts_passwordresettoken` |

The same two migration files also have the two slowest teardowns (41.28s and 39.69s).

#### `pytest_views_characters`: 10 slowest files

| File | Tests | Total (s) | Share |
|------|------:|----------:|------:|
| `games/tests/views/games/_entity_token_scopes_behavior.py` | 20 | 52.46 | 25.2% |
| `games/tests/views/game/npcs/hidden_npc_plain_routes_test.py` | 145 | 13.93 | 6.7% |
| `games/tests/views/game/recipes/game_recipes_create_test.py` | 39 | 2.64 | 1.3% |
| `games/tests/views/game/npcs/token_scopes_test.py` | 45 | 2.55 | 1.2% |
| `games/tests/views/game/npcs/detail/recipes/detail/game_npc_recipe_acquire_test.py` | 17 | 2.43 | 1.2% |
| `games/tests/views/game/npcs/game_npcs_test.py` | 45 | 2.18 | 1.0% |
| `games/tests/views/game/recipes/game_recipe_detail_patch_test.py` | 29 | 2.01 | 1.0% |
| `games/tests/views/game/recipes/recipes_token_scopes_test.py` | 25 | 2.00 | 1.0% |
| `games/tests/views/game/pcs/token_scopes_test.py` | 37 | 1.98 | 1.0% |
| `games/tests/views/game/pcs/detail/recipes/detail/game_pc_recipe_acquire_test.py` | 17 | 1.88 | 0.9% |

`_entity_token_scopes_behavior.py` is a shared behavior module: JUnit reports the file that
defines the test method, and the first test of the job (with the 49.69s test database creation)
is one of its inherited tests, run from `common_items/common_items_token_scopes_test.py`.

#### `pytest_views_characters`: 10 slowest tests

| Phase | Time | Test |
|-------|-----:|------|
| setup | 49.69s | `games/tests/views/game/common_items/common_items_token_scopes_test.py::TestCommonItemTokenScopesPublicReads::test_list_needs_no_scope` (test DB creation) |
| setup | 0.14s | `games/tests/views/game/npcs/detail/recipes/game_npc_recipes_available_test.py::TestGameNpcRecipesAvailableView::test_excludes_hidden_and_known_recipes` |
| setup | 0.14s | `games/tests/views/game/npcs/detail/recipes/detail/game_npc_recipe_acquire_all_test.py::TestGameNpcRecipeAcquireAllView::test_unknown_recipe_returns_404` |
| setup | 0.14s | `games/tests/views/game/npcs/detail/documents/detail/game_npc_document_acquire_all_test.py::TestGameNpcDocumentAcquireAllView::test_superuser_can_acquire_a_hidden_document` |
| setup | 0.13s | `games/tests/views/game/npcs/detail/recipes/game_npc_recipes_available_test.py::TestGameNpcRecipesAvailableView::test_returns_403_for_non_member` |
| setup | 0.13s | `games/tests/views/game/npcs/detail/recipes/detail/game_npc_recipe_acquire_test.py::TestGameNpcRecipeAcquireView::test_missing_id_returns_400` |
| setup | 0.13s | `games/tests/views/game/npcs/detail/recipes/detail/game_npc_recipe_remove_test.py::TestGameNpcRecipeRemoveView::test_returns_403_for_non_member` |
| setup | 0.12s | `games/tests/views/game/npcs/detail/recipes/game_npc_recipes_available_test.py::TestGameNpcRecipesAvailableView::test_url_by_name` |
| setup | 0.12s | `games/tests/views/game/npcs/detail/recipes/game_npc_recipes_available_all_test.py::TestGameNpcRecipesAvailableAllView::test_url_by_name` |
| setup | 0.12s | `games/tests/views/game/npcs/detail/recipes/detail/game_npc_recipe_acquire_test.py::TestGameNpcRecipeAcquireView::test_hidden_npc_returns_404_before_permission_check` |
| call | 1.21s | `games/tests/views/game/common_items/common_items_token_scopes_test.py::TestCommonItemTokenScopesPublicReads::test_list_needs_no_scope` |
| call | 0.58s | `games/tests/views/game/common_items/common_items_token_scopes_test.py::TestCommonItemTokenScopesPublicReads::test_permissions_needs_no_scope` |
| call | 0.47s | `games/tests/views/game/conversations/game_conversations_test.py::TestGameConversationsView::test_url_by_name` |
| call | 0.25s | `games/tests/views/game/pcs/detail/recipes/game_pc_recipes_available_test.py::TestGamePcRecipesAvailableView::test_returns_401_for_unauthenticated` |
| call | 0.24s | `games/tests/views/game/pcs/detail/documents/game_pc_documents_test.py::TestGamePcDocumentsView::test_does_not_include_hidden_field` |
| call | 0.21s | `games/tests/views/game/npcs/detail/treasures/detail/game_npc_treasure_remove_test.py::TestGameNpcTreasureRemoveView::test_unknown_game_slug_returns_404` |
| call | 0.21s | `games/tests/views/game/npcs/detail/game_npc_full_test.py::TestGameNpcFullUpdateView::test_patch_creates_link_via_links_payload` |
| call | 0.16s | `games/tests/views/game/npcs/detail/items/game_npc_items_test.py::TestGameNpcItemsView::test_returns_empty_list_when_no_items` |
| call | 0.07s | `games/tests/views/game/npcs/detail/recipes/detail/game_npc_recipe_acquire_test.py::TestGameNpcRecipeAcquireView::test_other_game_recipe_returns_400_regardless_of_hidden` |
| call | 0.07s | `games/tests/views/game/npcs/detail/recipes/detail/game_npc_recipe_detail_patch_test.py::TestGameNpcRecipeDetailPatchView::test_hidden_npc_returns_404_before_permission_check` |

No single test stands out: the job's cost is many small setups (85.20s of setup outside the
test DB creation, against 66.74s of call).

#### `pytest_views_rest`: 10 slowest files

| File | Tests | Total (s) | Share |
|------|------:|----------:|------:|
| `games/tests/views/access_route_config_test.py` | 7 | 50.66 | 46.9% |
| `games/tests/views/games/_entity_token_scopes_behavior.py` | 40 | 2.00 | 1.8% |
| `games/tests/views/games/games_token_scopes_test.py` | 25 | 1.89 | 1.8% |
| `games/tests/views/treasures/treasures_token_scopes_test.py` | 27 | 1.79 | 1.7% |
| `games/tests/views/games/game_treasures_test.py` | 56 | 1.76 | 1.6% |
| `games/tests/views/games/game_treasures_token_scopes_test.py` | 24 | 1.59 | 1.5% |
| `games/tests/views/common_test.py` | 32 | 1.48 | 1.4% |
| `games/tests/views/polls/polls_token_scopes_test.py` | 24 | 1.36 | 1.3% |
| `games/tests/views/games/game_factions_token_scopes_test.py` | 22 | 1.31 | 1.2% |
| `games/tests/views/games/_common_items_filters_behavior.py` | 28 | 1.17 | 1.1% |

`access_route_config_test.py` is first only because its first test pays the 48.82s test
database creation.

#### `pytest_views_rest`: 10 slowest tests

| Phase | Time | Test |
|-------|-----:|------|
| setup | 48.82s | `games/tests/views/access_route_config_test.py::TestAccessRouteConfigView::test_returns_200` (test DB creation) |
| setup | 0.06s | `games/tests/views/treasures/treasures_token_scopes_test.py::TestTreasureTokenScopesExclusiveGames::test_update_on_another_game_is_refused` |
| setup | 0.06s | `games/tests/views/games/games_token_scopes_test.py::TestGamesTokenScopesPublicReads::test_games_list_needs_no_scope` |
| setup | 0.05s | `games/tests/views/games/game_treasures_token_scopes_test.py::TestGameTreasureTokenScopesRestrictedReads::test_full_without_read_is_refused` |
| setup | 0.05s | `games/tests/views/games/games_token_scopes_test.py::TestGamesTokenScopesWrites::test_outsider_update_is_refused_by_role` |
| setup | 0.05s | `games/tests/views/games/game_treasures_token_scopes_test.py::TestGameTreasureTokenScopesOwnerIntersection::test_player_link_is_forbidden` |
| setup | 0.05s | `games/tests/views/polls/game_poll_votes_test.py::TestGamePollVotesGetView::test_dm_can_view` |
| setup | 0.05s | `games/tests/views/games/games_token_scopes_test.py::TestGamesTokenScopesWrites::test_update_on_another_game_is_refused` |
| setup | 0.05s | `games/tests/views/games/games_token_scopes_test.py::TestGamePhotoUploadTokenScopes::test_upload_without_write_is_refused` |
| setup | 0.05s | `games/tests/views/games/game_treasures_token_scopes_test.py::TestGameTreasureTokenScopesOwnerIntersection::test_outsider_update_is_forbidden` |
| call | 1.54s | `games/tests/views/access_route_config_test.py::TestAccessRouteConfigView::test_returns_200` |
| call | 0.48s | `games/tests/views/game_sessions/game_session_detail_test.py::TestGameSessionDetailView::test_url_by_name` |
| call | 0.22s | `games/tests/views/treasures/treasure_access_test.py::TestTreasureAccessView::test_unauthenticated_returns_null_user_context_fields` |
| call | 0.21s | `games/tests/views/access_route_config_test.py::TestAccessRouteConfigView::test_returns_the_static_config_dict` |
| call | 0.19s | `games/tests/views/games/game_detail_test.py::TestGameDetailPatchView::test_patch_includes_links_in_response` |
| call | 0.17s | `games/tests/views/games/game_possession_detail_test.py::TestGamePossessionDetailView::test_returns_404_for_unknown_game_slug` |
| call | 0.13s | `games/tests/views/games/game_common_items_test.py::TestGameCommonItemsFilters::test_non_numeric_price_is_ignored` |
| call | 0.07s | `games/tests/views/games/game_document_file_photo_upload_test.py::TestGameDocumentFilePhotoUploadView::test_full_upload_lifecycle_finalizes_without_error` |
| call | 0.07s | `games/tests/views/game_sessions/session_messages_list_test.py::TestSessionMessagesListView::test_next_entry_id_query_param_returns_next_page` |
| call | 0.06s | `games/tests/views/treasures/treasure_detail_test.py::TestTreasureDetailPatchView::test_patch_persists_changes` |

### Rebalanced jobs (#1788)

Recorded from CircleCI pipeline 5913 (workflow `0ea63694-0617-48be-bbca-2f8780e403d7`, commit
`f1d88728`, PR #1800), 2026-11-15, from the `test-reports/` artifacts of each pytest job and
each `pytest_non_views` container.

This is the first pipeline after the rename, so `pytest_non_views` had **no timing history**:
its "Split test files" step logged `Requested weighting by historical based timing, but they are
not present. Falling back to weighting by name.` (121, 121 and 120 files per container). The
pipeline of the commit that records these numbers is the first one that splits by timings.
The branch also includes #1798 (merged from `main`), which makes the two slow migration files
cheap, so the gain below is not from #1788 alone.

| Job | Duration | pytest wall time | Tests | Slowest file (total) |
|-----|----------|------------------|------:|----------------------|
| `pytest_views_game` (#96397) | 4m 56s | 268.08s | 2,614 | `games/tests/views/games/_entity_token_scopes_behavior.py` (60.03s) |
| `pytest_views_rest` (#96396) | 2m 58s | 106.27s | 1,671 | `games/tests/views/access_route_config_test.py` (44.75s) |
| `pytest_non_views` (#96398) | 2m 33s | — | 4,805 | — |
| `pytest_non_views` container 0 | 2m 34s | 126.37s | 1,646 | `accounts/tests/api_token_authentication_test.py` (53.88s) |
| `pytest_non_views` container 1 | 2m 24s | 116.42s | 1,634 | `accounts/tests/api_token_exclusions_test.py` (52.50s) |
| `pytest_non_views` container 2 | 1m 55s | 89.02s | 1,525 | `accounts/tests/api_tokens/access_test.py` (41.23s) |
| Workflow `test` | 5m 12s | — | — | — |

- Container durations run from the first to the last step of each container (CircleCI API
  v1.1 step times); the job duration is the one CircleCI reports for the whole job.
- Every slowest file above is slowest only because its first test pays the test database
  creation (about 40–50s). Outside that, container 0's slowest file is
  `character_public_slain_migration_test.py` (11.97s) and container 2's is
  `password_reset_token_table_migration_test.py` (4.94s).
- The two slow migration files from pipeline 5900 split across containers:
  `character_public_slain_migration_test.py` ran in container 0 and
  `game_treasure_hidden_backfill_migration_test.py` (now 0.88s) ran in container 2.
- Exact coverage: the three `test-files.txt` artifacts list 121 + 121 + 120 = 362 files, with no
  file listed twice and none missing or extra, compared with every `*_test.py` under the
  `testpaths` outside `games/tests/views/` at `f1d88728`. Their test counts add up to 4,805, the
  same as `pytest_all` in pipeline 5900.
- `pytest_views_game` (4m 56s) is now the critical path; `coverage-final` waits on it.

#### Compared with pipeline 5900

| Job | Pipeline 5900 | Pipeline 5913 |
|-----|---------------|---------------|
| `pytest_all` → `pytest_non_views` | 8m 08s (459.8s, 4,805 tests) | 2m 33s (containers 2m 34s / 2m 24s / 1m 55s) |
| `pytest_views_characters` → `pytest_views_game` | 4m 58s (226.5s, 2,614 tests) | 4m 56s (268.08s, 2,614 tests) |
| `pytest_views_rest` | 2m 55s (122.1s, 1,671 tests) | 2m 58s (106.27s, 1,671 tests) |
| Workflow `test` | 8m 54s | 5m 12s |

## How to measure

- **CI:** job durations from the CircleCI API or UI, for the pipeline of the PR's head commit,
  compared with the latest `main` pipeline. Since #1787, each pytest job also publishes a
  durations report in its Artifacts tab under `test-reports/` (`durations.txt` per test and
  phase, `durations-by-file.md` per file and directory, `junit.xml`) and populates its Tests
  tab; see [CI jobs](ci-jobs.md#durations-report-1787) for how to read it.
- **Every Epic PR** that touches tests or CI states the before and after time of the affected
  jobs (and of the affected modules, once the durations report exists) in its description, and
  appends them to the [History](#history) table below.

## Local

*Placeholder, filled in by #1794.* #1794 measures a full local run in the `majora_tests`
container, both with and without `--cov`, on a stated machine, right before and after its own
change, and records all four numbers here. Measuring both in one PR on the same machine keeps
the comparison fair.

## Targets

- **CI:** after #1788, the `test` workflow wall-clock time is at most **5m 30s**. Later
  sub-issues (#1789–#1794, #1798) lower it further. Pipeline 5913 meets it at 5m 12s.
- **Local:** set by #1794.

## History

| Sub-issue | Pipeline / machine | Jobs or modules | Before | After |
|-----------|--------------------|-----------------|--------|-------|
| #1787 | CircleCI 5881 → 5900 | `pytest_all` / `pytest_views_characters` / `pytest_views_rest` / workflow | 8m 34s / 5m 04s / 3m 35s / 8m 43s | 8m 08s / 4m 58s / 2m 55s / 8m 54s |
| #1788 | CircleCI 5900 → 5913 | pytest jobs / workflow (`pytest_all` → `pytest_non_views`, `pytest_views_characters` → `pytest_views_game`, `pytest_views_rest`) | 8m 08s / 4m 58s / 2m 55s / 8m 54s | 2m 33s / 4m 56s / 2m 58s / 5m 12s (split by name, no timing history; includes #1798) |
| #1798 | local docker (macOS host, MySQL 8), each file alone, `--durations=0` | `game_treasure_hidden_backfill_migration_test.py` call / teardown | 17.85s / 11.19s | 0.38s / 0.32s |
| #1798 | local docker (macOS host, MySQL 8), each file alone, `--durations=0` | `character_public_slain_migration_test.py` call (both tests) / teardown | 19.98s / 12.70s | 3.53s / 0.31s |
| #1790 | CircleCI, pending the PR pipeline | `pytest_views` / `pytest_non_views` | see previous rows | to be filled in from the PR pipeline (no speed change expected: still one `INSERT` per token) |
