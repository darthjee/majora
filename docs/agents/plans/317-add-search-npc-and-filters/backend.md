# Backend Plan: Add search NPC and filters

Main plan: [plan.md](plan.md)

## Shared contracts

- `GET /games/:game_slug/npcs.json` and `GET /games/:game_slug/npcs/all.json` accept two new
  optional query params, applied on top of the existing hardcoded filters:
  - `slain` — `"true"`/`"false"` (case-insensitive string). Filters `Character.slain`. Any
    other/absent value: no filter.
  - `name` — filters `Character.name__icontains`. Blank/absent: no filter.
- These combine with existing pagination (`page`/`per_page`, handled by `Paginator`) — the
  filters must be applied to the queryset *before* it reaches `paginated_list_response`.
- No changes to response shape, serializers, or permission checks.

## Implementation Steps

### Step 1 — Add a shared filter helper

In `source/games/views/characters/_shared.py`, add a private helper (mirroring the existing
`_find_character`/`_get_character_or_404` style) that takes a `request` and a base
`queryset` and returns the queryset narrowed by `slain` and `name`, e.g.:

```python
def _filter_characters(request, queryset):
    """Narrow `queryset` by the optional `slain`/`name` query params, if present."""
    slain = request.query_params.get('slain')
    if slain is not None and slain.lower() in ('true', 'false'):
        queryset = queryset.filter(slain=(slain.lower() == 'true'))

    name = request.query_params.get('name')
    if name:
        queryset = queryset.filter(name__icontains=name)

    return queryset
```

Keep it private (leading underscore) and colocated with the other character-view private
helpers, consistent with existing conventions in this file.

### Step 2 — Wire it into `game_npcs.py`

In `source/games/views/characters/game_npcs.py`, import `_filter_characters` from
`._shared` and apply it to the `npcs` queryset before pagination:

```python
npcs = game.characters.filter(npc=True, hidden=False)
npcs = _filter_characters(request, npcs)
return paginated_list_response(request, npcs, CharacterListSerializer)
```

### Step 3 — Wire it into `game_npcs_all.py`

Same pattern in `source/games/views/characters/game_npcs_all.py`:

```python
npcs = game.characters.filter(npc=True)
npcs = _filter_characters(request, npcs)
response = paginated_list_response(request, npcs, CharacterListSerializer)
```

### Step 4 — Tests

Add/extend pytest coverage under `source/games/tests/views/characters/` for both views.
`game_npcs`'s existing behavior is covered in `game_characters_test.py` (shared with
`game_pcs`) — extend it there for the new filter params, following its existing structure.
`game_npcs_all` has its own `game_npcs_all_test.py` — extend that one directly:
- `slain=true` / `slain=false` returns only matching NPCs.
- An invalid/unrecognized `slain` value is ignored (no filter, no 400).
- `name=<substring>` matches case-insensitively, anywhere in the name.
- Combining `slain` and `name` applies both filters (AND).
- Filters combine correctly with pagination (e.g. filtered count changes `pages`).
- No filter params present preserves current behavior (regression safety).
- `game_npcs_all` still enforces `GameEditPermission` regardless of filter params.

Also add a couple of focused unit tests for `_filter_characters` if the project's existing
test layout has a place for shared-helper tests (check for an existing
`tests/views/characters` test file targeting `_shared.py`'s other helpers first, and follow
that pattern if present).

## Files to Change

- `source/games/views/characters/_shared.py` — add `_filter_characters` helper.
- `source/games/views/characters/game_npcs.py` — apply the filter before pagination.
- `source/games/views/characters/game_npcs_all.py` — apply the filter before pagination.
- `source/games/tests/views/characters/game_characters_test.py` — extended coverage for
  `game_npcs` filtering.
- `source/games/tests/views/characters/game_npcs_all_test.py` — extended coverage for
  `game_npcs_all` filtering.

## CI Checks

- `source`: `poetry run pytest games/tests/views/characters/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`) — run via `docker-compose run` against the backend service, never directly on the host.
- `source`: python lint check (CI job: `checks` — "Check python Lint") — run via `docker-compose run` against the backend service.

## Notes

- Do not raise a 400 for an unrecognized `slain` value — the issue only asks for blank /
  Alive / Slain from a dropdown, so any other value is just treated as "no filter", keeping
  the endpoint permissive and consistent with how `page`/`per_page` already tolerate
  garbage input elsewhere in the codebase.
- No serializer or model changes — `Character.slain` and `Character.name` already exist.
