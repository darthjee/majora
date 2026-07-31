# Issue: Improve permissions serializers

## Description
Permission endpoints (e.g. `/games/:game_slug/pcs/:id/permissions.json`) are served by serializers such as `backend/games/serializers/characters/character_permissions.py`, which build a `can_*` key per permission by manually calling `UIPermission` once per attribute.

Two other endpoints follow the same shape and are in scope for this refactor too:
- `backend/games/serializers/games/game_permissions.py` (`GamePermissionsSerializer`)
- `backend/games/serializers/treasures/treasure_permissions.py` (`TreasurePermissionsSerializer`) — this one does not use `UIPermission` today; `can_edit` is computed directly from model methods. Bringing it into the new pattern means it will need a `UIPermission`-compatible resource config (a `treasure` `ui.yml`), which may not exist yet and should be verified/added during planning.

`UIPermission` (`backend/games/permissions/ui.py`) already resolves a resource + action pair against YAML config loaded and cached by `PermissionConfigStore` (`backend/games/permissions/config_store.py`), which keys its cache per resource (e.g. `backend/games/permissions/config/game_pc/ui.yml`). Role mocking (via `?role=` query param) already exists through `Roles.from_booleans` and is wired into each serializer's `_ui_permission` helper.

## Problem
`CharacterPermissionsSerializer` and `GamePermissionsSerializer` are convoluted: each has one `_get_can_*` method per exposed permission, all following the identical shape (null-check the resource, build a `UIPermission` via a duplicated `_ui_permission` helper, call `.allowed(resource, action)`). This duplication grows linearly with every new permission and is copy-pasted across serializers, because one backend permission can map to more than one front-end `can_*` key.

## Solution
Introduce a config-driven builder that replaces the per-attribute methods, reusing `UIPermission` under the hood, and apply it to the `permissions` endpoints.

### Permissions map
A permission response key (e.g. `create_item` for a character) is tied to a resource + `UIPermission` action pair (e.g. `character_item_resource` / `create_update`). This mapping is expressed per-endpoint in a YAML file rather than in per-attribute Python methods.

### YAML format
The top-level key is the resource name (as understood by `UIPermission`/`PermissionConfigStore`). Its nested keys/values are the response key to return and the `UIPermission` action to check:

```yml
character_item_resource:
  create_update: create_item
```

### New classes
- **Config loader**: like `PermissionConfigStore`, a class that reads and parses the per-endpoint YAML and keeps it cached in memory.
- **Resource resolver**: takes the parsed YAML, a resource key, and a user/game/PC (or roles, for mocking — safe since it's only used for UI components). Internally builds a `UIPermission` and returns a hash of response-key → boolean for that resource.
- **Builder**: takes a user, game, PC (game/PC optional, or replaced by roles when mocking) and a `page_key` selecting which YAML to load. Iterates every resource key in that YAML, calls the resource resolver for each, and merges all results into the single hash returned by the endpoint. The serializer/endpoint may still add keys that require extra computation beyond what the YAML/`UIPermission` mapping can express.

### Response scope
The builder's merged hash becomes the entire response body for each `permissions` endpoint, replacing `to_representation` — including `can_edit`, which today comes from `BasePermissionsSerializer` outside the per-attribute methods. `can_edit` should be expressed in the YAML/`UIPermission` mapping like every other key, for all three serializers (character, game, treasure).

The exact location of the new per-endpoint YAML files (relative to the existing per-resource `backend/games/permissions/config/<resource>/{ui,endpoints}.yml` layout) is left as an implementation detail for the planning step.

## Benefits
- Removes the repetitive `_get_can_*` / `_ui_permission` boilerplate duplicated across permission serializers.
- Adding a new front-end permission becomes a YAML edit instead of a new Python method.
- Consistent pattern across all `permissions` endpoints, mirroring the existing `PermissionConfigStore` caching approach already trusted for `UIPermission`.
