# Backend Plan: Allow multiple option in next session poll

Main plan: [plan.md](plan.md)

## Shared contracts

- `POST /games/<game_slug>/sessions/<session_id>/poll.json` must accept an optional `type` field in the request body, alongside the existing `dates` array. Valid values: `Poll.TYPE_SINGLE` (`'single'`) / `Poll.TYPE_MULTIPLE` (`'multiple'`), matching `Poll.TYPE_CHOICES`. When `type` is omitted, default to `Poll.TYPE_MULTIPLE` (this changes the current implicit default from single to multiple).
- Frontend will start sending `{ dates, type }`; the serializer must not break when `type` is absent (backwards compatible with any existing caller that still only sends `dates`).

## Implementation Steps

### Step 1 — Accept `type` in `SessionPollCreateSerializer`

In `backend/games/serializers/games/polls/session_poll_create.py`:
- Add a `type` field to the (plain, non-Model) serializer: `serializers.ChoiceField(choices=Poll.TYPE_CHOICES, required=False, default=Poll.TYPE_MULTIPLE)`.
- In `create()`, replace the hardcoded `type=Poll.TYPE_SINGLE` with `type=validated_data['type']` (the `default=` on the field means it's always present in `validated_data`, so no `.get()` fallback is needed).

### Step 2 — Test coverage

In `backend/games/tests/views/game_sessions/session_poll_create_test.py`:
- Extend `_payload()` usage (or add new cases) to cover:
  - No `type` in the payload → created poll's `type` is `Poll.TYPE_MULTIPLE` (new default).
  - `type='single'` explicitly → created poll's `type` is `Poll.TYPE_SINGLE`.
  - `type='multiple'` explicitly → created poll's `type` is `Poll.TYPE_MULTIPLE`.
  - An invalid `type` value (e.g. `'bogus'`) → 400 response with a field error on `type`.

## Files to Change

- `backend/games/serializers/games/polls/session_poll_create.py` — add the `type` field and use it in `create()` instead of the hardcoded value.
- `backend/games/tests/views/game_sessions/session_poll_create_test.py` — add test cases for default/explicit/invalid `type`.

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI job: `pytest_views_rest` / `pytest_all`)
- `backend`: `docker-compose run --rm majora_tests ruff check --fix .` (CI job: `checks`)

## Notes

- `PollCreateSerializer` (the generic poll form's serializer) is a `ModelSerializer` and already exposes `type` via the model's own default (`Poll.TYPE_SINGLE`) — it needs no changes; only the session-scoped serializer is a plain `Serializer` that hardcodes the value today.
- `Poll.TYPE_CHOICES` / `Poll.TYPE_SINGLE` / `Poll.TYPE_MULTIPLE` already exist in `backend/games/models/poll/poll.py` — no model or migration changes needed.
