# Local script runs

Bring the local stack up with `make stack-up` and run, through
`docker-compose -f investigations/statistics-bug/docker-compose.yml run --rm ...`:

1. `emulate --dry-run`, then `emulate` with all scenarios. Stop for the user to approve the
   local device authorization; check the self-pollution result is 0.
2. `analyse --validate reports/emulate-<timestamp>.json` on the same window. Stop for approval
   again.

Record, per scenario, the creation reasons, the expected vs. actual counts and any mismatch. A
mismatch inherited from `emulate.py` (a scenario producing an unexpected reason) is evidence, not
a script bug, and is explained against the code review. A real script bug in
`investigations/statistics-bug/` may be fixed here (investigator owns the folder) and noted in
the PR.

## Files to Change

- `investigations/statistics-bug/emulate.py`, `analyse.py` — only if a run exposes a script bug.
