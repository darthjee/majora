# Backend Plan: Add Player page

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section — backend produces every endpoint/field
listed there; frontend only consumes them.

## Implementation Steps

### Step 1 — Narrow `PlayerPermission` to players-only

`backend/games/permissions.py:188-199` — `PlayerPermission._is_allowed` currently delegates to
the shared `_is_admin_or_player` (`is_superuser or is_staff or game.has_player(user)`). Change
it to `return game.has_player(user)` directly, dropping the staff/superuser bypass. Do **not**
touch `_is_admin_or_player` itself — it's reused by `SessionMessagePermission`, `PollPermission`,
`PollVotePermission`, none of which are in scope here. Update the docstrings on `check`/
`_is_allowed` (currently say "a superuser, staff, a player, or the DM") to say "a player or the
DM of `game`". This single change narrows all three endpoints below at once, since they'll all
reuse `PlayerPermission`.

### Step 2 — Single-player detail endpoint

Per `docs/agents/views-organization.md`'s convention (a resource's own detail route lives
alongside its list route), add `backend/games/views/game/players/game_player_detail.py`:

```python
@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_player_detail(request, game_slug, player_id):
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = PlayerPermission.check(request, game)
    if error_response:
        return error_response
    player = get_object_or_404(game.players, id=player_id)
    return access_response(PlayerListSerializer, player, request)
```

`access_response` (`backend/games/views/common.py:123-131`) already serializes one object and
sets `X-Skip-Cache: true` — no need to set the header manually as `game_players.py` does.
Register in `backend/games/views/game/players/__init__.py` (add `game_player_detail` to the
`from .game_player_detail import game_player_detail` / `__all__`) and add the route to
`backend/games/urls/players.py`:
`path('games/<slug:game_slug>/players/<int:player_id>.json', views.game_player_detail, name='game-player-detail')`.

### Step 3 — Conversations endpoint (new, from scratch)

No `urls.py`/`views/`/`serializers/` exist for conversations anywhere yet; the
`Conversation`/`ConversationParticipant`/`Message` models (`backend/conversations/models/`)
are untouched by this issue. Routing/views/serializers for this games-scoped endpoint follow
the `games` app's own convention (single URL root, `game/<resource>/` nesting per
`views-organization.md`), even though the underlying models live in the separate
`conversations` app — there's no existing precedent for a second app owning its own
`urls.py`, and `majora_project/urls.py` only includes `games.urls` today.

- Serializer `backend/games/serializers/games/conversations/conversation_list.py`:
  ```python
  class ConversationListSerializer(serializers.Serializer):
      id = serializers.IntegerField()
      title = serializers.CharField()
  ```
- View `backend/games/views/game/conversations/game_conversations.py`:
  ```python
  @api_view(['GET'])
  @authentication_classes([CookieTokenAuthentication])
  @permission_classes([AllowAny])
  def game_conversations(request, game_slug):
      game = get_object_or_404(Game, game_slug=game_slug)
      error_response = PlayerPermission.check(request, game)
      if error_response:
          return error_response

      requesting_player = get_object_or_404(game.players, user=request.user)
      target_player = get_object_or_404(game.players, id=request.query_params.get('player_id'))

      conversations = Conversation.objects.filter(
          participants__player=requesting_player,
      ).filter(
          participants__player=target_player,
      ).distinct().order_by('-id')

      response = paginated_list_response(request, conversations, ConversationListSerializer)
      response['X-Skip-Cache'] = 'true'
      return response
  ```
  `player_id` is required for this issue's use case; `get_object_or_404` on a missing/non-numeric
  value naturally 404s (acceptable — matches the project's existing tolerant-but-not-permissive
  style for malformed filters). `game.players.get(user=request.user)` is safe because `Player`
  has `unique_together = [('game', 'user')]` — at most one row per user per game.
- New `backend/games/urls/conversations.py`:
  `path('games/<slug:game_slug>/conversations.json', views.game_conversations, name='game-conversations')`,
  wired into `backend/games/urls/__init__.py` (add `conversations` to the import line and the
  `urlpatterns` concatenation, e.g. after `players`).
- `backend/games/views/game/conversations/__init__.py` exporting `game_conversations`.

### Step 4 — Docs

- `docs/agents/access-control/player.md` — add a `Show` row to the table:
  `Show (GET /games/<game_slug>/players/<id>.json) | Player of the game or that game's
  GameMaster — PlayerPermission.check; 401/403/404 as the list endpoint`. Update the existing
  List row and the doc's prose to drop "Superuser, or Staff (`is_staff`)" — call out explicitly
  that, unlike most endpoints in this codebase, staff/superuser are **excluded** here (per
  issue #695), since `access-control.md`'s top-level "superusers always have full access to
  everything" default no longer holds for this resource.
- `docs/agents/access-control.md` — add `Conversation` to the "Models / resources" list, linking
  a new `access-control/conversation.md`.
- New `docs/agents/access-control/conversation.md` — document `Conversation`/
  `ConversationParticipant`, the new `conversations.json` endpoint (same DM/player-only access
  rule, `player_id` required, `X-Skip-Cache`, pagination), and explicitly note only the two
  players' shared conversations are returned (no ability to browse a third party's conversations
  via this filter). `Message`/`MessageVisualisation` stay undocumented here — out of scope
  (reserved for the future messages issue mentioned in #695).
- `docs/agents/product.md` — add a `### Conversation` entity section (title, owner `Player`,
  participants via `ConversationParticipant`, messages via `Message`), mirroring the existing
  `### Player` section's style, and link the new roster-detail endpoint from `### Player`'s
  existing roster-endpoint sentence.

### Step 5 — Tests

Mirror every new/changed file under `backend/games/tests/` and `backend/conversations/tests/`:
- `backend/games/tests/permissions/player_permission_test.py` (or wherever `PlayerPermission`
  is currently tested) — update/add cases proving staff/superuser are now rejected.
- `backend/games/tests/views/game/players/game_player_detail_test.py` — 200 (player/DM), 403
  (staff/superuser — new), 401 (anonymous), 404 (unknown game or player id, cross-game player id).
- `backend/games/tests/views/game/conversations/game_conversations_test.py` — 200 with correct
  intersection filtering (conversation both are in vs. only one is in), pagination, 403/401 as
  above, 400/404 on missing/invalid `player_id`.
- `backend/games/tests/serializers/games/conversations/conversation_list_test.py`.
- `backend/games/tests/serializers/games/players/game_player_detail_test.py` if the existing
  `player_list_test.py` doesn't already fully cover the reused serializer's edge cases (null
  user, null character).
- `backend/conversations/tests/` — no model changes, so no new model tests expected, but check
  existing factories (`ConversationFactory`/`ConversationParticipantFactory`, if present under
  `backend/conversations/tests/` or `backend/games/tests/factories.py`) exist and cover
  multi-participant setups; add them if missing, since the new view tests need to build
  conversations with 2+ participants.

## Files to Change

- `backend/games/permissions.py` — narrow `PlayerPermission`
- `backend/games/views/game/players/game_player_detail.py` (new)
- `backend/games/views/game/players/__init__.py`
- `backend/games/urls/players.py`
- `backend/games/views/game/conversations/game_conversations.py` (new)
- `backend/games/views/game/conversations/__init__.py` (new)
- `backend/games/serializers/games/conversations/conversation_list.py` (new)
- `backend/games/serializers/__init__.py` (export `ConversationListSerializer`, matching how
  `PlayerListSerializer` is re-exported)
- `backend/games/urls/conversations.py` (new)
- `backend/games/urls/__init__.py`
- `docs/agents/access-control/player.md`, `docs/agents/access-control.md`,
  `docs/agents/access-control/conversation.md` (new), `docs/agents/product.md`
- Corresponding test files listed in Step 5

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/ --cov ...` (CI job:
  `pytest_views_characters`) — covers `game/players/` and the new `game/conversations/`.
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov ...` (CI job: `pytest_all`) —
  covers permissions, serializers, and anything under `backend/conversations/tests/`; no CI
  config change needed, this job's ignore-only pattern already picks up new files.

## Notes

- **Conflicts with the documented project-wide default.** `docs/agents/access-control.md`
  states "Superusers always have full access to everything, regardless of any other rule listed
  below." This issue deliberately breaks that default for `players.json`, `players/:id.json`,
  and `conversations.json` (per explicit product decision during refinement — staff/superuser
  have no legitimate reason to browse a game's roster or player conversations). Flag this loudly
  in the PR description and in `player.md`/`conversation.md` so it isn't "fixed" back to the
  default by a future unrelated change.
- Run tests inside the project containers (`docker-compose run --rm majora_tests pytest ...`),
  never on the host, per `AGENTS.md`.
- `ConversationListSerializer` intentionally exposes only `id`/`title` — no participant list, no
  last-message preview — since the right-hand message panel and richer conversation data are
  explicitly out of scope (reserved for the future messages issue referenced in #695).
