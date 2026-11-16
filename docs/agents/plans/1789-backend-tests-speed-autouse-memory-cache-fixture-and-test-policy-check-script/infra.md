# Infra Plan: Backend tests speed: autouse memory cache fixture and test-policy check script

Main plan: [plan.md](plan.md)

## Shared contracts

`infra` relies on `backend` providing `backend/bin/check_test_policy.py`:

- Run from the backend root with no arguments: `poetry run python bin/check_test_policy.py`.
- Exit `0` = clean, `1` = violations, `2` = configuration error. Standard library only.

## Implementation Steps

### Step 1 — Run the script in the `checks` job

In `.circleci/config.yml`, job `checks`, add a step after "Check python Lint" and before
"Check Python complexity":

```yaml
      - run:
          name: Check test policy
          command: poetry run python bin/check_test_policy.py
```

The job's "Set folder" step already copies `backend/*` (including `bin/` and `pyproject.toml`)
to the working directory, so no path change is needed. Validate with
`circleci config validate` (inside a container if the CLI is not available; otherwise rely on
the CI run).

### Step 2 — Docs

- `.claude/agents/infra.md` (job table, `checks` row): "ruff lint + complexity check" →
  "ruff lint + test-policy check + complexity check".
- `docs/agents/contributing.md` (`backend/` row): add
  `poetry run python bin/check_test_policy.py` to the local commands.

## Files to Change

- `.circleci/config.yml` — "Check test policy" step in `checks`.
- `.claude/agents/infra.md` — `checks` job description.
- `docs/agents/contributing.md` — local command for `backend/`.

## CI Checks

- `.circleci/`: `circleci config validate` (CI job: the whole workflow; `checks` must pass).

## Notes

- `checks` is already in the `requires` of the release jobs; no workflow change is needed.
- The step must fail the job on exit `1`, which CircleCI does by default.
