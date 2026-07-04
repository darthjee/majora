# Backend Plan: Add game sessions

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the endpoints below (see [plan.md](plan.md) for the full contract table):

- `GET`/`POST` `/games/<slug:game_slug>/sessions.json`
- `GET`/`PATCH` `/games/<slug:game_slug>/sessions/<int:session_id>.json`

`GameSession.can_be_edited_by(user)` delegates to `self.game.can_be_edited_by(user)` — no new
independent edit-rights logic, mirroring `Treasure`/`Character` patterns but reusing `Game`'s
rule directly (per the issue: "sessions have no independent owner/player concept").

## Implementation Steps

### Step 1 — `GameSession` model + migration

Add `source/games/models/game_session.py`:

```python
class GameSession(models.Model):
    game = models.ForeignKey('games.Game', on_delete=models.CASCADE, related_name='sessions')
    title = models.CharField(max_length=200)
    date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ['id']

    def can_be_edited_by(self, user):
        return self.game.can_be_edited_by(user)

    def __str__(self):
        return self.title
```

Register it in `source/games/models/__init__.py` (follow the existing import/`__all__`
pattern used for `Treasure`). Generate the migration (next number after `0030_...` —
`0031_gamesession.py`) via
`docker-compose run --rm majora_app poetry run python manage.py makemigrations games`.

### Step 2 — Permission class

Add `GameSessionEditPermission(_EditPermission)` to `source/games/permissions.py`, following
the `TreasureEditPermission`/`CharacterEditPermission` one-liner pattern (docstring only, no
new logic — `_EditPermission.check` already does the auth/permission dance generically).

### Step 3 — Serializers

Add, one file per concern under `source/games/serializers/` (mirroring
`treasure_{list,detail,create,update}.py`):

- `game_session_list.py` — `GameSessionListSerializer`: `fields = ['id', 'title', 'date', 'game_slug']`. `game_slug` is a `SerializerMethodField` or `source='game.game_slug'` read-only field (mirrors how `Character` list serializers expose `game_slug` — check `source/games/serializers/character_list.py`/`pc_list.py` for the exact existing pattern before choosing).
- `game_session_detail.py` — `GameSessionDetailSerializer`: `fields = ['id', 'title', 'date', 'game_slug', 'can_edit']`, with `can_edit` a `SerializerMethodField` computed from `request.user` in context (mirror `TreasureDetailSerializer`/character detail serializers if they already expose `can_edit` this way — if the existing convention instead uses a separate `access.json` endpoint for `can_edit` rather than embedding it in detail, drop the field here and follow that convention instead, keeping consistency with the rest of the codebase).
- `game_session_create.py` — `GameSessionCreateSerializer`: `fields = ['title', 'date']`, `title` required, `date` optional; `game` is set explicitly in the view (`serializer.save(game=game)`), not accepted from the payload.
- `game_session_update.py` — `GameSessionUpdateSerializer`: same fields, all optional (`extra_kwargs` pattern from `TreasureUpdateSerializer`).

Register all four in `source/games/serializers/__init__.py`.

### Step 4 — Views

Add `source/games/views/game_sessions/` (new subpackage, following `views/treasures/` and
`views/game_masters/` layout):

- `game_sessions_list.py` — `game_sessions_list(request, game_slug)`: `GET` returns
  `paginated_list_response(request, game.sessions.all(), GameSessionListSerializer)`; `POST`
  validates auth via `require_authenticated`, then `GameSessionEditPermission`-equivalent check
  against the **game** (since there's no instance yet — mirror how `game_masters_list.py`'s
  `_create_game_master` checks directly, or instantiate an unsaved `GameSession(game=game)` and
  run it through `GameSessionEditPermission.check` the same way other create endpoints that
  gate on the parent's rule do), validates payload with `GameSessionCreateSerializer`, saves
  with `game=game`, returns 201 with `GameSessionDetailSerializer`.
- `game_session_detail.py` — `game_session_detail(request, game_slug, session_id)`: fetch the
  game via `get_object_or_404`, fetch the session via
  `get_object_or_404(GameSession, id=session_id, game=game)` (so a `session_id` from a
  different game correctly 404s), then delegate to the shared `detail_or_update` helper with
  `GameSessionEditPermission`, `GameSessionUpdateSerializer`, `GameSessionDetailSerializer` —
  same shape as `treasure_detail.py`.

Register both in `source/games/views/__init__.py`.

### Step 5 — URLs

Add to `source/games/urls.py`, near the existing treasures routes:

```python
path('games/<slug:game_slug>/sessions.json', views.game_sessions_list, name='game-sessions-list'),
path(
    'games/<slug:game_slug>/sessions/<int:session_id>.json',
    views.game_session_detail,
    name='game-session-detail',
),
```

### Step 6 — Tests

Mirror the existing treasure test layout:
- `source/games/tests/models/test_game_session.py` — `can_be_edited_by` delegates correctly (GM of the game → True, GM of a different game → False, superuser → True, anonymous/unrelated user → False), `__str__`, default ordering.
- `source/games/tests/serializers/test_game_session_list.py`, `test_game_session_detail.py`, `test_game_session_create.py` (or `_update.py`, matching whatever split Step 3 lands on) — field exposure, required/optional validation.
- `source/games/tests/views/games/game_sessions_test.py` — list pagination (mirror `game_treasures_test.py`), create as GM/superuser (201), create as non-GM (403), create unauthenticated (401), create with missing `title` (400), create with unknown `game_slug` (404).
- `source/games/tests/views/game_sessions/game_session_detail_test.py` — GET public 200, GET unknown `session_id`/mismatched `game_slug` 404, PATCH as GM/superuser 200, PATCH as non-GM 403, PATCH unauthenticated 401, PATCH invalid payload 400.
- Add a mass-assignment regression test consistent with the issue #273 convention documented in `docs/agents/security-guidelines.md` (or wherever the #273 rule landed) — confirm `game` cannot be reassigned via the update serializer's payload.

### Step 7 — Documentation

- Add a "GameSession" section to `docs/agents/access-control.md` (roles, exposed/write fields, edit-rights logic — delegates to `Game.can_be_edited_by`), following the existing `Treasure`/`GameMaster` section format.
- Update `docs/agents/pagination.md`'s "Endpoints with pagination" table to include `game_treasures` (already paginated but missing from the table, per the issue) and the new `GET /games/:game_slug/sessions.json`.

## Files to Change

- `source/games/models/game_session.py` — new `GameSession` model
- `source/games/models/__init__.py` — register model
- `source/games/migrations/0031_gamesession.py` — new migration (number may shift if other migrations land first; regenerate if so)
- `source/games/permissions.py` — add `GameSessionEditPermission`
- `source/games/serializers/game_session_list.py`, `game_session_detail.py`, `game_session_create.py`, `game_session_update.py` — new serializers
- `source/games/serializers/__init__.py` — register serializers
- `source/games/views/game_sessions/game_sessions_list.py`, `game_session_detail.py` — new views
- `source/games/views/__init__.py` — register views
- `source/games/urls.py` — register the two new routes
- `source/games/tests/models/test_game_session.py`
- `source/games/tests/serializers/test_game_session_*.py`
- `source/games/tests/views/games/game_sessions_test.py`
- `source/games/tests/views/game_sessions/game_session_detail_test.py`
- `docs/agents/access-control.md` — new "GameSession" section
- `docs/agents/pagination.md` — endpoint table correction/addition

## CI Checks

- `source/`: `docker-compose run --rm majora_app poetry run pytest games/tests/views/` (CI job: `pytest_views`)
- `source/`: `docker-compose run --rm majora_app poetry run pytest --ignore=games/tests/views/` (CI job: `pytest_all`)
- `source/`: `docker-compose run --rm majora_app poetry run ruff check .` (CI job: `checks`)

## Notes

- Confirm the exact existing convention for exposing `can_edit`/game_slug on list vs. detail
  serializers by reading a live example (e.g. `source/games/serializers/pc_list.py`,
  `character_detail.py`) before writing the new serializers — the issue is explicit that write
  access mirrors `Game.can_be_edited_by`, but the *shape* of how `can_edit` reaches the frontend
  should match whatever the codebase already does for a comparable case, to avoid introducing
  a one-off pattern.
- `Meta.ordering = ['id']` is a deliberate deviation from a chronological/date-based order —
  do not sort by `date` anywhere in the list view or serializer.
- No DELETE endpoint — do not add one.
- Data-access and security review are required after this work (new endpoints + new model
  exposed) — the architect will dispatch `data-access` and `security` once this is committed.
