# Backend Plan: Add new NPC button and page

Main plan: [plan.md](plan.md)

## Shared contracts

Produces `POST /games/<game_slug>/npcs.json`:

- Auth enforced inline via `GameEditPermission.check(request, game)` — `401` if
  unauthenticated, `403` if authenticated but `not game.can_be_edited_by(user)`, both
  `{"errors": {"detail": [...]}}`.
- Accepts JSON body: `name` (required), `role`, `public_description`, `private_description`,
  `hidden`, `money` (all optional except `name`). Does **not** accept `player` or `npc` — both
  are forced server-side (`npc=True`, `game=<resolved game>`).
- On success: `201` with `CharacterDetailSerializer` output for the new character.
- On validation failure: `400` with `{"errors": {"<field>": [...]}}`.

## Implementation Steps

### Step 1 — Add a create serializer

Add `source/games/serializers/character_create.py` with `CharacterCreateSerializer`,
modeled directly on `CharacterUpdateSerializer`
(`source/games/serializers/character_update.py`) but with `name` required and no `player`
field (NPCs aren't assigned a player — this mirrors the field set already accepted by
`CharacterUpdateSerializer`):

```python
class CharacterCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Character
        fields = ['name', 'role', 'public_description', 'private_description', 'hidden', 'money']
        extra_kwargs = {
            'name': {'required': True},
            'role': {'required': False},
            'public_description': {'required': False},
            'private_description': {'required': False},
            'hidden': {'required': False},
            'money': {'required': False},
        }
```

Register it in `source/games/serializers/__init__.py` (import + `__all__`), alongside the
other `Character*Serializer` entries.

### Step 2 — Add POST support to `game_npcs`

Edit `source/games/views/characters/game_npcs.py`, following the exact shape of
`source/games/views/game_sessions/game_sessions_list.py`'s `_create_session` helper:

- Change `@api_view(['GET'])` to `@api_view(['GET', 'POST'])`.
- Add `@authentication_classes([CookieTokenAuthentication])` and
  `@permission_classes([AllowAny])` (GET stays public; POST authorization is enforced inline
  via `GameEditPermission`, matching the `# AllowAny: ...` comment convention already used in
  `game_sessions_list.py`).
- Dispatch to a `_create_npc(request, game)` helper when `request.method == 'POST'`:
  - `error_response = GameEditPermission.check(request, game)` (imported from
    `...permissions`, same as `game_npcs_all.py` already does) → return it if not `None`.
  - Validate the body with `CharacterCreateSerializer(data=request.data)` via
    `validated_or_error` (from `..common`, same helper `game_sessions_list.py` uses).
  - `character = serializer.save(game=game, npc=True)` — forces `game` and `npc=True`
    server-side regardless of what the client sent.
  - Return `Response(CharacterDetailSerializer(character, context={'request': request}).data, status=201)`.

### Step 3 — Tests

Add `TestGameNpcsCreate` (or similar) to
`source/games/tests/views/characters/game_npcs_test.py`, mirroring
`source/games/tests/views/games/game_sessions_test.py`'s POST test class. Cover:
- `201` + created `Character(npc=True, game=game)` when the request user
  `can_be_edited_by` the game (DM or superuser).
- `401` when unauthenticated.
- `403` when authenticated but not allowed to edit the game.
- `400` with `errors.name` when `name` is missing.
- Optional fields (`role`, `public_description`, `private_description`, `hidden`, `money`)
  are persisted when provided, and defaults apply when omitted.
- The response body shape matches `CharacterDetailSerializer` (e.g. contains `id`,
  `game_slug`, `can_edit`).
- A `player` value in the request body is ignored/rejected (not settable via this endpoint).

Run the full backend suite locally before committing:

```bash
docker-compose run --rm majora_tests pytest
```

## Files to Change

- `source/games/serializers/character_create.py` — new `CharacterCreateSerializer`
- `source/games/serializers/__init__.py` — register the new serializer
- `source/games/views/characters/game_npcs.py` — add `POST` handling
- `source/games/tests/views/characters/game_npcs_test.py` — new POST test coverage

## CI Checks

- `source/`: `docker-compose run --rm majora_tests pytest` (CI job: `pytest_views`/`pytest_all`)

## Notes

- Do not add `player` to `CharacterCreateSerializer` — NPCs are never assigned a player, per
  the issue's explicit scope.
- After this work lands, the `data-access` and `security` agents must review the diff (new
  endpoint + new user input handling) before the PR merges.
