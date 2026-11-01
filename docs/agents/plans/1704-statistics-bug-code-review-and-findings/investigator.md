# Investigator Plan: Statistics bug: code review and findings

Main plan: [plan.md](plan.md)

## Overview

The investigator reviews the session path, runs both investigation scripts, reproduces the root
cause with an `emulate.py` scenario and writes the findings. The architect does this work itself
in an interactive chat session (see Execution below) and reviews the write-up.

## Context

- Epic #1696; specs in `docs/agents/specs/statistics-bug/` (`hypotheses.md`, `environments.md`,
  `privacy.md`, `investigation-plan.md`, `findings.md` placeholder).
- `emulate.py` (#1702) and `analyse.py` (#1703) are merged in `investigations/statistics-bug/`,
  with its own `docker-compose.yml` (`emulate`, `analyse`, `analyse-prod`) and a git-ignored
  `reports/` folder.
- 1.5.0 (#1701) released the `statistics:read` scope and the tracking columns, so production
  sessions created after its deploy carry `creation_reason`, `first_path` and
  `first_seen_logged`.
- Rules: `docs/agents/investigator.md` (safety rules, ownership) and `privacy.md`.

## Execution

- **Interactive only.** Not run through `/loop /auto-resolve-issue`: every script run waits for
  a device authorization the user approves (locally in the local frontend, in production as a
  production staff user), and a background specialist could not show the approval link.
- **Stop points**, each waiting for the user:
  1. before each local script run (approval of the local authorization);
  2. before the production run (explicit go-ahead, date range, then approval);
  3. on any exploitable finding (see step 05);
  4. before opening the PR (review of the anonymised evidence).
- The PR is not pre-approved: the `shipit` label was removed from the issue; the PR waits for the
  user's review.

## Steps

- [01 — Code review](investigator/01-code-review.md)
- [02 — Local script runs](investigator/02-local-runs.md)
- [03 — Production run](investigator/03-production-run.md)
- [04 — Reproduce the root cause](investigator/04-reproduce.md)
- [05 — Findings write-up and PR](investigator/05-findings-and-pr.md)

## CI Checks

- `investigations/**` is excluded from CI (markdownlint, Codacy, the `checks` job).
- `docs/agents/**`: markdownlint (CI job `checks`), run through docker-compose / make as the
  repo documents; no host runtime.

## Notes

- No change to `backend/`, `frontend/`, `proxy/` or any application code; a fix belongs to the
  issue #1705 creates.
- Tokens stay in memory; the user revokes them after each run (the scripts remind).
- Reports never leave `reports/`. Anything copied out is aggregated or anonymised: masked IPs
  (`203.0.113.x`), aliased ids, counts, route patterns only; never the production URL.
- If the production data is too thin to conclude, say so and pick a later range with the user
  rather than over-reading a few sessions.
