# 01 — Rename and split the pytest jobs

Edit `.circleci/config.yml`:

1. **`pytest_with_reports`:** keep the `paths` parameter. The parallel job passes its file list through an environment variable (for example `paths: "$TEST_FILES"`), so the command does not change. Check that the parameter is expanded unquoted inside `run`, so that the shell splits a multi-file list. If this does not work, add a boolean or string parameter instead and keep a single command definition.
2. **Rename** the job `pytest_views_characters` to `pytest_views_game`, both its definition and its workflow entry. Its scope stays `games/tests/views/game/`.
3. **Rename** `pytest_all` to `pytest_non_views` and add `parallelism: 3`. Before `pytest_with_reports`, add a step named "Split test files" that:
   - globs `*_test.py` under every `testpaths` entry with `circleci tests glob` (run from `~/project/backend`);
   - drops everything under `games/tests/views/` (for example `grep -v '^games/tests/views/'`);
   - pipes the list to `circleci tests split --split-by=timings --timings-type=filename`;
   - writes the result to `test-reports/test-files.txt` and exports it with `echo "export TEST_FILES=\"$(tr '\n' ' ' < test-reports/test-files.txt)\"" >> "$BASH_ENV"`.

   Then call `pytest_with_reports` with `paths: "$TEST_FILES"`. Running the file list keeps the `--ignore=games/tests/views/` behaviour, without the flag.
4. **`requires`:** in `coverage-final` and in every tag-only release job (`build-and-release`, `upload_proxy_files`, `upload_fe_files`, `link_photos`, `link_files`, `link_domain`, `upload_admin_assets`, `wake-navi`, `client-release`), replace `pytest_views_characters, pytest_views_rest, pytest_all` with `pytest_views_game, pytest_views_rest, pytest_non_views`. A parallel job is required by its single name.
5. Keep each job's docker images, environment, `working_directory`, Poetry install and "wait for db" steps as they are. Each container gets its own MySQL service container.

## Files to Change

- `.circleci/config.yml`: the renamed jobs, `parallelism`, the split step and the `requires` lists.
