# Report, expectation checks and local run

- After each scenario, export its window and build the report:
  - per session: `id`, `domain`, `user_id`, `created_at`, `creation_reason`, `first_path`,
    `first_seen_logged`, visit count;
  - per visit: `started_at`, `hits`, `first_path`, `last_path`;
  - expected vs. actual creation reasons, with a clear `MATCH` / `MISMATCH` per scenario.
- Write `reports/emulate-<timestamp>.json` (machine-readable, the input `analyse.py` (#1703)
  is validated against) and a text summary to stdout and `reports/emulate-<timestamp>.txt`.
  Never include the token or secrets. Local IPs are allowed in these git-ignored reports.
- Exit code: `0` when the run completed (mismatches are findings, not failures); non-zero only
  when the run itself failed (guard, authorization, export).
- **Local run:** run every scenario against the local stack, including the production-URL
  refusal and the self-pollution check. Put an anonymised summary (scenario, expected,
  actual, match) in the PR description — no IPs, ids or tokens.

## Files to Change

- `investigations/statistics-bug/emulate.py` — report building and output.
- `investigations/statistics-bug/README.md` — report format and how to read it.
