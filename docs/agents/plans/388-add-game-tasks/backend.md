# Backend Plan: Add Game Tasks

Main plan: [plan.md](plan.md)

## Shared contracts

- Must expose, under `game_masters`/superuser gating that applies to **every** method
  (including `GET`):
  - `GET`/`POST /games/<slug>/tasks.json`
  - `PATCH /games/<slug>/tasks/<id>.json` (no `GET` on this route by design)
- Task item shape: `{ id, short_description, long_description, completed, session }`
  (`session` is a nullable `GameSession` id). `game` is never accepted from the request body.
- `session`, when given on create/update, must belong to the same `game` as the task, or the
  request is rejected with 400.
- 401/403 error bodies follow the existing `_EditPermission` shape:
  `{"errors": {"detail": ["authentication required"]}}` / `{"errors": {"detail": ["not
  allowed"]}}`.

## Implementation Steps

### Step 1 — `Task` model

Add `source/games/models/task.py`:

```python
class Task(models.Model):
    game = models.ForeignKey('games.Game', on_delete=models.CASCADE, related_name='tasks')
    session = models.ForeignKey(
        'games.GameSession', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='tasks',
    )
    short_description = models.CharField(max_length=200)
    long_description = models.TextField(blank=True, default='')
    completed = models.BooleanField(default=False)

    class Meta:
        ordering = ['id']

    def can_be_edited_by(self, user):
        return self.game.can_be_edited_by(user)

    def __str__(self):
        return self.short_description
```

This mirrors `source/games/models/game_session.py` exactly for the ownership delegation.
Register `Task` in `source/games/models/__init__.py` (import + `__all__`), and generate the
migration:

```bash
docker-compose run --rm majora_tests python manage.py makemigrations games
```

Register `Task` in `source/games/admin.py` (`admin.site.register(Task)`) — no custom
`ModelAdmin`/inline needed, matching `GameSession`'s plain registration. Removal stays
superuser-only via Django admin, consistent with `GameSession`/`Treasure` (no `DELETE`
endpoint).

### Step 2 — `TaskEditPermission`

In `source/games/permissions.py`, add:

```python
class TaskEditPermission(_EditPermission):
    """Encapsulate the authentication/authorization checks for accessing/editing a task."""
```

No new logic needed — `_EditPermission.check()` already returns 401/403/None based on
`obj.can_be_edited_by(user)`; the difference for Task is *where* it gets called (see Step 3):
for every other `_EditPermission` subclass it only gates writes, but for `TaskEditPermission`
it must also gate `GET`, since Tasks have no public read path.

### Step 3 — Serializers

Add, following the exact `game_session_*` file/naming split:

- `source/games/serializers/game_task_list.py` — `GameTaskListSerializer`: fields `id`,
  `short_description`, `long_description`, `completed`, `session`. Since Task has no public
  read path (every viewer is already a GameMaster/superuser), reuse this same serializer for
  the detail response too — no separate `GameTaskDetailSerializer` is needed (unlike
  `GameSession`, which needs a detail-only `can_edit` field because its own `GET` is public;
  Task's `GET` is never reached by a non-editor in the first place).
- `source/games/serializers/game_task_create.py` — `GameTaskCreateSerializer`: fields
  `short_description` (required), `long_description` (optional), `completed` (optional,
  default `False`), `session` (optional, `PrimaryKeyRelatedField(queryset=GameSession.objects.all(),
  required=False, allow_null=True)`).
- `source/games/serializers/game_task_update.py` — `GameTaskUpdateSerializer`: same fields as
  create, all `required=False`, `session` additionally `allow_null=True` so it can be cleared.

Both create/update serializers must validate that `session`, when provided, belongs to the
same game. Since `game` isn't itself a serializer field (assigned server-side), pass the
`Game` instance in via serializer `context` and validate in `validate_session`:

```python
def validate_session(self, value):
    game = self.context.get('game')
    if value is not None and game is not None and value.game_id != game.id:
        raise serializers.ValidationError('session must belong to the same game')
    return value
```

Register all three new serializers in `source/games/serializers/__init__.py`.

### Step 4 — Views

Add a new `source/games/views/game_tasks/` package, mirroring `game_sessions/`:

- `source/games/views/game_tasks/game_tasks_list.py`:

  ```python
  @api_view(['GET', 'POST'])
  @authentication_classes([CookieTokenAuthentication])
  @permission_classes([AllowAny])
  def game_tasks_list(request, game_slug):
      game = get_object_or_404(Game, game_slug=game_slug)

      error_response = TaskEditPermission.check(request, game)
      if error_response:
          return error_response

      if request.method == 'POST':
          return _create_task(request, game)

      return paginated_list_response(request, game.tasks.all(), GameTaskListSerializer)


  def _create_task(request, game):
      serializer = GameTaskCreateSerializer(data=request.data, context={'game': game})
      error_response = validated_or_error(serializer)
      if error_response:
          return error_response

      task = serializer.save(game=game)
      detail = GameTaskListSerializer(task)
      return Response(detail.data, status=201)
  ```

  Note the permission check runs unconditionally (both `GET` and `POST`), unlike
  `game_sessions_list` where it's only invoked inside `_create_session` — this is the key
  behavioral difference driven by Task's read-gating requirement.

- `source/games/views/game_tasks/game_task_detail.py`:

  ```python
  @api_view(['PATCH'])
  @authentication_classes([CookieTokenAuthentication])
  @permission_classes([AllowAny])
  def game_task_detail(request, game_slug, task_id):
      game = get_object_or_404(Game, game_slug=game_slug)
      task = get_object_or_404(Task, id=task_id, game=game)

      error_response = TaskEditPermission.check(request, task)
      if error_response:
          return error_response

      serializer = GameTaskUpdateSerializer(
          task, data=request.data, partial=True, context={'game': game},
      )
      error_response = validated_or_error(serializer)
      if error_response:
          return error_response

      serializer.save()
      return Response(GameTaskListSerializer(task).data)
  ```

  This intentionally does not reuse `views/common.py`'s `detail_or_update` helper, since that
  helper only gates the `PATCH` branch — Task has no `GET` branch to gate in the first place
  (only `PATCH` is registered on this route; see Step 5's URL entry, no `GET` counterpart).

Create `source/games/views/game_tasks/__init__.py` exporting both, and wire them into
`source/games/views/__init__.py` (import + `__all__`), following the existing
`game_sessions` entries as a template.

### Step 5 — URLs

In `source/games/urls.py`, add (near the existing `sessions` entries):

```python
path('games/<slug:game_slug>/tasks.json', views.game_tasks_list, name='game-tasks-list'),
path(
    'games/<slug:game_slug>/tasks/<int:task_id>.json',
    views.game_task_detail,
    name='game-task-detail',
),
```

### Step 6 — Tests

Add, mirroring the `game_session` test structure:

- `source/games/tests/models/test_task.py` — `can_be_edited_by` delegation, `__str__`,
  default `completed=False`.
- `source/games/tests/serializers/test_game_task_list.py` — field shape.
- `source/games/tests/serializers/test_game_task_create.py` /
  `test_game_task_update.py` — required/optional fields, `session` cross-game validation
  (400/`ValidationError` when session belongs to another game).
- `source/games/tests/permissions_test.py` — add a `TestTaskEditPermissionCheck` class
  (401/403/None cases), mirroring `TestGameEditPermissionCheck`.
- `source/games/tests/views/game_tasks/game_tasks_list_test.py` — covering:
  - `GET`: 401 unauthenticated, 403 non-GameMaster, 200 + paginated body/headers for the
    GameMaster and for a superuser.
  - `POST`: 401/403 same as above; 201 + persisted task for the GameMaster/superuser;
    validation error (400) when `session` belongs to a different game; `game` in the payload
    is ignored (task is always created under the URL's game).
- `source/games/tests/views/game_tasks/game_task_detail_test.py` — covering:
  - `PATCH`: 401/403/200 cases (mirroring
    `source/games/tests/views/game_sessions/game_session_detail_test.py`'s
    `TestGameSessionDetailPatchView`), 404 for unknown task id or task belonging to a
    different game, partial-update behavior, `session` clearing (`null`) and cross-game
    rejection.
  - No `GET` test class — the route doesn't support `GET`.

### Step 7 — Documentation

Add a `## Task` section to `docs/agents/access-control.md` (after `## GameSession`),
following the same table shape used for `GameSession`, but noting explicitly that **List**
and **Detail** rows are also GameMaster/superuser-gated (401/403), not `AllowAny`, and listing
the exposed/write fields (`id`, `short_description`, `long_description`, `completed`,
`session`).

## Files to Change

- `source/games/models/task.py` — new
- `source/games/models/__init__.py` — export `Task`
- `source/games/migrations/00XX_task.py` — new (generated)
- `source/games/admin.py` — register `Task`
- `source/games/permissions.py` — add `TaskEditPermission`
- `source/games/serializers/game_task_list.py` — new
- `source/games/serializers/game_task_create.py` — new
- `source/games/serializers/game_task_update.py` — new
- `source/games/serializers/__init__.py` — export the three new serializers
- `source/games/views/game_tasks/__init__.py` — new
- `source/games/views/game_tasks/game_tasks_list.py` — new
- `source/games/views/game_tasks/game_task_detail.py` — new
- `source/games/views/__init__.py` — export `game_tasks_list`, `game_task_detail`
- `source/games/urls.py` — register the two new routes
- `source/games/tests/models/test_task.py` — new
- `source/games/tests/serializers/test_game_task_list.py` — new
- `source/games/tests/serializers/test_game_task_create.py` — new
- `source/games/tests/serializers/test_game_task_update.py` — new
- `source/games/tests/permissions_test.py` — add `TestTaskEditPermissionCheck`
- `source/games/tests/views/game_tasks/game_tasks_list_test.py` — new
- `source/games/tests/views/game_tasks/game_task_detail_test.py` — new
- `docs/agents/access-control.md` — add `## Task` section

## CI Checks

- `source/`: `docker-compose run --rm majora_tests pytest games/tests/views/` (CI job:
  `pytest_views_rest`, since `game_tasks/` tests are not under `views/characters/`)
- `source/`: `docker-compose run --rm majora_tests pytest --ignore=games/tests/views/` (CI
  job: `pytest_all`)
- `source/`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)

## Notes

- `data-access` review should be invoked once this is implemented, since it adds a new model,
  three new endpoint/method combinations, and — unlike every existing resource — gates `GET`
  behind an authorization check rather than `AllowAny`.
- The `session` FK uses `on_delete=models.SET_NULL` (not `CASCADE`) so deleting a
  `GameSession` via Django admin doesn't cascade-delete its tasks, only detaches them —
  consistent with a task outliving the session it was originally scoped to.
