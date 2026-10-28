# Issue: Statistics dashboard: remove the spec files

## Description
Part of #1678 (Epic: staff dashboard visits summary card). All implementation sub-issues (#1679–#1685) are merged, so the temporary spec can be retired:

- `docs/agents/specs/statistics_dashboard.md`
- `docs/agents/specs/statistics_dashboard/` (`count-endpoint.md`, `clear-endpoint.md`, `tracking-race.md`, `dashboard-card.md`)

Docs-only change, owned by the `architect`.

## Problem
Specs are temporary by convention (`docs/agents/specs.md`): they are removed once the feature is implemented and the knowledge has moved to the permanent docs. Today some of that knowledge lives **only** in the spec:

- `docs/agents/statistics.md` (the feature doc) does not mention the summary endpoint, the staff dashboard card, Clear, the ID reset, the batched clear, the audit log or the tracking-race tolerance.
- `docs/agents/access-control/staff-statistics.md` already covers the summary and Clear endpoints' permissions, but links to the spec for the audit log (`../specs/statistics_dashboard/clear-endpoint.md#audit-log`).
- `docs/agents/specs.md` lists the spec under *Active specs*.

## Expected Behavior
- The spec index and its folder are deleted.
- `docs/agents/specs.md` no longer lists *Statistics Dashboard*.
- No doc outside `docs/agents/issues/` and `docs/agents/plans/` links to the deleted files (historic issue/plan files are left as they are).
- The lasting design knowledge is in the permanent docs, described as **actually merged** (checked against the code), not as originally planned.

## Solution
1. Add the lasting content to `docs/agents/statistics.md`:
   - **Staff dashboard card** — what the card shows, the `day`/`week`/`month` rolling periods, Reload, Clear behind the typed `CLEAR` confirmation, the link to `/#/staff/statistics`; the feature is permanent.
   - **Summary endpoint** — `GET staff/statistics/summary.json` and how it counts unique visitors (pointing to the access-control doc for permissions instead of duplicating it).
   - **Clear** — `DELETE staff/statistics.json`, `statistics/reset.py`, the batched, separately committed deletes, the ID reset (next rows start at id `1`), MySQL-only SQL kept in `reset.py`, no rollback on failure.
   - **Audit log** — server-log-only `staff_statistics_clear` line: fields, levels (INFO success / WARNING failure), what is deliberately not logged (IP, username, email, exception message) and why, the gunicorn-timeout caveat.
   - **Tracking race** — visit tracking and user attachment tolerate a session deleted mid-request (e.g. by a concurrent Clear).

   Check every section against the merged code (`backend/statistics/reset.py`, `backend/staff/views/staff_statistics_clear.py`, the tracking code, the frontend card). Where the code differs from the spec, document the code. Resolve the points the spec left to #1684, such as how partial counts are carried when Clear fails.

   Do not move the spec-only material: sub-issue tables, *Open questions*, *Tests* and *Implemented by* sections.
2. In `docs/agents/access-control/staff-statistics.md`, point the audit-log link to the new `statistics.md` section.
3. Remove the *Statistics Dashboard* entry from `docs/agents/specs.md`.
4. Delete the spec files.
5. Check that no doc still links to `specs/statistics_dashboard`, e.g. `grep -rn statistics_dashboard docs AGENTS.md`, leaving out `docs/agents/issues/` and `docs/agents/plans/`.

## Benefits
- The permanent docs alone describe the feature; nothing depends on a temporary spec.
- No dead links once the spec is gone.
- Closes Epic #1678.
