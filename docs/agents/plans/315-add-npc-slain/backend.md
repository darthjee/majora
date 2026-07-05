# Backend Plan: Add NPC slain

Main plan: [plan.md](plan.md)

## Shared contracts

- Add `slain` (`BooleanField(default=False)`) to `Character`
  (`source/games/models/character.py`), shared by PCs and NPCs.
- Expose `slain` as a read-only field on **both** `CharacterListSerializer`
  and `CharacterDetailSerializer`.
- Add one new NPC-only endpoint:
  `PATCH /games/<slug>/npcs/<int:character_id>/slain.json`, gated by
  `CharacterEditPermission`, body `{"slain": true|false}`, response
  `200 {"slain": true|false}`.
- No PC endpoint, no change to `CharacterUpdateSerializer`/
  `CharacterCreateSerializer` (mirrors `hidden`'s NPC-only precedent).

## Implementation Steps

### Step 1 — Model + migration

Add to `source/games/models/character.py`:

```python
slain = models.BooleanField(default=False)
```

Place it near `hidden` (same "narrative/DM-controlled flag" family). Generate
the migration (`0032_character_slain.py`) via
`docker-compose run --rm backend poetry run python manage.py makemigrations`.

### Step 2 — Serializers

- `source/games/serializers/character_list.py` — add
  `slain = serializers.BooleanField(read_only=True)` and `'slain'` to
  `Meta.fields`.
- `source/games/serializers/character_detail.py` — same addition.
- New `source/games/serializers/character_slain_update.py`:

```python
"""Serializer validating the body of the NPC slain-toggle endpoint."""

from rest_framework import serializers


class CharacterSlainUpdateSerializer(serializers.Serializer):
    """Validates the `slain` boolean sent to the slain-toggle endpoint."""

    slain = serializers.BooleanField(required=True)
```

Register it in `source/games/serializers/__init__.py` (import + `__all__`),
alongside the other character serializers.

### Step 3 — View

New `source/games/views/characters/_slain_set.py` (mirrors `_photo_set.py`):

```python
"""Shared implementation for the NPC slain toggle endpoint."""

from django.http import Http404
from rest_framework.response import Response

from ...permissions import CharacterEditPermission
from ...serializers import CharacterSlainUpdateSerializer
from ..common import validated_or_error
from ._shared import _find_character


def character_slain_set(request, game, character_id, npc):
    """Toggle the slain flag on a character to the value given in the request body."""
    character = _find_character(game, character_id, npc)
    if character is None:
        raise Http404

    error_response = CharacterEditPermission.check(request, character)
    if error_response:
        return error_response

    serializer = CharacterSlainUpdateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    character.slain = serializer.validated_data['slain']
    character.save()

    return Response({'slain': character.slain}, status=200)
```

New `source/games/views/characters/game_npc_slain_set.py` (mirrors
`game_npc_photo_set.py`):

```python
"""View for the NPC slain toggle endpoint."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated

from ...authentication import CookieTokenAuthentication
from ...models import Game
from ._slain_set import character_slain_set


@api_view(['PATCH'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([IsAuthenticated])
def game_npc_slain_set(request, game_slug, character_id):
    """Toggle the slain flag on an NPC."""
    game = get_object_or_404(Game, game_slug=game_slug)
    return character_slain_set(request, game, character_id, npc=True)
```

Register `game_npc_slain_set` in
`source/games/views/characters/__init__.py` (import + `__all__`).

### Step 4 — URL

Add to `source/games/urls.py`, near the existing `game-npc-photo-set` entry:

```python
path(
    'games/<slug:game_slug>/npcs/<int:character_id>/slain.json',
    views.game_npc_slain_set,
    name='game-npc-slain-set',
),
```

### Step 5 — Tests

- `source/games/tests/serializers/` — extend the existing
  `CharacterListSerializer`/`CharacterDetailSerializer` tests to assert
  `slain` is present and reflects the model value (both `False` default and
  `True`).
- New `source/games/tests/views/characters/game_npc_slain_set_test.py`
  (mirror `game_npc_photo_set_test.py`'s structure), covering:
  - `200` toggling `False → True` and `True → False`, asserting the response
    body `{"slain": ...}` and that the DB row was updated.
  - `401` unauthenticated.
  - `403` authenticated but not an editor (not the DM, not superuser, not
    the character's player).
  - `404` unknown `game_slug`, unknown `character_id`, `character_id`
    belonging to a different game, and a PC id used against the NPC route.
  - `400` when `slain` is missing from the body or is not a boolean.

### Step 6 — Documentation

Update `docs/agents/access-control.md`:

- "Character (PC and NPC)" → "List"/"Detail" tables: add `slain` to the
  fields-returned column for both PC and NPC rows.
- Add a new subsection (near "Character photo upload init endpoints")
  documenting the slain-toggle endpoint: URL, method, who can call
  (`CharacterEditPermission` — and note explicitly, per the product-owner
  review, that in practice this resolves to "superuser or DM of that game"
  for NPCs, since NPCs are player-less by convention), request/response
  shape, and the NPC-only scope (mirroring the existing `hidden`
  NPC-only note).

## Files to Change

- `source/games/models/character.py` — add `slain` field
- `source/games/migrations/0032_character_slain.py` — new migration
- `source/games/serializers/character_list.py` — expose `slain`
- `source/games/serializers/character_detail.py` — expose `slain`
- `source/games/serializers/character_slain_update.py` — new
- `source/games/serializers/__init__.py` — export `CharacterSlainUpdateSerializer`
- `source/games/views/characters/_slain_set.py` — new
- `source/games/views/characters/game_npc_slain_set.py` — new
- `source/games/views/characters/__init__.py` — export `game_npc_slain_set`
- `source/games/urls.py` — register the new route
- `source/games/tests/serializers/test_character_list.py` (or equivalent) — assert `slain`
- `source/games/tests/serializers/test_character_detail.py` (or equivalent) — assert `slain`
- `source/games/tests/views/characters/game_npc_slain_set_test.py` — new
- `docs/agents/access-control.md` — document the new field and endpoint

## CI Checks

- `source/`: `docker-compose run --rm backend poetry run pytest games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views`)
- `source/`: `docker-compose run --rm backend poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`)

## Notes

- Do not add `slain` to `CharacterUpdateSerializer` or
  `CharacterCreateSerializer` — the only write path is the new dedicated
  endpoint, consistent with how the issue asks for a
  `character_photo_set`-style action endpoint rather than a generic PATCH.
- `data-access` and `security` review should be invoked once this is
  implemented, since a new endpoint and a new public serializer field are
  both introduced.
