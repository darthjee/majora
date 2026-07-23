# Plan: Add Game Item Creation Page

Issue: [784-add-game--item-creation-page.md](../issues/784-add-game--item-creation-page.md)

## Overview

Add a DM/admin/staff-only page at `/#/games/:game_slug/items/new` that creates a standalone
`GameItem` (no owning `CharacterItem`), reusing the exact form/layout the existing PC/NPC
`CharacterItemNew` flow already renders (`itemShowType`'s `name`/`description`/`hidden` fields
plus a deferred photo upload). The backend extends the existing `GET /games/:slug/items.json`
endpoint to also accept `POST`, gated by a new `GameItemCreatePermission` (dm/admin/staff), and
exposes a matching `can_create_item` field on the game permissions endpoint so the frontend can
gate both the new page and a new "Create Item" link on the (currently read-only) `GameItems`
list page. Since the item-creation form's translation namespace (`character_item_new_page`) is
no longer character-exclusive, it gets renamed to the already-established generic naming
(`item_new_page`, matching `item_edit_page`'s precedent).

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### New endpoint (backend produces, frontend consumes)

`POST /games/<slug>/items.json` — same URL/view (`game_items` in
`backend/games/views/games/game_items.py`) as the existing `GET`, extended to branch on
`request.method` exactly like `build_items_view` already does for the character-scoped
`items.json` route (`backend/games/views/game/_character_shared.py`).

- Request body: `{name: string (required), description?: string, hidden?: boolean}` — identical
  shape to `_CharacterItemCreateSerializer`.
- Auth: enforced inline via a new `GameItemCreatePermission.check(request, game)` (not DRF
  `permission_classes`, which stays `AllowAny` at the decorator level so `GET` remains public) —
  mirrors `character_item_create`'s use of `CharacterItemCreatePermission`. Grants dm, admin
  (superuser), and staff — **no owner concept**, since a bare `GameItem` has no owning character
  (unlike `CharacterItemCreatePermission`, which also allows a PC's owner).
- Response: `201` with `GameItemDetailFullSerializer(item).data` →
  `{id, name, photo_path, description, hidden}`. **The created item's id is at `data.id`**, not
  `data.game_item_id` like the character-scoped endpoint — the frontend must use `data.id` as the
  target for the photo-upload step.
- `400` with `{errors: {...}}` on validation failure (via `validated_or_error`); `401`/`403` via
  `GameItemCreatePermission.check`'s standard error payloads.
- No `CharacterItem` row is created — only `GameItem`.

### `can_create_item` on game permissions (backend produces, frontend consumes)

Existing `GET /games/<slug>/permissions.json` (`GamePermissionsSerializer`) gets a new
`can_create_item` boolean field, backed by the same `GameItemCreatePermission`, mirroring
`CharacterPermissionsSerializer._get_can_create_item`'s shape (real-identity path via
`is_allowed`, role-simulated `?role=` path via `is_allowed_for_roles`). Frontend consumes it via
`AccessStore.ensureGamePermissions(gameSlug)` in two places:
- The new page's mount effect, to redirect away when `!permissions.can_create_item` (mirroring
  `GameNpcNewController#buildEffect`'s `can_edit` redirect, but keyed on `can_create_item`).
- The `GameItems` list page, to gate the new "Create Item" link — **not** `ListPage`'s built-in
  `onCanEditChange`/`canEdit`, which reflects the plain `can_edit` (dm/admin only) and would
  wrongly hide the link from staff.

### Photo upload (no change, just confirming the contract)

Reuses the existing `POST /games/<slug>/items/<item_id>/photo_upload.json`
(`game_item_photo_upload` view, `GameItemPhotoUploadPermission`) unchanged — the frontend calls
it exactly as `CharacterItemNewController#uploadPhoto` already does, just against the id returned
directly by the new create endpoint (`data.id`, see above).

### Frontend route (new)

`#/games/:game_slug/items/new` → page key `gameItemNew`. Registered in `HashRouteResolver.js`
**immediately before** the existing `['/games/:game_slug/items/:id/edit', 'gameItemEdit']` entry
so the literal `new` segment isn't swallowed by the less-specific `:id` route (same ordering
concern already respected for `npcs/new` vs `npcs/:character_id`), and in `AppHelper.jsx`'s
`PAGES` map alongside `gameItems`.

### Translation namespace rename (translator produces, frontend consumes)

`character_item_new_page` → `item_new_page` in `frontend/assets/i18n/en.yaml` and `pt.yaml`
(content unchanged, pure key rename) — the namespace is now shared by game/PC/NPC item
creation, not just PC/NPC, matching the already-generic `item_edit_page` precedent used for
editing. Frontend updates the 6 `Item*` element files' `TITLE_KEYS`/`LABEL_KEYS`/etc. constants
(and the `character-item-new-*` DOM ids) to match. A new `game_items_page.create_item` key
(`"Create Item"` / `"Criar Item"`) is added for the new list-page link's label.
