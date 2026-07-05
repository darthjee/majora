# Backend Plan: Add game-exclusive treasures

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section for the full endpoint table and field
contract. Summary of what this agent must produce:

- `Treasure.game` nullable FK (`on_delete=CASCADE`), **plus** an explicit `related_name`/
  `related_query_name` on `Game.treasures` to avoid a field/reverse-query-name clash (see Step 1).
- `game_slug` read-only field on `TreasureListSerializer`/`TreasureDetailSerializer`.
- `GET /treasures.json` filtered to `game__isnull=True`.
- `GET /games/<slug>/treasures.json` returns the union of M2M-linked and FK-owned treasures.
- `POST /games/<slug>/treasures.json` (new support on the existing route).
- New `GET`/`PATCH /games/<slug>/treasures/<int:treasure_id>.json`.
- DM-aware permission on `POST /treasures/<id>/photo_upload.json` when `treasure.game_id` is set.
- `TreasureAccessSerializer.can_edit` extended to also report DM access for game-exclusive
  treasures, without touching `Treasure.can_be_edited_by` (which stays superuser-only).

## Implementation Steps

### Step 1 — Model + migration

In `source/games/models/game.py`, give the existing M2M an explicit related name to make room
for the new FK (this is a **required** companion change, not optional — see the collision note
in `plan.md`):

```python
treasures = models.ManyToManyField(
    'Treasure', blank=True, related_name='linked_games', related_query_name='linked_game',
)
```

In `source/games/models/treasure.py`, add:

```python
game = models.ForeignKey(
    'games.Game', on_delete=models.CASCADE, null=True, blank=True, related_name='exclusive_treasures',
)
```

Do **not** change `Treasure.can_be_edited_by` — it must stay exactly as-is (superuser-only),
since it is still used by the existing global `PATCH /treasures/<id>.json` endpoint via
`TreasureEditPermission`, which must remain superuser-only per the issue's acceptance criteria.

Generate the migration via
`docker-compose run --rm backend poetry run python manage.py makemigrations` (expect it to
produce both the `AlterField` on `Game.treasures` and the `AddField` on `Treasure.game` — verify
`python manage.py check` / the test suite passes cleanly, confirming the related-name fix
actually resolves the clash rather than just moving it).

### Step 2 — Serializers

- `source/games/serializers/treasure_list.py` and `treasure_detail.py`: add, next to the
  existing `photo_path` field:
  ```python
  game_slug = serializers.CharField(source='game.game_slug', default=None, read_only=True)
  ```
  and add `'game_slug'` to `Meta.fields` in both.
- `treasure_create.py` and `treasure_update.py`: leave `fields = ['name', 'value']` unchanged —
  `game` is never accepted from the client payload in either the global or game-scoped create
  path; it is always set server-side via `serializer.save(game=game)`.

### Step 3 — Access serializer

In `source/games/serializers/treasure_access.py`, extend `_get_can_edit` so it also reports
access available through the new game-scoped path, without changing `Treasure.can_be_edited_by`
itself:

```python
def _get_can_edit(self, treasure):
    """Return whether the requesting user may edit the treasure, via any available path."""
    if treasure is None:
        return False
    user = self._user()
    if treasure.can_be_edited_by(user):
        return True
    return treasure.game_id is not None and treasure.game.can_be_edited_by(user)
```

This is what the frontend edit page and (indirectly, via the plain `game_slug` match — see
`frontend.md`) the treasures list page rely on to gate their UI.

### Step 4 — Views

**Global list/create** (`source/games/views/treasures/treasures_list.py`): filter the `GET`
branch to `Treasure.objects.filter(game__isnull=True)` instead of `Treasure.objects.all()`. Leave
the `POST` branch (`_create_treasure`, superuser-only, no `game`) untouched.

**Game-scoped list/create** (`source/games/views/games/game_treasures.py`): add `POST` support,
mirroring `source/games/views/characters/game_npcs.py`'s `_create_npc` almost exactly:

```python
from django.db.models import Q
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...permissions import GameEditPermission
from ...serializers import TreasureCreateSerializer, TreasureDetailSerializer, TreasureListSerializer
from ..common import paginated_list_response, validated_or_error


@api_view(['GET', 'POST'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is intentionally public; POST authorization is enforced inline
# inside _create_game_treasure via GameEditPermission.check().
@permission_classes([AllowAny])
def game_treasures(request, game_slug):
    game = get_object_or_404(Game, game_slug=game_slug)

    if request.method == 'POST':
        return _create_game_treasure(request, game)

    treasures = Treasure.objects.filter(Q(linked_games=game) | Q(game=game)).distinct()
    return paginated_list_response(request, treasures, TreasureListSerializer)


def _create_game_treasure(request, game):
    error_response = GameEditPermission.check(request, game)
    if error_response:
        return error_response

    serializer = TreasureCreateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    treasure = serializer.save(game=game)
    detail = TreasureDetailSerializer(treasure)
    return Response(detail.data, status=201)
```

Note the `Q(linked_games=game) | Q(game=game)` — this preserves the existing M2M-based listing
(now via the renamed `linked_games` reverse accessor from Step 1) while adding treasures
exclusively owned by this game via the new FK, so a freshly-created game-exclusive treasure
immediately shows up on its own game's page.

**New game-scoped detail/update** — new file
`source/games/views/games/game_treasure_detail.py` (do not reuse the generic `detail_or_update`
helper here: permission must be checked against the *game*, not the treasure, since
`Treasure.can_be_edited_by` must stay superuser-only):

```python
"""View for retrieving or updating a treasure exclusive to a specific game."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...authentication import CookieTokenAuthentication
from ...models import Game, Treasure
from ...permissions import GameEditPermission
from ...serializers import TreasureDetailSerializer, TreasureUpdateSerializer
from ..common import validated_or_error


@api_view(['GET', 'PATCH'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is intentionally public; PATCH authorization is enforced inline via
# GameEditPermission.check() against the resolved game — distinct from, and does not
# alter, the superuser-only `/treasures/<id>.json` endpoint.
@permission_classes([AllowAny])
def game_treasure_detail(request, game_slug, treasure_id):
    """Return or update detail for a treasure exclusive to a specific game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    treasure = get_object_or_404(Treasure, id=treasure_id, game=game)

    if request.method == 'PATCH':
        return _update_game_treasure(request, game, treasure)

    return Response(TreasureDetailSerializer(treasure).data)


def _update_game_treasure(request, game, treasure):
    error_response = GameEditPermission.check(request, game)
    if error_response:
        return error_response

    serializer = TreasureUpdateSerializer(treasure, data=request.data, partial=True)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    serializer.save()
    return Response(TreasureDetailSerializer(treasure).data)
```

The `get_object_or_404(Treasure, id=treasure_id, game=game)` lookup is what enforces "only
treasures whose `game_id` matches this game" at the API layer — a mismatched or global
treasure id 404s here regardless of who's asking.

Register `game_treasure_detail` in `source/games/views/games/__init__.py` (import + `__all__`)
and in `source/games/views/__init__.py`.

**Photo upload** (`source/games/views/treasures/treasure_photo_upload.py`): replace the direct
`TreasureEditPermission.check(request, treasure)` call with:

```python
def _check_photo_permission(request, treasure):
    if treasure.game_id is not None:
        return GameEditPermission.check(request, treasure.game)
    return TreasureEditPermission.check(request, treasure)
```

and call `_check_photo_permission(request, treasure)` in place of the old check.

### Step 5 — URL

Add to `source/games/urls.py`, right after the existing `game-treasures` entry:

```python
path(
    'games/<slug:game_slug>/treasures/<int:treasure_id>.json',
    views.game_treasure_detail,
    name='game-treasure-detail',
),
```

### Step 6 — Documentation

Update `docs/agents/access-control.md`, "## Treasure" section:
- Change the opening line from "Treasures are a global resource, not scoped to any game" to
  reflect "global by default, optionally exclusive to one game via a `game` FK" — keep the
  existing sentence about the untouched M2M association.
- Add rows to the action table for the new `POST`/`GET`/`PATCH` game-scoped endpoints, their
  permission (`GameEditPermission` — that game's DM, or superuser), and the 404 behavior for a
  mismatched `treasure_id`.
- Document the new `game_slug` field in "Exposed fields".
- Update the "Treasure photo upload init endpoint" section (and the `Upload` section's
  `TreasurePhoto` bullet) to note DM access when `treasure.game_id` is set.
- Update "Edit rights logic" to clarify the split: `Treasure.can_be_edited_by` (superuser-only,
  used by the global endpoint) is unchanged; the new game-scoped endpoint and the photo-upload
  endpoint separately check `GameEditPermission`/`Game.can_be_edited_by` instead.

Update `docs/agents/product.md`: add a short paragraph noting that `Treasure` can now optionally
belong exclusively to one `Game` (a direct FK, parallel to how `Character` belongs to exactly
one game), distinct from the pre-existing, non-exclusive M2M association — so future readers
don't confuse "the treasure's owning game" with "games a treasure is merely listed under".

## Files to Change

- `source/games/models/game.py` — add `related_name`/`related_query_name` to `treasures` M2M
- `source/games/models/treasure.py` — add `game` FK
- `source/games/migrations/00XX_*.py` — new migration (generated)
- `source/games/serializers/treasure_list.py` — add `game_slug`
- `source/games/serializers/treasure_detail.py` — add `game_slug`
- `source/games/serializers/treasure_access.py` — extend `_get_can_edit`
- `source/games/views/treasures/treasures_list.py` — filter `GET` to `game__isnull=True`
- `source/games/views/treasures/treasure_photo_upload.py` — DM-aware permission check
- `source/games/views/games/game_treasures.py` — add `POST`, union queryset for `GET`
- `source/games/views/games/game_treasure_detail.py` — new
- `source/games/views/games/__init__.py` — export `game_treasure_detail`
- `source/games/views/__init__.py` — export `game_treasure_detail`
- `source/games/urls.py` — register the new route
- `source/games/tests/models/test_treasure.py` — cover the new `game` field / cascade delete
- `source/games/tests/serializers/test_treasure_list.py` — assert `game_slug`
- `source/games/tests/serializers/test_treasure_detail.py` — assert `game_slug`
- `source/games/tests/serializers/test_treasure_access.py` — assert DM-of-owning-game gets `can_edit: true`
- `source/games/tests/views/treasures/treasures_list_test.py` — assert global list excludes game-exclusive treasures
- `source/games/tests/views/treasures/treasure_photo_upload_test.py` — assert DM-of-owning-game can upload
- `source/games/tests/views/games/game_treasures_test.py` — cover `POST` (DM/superuser/403/401), and `GET` returning both M2M and FK-owned treasures
- new `source/games/tests/views/games/game_treasure_detail_test.py` — cover `GET`, `PATCH` (200/401/403/404 mismatched game)
- `docs/agents/access-control.md` — document new endpoints/field/permission split
- `docs/agents/product.md` — note the new exclusive-ownership relationship

## CI Checks

- `source/`: `docker-compose run --rm backend poetry run pytest games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views`)
- `source/`: `docker-compose run --rm backend poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`)

## Notes

- Test cascade delete explicitly: deleting a `Game` with an exclusive treasure must delete that
  treasure (mirrors how deleting a game already cascades to its `characters`).
- Test that a game-exclusive treasure is invisible on `GET /treasures.json` but visible on
  `GET /games/<slug>/treasures.json`.
- Test that `PATCH /treasures/<id>.json` (global) still rejects a DM of that treasure's owning
  game with `403` — this is the asymmetry the acceptance criteria explicitly calls out.
- `data-access` and `security` review should be invoked once this is implemented.
