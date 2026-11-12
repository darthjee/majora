# Investigator Plan: Statistics bug fix: post-fix check

Main plan: [plan.md](plan.md)

## Overview

Re-run the investigation scripts after the fixes, locally and in production, and write the
result into `docs/agents/specs/statistics-bug/findings.md`. No application code changes.

## Context

- Fix Epic #1736. Shipped: #1737 (session reused on an IP change, visit `first_ip`/`last_ip`,
  unresolved routes not tracked), #1738 (custom handlers forward the signed client IP), #1732
  and #1733, released as 1.6.0 (#1740), live in production.
- #1739 step 1 done on 2026-11-12: the direct host's custom domain no longer reaches the backend.
  Its `Domain` record is still in place on purpose (`Session.domain` is `SET_NULL`); the owner
  removes it after this issue (#1739 step 2).
- Tooling in `investigations/statistics-bug/` (README, `docker-compose.yml` services `emulate`,
  `analyse`, `analyse-prod`; reports in the git-ignored `reports/`). The README's scenario table
  already holds the post-#1737 expectations.
- Pre-fix evidence and the reproducing-scenario table: `findings.md`.
- Rules: `docs/agents/investigator.md` and `docs/agents/specs/statistics-bug/privacy.md`.

## Execution

- **Interactive only**, like #1704: not run through `/loop /auto-resolve-issue`. Every script
  run waits for a device authorization the owner approves.
- **Stop points**, each waiting for the owner:
  1. before the local run (approval in the local frontend);
  2. before the production run: explicit go-ahead and date range (from 2026-11-13, about a week
     or more), then approval; the owner revokes the token afterwards;
  3. if the pattern is not gone (see step 03);
  4. before opening the PR (review of the aggregated evidence).

## Steps

- [01 — Local check](investigator/01-local-check.md)
- [02 — Production check](investigator/02-production-check.md)
- [03 — Post-fix check write-up and PR](investigator/03-write-up-and-pr.md)

## CI Checks

- `investigations/**` is excluded from CI.
- `docs/agents/**`: markdownlint (CI job `checks`), through docker-compose / make; no host
  runtime.

## Notes

- No change to `backend/`, `frontend/`, `proxy/` or the investigation scripts. If a script needs
  a change to read the post-fix data (for example visit IPs), raise it with the owner first.
- Tokens stay in memory only; reports never leave `reports/`. Anything copied out is aggregated
  or anonymised (`--anonymised`): masked IPs, aliased ids, counts, route patterns; never the
  production URL or any hostname, including the direct host.
- Race 2a (no-cookie burst) is known and not addressed by the Epic: it may still show; report it,
  do not count it as a failure.
- If the production data is too thin to conclude, say so and pick a longer range with the owner.
