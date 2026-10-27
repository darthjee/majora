# Issue: Statistics dashboard: discuss and enhance specs for the batched clear

## Description

Part of #1678 (Epic: staff dashboard visits summary card).

A docs-only sub-issue. It records **how the batched clear of the statistics tables works** in
`docs/agents/specs/statistics_dashboard/clear-endpoint.md` and changes no code. It replaces the
"batching details are pending" placeholders and closes the #1680 items in the spec's *Open
questions* and *Edge cases* sections.

## Problem

Clear (`DELETE staff/statistics.json`, implemented by #1684) must delete every
`statistics_visit` row and then every `statistics_session` row on MySQL / InnoDB, without
holding long locks against the live tracking middleware. The spec doesn't yet say how the
deletes are batched or committed, how rows inserted mid-clear are handled, or what happens on
timeouts, concurrent clears or partial failure.

Two constraints found in the code:

- In Django, `Visit.session` is `on_delete=CASCADE`, but Django runs that cascade itself in
  Python, not in the database. So `Session.objects.filter(...).delete()` loads every related
  visit first, and a raw delete of a session that still has visits fails on the foreign key.
- Production runs gunicorn with 4 workers and the default 30s timeout (`backend/bin/server.sh`).
  If a request runs longer, its worker is killed partway through.

## Expected Behavior

`clear-endpoint.md` describes the algorithm below precisely enough to implement #1684.

### Algorithm (in `backend/statistics/reset.py`)

1. **Visits pass:** run raw MySQL `DELETE FROM statistics_visit ORDER BY id LIMIT <batch>` in a
   loop until a batch deletes 0 rows. Raw SQL skips Django's Python-side cascade collector and
   doesn't need a list of pks first.
2. **Sessions pass:** in a loop, select up to `<batch>` session ids (ordered by id). For each
   batch, first delete the visits whose `session_id` is in it, then the sessions themselves.
   This covers a visit added to an old session by a live request after the visits pass
   finished. The loop stops when a batch finds no sessions.
3. **ID reset:** `ALTER TABLE … AUTO_INCREMENT = 1` on both tables, as the spec already
   describes. Rows inserted before the `ALTER` move the counter to max + 1, which is harmless.
4. **Response counts:** the sum of rows each pass deleted, as `deleted_visits` and
   `deleted_sessions`.

### Rules

- **Commits:** each batch commits on its own (autocommit, no `atomic()`), so locks are held
  only for one batch.
- **Batch size:** a setting in `backend/statistics/settings.py`, default `10000`. Tests can
  lower it (e.g. to `2`) to force several batches.
- **Safety limit:** each loop stops after a maximum number of batches (`1000`). Going over it
  is an error, and the endpoint returns `500`.
- **Synchronous:** Clear runs within the HTTP request. There is no background job. If it hits
  the gunicorn timeout it stops partway, and clicking Clear again finishes the job.
- **Concurrent clears:** allowed, with no lock. The deletes are idempotent, and each response
  counts only the rows that request deleted.
- **Partial failure:** a run that fails partway returns `500`, and nothing is rolled back.
  Rows already deleted stay deleted, and a retry finishes the rest. The card fetches the count
  again after any failure (see `dashboard-card.md`). Whether a partial run is written to the
  audit log is settled by #1681.

### Tests (`TransactionTestCase`)

- With a small batch size, the deletes run in several batches and every row is removed.
- A visit attached to a session after the visits pass is deleted by the sessions pass, and the
  session delete doesn't fail on the foreign key.
- Going over the safety limit returns `500`.
- Ids start again at `1` after the clear.

## Solution

Update `docs/agents/specs/statistics_dashboard/clear-endpoint.md`:

- In *Behaviour*, replace the deletes bullet's "batching details are pending" with the
  algorithm and rules above.
- In *Edge cases*, settle concurrent clears and failure partway through.
- In *Tests*, add the batching, late-visit and safety-limit cases.
- Remove the #1680 line from *Open questions*.
- In `docs/agents/specs/statistics_dashboard.md`, update the index's *Open questions* to match.

The plan step `backend/03-clear-endpoint-and-reset.md` (#1678 plan) then follows the updated
spec.

## Benefits

- #1684 can be built without guessing how the deletes are batched.
- Live tracking isn't blocked, because locks last only one batch.
- Retries, timeouts and concurrent clears are all safe.
