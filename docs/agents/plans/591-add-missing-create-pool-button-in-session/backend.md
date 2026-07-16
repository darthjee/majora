# Backend Plan: Session detail response caches stale can_edit — migrate to dedicated /permissions.json endpoint

Main plan: [plan.md](plan.md)

## Shared contracts

- Remove `can_edit` from the `GET /games/:game_slug/sessions/:id.json` response body
  (`GameSessionDetailSerializer`). This same serializer is also used for the
  `POST /games/:game_slug/sessions.json` create response, so that response loses `can_edit` too.
- No new endpoint, view, serializer, or route. The frontend will reuse the existing
  `GET /games/:game_slug/permissions.json` (`GamePermissionsSerializer`/`game_permissions` view)
  unchanged — nothing here needs to change to support that reuse.
- `GameSession.can_be_edited_by`/`can_be_edited_by_roles` (the model methods) are unaffected —
  only the serializer field that surfaces `can_edit` in the detail/create JSON is removed.

## Implementation Steps

### Step 1 — Remove `can_edit` from `GameSessionDetailSerializer`

In `backend/games/serializers/games/sessions/game_session_detail.py`:
- Remove the `can_edit = serializers.SerializerMethodField()` field declaration.
- Remove `'can_edit'` from `Meta.fields`.
- Remove the now-unused `get_can_edit` method entirely.

### Step 2 — Update serializer tests

In `backend/games/tests/serializers/games/sessions/game_session_detail_test.py`:
- Update the "only id, title, date, description, game_slug, and can_edit are exposed" test to
  drop `can_edit` from both the assertion and its docstring.
- Remove the five `can_edit`-specific test methods (`test_can_edit_is_false_for_anonymous_user`,
  `test_can_edit_is_true_for_superuser`, `test_can_edit_is_true_for_game_master`,
  `test_can_edit_is_false_for_unrelated_user`, `test_can_edit_is_false_without_request_context`)
  — this permission logic is no longer this serializer's concern (it's already covered by
  `GamePermissionsSerializer`'s own tests and by `GameSession.can_be_edited_by`'s model tests).

### Step 3 — Update view tests

- `backend/games/tests/views/game_sessions/game_session_detail_test.py`: remove the
  `assert data['can_edit'] is False` assertion (line ~31) from the detail GET test — either
  drop the assertion alone (if the test still checks other fields meaningfully) or the whole
  case if it existed only to check `can_edit`.
- `backend/games/tests/views/games/game_sessions_test.py`: remove the `assert data['can_edit']
  is True` assertion (line ~57) and update the docstring "Test that the response body contains
  id, title, date, game_slug, and can_edit" to drop `can_edit`.

### Step 4 — Leave model tests untouched

`backend/games/tests/models/game/game_session_test.py` tests `can_be_edited_by`/
`can_be_edited_by_roles` directly on the model — these are unaffected by this change and
require no edits.

### Step 5 — Update access-control documentation

In `docs/agents/access-control/game-session.md`:
- Update the "Exposed fields (detail)" paragraph: remove `can_edit` from the exposed-fields
  list and its accompanying explanation (the paragraph currently contrasts it with `Treasure`'s
  `access.json` approach — that contrast no longer applies once `can_edit` moves out).
- Extend the existing "no separate `access.json`" note (which already explains that sessions
  reuse `GET /games/:slug/access.json`) to also say sessions have no separate
  `permissions.json` and reuse the existing `GET /games/:slug/permissions.json` instead, for
  the same reason (`GameSession.can_be_edited_by` delegates entirely to `Game.can_be_edited_by`).

No changes needed in `docs/agents/access-control/common-rules.md` — its "Edit permission
endpoints" section already describes the shared `permissions.json` convention generically for
"every resource with an `access.json` endpoint"; since sessions still won't have their own
`access.json`, no new endpoint is being added to that list.

## Files to Change

- `backend/games/serializers/games/sessions/game_session_detail.py` — remove `can_edit` field
  and `get_can_edit` method.
- `backend/games/tests/serializers/games/sessions/game_session_detail_test.py` — drop `can_edit`
  from the exposed-fields test; remove the five `can_edit`-specific tests.
- `backend/games/tests/views/game_sessions/game_session_detail_test.py` — remove the `can_edit`
  assertion.
- `backend/games/tests/views/games/game_sessions_test.py` — remove the `can_edit` assertion and
  update the docstring.
- `docs/agents/access-control/game-session.md` — update exposed-fields doc and the
  `access.json`/`permissions.json` reuse note.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/` (CI job:
  `pytest_views_rest`) — covers the session view tests.
- `backend`: `poetry run pytest --ignore=games/tests/views/` (CI job: `pytest_all`) — covers the
  serializer tests.
- Run via docker-compose per `AGENTS.md`, e.g.
  `docker-compose run --rm majora_tests pytest games/tests/serializers/games/sessions/
  games/tests/views/game_sessions/ games/tests/views/games/game_sessions_test.py`.

## Notes

- Double-check whether any other test (e.g. a session list or poll-related test) asserts on the
  full detail response shape and would break by `can_edit`'s removal — the grep in this plan's
  research covered `can_edit` occurrences under `backend/games/tests/`, but re-run
  `grep -rn "can_edit" backend/games/tests` after the change to confirm nothing was missed.
- This step should land together with (or immediately before) the frontend step, since the
  frontend currently reads `session.can_edit` straight from the detail response — removing the
  field first without the frontend change would silently break the "Edit"/"Create Pool" buttons
  for everyone.
