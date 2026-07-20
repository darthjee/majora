# Plan: Add PC item creation

Issue: [714-add-pc-item-creation.md](../../issues/714-add-pc-item-creation.md)

## Overview

`GameItem`/`CharacterItem` already exist and are read-only (list-only) today. This plan adds the
missing creation path: a `POST` on the existing `.../items.json` routes that creates a `GameItem`
and its linked `CharacterItem` together, gated by a new dm/admin/staff/owner (PC) or dm/admin/staff
(NPC) permission rule, plus a "Create Item" button and `.../items/new` form pages on the frontend.
The button is deliberately named "Create Item" (not "Add item") — a future issue will add a
separate "Add item" flow that links an existing `GameItem` from the game's catalog instead of
always creating a new one, mirroring the existing "New Treasure" vs "Add Treasure" split on the
game treasures page (`GameTreasuresHelper`).

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

### New endpoints
- `POST /games/<slug>/pcs/<id>/items.json`
- `POST /games/<slug>/npcs/<id>/items.json`

Both reuse the existing `.../items.json` route (currently `GET`-only), same shape as how
`treasures_list` already handles `GET`+`POST` on one view/route.

**Request body**: `{ name: string, description?: string, hidden?: boolean }`
- `name`: required, non-blank, max 200 chars (matches `GameItem.name`/`CharacterItem.name`).
- `description`: optional, defaults to `""`.
- `hidden`: optional, defaults to `false`.

**Behavior**: creates a new `GameItem` (scoped to the character's game) with the submitted
`name`/`description`/`hidden`, then a `CharacterItem` linked to it via `game_item`, belonging to
the PC/NPC, with the **same** `name`/`description`/`hidden` values explicitly duplicated onto the
`CharacterItem` row (not left `null` — confirmed during issue refinement). No photo handling, and
no option to link an already-existing `GameItem` (both explicitly out of scope for this issue).

**Success response**: `201`, body shaped like `CharacterItemAllSerializer`:
`{ id, game_item_id, name, description, photo_path, hidden }` (`id` is the `CharacterItem` id).

**Error responses**: `401` if unauthenticated; `403` `{"errors": {"detail": ["not allowed"]}}` if
authenticated but not permitted; `400` `{"errors": {"<field>": ["<message>", ...]}}` on validation
failure — all matching this codebase's existing `_EditPermission`/`validated_or_error` conventions.

### Permission rule (`dm`, `admin`, `staff`, `owner` for PCs / `dm`, `admin`, `staff` for NPCs)

Realized as a new `CharacterItemCreatePermission` in `backend/games/permissions.py`:
`user.is_staff or character.can_be_edited_by(user)`. `can_be_edited_by` already covers
superuser/dm/owning-player (PC) or superuser/dm (NPC, no owner concept) — adding the `is_staff`
bypass on top gives exactly the roles listed in the issue, for both kinds, with one rule.

### `can_create_item` permission flag (backend → frontend)

The existing `.../permissions.json` response (`CharacterPermissionsSerializer`, already consumed
by the frontend via `AccessStore.ensureCharacterPermissions`) only exposes `can_edit`, which is
`Character.can_be_edited_by(_roles)` — **no staff bypass**. Since staff must see/use the "Create
Item" button too, the frontend cannot reuse `can_edit` as-is. Add a new `can_create_item` boolean
to that same response, backed by `CharacterItemCreatePermission`, so the frontend gates the button
off an authoritative server-computed flag instead of re-deriving role logic client-side. This also
requires `parse_role_booleans` (`backend/games/views/common.py`) to start actually populating
`is_staff` in the returned dict — today it parses the `staff` role query value but the comment
notes it "silently has no effect"; `can_create_item`'s role-simulated path becomes its first real
consumer.
