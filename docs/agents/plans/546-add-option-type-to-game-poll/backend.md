# Backend Plan: Add option type to Game Poll

Main plan: [plan.md](plan.md)

## Shared contracts

- Add `option_type` to the `Poll` model (not `PollOption` — the type applies to the whole poll,
  matching the New Poll form having a single select for it): `CharField(max_length=16,
  choices=OPTION_TYPE_CHOICES, default=OPTION_TYPE_TEXT)`, with `OPTION_TYPE_TEXT = 'text'`,
  `OPTION_TYPE_DATE = 'date'`, `OPTION_TYPE_CHOICES = [(OPTION_TYPE_TEXT, 'Text'),
  (OPTION_TYPE_DATE, 'Date')]` — same style as the existing `Poll.TYPE_CHOICES`/
  `Poll.STATUS_CHOICES`.
- `POST /games/<slug>/polls.json` must accept an optional `option_type` field in the payload
  (default `text` when omitted) and both the create (201) and detail (`GET
  /games/<slug>/polls/<id>.json`) responses must include `option_type` as a top-level field on
  the poll, alongside `type` and `status`. `PollListSerializer` is unaffected.

## Implementation Steps

### Step 1 — Add the `option_type` field to `Poll`

In `backend/games/models/poll/poll.py`, add the `OPTION_TYPE_TEXT`/`OPTION_TYPE_DATE`/
`OPTION_TYPE_CHOICES` constants and the `option_type` field, following the exact style already
used for `TYPE_CHOICES`/`STATUS_CHOICES` on the same model.

### Step 2 — Migration

Generate the migration (`python manage.py makemigrations games`) so it adds `option_type` with
`choices=[('text', 'Text'), ('date', 'Date')]`, `default='text'`, `max_length=16` — same shape as
`backend/games/migrations/0044_game_game_type.py`.

### Step 3 — Expose `option_type` on serializers

- `backend/games/serializers/games/polls/poll_create.py` (`PollCreateSerializer`): add
  `'option_type'` to `fields`, with `extra_kwargs['option_type'] = {'required': False}` (mirrors
  the existing `'type'` entry). No change needed to `create()` — `option_type` is a plain
  `Poll` field, not part of the nested `options` handling.
- `backend/games/serializers/games/polls/poll_detail.py` (`PollDetailSerializer`): add
  `'option_type'` to `fields`.
- Leave `PollListSerializer` and `PollOptionSerializer`/`PollOptionWriteSerializer` unchanged —
  the type lives on `Poll`, not `PollOption`.

### Step 4 — Tests

- `backend/games/tests/models/poll/poll_test.py`: add cases mirroring the existing `type`
  coverage — `option_type` defaults to `Poll.OPTION_TYPE_TEXT` when not specified, and a poll can
  be created with `option_type=Poll.OPTION_TYPE_DATE`. Update `PollFactory` in
  `backend/games/tests/factories.py` only if a test needs a non-default `option_type` (it can
  keep relying on the model default otherwise).
- `backend/games/tests/views/polls/game_polls_list_test.py`: add coverage for creating a poll
  with `option_type='date'` returning it in the 201 response, and confirm omitting it defaults to
  `'text'`.
- `backend/games/tests/views/polls/game_poll_detail_test.py`: assert `option_type` is present in
  the detail response.

## Files to Change

- `backend/games/models/poll/poll.py` — add `option_type` field and its choices constants.
- `backend/games/migrations/00XX_poll_option_type.py` — new migration (auto-generated).
- `backend/games/serializers/games/polls/poll_create.py` — expose `option_type` for writes.
- `backend/games/serializers/games/polls/poll_detail.py` — expose `option_type` for reads.
- `backend/games/tests/models/poll/poll_test.py` — model-level coverage.
- `backend/games/tests/views/polls/game_polls_list_test.py` — create-endpoint coverage.
- `backend/games/tests/views/polls/game_poll_detail_test.py` — detail-endpoint coverage.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`).
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`).

## Notes

- `option_type` intentionally lives on `Poll`, not `PollOption`, per the confirmed scope: one
  type per poll, applied to all of its options (not a per-option mix).
- No changes needed to `PollOption`, `PollOptionSerializer`, `PollOptionWriteSerializer`, or the
  `bulk_create` logic in `PollCreateSerializer.create()`.
