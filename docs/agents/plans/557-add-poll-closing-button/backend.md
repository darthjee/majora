# Backend Plan: Add poll closing button

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" for the full endpoint/response
shape, the `PollOption.selected` field, and the vote-casting guard — this
agent implements all of it.

## Implementation Steps

### Step 1 — Add `PollOption.selected`

- `backend/games/models/poll/poll_option.py`: add
  `selected = models.BooleanField(default=False)`.
- Generate the migration (`python manage.py makemigrations`).
- Update `backend/games/serializers/games/polls/poll_option.py`
  (`PollOptionSerializer`) to include `'selected'` in `fields` (read-only by
  default for a `ModelSerializer` field not otherwise writable through this
  serializer).

### Step 2 — Add the DM/superuser-only close permission

- `backend/games/permissions.py`: add a `PollClosePermission(_EditPermission)`
  class (or an equivalent `check` classmethod), mirroring `PollPermission`'s
  shape but with an allow rule of `user.is_superuser or
  game.game_masters.filter(user=user).exists()` — no `is_staff`, no players.
  This intentionally differs from `PollPermission._is_allowed`.

### Step 3 — Poll-closing logic

- Add a small writer/service (e.g.
  `backend/games/poll_close_writer.py`, alongside the existing
  `poll_vote_writer.py`) responsible for:
  1. Validating the poll's current `status == Poll.STATUS_OPEN` (raise/return
     an error otherwise — nothing is persisted).
  2. Resolving the winning option:
     - Empty payload: tally `PollVote` rows per option for this poll, take
       the option(s) with the max count, and pick the lowest `id` among them
       on a tie.
     - `option_id` given: validate it belongs to the poll's options (reuse
       the same belongs-to-poll check pattern as
       `PollVoteWriteSerializer.validate_option_ids`); use it directly as the
       winner, no vote-count comparison needed.
  3. Setting `selected=True` on the winning `PollOption` (and leaving all
     others `False` — relevant if a poll could ever be closed twice, though
     Step 1's status guard should make that unreachable in practice).
  4. Setting `poll.status = Poll.STATUS_CLOSED` and saving.
- Keep validation errors in the same `ValidationError` /
  `{"errors": {...}}` idiom used by `poll_vote_writer.py` and
  `game_poll_votes.py`, so the view can reuse `validated_or_error`-style
  error handling.

### Step 4 — New view + URL

- `backend/games/views/polls/game_poll_close.py`: `@api_view(['PATCH'])`
  view `game_poll_close(request, game_slug, poll_id)`, following
  `game_poll_detail.py`'s shape (`CookieTokenAuthentication`,
  `AllowAny` + inline `PollClosePermission.check(request, game)`,
  `X-Skip-Cache: true` on the response). On success, return
  `PollDetailSerializer(poll).data` (so the frontend gets back the updated
  `status` and each option's `selected` flag in one round trip).
- Register it in `backend/games/views/polls/__init__.py` and
  `backend/games/urls/games.py` as
  `games/<slug:game_slug>/polls/<int:poll_id>/close.json`, name
  `game-poll-close`, next to the existing `game-poll-detail` /
  `game-poll-votes` routes.

### Step 5 — Guard vote-casting against a non-open poll

- `backend/games/views/polls/game_poll_votes.py`'s `_cast_votes`: before
  building/calling the writer, check `poll.status == Poll.STATUS_OPEN` and
  return a `400` with an error body (matching the existing
  `{"errors": {"option_ids": [...]}}` shape used a few lines below, or a
  `{"errors": {"detail": [...]}}` shape if that reads more naturally — pick
  whichever existing convention fits best in context) when it isn't.

### Step 6 — Tests

- `backend/games/tests/models/poll/poll_option_test.py`: cover the new
  `selected` field's default.
- New `backend/games/tests/views/polls/game_poll_close_test.py`: cover
  permission (DM/superuser allowed, player/anonymous/other rejected),
  empty-payload auto-pick (clear winner, and tied-by-id case), explicit
  `option_id` override, rejecting a non-open poll, rejecting an
  `option_id` that doesn't belong to the poll, and the response shape
  (`status`, `selected` on options).
- `backend/games/tests/views/polls/game_poll_votes_test.py`: add a case
  covering the new "poll not open" rejection.

## Files to Change

- `backend/games/models/poll/poll_option.py` — add `selected` field.
- `backend/games/migrations/<new>.py` — migration for the new field.
- `backend/games/serializers/games/polls/poll_option.py` — expose `selected`.
- `backend/games/permissions.py` — add `PollClosePermission`.
- `backend/games/poll_close_writer.py` — new, winner resolution + persistence.
- `backend/games/views/polls/game_poll_close.py` — new view.
- `backend/games/views/polls/__init__.py` — export the new view.
- `backend/games/urls/games.py` — register the new route.
- `backend/games/views/polls/game_poll_votes.py` — add the status guard.
- `backend/games/tests/models/poll/poll_option_test.py` — new field coverage.
- `backend/games/tests/views/polls/game_poll_close_test.py` — new test file.
- `backend/games/tests/views/polls/game_poll_votes_test.py` — status-guard case.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/ --cov` (CI job:
  `pytest_views_rest`) covers the new/changed view tests.
- `backend`: `poetry run pytest games/tests/ --cov` locally is the simplest
  full check; CI also runs `pytest_all` for everything outside
  `games/tests/views/`, which will cover the model test.
- `backend`: `poetry run ruff check .` (CI job: `checks`).

## Notes

- No existing precedent for a "close"-style member action under
  `views/polls/`; keeping it flat in `views/polls/game_poll_close.py`
  matches the current (pre-`views-organization.md`-migration) flat layout of
  that folder's sibling files, rather than introducing a `polls/detail/`
  subfolder unilaterally.
- Double-check whether `PollVote` rows should be deleted/kept once a poll is
  closed — the issue doesn't ask for cleanup, so leave existing votes as-is;
  only `PollOption.selected` and `Poll.status` change.
