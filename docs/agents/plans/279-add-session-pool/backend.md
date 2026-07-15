# Backend Plan: Add session pool

Main plan: [plan.md](plan.md)

## Shared contracts

- `Poll` gains `content_type`/`object_id`/`content_object` (nullable `GenericForeignKey`,
  copied from `Link`'s implementation) — see [plan.md](plan.md) for exact field definitions.
- New `POST /games/<slug:game_slug>/sessions/<int:session_id>/poll.json`: request
  `{"dates": [...]}, response = PollDetailSerializer` shape, `201`. Permission: reuse
  `PollPermission.check(request, game)` unchanged (same DM/player/admin audience as the existing
  poll endpoints).
- Guardrail: do **not** add any poll reference to `GameSessionDetailSerializer` — that view is
  public (`AllowAny`, no inline check on GET), and poll data must stay reachable only through the
  separately-gated Poll endpoints.

## Implementation Steps

### Step 1 — Polymorphic relationship on `Poll`

In `backend/games/models/poll/poll.py`, add (after the existing fields, mirroring
`backend/games/models/link.py` exactly):

```python
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
object_id = models.PositiveIntegerField(null=True, blank=True)
content_object = GenericForeignKey('content_type', 'object_id')
```

Generate the migration (`python manage.py makemigrations games`) — a plain `AddField` x2, no data
migration needed (existing polls simply get null values, unlike `Link`'s conversion migration
which had existing data to backfill).

### Step 2 — Session-scoped poll create serializer

New file `backend/games/serializers/games/polls/session_poll_create.py`:

- `SessionPollCreateSerializer(serializers.Serializer)` (not a `ModelSerializer` — the payload
  shape, `{"dates": [...]}`, doesn't map 1:1 to `Poll` fields).
- `dates = serializers.ListField(child=serializers.DateField(), allow_empty=False)`.
- `validate_dates`: enforce the same upper bound as `PollCreateSerializer.MAX_OPTIONS` (import
  `MAX_OPTIONS` from `games.serializers.games.polls.poll_create` rather than redefining it).
- `DEFAULT_TITLE = 'Next session date'` module constant.
- `create(self, validated_data)`: creates the `Poll` with `game=self.context['game']`,
  `status=Poll.STATUS_OPEN`, `option_type=Poll.OPTION_TYPE_DATE`, `type=Poll.TYPE_SINGLE`,
  `title=DEFAULT_TITLE`, `content_object=self.context['session']`; then
  `PollOption.objects.bulk_create([PollOption(poll=poll, option=date.isoformat()) for date in
  validated_data['dates']])` — mirrors `PollCreateSerializer.create()`'s shape.
- Register the new serializer in `backend/games/serializers/__init__.py` (import + `__all__`
  entry), same pattern as `PollCreateSerializer`.

### Step 3 — View

New file `backend/games/views/game_sessions/session_poll_create.py`, function
`session_poll_create(request, game_slug, session_id)`, following
`backend/games/views/game_sessions/session_messages_list.py`'s shape exactly:

- `@api_view(['POST'])`, `@authentication_classes([CookieTokenAuthentication])`,
  `@permission_classes([AllowAny])` with the same comment convention explaining that
  authorization is enforced inline (not truly public).
- `get_object_or_404(Game, game_slug=game_slug)`, then
  `get_object_or_404(GameSession, id=session_id, game=game)`.
- `PollPermission.check(request, game)` — return the error response if any.
- Validate `SessionPollCreateSerializer(data=request.data, context={'game': game, 'session':
  session})` via `validated_or_error` (from `..common`).
- On success: `poll = serializer.save()`; return `PollDetailSerializer(poll).data` wrapped in a
  `Response(..., status=201)` with `X-Skip-Cache: true`, matching `game_polls_list.py`'s
  `_create_poll`.

Wire it up:
- `backend/games/views/game_sessions/__init__.py` — export `session_poll_create`.
- `backend/games/views/__init__.py` — re-export it.
- `backend/games/urls/games.py` — add
  `path('games/<slug:game_slug>/sessions/<int:session_id>/poll.json', views.session_poll_create,
  name='game-session-poll-create')`, placed right after the existing
  `sessions/<int:session_id>/messages.json` entry.

### Step 4 — Tests

- `backend/games/tests/models/poll/poll_test.py`: add coverage that a `Poll` can be created with
  a `content_object` pointing at a `GameSession` and that `content_type`/`object_id` default to
  `None` (unrelated poll, existing behavior unaffected).
- New `backend/games/tests/views/game_sessions/session_poll_create_test.py`:
  - `201` for DM, player, and superuser/staff; `403` for an unrelated authenticated user; `401`
    unauthenticated — mirrors `game_polls_list_test.py`'s permission-matrix style.
  - Request with `dates=["2026-08-01", "2026-08-08"]` produces a poll with `option_type='date'`,
    `type='single'`, `status='open'`, exactly 2 `PollOption`s with those values (in order), and
    `content_object == session`.
  - Empty `dates` and more-than-`MAX_OPTIONS` dates both return `400`.
  - Response body matches `PollDetailSerializer`'s shape (same fields as the general poll detail
    endpoint, confirming `option_type` and `options` round-trip correctly).

## Files to Change

- `backend/games/models/poll/poll.py` — add the generic relation fields.
- `backend/games/migrations/00XX_poll_content_type_object_id.py` — new migration (auto-generated).
- `backend/games/serializers/games/polls/session_poll_create.py` — new serializer.
- `backend/games/serializers/__init__.py` — export it.
- `backend/games/views/game_sessions/session_poll_create.py` — new view.
- `backend/games/views/game_sessions/__init__.py` — export it.
- `backend/games/views/__init__.py` — re-export it.
- `backend/games/urls/games.py` — new URL pattern.
- `backend/games/tests/models/poll/poll_test.py` — generic-relation coverage.
- `backend/games/tests/views/game_sessions/session_poll_create_test.py` — new endpoint coverage.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`).
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`).

## Notes

- Requires #546's `Poll.option_type`/`Poll.OPTION_TYPE_DATE` to already exist — this plan doesn't
  redefine them.
- `PollListSerializer`/`PollOptionSerializer`/`PollOptionWriteSerializer` are untouched — the
  general poll list/detail/vote endpoints already work unchanged for session-linked polls, since
  `content_object` is purely additive metadata.
- Do not add `content_type`/`object_id` to any serializer's `fields` unless a later issue needs
  to expose "which session/entity is this poll for" in the API — not required by this issue.
