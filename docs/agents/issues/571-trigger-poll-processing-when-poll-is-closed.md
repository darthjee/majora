# Issue: Trigger poll processing when poll is closed

## Description
On the endpoint `PATCH /games/:game_slug/polls/:id/close`, closing a poll linked to an entity (via `Poll.content_type`/`object_id`) does not trigger any entity-specific processing. Each entity type that a poll can be linked to should get its own closing behavior, resolved through a generic dispatch mechanism rather than one-off checks. Currently the only such entity is `GameSession`, so this issue introduces the dispatch mechanism and adds the closing processing for session-linked polls.

## Problem
`PollCloseWriter` (`backend/games/poll_close_writer.py`) resolves the winning `PollOption`, marks it `selected`, and sets `poll.status` to closed — but never reads `poll.content_object`. When a session poll (created via `session_poll_create.py`, with `option_type=OPTION_TYPE_DATE`) is closed, the chosen date is never applied to the linked `GameSession`, leaving `GameSession.date` unset even after a date has been voted on.

## Expected Behavior
When a poll linked to a `GameSession` is closed, the winning option's string value (an ISO date, since the poll's `option_type` is `OPTION_TYPE_DATE`) is parsed into a date and saved to `GameSession.date`. Polls not linked to any entity are unaffected.

If the winning option's string cannot be parsed as a date, the close request fails (poll stays open, nothing is persisted) instead of closing silently with a missing session date.

## Solution
Introduce a generic entity-closing dispatch mechanism keyed by the poll's linked content type (`poll.content_type`/`content_object`), invoked by `PollCloseWriter` after the winning option is resolved but as part of the same close transaction. Each entity type registers its own closing processor; polls with no linked entity (`content_object is None`) skip dispatch entirely.

Implement the `GameSession` processor: parse the winning `PollOption.option` string into a date and save it to the linked session's `date` field. If parsing fails, raise a validation error that aborts the whole close operation (transactional — poll status and option selection are rolled back too).

Add an integration/end-to-end test covering the full flow: create a session, create its date poll, vote on an option, then close the poll — asserting the winning option's string is correctly parsed into the session's date. This is a new kind of test for the backend (existing `backend/games/tests` only has unit-level model/serializer/view tests), so it lives in its own new folder (e.g. `backend/games/tests/integration/` or `backend/games/tests/end_to_end/`) rather than alongside the per-layer test suites.

## Benefits
Session dates get set automatically based on the poll outcome, closing the loop between scheduling polls and the session record without a manual follow-up step. The dispatch mechanism also gives future entity types (beyond session) a clear, consistent extension point for their own closing behavior. The new integration test guards the full create→vote→close flow end-to-end, catching option-type parsing regressions that unit tests on individual layers could miss.
