# Backend Plan: Add a My Games page

Main plan: [plan.md](plan.md)

## Shared contracts

Produces `GET /my-games.json` exactly as specified in [plan.md](plan.md)'s "Shared contracts"
section — same field names, nesting, and null rules. Consumed by the `frontend` agent.

## Implementation Steps

### Step 1 — Query the current user's players with role/character, no N+1

In the new view, resolve every `Player` row for `request.user` in one query, with the game and PC
preloaded:

```python
from django.db.models import Prefetch
from games.models import Player, Character

players = (
    Player.objects.filter(user=request.user)
    .select_related('game')
    .prefetch_related(
        Prefetch('characters', queryset=Character.objects.filter(npc=False), to_attr='pc_list')
    )
)
```

Per player: `role = 'dm' if player.is_dm else 'player'`; `character = player.pc_list[0] if
player.pc_list else None`. This mirrors `PlayerListSerializer.get_character`
(`backend/games/serializers/games/players/player_list.py`), which already does
`obj.characters.filter(npc=False).first()` — reuse its paired `PlayerCharacterSerializer` for the
`character` field's `{name, photo_url}` shape rather than inventing a new one.

### Step 2 — Query conversation counts per game in one pass

Conversations link to games only indirectly, through participants' `Player.game`
(`backend/conversations/models/conversation_participant.py`, `Player` FK; `Player.game` FK). Build
one queryset for all conversations the user follows, annotated with unread count, then bucket by
game in Python (avoids one query per game):

```python
from django.db.models import Count, Q
from conversations.models import Conversation

conversations = (
    Conversation.objects.filter(participants__player__user=request.user)
    .annotate(
        unread=Count(
            'messages__visualisations',
            filter=Q(
                messages__visualisations__player__user=request.user,
                messages__visualisations__not_seen=True,
            ),
            distinct=True,
        ),
    )
    .prefetch_related('participants__player__game')
    .distinct()
)
```

For each conversation, collect the set of distinct `game_id`s among its participants (via the
prefetched `participants`), then for each of the current user's games increment `count` (and
`unread` when `unread > 0`) for every conversation whose participant-game-set includes that game.

### Step 3 — Response wrapper serializer

Add a new serializer package `backend/games/serializers/games/my_games/` (mirrors the
`serializers-organization.md` per-resource-folder convention) with a `MyGamesItemSerializer` that
takes a plain dict/object of `{game, role, character, conversations}` per item (not a Django
model instance — this is the "dedicated wrapper" the issue calls for, since none of the existing
serializers wrap heterogeneous data like this) and outputs the exact shape from the shared
contract using `GameListSerializer` and `PlayerCharacterSerializer` for the nested fields.

### Step 4 — View and URL

New view `backend/games/views/games/my_games_list.py`:

```python
@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def my_games_list(request):
    error_response = require_authenticated(request)
    if error_response:
        return error_response
    # ... build items via Steps 1-2, serialize via Step 3 ...
    return Response(serializer.data)
```

This mirrors `backend/games/views/games/games_list.py`'s `require_authenticated` pattern (not
`IsAuthenticated`, per the shared contract's 401 shape) — see `backend/games/views/common.py` for
`require_authenticated`/`UNAUTHENTICATED_RESPONSE_DATA`. No `paginated_list_response` — plain
`Response(serializer.data)`, per [plan.md](plan.md)'s no-pagination note.

Register in `backend/games/urls/games.py` (or a new `backend/games/urls/my_games.py` wired into
`backend/games/urls/__init__.py`): `path('my-games.json', views.my_games_list, name='my-games-list')`.

### Step 5 — Tests

New `backend/games/tests/views/games/my_games_list_test.py`, following the pattern in
`backend/games/tests/views/games/games_list_test.py` (pytest-django + `TokenAuthRequestMixin` for
auth, see `backend/games/tests/auth/account_test.py` for that mixin's usage) plus an explicit
`test_unauthenticated_returns_401`. Covers: DM item has `character: null`; player with no PC yet
has `character: null`; player with a PC gets it serialized; conversation counts and unread counts
across multiple games and conversations with mixed participants. Check whether
`ConversationFactory`/`ConversationParticipantFactory`/`MessageFactory`/`MessageVisualisationFactory`
already exist (only `backend/conversations/tests/models/` existed as of planning — model tests
only, no factories confirmed) — add them under `games.tests.factories` (or a new
`conversations.tests.factories`, matching wherever existing `PlayerFactory`/`GameFactory` live) if
missing.

## Files to Change

- `backend/games/views/games/my_games_list.py` — new view.
- `backend/games/serializers/games/my_games/` — new serializer package (`MyGamesItemSerializer`
  and any helper module for the role/character/conversation-count assembly logic).
- `backend/games/urls/games.py` (or new `backend/games/urls/my_games.py` + `urls/__init__.py`
  wiring) — `/my-games.json` route.
- `backend/games/tests/views/games/my_games_list_test.py` — new test file.
- `backend/games/tests/factories/*` or `backend/conversations/tests/factories/*` — conversation
  test factories, only if not already present.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/` (CI job:
  `pytest_views_rest`)
- `backend`: `poetry run ruff check .` (CI job: `checks`)

## Notes

- Confirm during implementation whether `Conversation`/`ConversationParticipant` factories already
  exist anywhere in the codebase before adding new ones.
- The per-game conversation bucketing in Step 2 is the trickiest part — if the in-Python bucketing
  proves awkward, consider an alternative: iterate the user's games and run one annotated query per
  game instead, trading a few more queries (bounded by game count, typically small) for simpler
  code. Either approach is acceptable; prioritize correctness and readability over strict
  query-count minimization here.
