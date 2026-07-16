# Backend Plan: Add Poll Voting

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section — this agent produces both the
`GET`/`PUT .../votes.json` endpoints and the `PollVote.player` → `PollVote.user` model change
described there in full.

## Implementation Steps

### Step 1 — Migrate `PollVote.player` to `PollVote.user`
- `backend/games/models/poll/poll_vote.py`: replace the `player` FK (`games.Player`) with a
  `user` FK (`settings.AUTH_USER_MODEL`, `on_delete=models.CASCADE`, `related_name='poll_votes'`).
- `unique_together = [('user', 'option')]`.
- `_validate_player_belongs_to_game` becomes `_validate_user_belongs_to_game`, checking
  `self.option.poll.game.players.filter(user=self.user).exists() or self.option.poll.game.game_masters.filter(user=self.user).exists()`
  (mirrors `PollPermission._is_allowed`'s player-or-DM check).
- `_validate_single_type_vote` keys its `PollVote.objects.filter(...)` lookup on `user=self.user`
  instead of `player=self.player`.
- `__str__` reads `self.user.username` instead of `self.player.name`.
- Generate the migration (`RemoveField('poll_vote', 'player')` + `AddField('poll_vote', 'user', ...)`
  — no data migration, there are no votes in production). It will be `0053_*.py` (last is
  `0052_poll_content_type_poll_object_id.py`).
- Update `backend/games/tests/models/poll/poll_vote_test.py` for the new field name and the
  player-or-DM membership rule (add a case covering a DM-only user, with no `Player` row, voting
  successfully).

### Step 2 — `PollVotePermission`
- Add to `backend/games/permissions.py`, following the `SessionMessagePermission` shape exactly:
  - `check_view(request, game)`: superuser/staff bypass allowed, else player or DM of `game`.
  - `check_vote(request, game)`: player or DM of `game` only, no superuser/staff bypass.
- No dedicated test file needed beyond the view tests below (existing permission classes in this
  file aren't unit-tested standalone; `SessionMessagePermission` isn't either).

### Step 3 — Vote-writing classes
- New module, e.g. `backend/games/services/poll_vote_writer.py` (or
  `backend/games/models/poll/poll_vote_writer.py` if this codebase's convention favors keeping
  small persistence helpers next to the model — check for an existing non-serializer "writer"
  class precedent before picking a location; default to a new `backend/games/services/` package
  if none exists).
- `SinglePollVoteWriter.write(poll, user, option_ids)`: expects `option_ids` to contain 0 or 1
  ids belonging to `poll` (validation error otherwise). If the user already has a vote for this
  poll, update its `option` in place; if `option_ids` is empty, delete the existing vote instead;
  if no existing vote and `option_ids` has one id, create it.
- `MultiplePollVoteWriter.write(poll, user, option_ids)`: diff `option_ids` (validated to belong
  to `poll`) against the user's existing `PollVote` rows for `poll` — create rows for newly
  selected options, delete rows for options no longer selected, leave unchanged ones untouched.
- Both return the user's resulting `PollVote` queryset/list for the view to serialize.

### Step 4 — Serializers
- `backend/games/serializers/games/polls/poll_vote.py` — `PollVoteSerializer`: `id`, `option`,
  `user` (both plain FK ids, not nested — matches the "shared contracts" response shape).
- `backend/games/serializers/games/polls/poll_vote_write.py` — a plain serializer (not
  `ModelSerializer`, since the write path goes through the writer classes above, not `.save()`)
  validating `option_ids` is a list of ints, each id an existing `PollOption` belonging to the
  poll (400 with a clear error otherwise).
- Register both in `backend/games/serializers/games/polls/__init__.py` (create the file — it's
  currently empty/absent, unlike the sibling `views/polls/__init__.py`, so check whether it needs
  creating vs. already exists) and re-export from `backend/games/serializers/__init__.py`
  alongside the other `Poll*` entries.

### Step 5 — View
- `backend/games/views/polls/game_poll_votes.py`, `@api_view(['GET', 'PUT'])`, same
  `CookieTokenAuthentication` + `AllowAny` + inline-permission-check shape as
  `session_messages_list.py` (the closest existing view/create split): resolve `game` and `poll`
  via `get_object_or_404`, branch on `request.method`:
  - `PUT`: `PollVotePermission.check_vote`, validate body via the write serializer, pick
    `SinglePollVoteWriter`/`MultiplePollVoteWriter` based on `poll.type`, call `.write(...)`,
    return the resulting votes via `PollVoteSerializer(..., many=True)`.
  - `GET`: `PollVotePermission.check_view`, filter `poll`'s votes by `?user_id=` when present,
    serialize via `PollVoteSerializer(..., many=True)`.
  - Both set `X-Skip-Cache: true`.
- Register in `backend/games/views/polls/__init__.py` and route in
  `backend/games/urls/games.py`, alongside the existing `game-poll-detail` path:
  `games/<slug:game_slug>/polls/<int:poll_id>/votes.json`, e.g. `name='game-poll-votes'`.
- New test file `backend/games/tests/views/polls/game_poll_votes_test.py` covering: DM-without-
  Player-row voting, player voting, admin `GET` allowed / `PUT` 403, single-type option switch
  (in-place update, never two rows), multiple-type add/remove diffing, `user_id` filter on `GET`,
  unauthenticated 401, non-member 403, invalid option id 400, poll/game 404s.

### Step 6 — Docs
- Update `docs/agents/access-control/poll.md`'s "Vote (`PollVote`)" row and its "Exposed fields"
  section to document the new endpoints, the view/vote permission split, and the `player` → `user`
  model change (mention this doc explicitly says "Not exposed by any endpoint" today — that line
  is now wrong).

## Files to Change
- `backend/games/models/poll/poll_vote.py` — `player` → `user`, updated `clean()` rules.
- `backend/games/migrations/0053_*.py` — new migration for the field swap.
- `backend/games/tests/models/poll/poll_vote_test.py` — updated for `user`, add DM-voting case.
- `backend/games/permissions.py` — add `PollVotePermission`.
- `backend/games/services/poll_vote_writer.py` (or equivalent location) — `SinglePollVoteWriter`,
  `MultiplePollVoteWriter`.
- `backend/games/serializers/games/polls/poll_vote.py` — `PollVoteSerializer`.
- `backend/games/serializers/games/polls/poll_vote_write.py` — write/validation serializer.
- `backend/games/serializers/games/polls/__init__.py`, `backend/games/serializers/__init__.py` —
  exports.
- `backend/games/views/polls/game_poll_votes.py` — new `GET`/`PUT` view.
- `backend/games/views/polls/__init__.py` — export.
- `backend/games/urls/games.py` — new route.
- `backend/games/tests/views/polls/game_poll_votes_test.py` — new view tests.
- `docs/agents/access-control/poll.md` — update the Vote row and exposed-fields section.

## CI Checks
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/` (CI job:
  `pytest_views_rest`) — covers the new `views/polls/game_poll_votes_test.py`.
- `backend`: `poetry run pytest --ignore=games/tests/views/` (CI job: `pytest_all`) — covers the
  model test under `games/tests/models/poll/`.
- `backend`: `poetry run ruff check .` (CI job: `checks`).

## Notes
- Confirm where this codebase already keeps non-serializer, non-model "business logic" helper
  classes (if any precedent exists) before creating `backend/games/services/`; if none exists,
  a new small package is reasonable, but check first — this repo favors matching existing
  structure over introducing a new layer.
- The single-type "update in place" behavior means the writer must not go through `PollVote.save()`
  in a way that re-triggers `_validate_single_type_vote` against the row being updated itself —
  exclude the row's own pk from that check the same way the current `clean()` already excludes
  `option=self.option` when checking for other rows.
