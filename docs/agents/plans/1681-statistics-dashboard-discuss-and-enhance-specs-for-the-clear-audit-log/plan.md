# Plan: Statistics dashboard: discuss and enhance specs for the clear audit log

Issue: [1681-statistics-dashboard-discuss-and-enhance-specs-for-the-clear-audit-log.md](../../issues/1681-statistics-dashboard-discuss-and-enhance-specs-for-the-clear-audit-log.md)

## Overview

A docs-only change, owned by the architect, that writes the audit-log decisions settled in #1681
into the Statistics Dashboard spec. It defines where the Clear audit entry goes, its fields and
format, its levels, and how failures are logged. It touches no code. #1684 then implements the
logging from the updated spec.

## Context

`docs/agents/specs/statistics_dashboard/clear-endpoint.md` says in several places that the audit
entry's shape is pending (*Contract*, *Behaviour*, *Edge cases*, *Tests*, *Open questions*). The
index `docs/agents/specs/statistics_dashboard.md` lists it under *Open questions* → #1681.

The decisions follow an existing pattern: `backend/staff/views/_api_token_shared.py` and
`_recovery_token_shared.py` log staff actions on the `staff` logger at INFO as a single
`key=value` line with ids only. The `staff` logger is configured in
`backend/majora_project/settings.py` to write to stdout, which Render captures. No backend log
line records an IP today.

## Implementation Steps

### Step 1 — Add an `### Audit log` section to `clear-endpoint.md`

Add it under *Behaviour*, after *Batched clear*, with:

- **Destination:** a server log only, with no model, table or migration. The Clear view
  (`backend/staff/views/staff_statistics_clear.py`) logs with `logging.getLogger(__name__)`, so
  the line goes to the existing `staff` logger. Retention is Render's log retention; nothing is
  shown in the app. Say that a persisted model was rejected and can be a later issue.
- **Format:** one line per run, with a fixed message key, and an example:

  ```text
  2026-10-27 14:02:11,512 INFO staff.views.staff_statistics_clear staff_statistics_clear status=success staff_id=7 deleted_visits=1234 deleted_sessions=321 duration_ms=842
  ```

- **Fields** table: `status` (`success` / `failed`), `staff_id` (`request.user.id`),
  `deleted_visits` and `deleted_sessions` (the response counts; on failure, the rows deleted
  before the error), `duration_ms` (deletes + ID reset, in ms), and `error` (only on failure:
  the exception class name). The timestamp comes from the formatter's `asctime`.
- **Not logged:** the request IP, username, email, the exception message (it may contain SQL)
  and the batch count. Give the IP reasoning briefly: no precedent, it is personal data that
  would outlive the Clear, and Render's request logs already record it.
- **Helper:** `log_statistics_clear(status, staff_id, deleted_visits, deleted_sessions,
  duration_ms, error=None)` in the view module, following `log_api_token_action`.
- **Levels and failure:** success logs at INFO. A failure (database error, safety limit, …) logs
  at WARNING with `status=failed`, the partial counts and `error=`, then re-raises, so the
  endpoint still returns `500`. `reset.py` must make the running counts available when it fails
  (e.g. the raised error carries them); #1684 picks the mechanism. A run killed by the gunicorn
  timeout writes no line.
- **Logging failures:** no special handling, because Python logging never raises into the caller.
- **Security:** the line holds only the staff id, counts, duration, status and an exception class
  name, so it needs no extra protection.

### Step 2 — Point the rest of `clear-endpoint.md` at the new section

- *Contract:* replace "recorded in the audit log (see *Open questions*)" with a link to
  [Audit log](#audit-log).
- *Behaviour:* replace "its shape is pending (see *Open questions*)" in the *Audit log* bullet
  with a link to the section.
- *Edge cases:* in *Failure partway through*, replace "settled by #1681" with: a partial run is
  logged at WARNING with the partial counts (link to the section).
- *Tests:* replace "the audit log entry is written (its shape → #1681)" with two cases using
  `assertLogs('staff', level=...)`:
  - success writes one INFO `status=success` line with the counts and `staff_id`;
  - going over the safety limit writes one WARNING `status=failed` line with partial counts and
    `error=`.
- *Open questions:* remove the #1681 line. If no open questions remain, replace the list with
  "None." and keep the link to the index.

### Step 3 — Update the index `statistics_dashboard.md`

Remove the **Audit log for Clear** → #1681 bullet from *Open questions*. If none remain, say so
in one line ("All open questions are settled.") instead of leaving the heading empty. In the
Clear endpoint entry of the topic list, add a short mention that every Clear is audit-logged,
linking to the new section.

## Files to Change

- `docs/agents/specs/statistics_dashboard/clear-endpoint.md` — the new *Audit log* section, the
  links replacing the pending wording, the concrete tests; remove the #1681 open question.
- `docs/agents/specs/statistics_dashboard.md` — remove the #1681 open question; mention the
  audit log in the Clear entry.

## CI Checks

- Markdown: `yarn lint_md`, run through docker-compose (CI job: `markdownlint`).

## Notes

- This changes no code. The helper, the view and the `reset.py` error carrying partial counts are
  only described here; #1684 adds them.
- The example log line must be in a fenced block with a language (`text`) so markdownlint passes.
- `access-control/staff-statistics.md` is updated by #1684, not here.
