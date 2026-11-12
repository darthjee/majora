# Issue: Statistics bug fix: post-fix check

## Description

Part of the statistics bug fix Epic (Epic #1736). Confirm that the duplicated-session pattern
found by #1704 is gone after the fixes, and record the result in
`docs/agents/specs/statistics-bug/findings.md`.

## Depends on

- #1740 Release: version bump (backend and proxy fixes): **done**, 1.6.0 is live.
- #1739 Ops: stop exposing the direct host, **step 1 only** (the custom domain no longer
  reaches the backend): **done** on 2026-11-12. Step 2 of #1739 (removing the direct host's
  `Domain` record) waits for this issue: `Session.domain` is `SET_NULL`, so removing it earlier
  would erase the domain of the sessions this check reads. #1739 stays open until then.
- About a week of production data collected after both (from 2026-11-13).

## Expected Behavior

`findings.md` gains a *Post-fix check* section with aggregated or anonymised results, stating
whether the pattern is gone.

- **Gone:** the section says so; #1739 step 2 (remove the `Domain` record) and the cleanup
  (#1742) can start.
- **Not gone:** the remaining cause is documented and a follow-up issue is created; the cleanup
  does not start.

## Solution

Run **interactively** with the owner, like #1704 (not through `/loop /auto-resolve-issue`).
The architect coordinates and the investigator agent does the work; the architect stops before
each production run for the owner's go-ahead.

### 1. Local check (any time, no need to wait for production data)

- Re-run `emulate.py` with all scenarios against the local stack (`make stack-up`) and
  `analyse.py --validate` on its report.
- Expected: every scenario `MATCH` against the post-#1737 expectations in the investigation
  README; in particular no `ip_changed` session in `ip_change` and `mixed_handlers`, and at most
  one `login_rotation` session in `refresh_burst_with_cookie_logged_in`.
- Unresolved routes have no emulate scenario: they are covered by #1737's backend tests
  (the middleware skips tracking for them).

### 2. Production check (`analyse-prod`)

- Over a date range chosen by the owner, starting after 2026-11-12 (about a week).
- The owner approves the device authorization and **revokes the token afterwards**.
- Expected, reported as aggregate counts:
  - no new `ip_changed` sessions;
  - no sessions whose `first_path` is `unresolved`;
  - no new sessions on the direct host's domain (counted, never named);
  - new sessions with **no domain** reported separately: traffic still reaching the backend
    through the hosting's default hostname, a concern of #1750, not a failure of this check;
  - grouped extra sessions per visitor clearly below the pre-fix numbers in `findings.md`.

### 3. Write-up

Add the *Post-fix check* section to `findings.md` (local result table, production aggregates,
conclusion). Race 2a (no-cookie burst) is known and not addressed by the Epic: it may still
show and is reported, not counted as a failure.

## Out of scope

- Removing the direct host's `Domain` record (owner, #1739 step 2, after this issue).
- Requests through the default hostname (#1750).
- The cleanup of the investigation, scope and export endpoint (#1742).

## Privacy

The repository is public: no real IPs, user ids, session ids, tokens, secrets, hostnames or
production URL in anything committed, posted to an issue or written in the PR. Reports stay
git-ignored.

### Responsible agent

investigator (coordinated by the architect, interactive with the owner)
