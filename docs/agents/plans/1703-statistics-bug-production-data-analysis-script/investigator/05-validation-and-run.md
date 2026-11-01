# Validation mode and local run

Prove that the analysis recovers what `emulate.py` produced, before it is ever trusted on
production.

## `--validate <emulate report.json>`

Local targets only; it is refused together with `--production`.

1. Load the emulate report, and authorize once.
2. For each scenario that is not `skipped`:
   - fetch the local export for the scenario's `window.filtered_from` / `filtered_to`, using
     the export's day range with `tz=UTC`, then filtered by `created_at` inside the window;
   - run steps 02–03 on those sessions only.
3. Compare, per scenario:
   - **Sessions:** the session ids analysed must equal the ids in the emulate report's
     `sessions` for that scenario.
   - **Duplicates:** each emulate scenario is one visitor, so the expected extras are the
     scenario's session count minus 1. Analysed extras must equal that, and all of the
     scenario's sessions must end up in one group.
   - **Reasons:** the recovered `creation_reason` counts must satisfy the scenario's
     `expected.exact` / `at_most`, with the same rule as `emulate.py`'s `check_expectation`.
     No disagreement may be left unexplained.
4. **Self-pollution:** with the skip secret present, no session in the windows may have a
   `first_path` from `SELF_ROUTES`.
5. Print a per-scenario `match` / `mismatch` line with the reasons. Write
   `validate-<stamp>.json` / `.txt` to `reports/`. Exit 0 if everything matches, 1 otherwise.

## Local run

1. With the local stack up:
   - run `docker-compose -f investigations/statistics-bug/docker-compose.yml run --rm emulate`;
   - approve the request as the local staff user;
   - then run `... run --rm analyse --validate reports/emulate-<stamp>.json --from <day> --to <day>`.
2. Iterate on grouping and classification until every scenario matches. If a mismatch is
   genuinely a finding, for example a scenario producing an unexpected reason, record it for
   #1704 rather than tuning it away.
3. Also check:
   - `--from` / `--to` are required;
   - `--production` without `STATISTICS_PROD_URL` is refused;
   - `--validate` together with `--production` is refused;
   - a denied request stops cleanly with no report.

## README

Add an `analyse.py` section to `investigations/statistics-bug/README.md`:

- purpose and safety;
- local and production commands, noting that the production run belongs to #1704 and needs the
  user's go-ahead and approval;
- the 1-hour approval wait;
- revoking the token afterwards from the account page;
- the bounded production side effect (the authorization requests are tracked);
- validation mode.

## PR description

Only the aggregated validation summary: per-scenario match or mismatch and reason counts. No
ids, IPs or URLs.

## Files to Change

- `investigations/statistics-bug/analyse.py`: validation mode.
- `investigations/statistics-bug/README.md`: the `analyse.py` section.
