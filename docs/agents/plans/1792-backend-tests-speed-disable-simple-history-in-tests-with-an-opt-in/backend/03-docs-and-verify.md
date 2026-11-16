# Step 3: docs and verification

## Docs (`docs/agents/specs/pytest-all-long-test/`)

- `cost-drivers.md`: driver 7 says history is now off in tests via `SIMPLE_HISTORY_ENABLED` with the
  `history` marker opt-in; correct the "13 test files" figure to the files actually marked.
  Hypothesis 5: add the before/after job times and set its status from them.
- `isolation-policy.md`: replace the #1792 placeholder under "Rules added later" with a `## History`
  section: recording is off in tests; a test that reads `simple_history` rows (or asserts none were
  added) uses `@pytest.mark.history`; `GameDocumentPageHistory` is unaffected.
- `baseline.md`: add the new job times to the history table.

## Verify

- `pytest --collect-only -q` matches the saved list plus the new `history_settings_test.py` tests.
- `poetry run python bin/check_test_policy.py` is clean.
- Full suite passes in CI; nothing skipped, `xfail`ed or deleted.
- Codacy total coverage does not drop.
- PR description reports before/after times of `pytest_all`, `pytest_views_characters`,
  `pytest_views_rest` (and any other split view jobs).
