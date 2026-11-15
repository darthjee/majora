# Publish the reports from the three pytest jobs

Change `pytest_views_characters`, `pytest_views_rest` and `pytest_all` in `.circleci/config.yml` so each one produces and stores its reports. Keep the job names, paths, coverage flags and the Codacy step unchanged.

- Tests step: create the reports directory and run, keeping each job's current paths:

  ```bash
  mkdir -p test-reports
  poetry run pytest <current paths> --cov --cov-report=lcov:coverage/lcov.info \
    --durations=0 --junitxml=test-reports/junit.xml -o junit_family=xunit1 \
    | tee test-reports/pytest-output.txt
  ```

  CircleCI's default shell is `/bin/bash -eo pipefail`, so a pytest failure still fails the step through the pipe. `xunit1` adds the `file` attribute that the summary script and CircleCI timing-based splitting (#1788) need.
- New step "Durations report", `when: always`: extract the "slowest durations" section of `test-reports/pytest-output.txt` into `test-reports/durations.txt` (from the `slowest durations` banner line up to, not including, the next `====` banner line, e.g. with `awk`), then run `poetry run python bin/junit_summary.py test-reports/junit.xml test-reports/durations-by-file.md`. Guard both so a missing input (pytest crashed before writing) does not hide the original failure (`[ -f test-reports/junit.xml ] && ...`).
- New steps, `when: always`: `store_test_results: path: test-reports` and `store_artifacts: path: test-reports` (destination `test-reports`).
- The Codacy "Upload coverage to Codacy (partial)" step stays right after the Tests step, unchanged.
- Avoid repeating the same steps three times: since the config is `version: 2.1`, add a reusable command under a top-level `commands:` key (e.g. `pytest_with_reports` taking a `paths` parameter, or a `publish_test_reports` command for the post-pytest steps). Do not touch `coverage-final` or any release job's `requires`.
- Add `backend/test-reports/` to the root `.gitignore`, next to `backend/coverage/`.

## Files to Change
- `.circleci/config.yml` — pytest flags, report steps, optional reusable `commands:` entry.
- `.gitignore` — ignore `backend/test-reports/`.
