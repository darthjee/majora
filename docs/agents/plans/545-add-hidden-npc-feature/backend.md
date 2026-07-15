# Backend Plan: Add hidden Npc feature

Main plan: [plan.md](plan.md)

## Shared contracts

- Must expose `hidden` (read-only boolean) on `CharacterFullSerializer` and `CharacterFullListSerializer`.
- Must add a `hidden` query filter to `_filter_characters`, applied only from `game_npcs_all.py`.
- `CharacterCreateSerializer`/`CharacterUpdateSerializer` (already accept `hidden`), `CharacterDetailSerializer`/`CharacterListSerializer` (already correctly omit it), and `game_npcs.py`'s unconditional `hidden=False` exclusion are all untouched by this plan.

## Implementation Steps

### Step 1 — Expose `hidden` on the DM/admin read serializers

Edit `backend/games/serializers/characters/character_full.py`:

```python
class CharacterFullSerializer(CharacterDetailSerializer):
    """Serializer for full character detail including the private description."""

    allegiance = serializers.CharField(read_only=True)
    public_allegiance = serializers.CharField(read_only=True)
    slain = serializers.BooleanField(read_only=True)
    public_slain = serializers.BooleanField(read_only=True)
    hidden = serializers.BooleanField(read_only=True)

    class Meta(CharacterDetailSerializer.Meta):
        """Metadata for the CharacterFullSerializer."""

        fields = CharacterDetailSerializer.Meta.fields + [
            'private_description',
            'public_allegiance',
            'public_slain',
            'hidden',
        ]
```

Edit `backend/games/serializers/characters/character_full_list.py` the same way (add the `hidden` field declaration and append `'hidden'` to `Meta.fields`).

### Step 2 — Add the `hidden` query filter

Edit `backend/games/views/game/_shared.py`'s `_filter_characters` to accept an optional `hidden_field` parameter (default `None`, so callers that don't pass it — i.e. the public `npcs.json` list — are unaffected):

```python
def _filter_characters(
    request, queryset, allegiance_field='public_allegiance', slain_field='public_slain',
    hidden_field=None,
):
    """Narrow `queryset` by the optional `slain`/`name`/`allegiance`/`hidden` query params."""
    slain = request.query_params.get('slain')
    if slain is not None and slain.lower() in ('true', 'false'):
        queryset = queryset.filter(**{slain_field: (slain.lower() == 'true')})

    name = request.query_params.get('name')
    if name:
        queryset = queryset.filter(name__icontains=name)

    allegiance = request.query_params.get('allegiance')
    allowed_allegiances = (
        Character.ALLEGIANCE_ALLY,
        Character.ALLEGIANCE_ENEMY,
        Character.ALLEGIANCE_NEUTRAL,
    )
    if allegiance in allowed_allegiances:
        queryset = queryset.filter(**{allegiance_field: allegiance})

    if hidden_field:
        hidden = request.query_params.get('hidden')
        if hidden is not None and hidden.lower() in ('true', 'false'):
            queryset = queryset.filter(**{hidden_field: (hidden.lower() == 'true')})

    return queryset
```

Edit `backend/games/views/game/npcs/game_npcs_all.py` to pass `hidden_field='hidden'`:

```python
npcs = _filter_characters(
    request, npcs, allegiance_field='allegiance', slain_field='slain', hidden_field='hidden',
)
```

Do not touch `game_npcs.py` — it must keep excluding hidden NPCs unconditionally, with no filter param.

### Step 3 — Tests

- `backend/games/tests/serializers/characters/character_full_test.py` — add a `test_serializes_hidden` case (mirroring `test_serializes_slain_from_real_field`/`test_serializes_public_slain`), and add `'hidden'` to whatever test asserts the full field list.
- `backend/games/tests/serializers/characters/character_full_list_test.py` — same, mirroring its existing `slain`/`public_slain` coverage.
- `backend/games/tests/views/game/npcs/game_npcs_all_test.py` — add `hidden=true`/`hidden=false`/invalid-value-ignored filter tests, mirroring the existing `slain` filter tests (`test_slain_true_returns_only_slain_npcs`, `test_invalid_slain_value_is_ignored`, `test_slain_filter_matches_real_slain`), plus a response-body assertion that `hidden` is present and correct for the DM/superuser 200 case.
- `backend/games/tests/views/game/npcs/detail/game_npc_full_test.py` — add a `hidden` field assertion to its existing GET-response test if one isn't already there. Note: the existing hidden-visibility-gate tests (404 for non-editors, `X-Skip-Cache` header) already fully cover `game_npc_detail`/`game_npc_photos` and need no changes.

## Files to Change

- `backend/games/serializers/characters/character_full.py` — add `hidden` field
- `backend/games/serializers/characters/character_full_list.py` — add `hidden` field
- `backend/games/views/game/_shared.py` — add `hidden_field` param to `_filter_characters`
- `backend/games/views/game/npcs/game_npcs_all.py` — pass `hidden_field='hidden'`
- `backend/games/tests/serializers/characters/character_full_test.py` — add `hidden` coverage
- `backend/games/tests/serializers/characters/character_full_list_test.py` — add `hidden` coverage
- `backend/games/tests/views/game/npcs/game_npcs_all_test.py` — add `hidden` filter coverage
- `backend/games/tests/views/game/npcs/detail/game_npc_full_test.py` — add `hidden` field assertion if missing

## CI Checks

- `backend/`: `docker-compose run --rm majora_tests pytest games/tests/views/` (CI job: `pytest_views_characters`/`pytest_views_rest`)
- `backend/`: `docker-compose run --rm majora_tests pytest --ignore=games/tests/views/` (CI job: `pytest_all`)

## Notes

- No new endpoint, no permission change — `POST npcs.json`, `PATCH npcs/:id/full.json`, `PATCH npcs/:id.json`, `GET npcs.json`, `GET npcs/:id.json` are all confirmed already correct and untouched.
- `_hidden_gate_response`, the 404-for-non-editors gate on `character_detail`/`character_photos`, is unrelated to this issue's scope and must not be touched.
