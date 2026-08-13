# Backend Plan: Frontend — Resource-specific edit permissions for show pages and photo upload

Main plan: [plan.md](plan.md)

## Shared contracts

Produce four new entity-agnostic GET endpoints, response `{"can_edit": boolean}`, `?role=`-simulatable, no auth-level gate beyond `AllowAny` (the `UIPermission` check inside the serializer does the real gating):

- `GET /permissions/game_possession.json`
- `GET /permissions/game_item.json`
- `GET /permissions/game_faction.json`
- `GET /permissions/game_document.json`

**Precondition**: this depends on `edit: [staff, player]` existing in `backend/permissions/config/game_possession/ui.yml`, `game_item/ui.yml`, `game_faction/ui.yml` (sibling issue #1097) and `game_document/ui.yml` (documents-PATCH sibling issue). Confirm all four files exist on this branch before starting — if #1097/the documents sibling haven't landed yet, merge/rebase them in first.

## Implementation Steps

### Step 1 — Add page-config files mapping each resource's `edit` action to `can_edit`

Mirror `backend/permissions/config/pages/treasure.yml`'s shape (single resource, single action) — not `game.yml`'s multi-action shape, since these resources only ever expose one flag. Create:

- `backend/permissions/config/pages/game_possession.yml`:
  ```yaml
  game_possession:
    edit: can_edit
  ```
- `backend/permissions/config/pages/game_item.yml`:
  ```yaml
  game_item:
    edit: can_edit
  ```
- `backend/permissions/config/pages/game_faction.yml`:
  ```yaml
  game_faction:
    edit: can_edit
  ```
- `backend/permissions/config/pages/game_document.yml`:
  ```yaml
  game_document:
    edit: can_edit
  ```

Double check the exact action key each `ui.yml` actually landed with (`edit` is what #1097's own description says it will add — `edit: [staff, player]` — but confirm against the real file once #1097 is merged/rebased in, in case naming shifted during that issue's own review).

### Step 2 — Add one `<Resource>PermissionsSerializer` per resource

Mirror `backend/games/serializers/games/game_permissions.py`'s `GamePermissionsSerializer` exactly (not `TreasurePermissionsSerializer` — that one's extra complexity is only needed for treasure's scoped/global action branching, which doesn't apply here since each of these four resources has exactly one action). Each `to_representation` ignores its `instance` arg (always `None`, entity-agnostic route) and returns `PermissionsBuilder(page_key=<page_key>, user=self._user(), roles=self._simulated_roles()).build()`.

Files (new), matching the existing `backend/games/serializers/games/<plural>/` layout (confirmed against `game_possession_list.py`/`game_possession_update.py`/`game_possession_photo.py` and their `items`/`factions`/`documents` siblings):
- `backend/games/serializers/games/possessions/game_possession_permissions.py` → `GamePossessionPermissionsSerializer`, `page_key='game_possession'`
- `backend/games/serializers/games/items/game_item_permissions.py` → `GameItemPermissionsSerializer`, `page_key='game_item'`
- `backend/games/serializers/games/factions/game_faction_permissions.py` → `GameFactionPermissionsSerializer`, `page_key='game_faction'`
- `backend/games/serializers/games/documents/game_document_permissions.py` → `GameDocumentPermissionsSerializer`, `page_key='game_document'`

Register each in `backend/games/serializers/__init__.py` (import + `__all__` entry), alphabetically alongside the existing imports, same pattern as `GamePermissionsSerializer`/`TreasurePermissionsSerializer`.

### Step 3 — Add one view function per resource

Mirror `backend/games/views/permissions/game_permissions.py` exactly:

```python
@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_possession_permissions(request):
    """Return whether the requester (real or role-simulated) may edit a game possession."""
    role_booleans = parse_role_booleans(request)
    return permissions_response(GamePossessionPermissionsSerializer, None, request, role_booleans)
```

New files: `backend/games/views/permissions/game_possession_permissions.py`, `game_item_permissions.py`, `game_faction_permissions.py`, `game_document_permissions.py`.

Register each in `backend/games/views/permissions/__init__.py` and `backend/games/views/__init__.py` (import + `__all__`), same pattern as `game_pc_permissions`.

### Step 4 — Wire the routes

Add to `backend/games/urls/permissions.py`, alongside the existing entries:

```python
path(
    'permissions/game_possession.json',
    views.game_possession_permissions,
    name='permissions-game-possession',
),
path('permissions/game_item.json', views.game_item_permissions, name='permissions-game-item'),
path(
    'permissions/game_faction.json',
    views.game_faction_permissions,
    name='permissions-game-faction',
),
path(
    'permissions/game_document.json',
    views.game_document_permissions,
    name='permissions-game-document',
),
```

### Step 5 — Tests

Add `backend/games/tests/views/permissions/game_possession_permissions_test.py`, `game_item_permissions_test.py`, `game_faction_permissions_test.py`, `game_document_permissions_test.py`, mirroring `backend/games/tests/views/permissions/game_pc_permissions_test.py`'s shape (simulated `?role=` sweep — admin/dm always `true`, staff/player `true`, everyone else `false`, per the `ui.yml` tiers) but simpler, matching `treasure_permissions_test.py`'s structure more closely since there's only one action, not PC/NPC branching.

## Files to Change

- `backend/permissions/config/pages/game_possession.yml` (new)
- `backend/permissions/config/pages/game_item.yml` (new)
- `backend/permissions/config/pages/game_faction.yml` (new)
- `backend/permissions/config/pages/game_document.yml` (new)
- `backend/games/serializers/games/possessions/game_possession_permissions.py`, `games/items/game_item_permissions.py`, `games/factions/game_faction_permissions.py`, `games/documents/game_document_permissions.py` (new)
- `backend/games/serializers/__init__.py` — register the 4 new serializers
- `backend/games/views/permissions/game_possession_permissions.py`, `game_item_permissions.py`, `game_faction_permissions.py`, `game_document_permissions.py` (new)
- `backend/games/views/permissions/__init__.py` — register the 4 new views
- `backend/games/views/__init__.py` — register the 4 new views
- `backend/games/urls/permissions.py` — 4 new routes
- `backend/games/tests/views/permissions/game_possession_permissions_test.py`, `game_item_permissions_test.py`, `game_faction_permissions_test.py`, `game_document_permissions_test.py` (new)

## CI Checks

- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/` (CI job: `pytest_views_rest`)

## Notes

- Do not touch `check_game_edit()`, the PATCH views, or the `endpoints.yml` files — those are #1097's and the documents-PATCH sibling's territory, not this issue's.
- If #1097's `ui.yml` action key ends up named something other than `edit` (e.g. `regular_edit`, mirroring the `endpoints.yml` tier name mentioned in #1097's own text), adjust Step 1's page-config `edit:` key to match exactly — the page config's action key and the `ui.yml` action key must be identical strings for `ResourcePermissionsResolver`/`UIPermission` to find the tier.
