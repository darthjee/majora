# Docs

- `docs/agents/specs/pytest-all-long-test/isolation-policy.md`: move the "Cache (#1789)" item
  out of the placeholders into an actual rule: the autouse fixture in `backend/conftest.py`
  clears `memory_cache` before each test; tests never call `memory_cache.clear()`, except a test
  whose subject is clearing, marked `# test-policy: allow memory-cache-clear`.
- `docs/agents/specs/pytest-all-long-test/edge-cases.md` ("Shared in-memory cache"): replace
  "cleared by hand in only 16 test files" with the new state, and list the tests fixed in
  step 01 with their cause (or say none failed).
- `docs/agents/specs/pytest-all-long-test/verification.md`: in "Check-script rules", describe
  the script (path, local command, output, exit codes, how to add a rule, the opt-out marker)
  and set the `memory_cache.clear()` rule's status to "added".
- `docs/agents/specs/pytest-all-long-test/cost-drivers.md`: mark driver 6 (manual
  `memory_cache.clear()`) as addressed by #1789.
- `.claude/agents/backend.md` ("Tests"): add that tests never clear `memory_cache` by hand (the
  autouse fixture does it) and that `poetry run python bin/check_test_policy.py` must pass,
  with the docker-compose command next to the existing ones.

## Files to Change

- `docs/agents/specs/pytest-all-long-test/isolation-policy.md`
- `docs/agents/specs/pytest-all-long-test/edge-cases.md`
- `docs/agents/specs/pytest-all-long-test/verification.md`
- `docs/agents/specs/pytest-all-long-test/cost-drivers.md`
- `.claude/agents/backend.md`
