# Repoint links and delete the spec

In the same commit as step 01:

- `docs/agents/index.md`: add `- [Testing](testing.md)` under "Conventions".
- `docs/agents/summary.md`: add a 2-4 line entry for `testing.md` under "Conventions".
- `AGENTS.md`: add a `Testing` row to the Documentation table; keep the `--reuse-db` / `make tests-fast` paragraph in Development and end it with a pointer to `docs/agents/testing.md`.
- `.claude/agents/backend.md` (Tests section, line 95) and `.github/agents/backend.agent.md` (line 15): link `../../docs/agents/testing.md` instead of the isolation-policy page.
- `.claude/agents/infra.md` (line 125, `pytest_non_views` row): point at the CI section of `docs/agents/testing.md` instead of `ci-jobs.md`.
- `docs/agents/specs.md`: remove the "Backend Tests Speed" entry.
- Delete `docs/agents/specs/pytest-all-long-test.md` and `docs/agents/specs/pytest-all-long-test/` (`git rm -r`).

Verify: `grep -rn pytest-all-long-test . --exclude-dir=node_modules` finds matches only under `docs/agents/issues/` and `docs/agents/plans/`, and every relative link in the changed files resolves to an existing file.

## Files to Change

- `docs/agents/index.md`, `docs/agents/summary.md`, `AGENTS.md` — link `testing.md`.
- `.claude/agents/backend.md`, `.github/agents/backend.agent.md`, `.claude/agents/infra.md` — repoint links.
- `docs/agents/specs.md` — unregister the spec.
- `docs/agents/specs/pytest-all-long-test.md`, `docs/agents/specs/pytest-all-long-test/` — deleted.
