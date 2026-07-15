# Backend Plan: View session list

Main plan: [plan.md](plan.md)

## Shared contracts

This agent produces everything under "Shared contracts" in [plan.md](plan.md): the
`next_session` field on game detail, the 3 new session-list endpoints (and removal of the old
one), and the `description` field on `GameSession` (detail/create/update serializers only).

## Implementation Steps

### Step 1 — Add `description` to `GameSession`

- `backend/games/models/game/game_session.py`: add `description = models.TextField(null=True, blank=True)`.
- Generate a migration (`0042_...`, next after `0041_character_public_slain.py`).
- Add `description` to `fields` in:
  - `backend/games/serializers/games/sessions/game_session_detail.py`
  - `backend/games/serializers/games/sessions/game_session_create.py` (`extra_kwargs`: `required: False`)
  - `backend/games/serializers/games/sessions/game_session_update.py` (`extra_kwargs`: `required: False`)
- Leave `backend/games/serializers/games/sessions/game_session_list.py` untouched (`id`,
  `title`, `date`, `game_slug` only).

### Step 2 — Compute `next_session` on game detail

- `backend/games/serializers/games/game_detail.py`: add a `next_session` `SerializerMethodField`
  and add `'next_session'` to `Meta.fields`.
- Query logic (use `django.utils.timezone.now().date()` for "today", matching the existing
  convention in `games/models/upload.py`/`games/models/password_reset_token.py`):
  ```python
  today = timezone.now().date()
  next_session = obj.sessions.filter(date__gte=today).order_by('date', 'id').first()
  if next_session is None and not obj.sessions.filter(date__isnull=False).exists():
      next_session = obj.sessions.order_by('id').first()
  ```
  Serialize `next_session` as `{'title': ..., 'date': ...}` (or `None`) — a small inline dict,
  not a full serializer, since only 2 fields are needed and no other session data is exposed
  here.
- See Notes below on the fallback edge case (all sessions past-dated, none unscheduled).

### Step 3 — Split the session list into past/future/unscheduled endpoints

- Add 3 new view functions (new files, following the existing one-file-per-view convention in
  `backend/games/views/game_sessions/`, alongside `game_sessions_list.py` and
  `game_session_detail.py`): `game_sessions_past.py`, `game_sessions_future.py`,
  `game_sessions_unscheduled.py`. Each mirrors `game_sessions_list`'s GET branch: `AllowAny`,
  `get_object_or_404(Game, game_slug=game_slug)`, then
  `paginated_list_response(request, <filtered/ordered queryset>, GameSessionListSerializer)`.
  - past: `game.sessions.filter(date__lt=today).order_by('-date')`
  - future: `game.sessions.filter(date__gte=today).order_by('date')`
  - unscheduled: `game.sessions.filter(date__isnull=True)` (already ordered by id via the
    model's `Meta.ordering`)
- Remove the GET branch from `game_sessions_list.py`, keeping only `POST` (create). Rename the
  view function if it no longer makes sense to call it `_list` once GET is gone — keep the URL
  name `game-sessions-list` and path `sessions.json` unchanged (POST only now).
- Register the 3 new routes in `backend/games/urls/games.py`, next to the existing
  `sessions.json`/`sessions/<int:session_id>.json` entries. Literal paths (`sessions/past.json`
  etc.) don't collide with the `<int:session_id>.json` converter regardless of order, but place
  them before the detail route for readability, following the `treasures/all.json` /
  `treasures/<int:treasure_id>.json` precedent in the same file.
- Export the 3 new views from `backend/games/views/__init__.py` and `backend/games/views/game_sessions/__init__.py`.

### Step 4 — Tests

- Update `backend/games/tests/models/game/game_session_test.py` for the new `description` field.
- Update `backend/games/tests/serializers/games/sessions/*_test.py` (detail/create/update) for
  `description`; list serializer test stays unchanged.
- Update `backend/games/tests/serializers/games/game_detail_test.py` for `next_session`,
  covering: no
  sessions → `null`; only past sessions and no unscheduled → per the Notes rule; a session
  today; a future session; sessions with no dates at all → first by id.
- Update `backend/games/tests/views/games/game_sessions_test.py`: remove/adjust GET coverage
  for the old list endpoint, keep POST coverage.
- Add new test files for the 3 new views under `backend/games/tests/views/game_sessions/` (or
  `backend/games/tests/views/games/`, matching wherever `game_sessions_test.py` currently lives)
  covering filtering, ordering, and pagination for each of past/future/unscheduled.

## Files to Change

- `backend/games/models/game/game_session.py` — add `description` field.
- `backend/games/migrations/0042_gamesession_description.py` (new) — migration for the above.
- `backend/games/serializers/games/sessions/game_session_detail.py` — add `description`.
- `backend/games/serializers/games/sessions/game_session_create.py` — add `description`.
- `backend/games/serializers/games/sessions/game_session_update.py` — add `description`.
- `backend/games/serializers/games/game_detail.py` — add `next_session`.
- `backend/games/views/game_sessions/game_sessions_list.py` — drop GET branch (POST only).
- `backend/games/views/game_sessions/game_sessions_past.py` (new)
- `backend/games/views/game_sessions/game_sessions_future.py` (new)
- `backend/games/views/game_sessions/game_sessions_unscheduled.py` (new)
- `backend/games/views/game_sessions/__init__.py` — export the 3 new views.
- `backend/games/views/__init__.py` — export the 3 new views.
- `backend/games/urls/games.py` — register `sessions/past.json`, `sessions/future.json`,
  `sessions/unscheduled.json`.
- Test files listed in Step 4.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/` (CI job:
  `pytest_views_rest`) — covers the session view tests.
- `backend`: `poetry run pytest --ignore=games/tests/views/` (CI job: `pytest_all`) — covers
  model/serializer tests.
- `backend`: `poetry run ruff check .` (CI job: `checks`).

## Notes

- **Edge case not fully specified in the issue**: when a game has sessions with dates but *all*
  of them are in the past (none today/future, and none unscheduled), the issue text only says
  "if there are no sessions with date, fall back to first by id" — it doesn't say what happens
  when dates exist but are all in the past. Step 2's logic treats that case as `next_session:
  null` (no fallback to first-by-id unless *zero* sessions have any date). This is the literal
  reading of the confirmed issue text; flag this to the user/product-owner if a different
  behavior (e.g. always falling back to first-by-id when there's no upcoming session) turns out
  to be expected during implementation or review.
