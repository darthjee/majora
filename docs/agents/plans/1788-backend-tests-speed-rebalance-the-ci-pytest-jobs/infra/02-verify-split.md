# 02 — Prove the split runs the full suite once

Show the following evidence in the PR description:

1. **Config:** `circleci config validate` passes, and `grep -nE 'pytest_all|pytest_views_characters' .circleci/config.yml` finds nothing.
2. **Same collection:** run `docker-compose run --rm majora_tests pytest --collect-only -q` on `main` and on the branch. The node IDs must be the same (tests do not change).
3. **Union equals the full suite:**
   - From the PR pipeline, download the 3 `pytest_non_views` `test-reports/test-files.txt` artifacts.
   - Check that the 3 lists do not overlap.
   - Check that their union equals the `*_test.py` files outside `games/tests/views/`, for example compared with `find` inside the `majora_tests` container.
   - Check that the total tests in the jobs' Tests tabs (the 3 containers + `pytest_views_game` + `pytest_views_rest`) equal the full collection count. In pipeline 5900 that was 4,805 + 2,614 + 1,671 = 9,090.
4. **Green and covered:** every pytest job and container passes, each one uploads its partial coverage, `coverage-final` succeeds, and Codacy total coverage does not drop compared with `main`.
5. **Balanced:** the 2 slow migration files (`game_treasure_hidden_backfill_migration_test.py`, `character_public_slain_migration_test.py`) are in different containers in a run that has timing history.

## Files to Change

- None. This step produces evidence for the PR description.
