# CharacterItem

`CharacterItem` links a `Character` (PC or NPC) to a `GameItem`, with its own optional
`name`/`description`/`photo` overrides (each nullable, falling back to the linked `GameItem`'s
own value when `null` — see "Fallback resolution" below) and its own `hidden` (`BooleanField`,
default `False`, never inherited from `GameItem.hidden` — see [GameItem](game-item.md) above).
`unique_together = ('character', 'game_item')` — a character can hold at most one row per
`GameItem`. Four dedicated index endpoints (one PC pair, one NPC pair) expose read access, and a
PC/NPC `POST .../items.json` pair (issue #714) creates a brand-new `GameItem`/`CharacterItem`
pair together — there is still no update/delete endpoint for a `CharacterItem` row, and no way to
link an already-existing `GameItem` instead of always creating a new one (both out of scope, along
with photo upload — left for follow-up issues), only Django admin for superusers.

## Item index endpoints

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/pcs/<id>/items.json` | GET | **AllowAny** | Paginated list of `CharacterItemSerializer` objects (`id`, `game_item_id`, `name`, `description`, `photo_path`) for that PC's non-hidden `CharacterItem` rows |
| `/games/<slug>/pcs/<id>/items/all.json` | GET | **CharacterEdit** (covers the PC's owning player, that game's GameMaster, or a superuser, via `Character.can_be_edited_by`) | Does not exclude hidden held items, and each item additionally carries a `hidden: boolean` field (via `CharacterItemAllSerializer`). Always sets `X-Skip-Cache: true` |
| `/games/<slug>/npcs/<id>/items.json` | GET | **AllowAny**, but see the [hidden-NPC gate](character-photo.md#photo-index-endpoints) above | Same shape as the PC list, additionally excluding the NPC's own hidden `CharacterItem` rows |
| `/games/<slug>/npcs/<id>/items/all.json` | GET | **GameEdit** | Does not exclude hidden held items, and each item additionally carries `hidden` (same `CharacterItemAllSerializer` as the PC variant). Always sets `X-Skip-Cache: true` |

Unknown `game_slug` or `character_id` (or mismatched/wrong type) → 404. All four endpoints order
by `id`.

## Item detail endpoints

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/pcs/<id>/items/<item_id>.json` | GET | **AllowAny** | `CharacterItemSerializer` object (`id`, `game_item_id`, `name`, `description`, `photo_path`) for a single non-hidden `CharacterItem`; 404 if hidden or unknown |
| `/games/<slug>/pcs/<id>/items/<item_id>/all.json` | GET | **CharacterEdit** (covers the PC's owning player, that game's GameMaster, or a superuser) | Returns the item even if hidden, and additionally carries `hidden` (via `CharacterItemAllSerializer`). Always sets `X-Skip-Cache: true` |
| `/games/<slug>/npcs/<id>/items/<item_id>.json` | GET | **AllowAny**, but see the [hidden-NPC gate](character-photo.md#photo-index-endpoints) above | Same shape as the PC detail variant; 404 if the `CharacterItem` is hidden, if the NPC itself is hidden from the requester, or if unknown |
| `/games/<slug>/npcs/<id>/items/<item_id>/all.json` | GET | **GameEdit** (dm/admin only — NPCs have no owner) | Returns the item even if hidden, and additionally carries `hidden` (same `CharacterItemAllSerializer` as the PC variant). Always sets `X-Skip-Cache: true` |

Unknown `game_slug`/`character_id`/`item_id`, or an id belonging to the opposite PC/NPC role,
→ 404. All four mirror the equivalent list endpoint above exactly, narrowed to a single row — no
new serializer or permission class was introduced, and the hidden-character gate on the two
plain (non-`/all.json`) variants behaves identically to the list endpoints'.

## Item creation endpoints

| Endpoint | Method | Who can call | Request | Response |
|----------|--------|-------------|---------|----------|
| `/games/<slug>/pcs/<id>/items.json` | POST | **CharacterItemCreatePermission** — dm, admin, staff, or the PC's owning player | `{ name: string, description?: string, hidden?: boolean }` (`name` required, non-blank, ≤200 chars; `description` defaults to `''`; `hidden` defaults to `false`) | `201` with `CharacterItemAllSerializer` shape (`id`, `game_item_id`, `name`, `description`, `photo_path`, `hidden`) |
| `/games/<slug>/npcs/<id>/items.json` | POST | **CharacterItemCreatePermission** — dm, admin, or staff (NPCs have no owner) | Same as above | Same as above |

Both share the same route as the `GET` list above (`build_items_view` now handles `GET` and
`POST`). Each `POST` creates a brand-new `GameItem` (`game`-scoped) with the submitted
`name`/`description`/`hidden`, then a `CharacterItem` linked to it via `game_item`, with the
**same** `name`/`description`/`hidden` values explicitly duplicated onto the `CharacterItem` row
(not left `null`) — there is no option to link an already-existing `GameItem` from the game's
catalog. `unique_together = ('character', 'game_item')` can never be violated here, since each
request always creates a fresh `GameItem` first.

`CharacterItemCreatePermission` (`backend/games/permissions.py`) is `user.is_staff or
character.can_be_edited_by(user)` — `can_be_edited_by` alone already resolves to exactly
dm/admin for NPCs (no owner concept) and dm/admin/owner for PCs, so adding the Staff bypass on
top yields exactly the roles in the table above, for both kinds, with one rule. Error responses:
`401` `{"errors": {"detail": ["authentication required"]}}` if unauthenticated; `403`
`{"errors": {"detail": ["not allowed"]}}` if authenticated but not permitted; `400`
`{"errors": {"<field>": ["<message>", ...]}}` on validation failure.

A `can_create_item` boolean (backed by the same `CharacterItemCreatePermission`, including its
Staff bypass — unlike `can_edit`, which has none) is also exposed on the existing
`.../permissions.json` response (`CharacterPermissionsSerializer`), for both the real-identity
and role-simulated (`?role=`) paths, so the frontend can gate its "Create Item" button off an
authoritative server-computed flag.

Unlike [CharacterTreasure](character-treasure.md)'s NPC-only hidden-held-item filter (`hidden`
there lives on the separate `GameTreasure` catalog row, and a PC keeps seeing every treasure it
owns regardless of catalog visibility), `CharacterItem.hidden` lives directly on the character's
own row — so **both** the PC and NPC regular list endpoints exclude a character's own hidden
items; only the two DM/owner-facing `/all.json` variants reveal them. The PC `/items/all.json`
endpoint is also a new permission shape with no `Treasure` precedent (`Treasure` has no
`/pcs/<id>/treasures/all.json` at all) — gated by `CharacterEditPermission`, which already grants
the PC's own owning player access in addition to a GameMaster/superuser, unlike the NPC variant's
`GameEditPermission` (dm/admin only — an NPC has no "owning player" of its own).

**Exposed fields** (read): `id` (the `CharacterItem` row id, not the `GameItem` id),
`game_item_id`, `name`, `description`, `photo_path` — all already fallback-resolved server-side
(see below), so the frontend never needs its own fallback logic. `hidden` is additionally exposed
on both `/all.json` variants only.

## Fallback resolution

`name`, `description`, and `photo_path` are nullable overrides on `CharacterItem`: a `null` value
falls back to the linked `GameItem`'s own value, via `resolve_character_item_field`/
`resolve_character_item_photo_path` (`backend/games/serializers/games/items/
character_item_fields.py`). This is a direct-FK fallback (`character_item.game_item`), simpler
than [GameTreasure](game-treasure.md)'s context-lookup pattern (which resolves a separate
per-`(game, treasure)` row via the game in serializer context) — no context is needed here.
`hidden` is never part of this fallback; it is a plain field on both models, read independently
on each.

## `hidden`

Governs only whether a `CharacterItem` row itself is included in the regular (non-`/all.json`)
index endpoints above — it says nothing about the visibility of the `GameItem` it links to (see
[GameItem](game-item.md) above for that model's own, independent `hidden`). A hidden
`CharacterItem` is still fully visible to the character's owning player (PC) or that game's
GameMaster/superuser, via the appropriate `/all.json` endpoint.
