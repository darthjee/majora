# Backend Plan: Add Polls Links In Game Show Page

Main plan: [plan.md](plan.md)

## Shared contracts

- Add `title` and `description` to `Poll` via migration.
- Add three endpoints: `GET /games/<slug>/polls.json` (list, `status` filter, paginated), `GET /games/<slug>/polls/<id>.json` (detail with nested `options`), `POST /games/<slug>/polls.json` (create poll + options together).
- All three gated by a new `PollPermission` (DM(s)/players/`is_superuser`/`is_staff` of the poll's game — same check for view and create).
- All three set `X-Skip-Cache: true` (no caching), same as `session_messages_list`/`game_tasks_list`'s auth-gated siblings.
- New polls are created with `status=Poll.STATUS_OPEN` (see `plan.md`'s "Response shapes" section for why).
- See `plan.md` for the exact response/request JSON shapes.

## Implementation Steps

### Step 1 — Migration: add `title`/`description` to `Poll`

Edit `backend/games/models/poll/poll.py`, adding:

```python
title = models.CharField(max_length=200, blank=True, default='')
description = models.TextField(blank=True, default='')
```

`blank=True, default=''` at the DB level mirrors `Task.long_description` (and, for `title`'s required-ness, note that unlike `Task.short_description` — added in `Task`'s original migration with no existing rows to backfill — `Poll` rows may already exist from migration `0042`, so a non-blank/no-default `title` would force an interactive default at `makemigrations` time; keep it blank/defaulted at the model level, and enforce "required" only where it matters: `PollCreateSerializer`, Step 4 below). Generate the migration with `docker-compose run --rm majora_tests python manage.py makemigrations games` and commit the generated file under `backend/games/migrations/`.

### Step 2 — `PollPermission`

Add to `backend/games/permissions.py`, after `SessionMessagePermission`:

```python
class PollPermission(_EditPermission):
    """Encapsulate the authentication/authorization checks for game polls.

    Unlike SessionMessagePermission, view and create share the exact same check: the
    game's DM(s), players, and admins (superuser/staff) — no stricter create-only rule,
    per the issue's explicit permission list for all three poll endpoints.
    """

    @classmethod
    def check(cls, request, game):
        """Return an error Response if `request.user` may not view/create polls for `game`."""
        unauthenticated = cls._unauthenticated_response(request)
        if unauthenticated:
            return unauthenticated
        if not cls._is_allowed(request.user, game):
            return cls._forbidden_response()
        return None

    @classmethod
    def _is_allowed(cls, user, game):
        return (
            user.is_superuser or user.is_staff
            or game.players.filter(user=user).exists()
            or game.game_masters.filter(user=user).exists()
        )
```

### Step 3 — Serializers

Add under `backend/games/serializers/games/polls/` (new folder, mirroring `games/sessions/`):

- `poll_option.py` — `PollOptionSerializer(serializers.ModelSerializer)`: read-only, `fields = ['id', 'option']`. Used nested inside the detail serializer.
- `poll_option_write.py` — `PollOptionWriteSerializer(serializers.ModelSerializer)`: `fields = ['option']`, `option` required. No `id`/`delete` handling needed (unlike `CharacterLinkWriteSerializer`) — this issue only ever creates options, never updates/deletes them.
- `poll_list.py` — `PollListSerializer(serializers.ModelSerializer)`: `fields = ['id', 'title', 'type', 'status']` (no `description`/`options` in the list — keep list payloads light, matching `GameTaskListSerializer`'s trimmed shape vs. a detail view).
- `poll_detail.py` — `PollDetailSerializer(serializers.ModelSerializer)`: `fields = ['id', 'title', 'description', 'type', 'status', 'options']`, with `options = PollOptionSerializer(many=True, read_only=True)`.
- `poll_create.py` — `PollCreateSerializer(serializers.ModelSerializer)`:
  ```python
  class PollCreateSerializer(serializers.ModelSerializer):
      options = PollOptionWriteSerializer(many=True)

      class Meta:
          model = Poll
          fields = ['title', 'description', 'type', 'options']
          extra_kwargs = {
              'title': {'required': True},
              'description': {'required': False},
              'type': {'required': False},
          }

      def validate_options(self, value):
          if not value:
              raise serializers.ValidationError('At least one option is required.')
          return value

      def create(self, validated_data):
          options = validated_data.pop('options')
          poll = Poll.objects.create(
              game=self.context['game'], status=Poll.STATUS_OPEN, **validated_data,
          )
          PollOption.objects.bulk_create(
              [PollOption(poll=poll, option=entry['option']) for entry in options],
          )
          return poll
  ```
  (`game` passed via serializer `context`, matching `GameTaskCreateSerializer`'s `context={'game': game}` convention — see `game_tasks_list.py`.)

Register all five in `backend/games/serializers/__init__.py`, alphabetically among the existing `games.*` imports.

### Step 4 — Views

Add under `backend/games/views/polls/` (new package, with `__init__.py` exporting both views):

- `game_polls_list.py` — `game_polls_list(request, game_slug)`:
  - `GET`/`POST` via `@api_view(['GET', 'POST'])`, `AllowAny` + inline `PollPermission.check(request, game)` for both methods (mirrors `game_tasks_list.py`'s shape, but with the shared `PollPermission` gating GET too, unlike Task).
  - `GET`: build the queryset `game.polls.all()`; if `status` is present in `request.query_params`, filter `.filter(status=status)` — no validation against `Poll.STATUS_CHOICES` (tolerant of an unrecognized value the same way `?allegiance=`/`?slain=` are elsewhere — an unknown status just yields an empty page, no 400). Call `paginated_list_response(request, queryset, PollListSerializer)`, then set `response['X-Skip-Cache'] = 'true'` before returning (the helper itself doesn't set that header — see `session_messages_list.py`'s manual pattern, since `paginated_list_response` alone is not enough here).
  - `POST`: `PollCreateSerializer(data=request.data, context={'game': game})`, `validated_or_error`, `serializer.save()`, respond `201` with `PollDetailSerializer(poll).data` (so the frontend gets `options` with real ids back immediately), also with `X-Skip-Cache: true`.
- `game_poll_detail.py` — `game_poll_detail(request, game_slug, poll_id)`:
  - `GET` only. `get_object_or_404(Poll, id=poll_id, game=game)`, `PollPermission.check(request, game)`, then `Response(PollDetailSerializer(poll).data)` with `X-Skip-Cache: true`.

Register in `backend/games/views/__init__.py` (new `from .polls import game_poll_detail, game_polls_list` alongside the existing `from .game_tasks import ...` line) and in `backend/games/urls/games.py`, near the existing `sessions`/`tasks` entries:

```python
path('games/<slug:game_slug>/polls.json', views.game_polls_list, name='game-polls-list'),
path(
    'games/<slug:game_slug>/polls/<int:poll_id>.json',
    views.game_poll_detail,
    name='game-poll-detail',
),
```

### Step 5 — Tests

Add under `backend/games/tests/views/polls/` (mirroring `games/tests/views/game_tasks/`):

- `game_polls_list_test.py`: 200 list with pagination headers + `X-Skip-Cache`; `status` filter narrows results; 401 unauthenticated; 403 for a user who is neither player/DM/staff/superuser of the game; 201 create with nested options persisted and `status` forced to `open`; 400 when `title` or `options` is missing/empty; DM, player, and superuser/staff can all list and create; a non-member cannot.
- `game_poll_detail_test.py`: 200 with nested `options`; 404 for a poll belonging to a different game or a nonexistent id; same 401/403 permission matrix as the list test.

Extend `backend/games/tests/models/poll/poll_test.py` if needed to cover the new `title`/`description` fields (default blank values, `str()` unaffected).

## Files to Change

- `backend/games/models/poll/poll.py` — add `title`, `description`
- `backend/games/migrations/<new>.py` — generated migration
- `backend/games/permissions.py` — add `PollPermission`
- `backend/games/serializers/games/polls/poll_option.py` — new
- `backend/games/serializers/games/polls/poll_option_write.py` — new
- `backend/games/serializers/games/polls/poll_list.py` — new
- `backend/games/serializers/games/polls/poll_detail.py` — new
- `backend/games/serializers/games/polls/poll_create.py` — new
- `backend/games/serializers/__init__.py` — export the five new serializers
- `backend/games/views/polls/__init__.py` — new
- `backend/games/views/polls/game_polls_list.py` — new
- `backend/games/views/polls/game_poll_detail.py` — new
- `backend/games/views/__init__.py` — export the two new views
- `backend/games/urls/games.py` — register the two new routes
- `backend/games/tests/views/polls/game_polls_list_test.py` — new
- `backend/games/tests/views/polls/game_poll_detail_test.py` — new
- `backend/games/tests/models/poll/poll_test.py` — extend for `title`/`description`

## CI Checks

- `backend/`: `docker-compose run --rm majora_tests pytest games/tests/views/ --ignore=games/tests/views/game/` (CI job: `pytest_views_rest`)
- `backend/`: `docker-compose run --rm majora_tests pytest --ignore=games/tests/views/` (CI job: `pytest_all`)
- `backend/`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)

## Notes

- `data-access` and `security` review should be invoked once this is implemented — three new authenticated endpoints, new serializer fields, and a new permission class.
