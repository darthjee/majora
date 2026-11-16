# Docs and verification
Update the Epic specs:

- `docs/agents/specs/pytest-all-long-test/edge-cases.md`, in the "Transactional tests" section:
  - List the 11 sites with their reasons, and state that each one carries a `# transactional:` comment (#1793).
  - Add a "Shared-scope setup" or "base_game" note: `build_base_game()` always registers `testserver`, and `Domain.domain` is unique, so a converted module must use `base.domain` instead of creating its own `testserver`.
- `docs/agents/specs/pytest-all-long-test/isolation-policy.md`:
  - The Transactions section names the `# transactional: <reason>` comment and the `transaction-justification` rule.
  - The Fixture scope section names the `scoped-db-fixture` rule.
  - Replace the "Base object graph (#1793)" placeholder under "Rules added later" with a usage block: `cls.base = build_base_game()` in `setUpTestData`, with its fields and overrides.
- `docs/agents/specs/pytest-all-long-test/verification.md`:
  - "Check-script rules" lists all four rule ids.
  - Both #1793 rows in the table change to "added".
  - Add a "#1793" bullet under "Specific checks".

Then verify:
1. Run `docker-compose run --rm majora_tests poetry run python bin/check_test_policy.py`. It must exit `0`.
2. Run `pytest --collect-only -q`. It must list the same node IDs as the list saved in step 01, plus the new `base_game_test.py` tests.
3. Run the transactional files and the new builder tests in the container.
4. Run lint (flake8/pylint/pydocstyle as in CI) on the changed Python files.
5. After CI, report the before and after times of the affected jobs in the PR description, and add them to `baseline.md`.

## Files to Change
- `docs/agents/specs/pytest-all-long-test/edge-cases.md`
- `docs/agents/specs/pytest-all-long-test/isolation-policy.md`
- `docs/agents/specs/pytest-all-long-test/verification.md`
- `docs/agents/specs/pytest-all-long-test/baseline.md`: timings, after CI
