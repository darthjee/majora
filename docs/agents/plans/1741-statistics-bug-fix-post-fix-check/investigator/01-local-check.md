# Local check

Bring the local stack up from `main` (`make stack-up`) and run every scenario:

```bash
docker-compose -f investigations/statistics-bug/docker-compose.yml run --rm emulate
```

Then validate the report with `analyse.py`:

```bash
docker-compose -f investigations/statistics-bug/docker-compose.yml run --rm analyse \
  --from <date> --to <date> --validate reports/emulate-<timestamp>.json
```

Expected: every scenario `MATCH` against the README's expectations; in particular no
`ip_changed` session in `ip_change` and `mixed_handlers`, and no `login_rotation` session beyond
one in `refresh_burst_with_cookie_logged_in`. `refresh_burst_no_cookie_anonymous` (race 2a) may
still create several `no_cookie` sessions: expected, not a failure. Any `MISMATCH` is a finding to
discuss with the owner before going on.

Unresolved routes have no scenario; #1737's backend tests cover them. Do not browse the local site
during the run.

## Files to Change

- None (reports stay in the git-ignored `reports/`).
