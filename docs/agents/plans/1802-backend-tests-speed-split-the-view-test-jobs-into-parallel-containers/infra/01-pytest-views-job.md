# Shared split command and the pytest_views job

Move #1788's inline "Split test files" logic into a reusable command and use it in both parallel jobs, so the two splits cannot drift.

1. Under top-level `commands:` (next to `pytest_with_reports`), add `split_test_files`. It has two parameters:
   - `include` (string): a regex of path prefixes to keep, for example `'^games/tests/views/'` for views and `'.'` for everything;
   - `exclude` (string, default `'^$'`, which matches nothing): a regex of path prefixes to drop, for example `'^games/tests/views/'` for non-views.

   It runs the same body as today's step:
   - `mkdir -p test-reports`, `set -f`;
   - build the `<testpath>/*_test.py <testpath>/**/*_test.py` patterns from every `testpaths` entry in `pyproject.toml`;
   - `circleci tests glob ... | sort -u | grep -E '<< parameters.include >>' | grep -Ev '<< parameters.exclude >>' | circleci tests split --split-by=timings --timings-type=filename > test-reports/test-files.txt`;
   - echo the per-container count;
   - fail when the file is empty;
   - append `export TEST_FILES=...` to `$BASH_ENV`.

   Keep the step name "Split test files". Using the `testpaths` glob for both jobs keeps a single source of truth; `games/tests` is a `testpaths` entry, so the views glob is covered.
2. In `pytest_non_views`, replace the inline step with `- split_test_files: { include: '.', exclude: '^games/tests/views/' }`. Before committing, check the generated pipeline (`circleci config process`) to confirm the produced shell command is equivalent to today's.
3. Replace the `pytest_views_game` and `pytest_views_rest` job definitions with one `pytest_views` job:
   - `parallelism: 3`;
   - the same executor and MySQL service blocks and `working_directory: ~/project/backend`;
   - the steps checkout, Poetry Install, wait for db, then `split_test_files: { include: '^games/tests/views/' }`, then `pytest_with_reports: { paths: "$TEST_FILES" }`.

   Add a short comment above it, in the style of the comment above `pytest_non_views`: "Runs every test under games/tests/views/ (#1802), split across parallel containers by the per-file timings stored from the JUnit report."
4. In the `test` workflow, replace the `pytest_views_game` and `pytest_views_rest` entries with one `pytest_views` entry, with `filters: &all_tags` and `requires: [release-circleci_majora-base, release-circleci_majora-base-arm64]`. Move the `&all_tags` anchor definition to whichever job comes first, since `pytest_views_game` defined it.

## Files to Change
- `.circleci/config.yml` — new `split_test_files` command, `pytest_non_views` uses it, `pytest_views` replaces the two view jobs, `test` workflow entries.
