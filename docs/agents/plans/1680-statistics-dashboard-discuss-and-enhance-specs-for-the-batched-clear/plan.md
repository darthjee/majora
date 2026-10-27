# Plan: Statistics dashboard: discuss and enhance specs for the batched clear

Issue: [1680-statistics-dashboard-discuss-and-enhance-specs-for-the-batched-clear.md](../../issues/1680-statistics-dashboard-discuss-and-enhance-specs-for-the-batched-clear.md)

## Overview

A docs-only change, owned by the architect, that writes the decisions settled in #1680 into the
Statistics Dashboard spec. It sets out how Clear deletes the data: batching, commits, the
safety limit, running synchronously, concurrent clears and partial failure. It touches no code.
#1684 then implements the endpoint and `backend/statistics/reset.py` from the updated spec.

## Context

`docs/agents/specs/statistics_dashboard/clear-endpoint.md` (merged in #1679) leaves the batching
details pending, as do the concurrent-clear and failure-partway edge cases. The index
`docs/agents/specs/statistics_dashboard.md` lists them under *Open questions* → #1680.

The decisions come from the issue. Two constraints in the code shape them:

- In Django, `Visit.session` is `on_delete=CASCADE` (`backend/statistics/models.py`), but Django
  runs that cascade itself in Python. So the ORM `.delete()` on sessions loads every related
  visit first, and a raw delete of a session that still has visits fails on the foreign key.
- Production runs gunicorn with 4 workers and the default 30s timeout
  (`backend/bin/server.sh`).

## Implementation Steps

### Step 1 — Update `clear-endpoint.md`

- **Behaviour:** replace "batching details are pending" in the *Deletes* bullet with the
  algorithm, all of it in `backend/statistics/reset.py`:
  1. **Visits pass:** run `DELETE FROM statistics_visit ORDER BY id LIMIT <batch>` in a loop
     until a batch deletes 0 rows.
  2. **Sessions pass:** in a loop, select up to `<batch>` session ids ordered by id. For each
     batch, first `DELETE FROM statistics_visit WHERE session_id IN (…)`, then delete the
     sessions themselves. The loop stops when a batch finds no sessions. This covers a visit
     that a live request adds to an old session after the visits pass has finished.
  3. **ID reset:** `ALTER TABLE … AUTO_INCREMENT = 1`, as the spec already describes.
  4. **Response counts:** `deleted_visits` / `deleted_sessions` are the sums the passes deleted.
     Visits deleted in the sessions pass count towards `deleted_visits`.
- Add a set of rules:
  - **Commits:** each batch commits on its own (autocommit, no `atomic()`), so locks last only
    one batch.
  - **Batch size:** a new setting in `backend/statistics/settings.py`,
    `Settings.clear_batch_size()`, read from the env var
    `MAJORA_STATISTICS_CLEAR_BATCH_SIZE` with a default of `10000`. This follows the existing
    `env_int` settings.
  - **Safety limit:** each loop stops after `1000` batches. Going over it raises, and the
    endpoint returns `500`.
  - **Synchronous:** Clear runs within the request, with no background job. If it hits the
    gunicorn timeout, it stops partway, and clicking Clear again finishes the job.
- **Edge cases:**
  - **Concurrent clears:** settle this one. Two clears may run at once, with no lock. The
    deletes are idempotent, and each response counts only its own rows.
  - **Failure partway through:** settle this one too. The endpoint returns `500` and rolls
    nothing back, so a retry finishes the rest. The card fetches the count again. Whether a
    partial run is written to the audit log stays with #1681.
- **Tests:** add three cases to the `TransactionTestCase` list:
  - batching with a small batch size (e.g. `2`), so the deletes run in several batches and
    remove every row;
  - a visit attached to a session after the visits pass, deleted by the sessions pass with no
    foreign-key error;
  - going over the safety limit, which returns `500`.
- **Open questions:** remove the #1680 line and keep only #1681.
- **Implemented by:** keep `#1684`. It still depends on #1681 and #1683, and on #1680 once this
  merges.

### Step 2 — Update the index `statistics_dashboard.md`

Remove the **Batched clear** → #1680 bullet from *Open questions*. If the index has a short
summary of Clear's behaviour, add one line there linking to the batching section in
`clear-endpoint.md`.

## Files to Change

- `docs/agents/specs/statistics_dashboard/clear-endpoint.md` — the batching algorithm, rules,
  the settled edge cases and the extra tests; remove the #1680 open question.
- `docs/agents/specs/statistics_dashboard.md` — remove the #1680 open question.

## CI Checks

- Markdown: `yarn lint_md`, run through docker-compose (CI job: `markdownlint`).

## Notes

- This changes no code. The new setting and `reset.py` are only described here. #1684 adds them.
- The #1678 plan step `backend/03-clear-endpoint-and-reset.md` (on branch `issue-1678`, not yet
  pushed) uses placeholders for batching. Its implementer should follow the updated spec, not
  that step's placeholders.
- `DELETE … ORDER BY … LIMIT` is MySQL-specific. That is acceptable, because the spec already
  keeps all MySQL-specific SQL in `reset.py`. The test database must be MySQL too, so the
  `TransactionTestCase` cases exercise the real SQL.
