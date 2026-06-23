# Backend plan — issue #111 (add edit NPC page)

See [plan.md](plan.md) for the shared contract. No model or serializer changes are needed —
`Character.can_be_edited_by`, `CharacterDetailSerializer`, and `CharacterUpdateSerializer`
(all added in #110) are already generic to both PCs and NPCs.

## 1. Extract a shared update helper

`source/games/views/characters.py` currently has `_update_pc(request, character)` used only by
`game_pc_detail`. Rename it to a generic `_update_character(request, character)` (same body,
no logic change — it already just calls `character.can_be_edited_by(request.user)`, which
works correctly for NPCs since their `player` is `None`) and have both `game_pc_detail` and
`game_npc_detail` call it:

```python
@api_view(['GET', 'PATCH'])
@authentication_classes([TokenAuthentication])
@permission_classes([AllowAny])
def game_npc_detail(request, game_slug, character_id):
    """Return or update detail for a specific NPC in a game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    character = get_object_or_404(Character, id=character_id, game=game, npc=True)

    if request.method == 'PATCH':
        return _update_character(request, character)

    serializer = CharacterDetailSerializer(character, context={'request': request})
    return Response(serializer.data)


@api_view(['GET', 'PATCH'])
@authentication_classes([TokenAuthentication])
@permission_classes([AllowAny])
def game_pc_detail(request, game_slug, character_id):
    """Return or update detail for a specific PC in a game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    character = get_object_or_404(Character, id=character_id, game=game, npc=False)

    if request.method == 'PATCH':
        return _update_character(request, character)

    serializer = CharacterDetailSerializer(character, context={'request': request})
    return Response(serializer.data)


def _update_character(request, character):
    """Validate permissions and payload, then persist updates to a character."""
    if not request.user or not request.user.is_authenticated:
        return Response({'errors': {'detail': ['authentication required']}}, status=401)
    if not character.can_be_edited_by(request.user):
        return Response(
            {'errors': {'detail': ['not allowed to edit this character']}}, status=403
        )

    serializer = CharacterUpdateSerializer(character, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response({'errors': serializer.errors}, status=400)

    serializer.save()
    detail = CharacterDetailSerializer(character, context={'request': request})
    return Response(detail.data)
```

## 2. Tests (`source/games/tests/views_test.py`)

Mirror the existing `TestGamePcUpdateView` class (added in #110) as a new `TestGameNpcUpdateView`
class, adjusted for NPC semantics:

- `GET` on an NPC includes `can_edit: false` for an anonymous request and for a regular
  authenticated (non-superuser) user — even one that happens to own a `Player` — since NPCs
  have no connected player.
- `GET` includes `can_edit: true` for a superuser's token.
- `PATCH` with no token → `401`.
- `PATCH` with a regular (non-superuser) user's token → `403`, NPC unchanged in DB. Include a
  case where that user owns a `Player` linked via `Player.user`, to make explicit that
  "connected player" never applies to NPCs.
- `PATCH` with a superuser's token → `200`, fields updated.
- `PATCH` attempting to set a non-editable field (e.g. `npc`, `game`) → silently ignored, other
  valid fields in the same request still saved.
- `PATCH` with an invalid value (e.g. `level: "not-a-number"`) → `400`,
  `{"errors": {"level": [...]}}`, NPC unchanged in DB.
- `PATCH` partial body (only `name`) → only `name` changes.

No changes needed to `source/games/tests/models_test.py` — `can_be_edited_by`'s NPC behavior is
already covered by its existing "character with no player" case from #110.

Run locally: `docker-compose run --rm majora_tests pytest source/games` and
`docker-compose run --rm majora_be ruff check source/`.
