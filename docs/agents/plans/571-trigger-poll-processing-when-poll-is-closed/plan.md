# Plan: Trigger poll processing when poll is closed

Issue: [571-trigger-poll-processing-when-poll-is-closed.md](../issues/571-trigger-poll-processing-when-poll-is-closed.md)

## Overview

`Poll` already carries a generic entity link (`content_type`/`object_id`/`content_object`), populated at creation time for session-scoped polls (`SessionPollCreateSerializer`), but `PollCloseWriter` never reads it when a poll closes. This plan adds a small dispatch mechanism, keyed by the linked entity's model class, that `PollCloseWriter` invokes right after it resolves the winning option — so each entity type can define its own closing behavior. The only implementation for now is `GameSession`: parse the winning option's ISO date string and save it as the session's `date`. The whole close is wrapped in a transaction so a parsing failure aborts the close entirely (poll stays open, nothing persisted). A new integration-style test exercises the full create → vote → close flow end to end.

## Context

- `Poll` model: `backend/games/models/poll/poll.py` — `content_type`/`object_id`/`content_object` (GenericForeignKey), `option_type` (`text`/`date`).
- `PollCloseWriter`: `backend/games/poll_close_writer.py` — resolves the winning `PollOption` (explicit `option_id` or vote tally) and persists `selected`/`STATUS_CLOSED`. This is the single place both close paths (DM-picked and vote-tally) go through, so hooking in here covers both.
- `GameSession`: `backend/games/models/game/game_session.py` — has a plain `date = DateField(null=True, blank=True)`, no existing relation back to `Poll`.
- Session poll creation: `backend/games/serializers/games/polls/session_poll_create.py` — creates the poll with `content_object=session`, `option_type=Poll.OPTION_TYPE_DATE`, and one `PollOption` per date with `option=date.isoformat()`.
- No existing "dispatch by entity type" pattern in the codebase (no signals, no strategy modules) — this introduces the first one, but reuses the existing GenericForeignKey rather than adding new fields.
- `transaction.atomic()` precedent already exists elsewhere (e.g. `backend/games/views/game/_treasure_exchange.py`).

## Implementation Steps

### Step 1 — Add the poll-close dispatch mechanism

Create `backend/games/poll_close_processors/`:

- `__init__.py` — a registry mapping a model class to a processor, plus a `process(poll, winner)` function:
  - If `poll.content_object is None`, return immediately (no-op).
  - Look up `type(poll.content_object)` in the registry; if there's no processor registered for that type, return immediately (no-op) — this keeps unrelated/future entity types safe by default.
  - Otherwise call the registered processor with `(poll.content_object, winner)`.
- `session_close_processor.py` — `GameSessionCloseProcessor` (or a plain function) that:
  - Parses `winner.option` with `datetime.date.fromisoformat(...)`.
  - On `ValueError`, raises `django.core.exceptions.ValidationError` (so it surfaces the same way other close failures do).
  - On success, sets `session.date` and saves (`update_fields=['date']`).
  - Registers itself against `GameSession` in the `__init__.py` registry.

Keep the registry keyed by model class (not a string/content-type id) — it reads directly off `type(poll.content_object)`, avoiding any extra `ContentType` lookups.

### Step 2 — Wire the dispatch into `PollCloseWriter`

In `backend/games/poll_close_writer.py`:

- Wrap `_write` (or just the `_persist` + dispatch portion) in `transaction.atomic()`.
- After `self._persist(winner)`, call the new dispatch function with `(self.poll, winner)`.
- Since the dispatcher's `ValidationError` propagates out of `_write`, and the view (`game_poll_close.py`) already catches `ValidationError` and returns 400, no view changes are needed — the transaction rollback (poll status, option `selected` flags) happens automatically when the exception propagates out of the atomic block.

### Step 3 — Unit-level tests for the new behavior

Extend `backend/games/tests/views/polls/game_poll_close_test.py` (or add a sibling test module) with cases against a session-linked, date-type poll:
- Closing sets `GameSession.date` to the winning option's parsed date (both vote-tally and explicit `option_id` paths).
- An unparseable option string returns 400 and leaves the poll `STATUS_OPEN` and the session's `date` unchanged (transactional rollback).
- Closing a poll with no linked entity (`content_object is None`) behaves exactly as before (regression check — most existing tests in this file already cover this implicitly since they use plain `PollFactory` polls).

### Step 4 — New integration test folder for the full flow

Per explicit request: add a new test category (this repo's `backend/games/tests` currently only has `models/`, `serializers/`, `views/`, `auth/`, `password_reset/` — no cross-endpoint flow tests). Create:

- `backend/games/tests/integration/__init__.py`
- `backend/games/tests/integration/session_poll_close_flow_test.py`

This test drives the real endpoints in sequence (no direct writer/model shortcuts, so it genuinely exercises serialization at each boundary):
1. `POST /games/<slug>/sessions/<id>/poll.json` — create the session date poll (reuse the `dates` payload shape from `session_poll_create_test.py`).
2. `PUT /games/<slug>/polls/<id>/votes.json` — cast a vote for one of the offered dates.
3. `PATCH /games/<slug>/polls/<id>/close.json` — close the poll.
4. Assert the response reflects the closed poll/selected option, and that `GameSession.objects.get(id=session.id).date` equals the voted-for date (parsed correctly from the option's string, i.e. `option_type=OPTION_TYPE_DATE` round-trips through `PollOption.option` correctly).

This folder is not under `backend/games/tests/views/`, so it naturally falls into the existing `pytest_all` CI job (see CI Checks) without any CircleCI config changes.

## Files to Change

- `backend/games/poll_close_writer.py` — wrap persistence in `transaction.atomic()`; invoke the new dispatch after persisting the winner.
- `backend/games/poll_close_processors/__init__.py` — new: registry + `process(poll, winner)` dispatch function.
- `backend/games/poll_close_processors/session_close_processor.py` — new: `GameSession` closing processor (parse date, save).
- `backend/games/tests/views/polls/game_poll_close_test.py` — add cases for session-date-set-on-close, parse-failure rollback, and no-entity-linked regression.
- `backend/games/tests/integration/__init__.py` — new, empty.
- `backend/games/tests/integration/session_poll_close_flow_test.py` — new: full create → vote → close flow test.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`) — covers the `game_poll_close_test.py` additions.
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`) — covers the new `games/tests/integration/` folder since it sits outside `games/tests/views/`.

## Notes

- No model/migration changes: `Poll.content_type`/`object_id` and `GameSession.date` already exist and are sufficient.
- The dispatch registry is intentionally a plain dict keyed by model class rather than a more elaborate plugin system — the issue only requires one real implementation today (`GameSession`), and the registry itself is already the generic extension point for future entity types.
- `PollCloseWriter._resolve_winner` runs before the dispatch, so both the DM-picked (`option_id`) and vote-tally close paths get entity processing uniformly.
