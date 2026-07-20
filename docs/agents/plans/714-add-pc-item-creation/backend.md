# Backend Plan: Add PC item creation

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section for the full request/response shape,
permission rule, and the new `can_create_item` permissions field — this file only expands on how
to build them.

## Implementation Steps

### Step 1 — `CharacterItemCreatePermission`

In `backend/games/permissions.py`, add a new class following the `CharacterMoneyEditPermission`
precedent (public `is_allowed` classmethod, since a serializer will need the same boolean
elsewhere — see Step 3):

```python
class CharacterItemCreatePermission(_EditPermission):
    """...dm/admin(superuser)/owner via can_be_edited_by, plus a staff bypass..."""

    @classmethod
    def check(cls, request, character):
        return cls._guarded_check(request, lambda: cls.is_allowed(request.user, character))

    @classmethod
    def is_allowed(cls, user, character):
        if not user or not user.is_authenticated:
            return False
        return user.is_staff or character.can_be_edited_by(user)
```

For an NPC, `can_be_edited_by` only ever resolves true for a superuser or DM (NPCs have no
`player`), so this one class already yields exactly `dm`/`admin`/`staff` for NPCs and
`dm`/`admin`/`staff`/`owner` for PCs — no per-kind branching needed.

### Step 2 — Role-simulated variant + `parse_role_booleans`

`is_allowed` above only handles the real-identity path. `can_create_item` (Step 3) also needs a
role-simulated variant for the `?role=` query-param path already used by `/permissions.json`.
Add a `is_allowed_for_roles(is_superuser, is_dm, is_owner, is_staff, is_pc)` classmethod (mirrors
`Character.can_be_edited_by_roles`, plus the staff bypass) to `CharacterItemCreatePermission`, and
extend `parse_role_booleans` in `backend/games/views/common.py` to add `'is_staff': 'staff' in
roles` to its returned dict (currently parsed but discarded — update its docstring accordingly,
since `staff` stops being a no-op).

### Step 3 — `can_create_item` on `/permissions.json`

Extend `CharacterPermissionsSerializer` (`backend/games/serializers/characters/
character_permissions.py`) to add `can_create_item` alongside the existing `can_edit`, e.g. by
overriding `to_representation` to merge in `{'can_create_item': self._get_can_create_item(obj)}`,
computed the same way `_get_can_edit` is (real user vs. `self._roles()`), calling
`CharacterItemCreatePermission.is_allowed`/`is_allowed_for_roles` from Step 1/2. Used by both the
PC and NPC `/permissions.json` endpoints as-is (no subclass needed), same as `can_edit` today.

### Step 4 — Item-creation logic

Add `backend/games/views/game/_item_create.py`, mirroring `_treasure_exchange.py`'s shape:

- A small validation-only serializer (`name` required non-blank ≤200 chars, `description`
  optional default `''`, `hidden` optional default `False`) — do **not** reuse `GameItem`/
  `CharacterItem` as `ModelSerializer`s directly, since this endpoint writes to both models at
  once.
- `character_item_create(request, game, character)`:
  1. `CharacterItemCreatePermission.check(request, character)` → return its error response if any.
  2. Validate the payload via `validated_or_error`.
  3. Inside `transaction.atomic()`: create the `GameItem` (`game=game`, plus the validated fields),
     then `CharacterItem.objects.create(character=character, game_item=game_item, ...)` with the
     **same** `name`/`description`/`hidden` values duplicated onto the `CharacterItem` row (per
     the confirmed issue behavior — do not leave them `null`).
  4. Return `Response(CharacterItemAllSerializer(character_item).data, status=201)`.

### Step 5 — Wire the `POST` into the existing `.../items.json` view

In `backend/games/views/game/_character_shared.py`, `build_items_view(npc)` currently only
handles `GET` (`_build_api_view(['GET'], AllowAny)`). Extend it to `['GET', 'POST']`, dispatching
to `character_item_create` on `POST` (needs `_get_character_or_404` first, mirroring how
`build_treasure_acquire_view` resolves `character` before calling its handler) and to the existing
`character_items(...)` call on `GET`. No changes needed to `_CHARACTER_ROUTES`
(`backend/games/urls/_character_routes.py`) — the `/items.json` route already exists and already
resolves to this same view.

### Step 6 — Access-control docs

Update `docs/agents/access-control/character-item.md`: remove the "read-only... no create/update/
delete endpoint... left for a follow-up issue" language, and add the two new `POST` rows (paths,
permission, request/response shape) to the "Item index endpoints" table (or a new table below it).

## Files to Change

- `backend/games/permissions.py` — add `CharacterItemCreatePermission`.
- `backend/games/views/common.py` — `parse_role_booleans` starts populating `is_staff`.
- `backend/games/serializers/characters/character_permissions.py` — add `can_create_item`.
- `backend/games/views/game/_item_create.py` — new file, item-creation logic (Step 4).
- `backend/games/views/game/_character_shared.py` — `build_items_view` handles `POST` too.
- `docs/agents/access-control/character-item.md` — document the new endpoints/permission.
- Tests (mirror the existing tree):
  - `backend/games/tests/permissions_test.py` — `CharacterItemCreatePermission`.
  - `backend/games/tests/views/game/pcs/detail/items/game_pc_items_test.py` and the npc
    equivalent — add `POST` coverage (success, 400 validation, 401, 403 per role).
  - `backend/games/tests/serializers/characters/character_permissions_test.py` (or equivalent) —
    `can_create_item` for real and role-simulated identities.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info`
  (CI job: `pytest_views_characters`) — covers the new PC/NPC item view tests.
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info`
  (CI job: `pytest_all`) — covers `permissions_test.py` and serializer tests.
- `backend`: `poetry run ruff check .` (CI job: `checks`).

## Notes

- `GameItem.description` defaults to `''` (`blank=True, default=''`), while `CharacterItem`'s
  fields are nullable overrides — since this endpoint always duplicates values explicitly, this
  distinction only matters if a later issue changes the creation semantics (e.g. the future
  "Add item" flow that links an existing `GameItem` without duplicating fields).
- `unique_together = ('character', 'game_item')` on `CharacterItem` can never be violated here,
  since each `POST` always creates a brand-new `GameItem` first.
