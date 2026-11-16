# 04 — Docs, verification and timings

Docs (Epic #1785 spec, `docs/agents/specs/pytest-all-long-test/`):

- `isolation-policy.md` — move the Tokens (#1790) placeholder out of "Rules added later" into the
  enforced rules: tests and helper modules create tokens with `TokenFactory`, never
  `Token.objects.create`; opt-out `# test-policy: allow token-create`.
- `verification.md` — under the check script entry, list the `token-create` rule and the new scan
  scope (every `.py` file under the `testpaths`, plus the root `conftest.py`).
- `cost-drivers.md` — hypothesis 4: done for tokens by #1790, with the before and after job times;
  status stays open until #1791.
- `baseline.md` — add the new job times.

Verification (Epic rules):

- `poetry run pytest --collect-only -q` gives the same node IDs as the list saved in step 02.
- The full suite passes in CI; no test is skipped, marked `xfail` or deleted.
- Codacy total coverage does not drop.
- The PR description reports the before and after times of `pytest_views` and
  `pytest_non_views`.

## Files to Change

- `docs/agents/specs/pytest-all-long-test/isolation-policy.md`
- `docs/agents/specs/pytest-all-long-test/verification.md`
- `docs/agents/specs/pytest-all-long-test/cost-drivers.md`
- `docs/agents/specs/pytest-all-long-test/baseline.md`
