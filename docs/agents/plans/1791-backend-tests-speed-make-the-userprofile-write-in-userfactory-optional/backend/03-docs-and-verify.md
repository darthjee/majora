# Docs and verification

Update the Epic spec docs:

- `docs/agents/specs/pytest-all-long-test/cost-drivers.md` — hypothesis 3: describe the `with_profile=False` opt-out, where it was applied, the safety rule, and the measured effect.
- `docs/agents/specs/pytest-all-long-test/isolation-policy.md` — add the factory opt-out and its rule to the guidance for new tests, if the page has a factory/fixtures section.
- `docs/agents/specs/pytest-all-long-test/baseline.md` — add the new `pytest_views` and `pytest_non_views` times once the PR pipeline has run.

Verify:

- `pytest --collect-only -q` lists the same node IDs as before, plus only the new `user_test.py` tests (list them in the PR).
- The full suite passes locally through `docker-compose run --rm majora_tests pytest` and in CI; ruff and `bin/check_test_policy.py` pass.
- Codacy total coverage does not drop.
- The PR description lists the changed modules and call counts, and the before/after times of the `pytest_views` containers and `pytest_non_views` (before: latest main pipeline).

## Files to Change
- `docs/agents/specs/pytest-all-long-test/cost-drivers.md` — hypothesis 3 outcome.
- `docs/agents/specs/pytest-all-long-test/isolation-policy.md` — opt-out rule for new tests.
- `docs/agents/specs/pytest-all-long-test/baseline.md` — new timings.
