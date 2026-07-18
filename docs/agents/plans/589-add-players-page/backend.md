# Backend Plan: Add players page

Main plan: [plan.md](plan.md)

## Shared contracts

Must produce `GET /games/:game_slug/players.json` exactly as specified in
[plan.md](plan.md)'s "Shared contracts" section: paginated, `X-Skip-Cache: true`, payload
`{id, user: {display_name, photo_url} | null, character: {name, photo_url} | null}`,
ordered by `Player.Meta.ordering` (`['name']`), no filters.

## Implementation Steps

### Step 1 — Add the one-PC-per-player DB constraint

In `backend/games/models/character/character.py`, add to `Character.Meta`:

```python
constraints = [
    models.UniqueConstraint(
        fields=['player'],
        condition=models.Q(player__isnull=False),
        name='unique_player_character',
    ),
]
```

This only constrains non-null `player` values, so NPCs and unowned PCs (`player=None`)
remain unaffected and multiple such rows stay valid. Generate the migration with
`docker-compose run --rm majora_be poetry run python manage.py makemigrations games` — per
the issue, production data is assumed already consistent with this rule, so no data
migration/backfill is included, only the schema change.

### Step 2 — Add `PlayerPermission`

In `backend/games/permissions.py`, alongside `PollPermission` (same file, same shape):

```python
class PlayerPermission(_EditPermission):
    """Encapsulate the authentication/authorization checks for a game's players list."""

    @classmethod
    def check(cls, request, game):
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
        )
```

This is a superuser/staff/DM/player check identical to `PollPermission._is_allowed` —
`game.players.filter(user=user)` already covers the DM, since a DM is just a `Player` row
with `is_dm=True`.

### Step 3 — Add the nested serializers

Following the `serializers/games/polls/`, `serializers/games/sessions/` folder convention
(a resource's own nested sub-resources get their own subfolder under `games/`), create
`backend/games/serializers/games/players/`:

- `player_user.py` — `PlayerUserSerializer(serializers.Serializer)`, takes a `User`
  instance (or is skipped entirely when `player.user` is `None` — handled in the list
  serializer, see below):
  - `display_name` — `SerializerMethodField`, resolves via
    `UserProfile.objects.get_or_create(user=user)` + `.display_name`, exact pattern as
    `SessionMessageUserSerializer.get_name`/`MyAccountDetailSerializer.get_display_name`.
  - `photo_url` — `SerializerMethodField`, `GravatarUrlBuilder.build(profile.email_hash)`,
    same pattern as `get_avatar_url` in both serializers above (just renamed to match this
    endpoint's `photo_url` field name instead of `avatar_url`).
- `player_character.py` — `PlayerCharacterSerializer(serializers.ModelSerializer)` over
  `Character`, fields `name` and `photo_url` (`source='profile_photo.path'`, `default=None`
  — same source `CharacterListSerializer.profile_photo_path` already uses, just renamed to
  `photo_url` per this endpoint's contract).
- `player_list.py` — `PlayerListSerializer(serializers.Serializer)` over `Player`:
  - `id` — plain field.
  - `user` — `SerializerMethodField`, returns `None` if `obj.user_id` is `None`, else
    `PlayerUserSerializer(obj.user).data`.
  - `character` — `SerializerMethodField`, returns `None` if the player has no PC, else
    `PlayerCharacterSerializer(character).data`. Resolve the character via
    `obj.characters.filter(npc=False).first()` (matches the issue's "first PC character
    owned by the user" definition; becomes effectively "the" PC once Step 1's constraint is
    in place for any newly-created data, but existing rows are read tolerantly with
    `.first()` regardless).

Register all three in `backend/games/serializers/__init__.py`'s re-export list (alongside
the existing `Poll*`/`GameSession*` entries), per
[serializers-organization.md](../../serializers-organization.md).

### Step 4 — Add the view and URL

Following the `views/polls/game_polls_list.py` pattern (list-only, `PlayerPermission` +
`paginated_list_response` + `X-Skip-Cache`), create
`backend/games/views/game/players/game_players.py`:

```python
"""View for listing a game's players."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from ....authentication import CookieTokenAuthentication
from ....models import Game
from ....permissions import PlayerPermission
from ....serializers import PlayerListSerializer
from ...common import paginated_list_response


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authorisation is enforced inline below via PlayerPermission.check(), since
# Players have no public read path.
@permission_classes([AllowAny])
def game_players(request, game_slug):
    """Return a paginated list of a game's players."""
    game = get_object_or_404(Game, game_slug=game_slug)

    error_response = PlayerPermission.check(request, game)
    if error_response:
        return error_response

    response = paginated_list_response(request, game.players.all(), PlayerListSerializer)
    response['X-Skip-Cache'] = 'true'
    return response
```

Note this is a nested resource under `game/players/` per
[views-organization.md](../../views-organization.md) (rule 2: a *different* resource nested
under a specific game).

Add `backend/games/urls/players.py`:

```python
"""URL patterns for a game's players."""

from django.urls import path

from .. import views

urlpatterns = [
    path('games/<slug:game_slug>/players.json', views.game_players, name='game-players'),
]
```

Wire it into `backend/games/urls/__init__.py` and re-export `game_players` from the views
package `__init__.py`, matching how `game_pcs`/`game_polls_list` are already wired.

### Step 5 — Update documentation

- `docs/agents/access-control/player.md`: replace the "Players have no dedicated public
  endpoint" opening with a description of the new `players.json` endpoint (mirror
  [access-control/poll.md](../../access-control/poll.md)'s table format: List row, who can,
  status codes, pagination, cache, exposed fields).
- `docs/agents/product.md`: change the Player section's "owns zero or more characters" to
  "zero or one" (Step 1's new constraint), and add a sentence to the **Staff Role** section
  (plus the Summary Table) explicitly naming the new `players.json` List endpoint as an
  additional named exception to "Staff gains no authority over any game-scoped resource" —
  the product-owner review for this issue flagged that `Player` is currently listed as a
  hard staff exception with no carve-out, so this needs to be reconciled the same way the
  Poll exception already is, rather than silently extending staff access.

## Files to Change

- `backend/games/models/character/character.py` — add the `unique_player_character`
  partial unique constraint.
- `backend/games/migrations/00XX_character_unique_player_character.py` — generated
  migration for the above.
- `backend/games/permissions.py` — add `PlayerPermission`.
- `backend/games/serializers/games/players/player_user.py` — new, `PlayerUserSerializer`.
- `backend/games/serializers/games/players/player_character.py` — new,
  `PlayerCharacterSerializer`.
- `backend/games/serializers/games/players/player_list.py` — new, `PlayerListSerializer`.
- `backend/games/serializers/__init__.py` — re-export the three new serializers.
- `backend/games/views/game/players/game_players.py` — new, the list view.
- `backend/games/views/game/__init__.py` (or equivalent re-export chain) — re-export
  `game_players`.
- `backend/games/urls/players.py` — new, URL pattern.
- `backend/games/urls/__init__.py` — include the new `players` urlpatterns.
- `docs/agents/access-control/player.md` — document the new endpoint.
- `docs/agents/product.md` — "zero or one" wording + Staff Role carve-out.
- `backend/games/tests/models/character/test_character.py` (or nearest equivalent) — test
  the new constraint (creating a second PC for an already-owning player raises
  `IntegrityError`).
- `backend/games/tests/permissions/test_player_permission.py` — new, mirrors
  `test_poll_permission.py`'s coverage (superuser/staff/DM/player allowed, unrelated
  authenticated user and anonymous user rejected).
- `backend/games/tests/views/game/players/test_game_players.py` — new, covers: 200 with
  correct payload shape for a DM (null character), a player with a PC (non-null character),
  a player with no linked user (`user: null`); 401 unauthenticated; 403 unrelated user; 404
  unknown game slug; pagination; `X-Skip-Cache` header present.
- `backend/games/tests/serializers/games/players/` — new, one test file per new serializer,
  per [serializers-organization.md](../../serializers-organization.md).

## CI Checks

- `backend/`: `docker-compose run --rm majora_be poetry run ruff check .` (CI job: `checks`)
- `backend/`: `docker-compose run --rm majora_tests pytest games/tests/views/game/ --cov` (CI
  job: `pytest_views_characters` — this job's path filter already covers `views/game/`,
  where the new `game/players/` view lives)
- `backend/`: `docker-compose run --rm majora_tests pytest --ignore=games/tests/views/` (CI
  job: `pytest_all` — covers the new model/permission/serializer tests)

## Notes

- The product-owner review for this issue confirmed the "zero or one" narrowing and the
  `user`/`character` payload shape are both consistent with `docs/agents/product.md`, but
  flagged the Staff Role documentation gap addressed in Step 5.
- `Player.characters.filter(npc=False).first()` is used instead of relying solely on the
  new constraint, since existing (pre-constraint) data could in theory still have more than
  one PC per player until the migration is applied — `.first()` degrades gracefully rather
  than raising.
