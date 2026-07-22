# CharacterItem

`CharacterItem` links a `Character` (PC or NPC) to a `GameItem`, with its own optional
`name`/`description`/`photo` overrides (each nullable, falling back to the linked `GameItem`'s
own value when `null` — see "Fallback resolution" below) and its own `hidden` (`BooleanField`,
default `False`, never inherited from `GameItem.hidden` — see [GameItem](game-item.md) above).
`unique_together = ('character', 'game_item')` — a character can hold at most one row per
`GameItem`. Four dedicated index endpoints (one PC pair, one NPC pair) expose read access, and a
PC/NPC `POST .../items.json` pair (issue #714) creates a brand-new `GameItem`/`CharacterItem`
pair together, a PC/NPC `POST .../items/<item_id>/photo_upload.json` pair (issue #750) initiates
a photo upload overriding a held item's photo, and a PC/NPC `PATCH .../items/<item_id>.json` pair
(issue #766) updates `name`/`description`/`hidden` on an existing `CharacterItem` row — there is
still no delete endpoint, and no way to link an already-existing `GameItem` instead of always
creating a new one on `POST` (both out of scope, left for follow-up issues; deletion remains
Django-admin-only for superusers).

## Item index endpoints

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/pcs/<id>/items.json` | GET | **AllowAny** | Paginated list of `CharacterItemSerializer` objects (`id`, `game_item_id`, `name`, `photo_path` — no `description`) for that PC's non-hidden `CharacterItem` rows |
| `/games/<slug>/pcs/<id>/items/all.json` | GET | **CharacterEdit** (covers the PC's owning player, that game's GameMaster, or a superuser, via `Character.can_be_edited_by`) | Same lean fields as the plain list, plus a `hidden: boolean` field (via `CharacterItemAllSerializer`), and does not exclude hidden held items. Always sets `X-Skip-Cache: true` |
| `/games/<slug>/npcs/<id>/items.json` | GET | **AllowAny**, but see the [hidden-NPC gate](character-photo.md#photo-index-endpoints) above | Same shape as the PC list, additionally excluding the NPC's own hidden `CharacterItem` rows |
| `/games/<slug>/npcs/<id>/items/all.json` | GET | **GameEdit** | Same lean fields as the plain list, plus `hidden` (same `CharacterItemAllSerializer` as the PC variant), and does not exclude hidden held items. Always sets `X-Skip-Cache: true` |

`description` is intentionally omitted from all four index/index-all endpoints above — card/
preview UI never renders it; see the detail endpoints below for where it is exposed.

Unknown `game_slug` or `character_id` (or mismatched/wrong type) → 404. All four endpoints order
by `id`.

## Item detail endpoints

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/pcs/<id>/items/<item_id>.json` | GET | **AllowAny** | `CharacterItemDetailSerializer` object (`id`, `game_item_id`, `name`, `photo_path`, `description`) for a single non-hidden `CharacterItem`; 404 if hidden or unknown |
| `/games/<slug>/pcs/<id>/items/<item_id>/full.json` | GET | **CharacterEdit** (covers the PC's owning player, that game's GameMaster, or a superuser) | Returns the item even if hidden, and additionally carries `hidden` (via `CharacterItemDetailFullSerializer`). Always sets `X-Skip-Cache: true` |
| `/games/<slug>/npcs/<id>/items/<item_id>.json` | GET | **AllowAny**, but see the [hidden-NPC gate](character-photo.md#photo-index-endpoints) above | Same shape as the PC detail variant; 404 if the `CharacterItem` is hidden, if the NPC itself is hidden from the requester, or if unknown |
| `/games/<slug>/npcs/<id>/items/<item_id>/full.json` | GET | **GameEdit** (dm/admin only — NPCs have no owner) | Returns the item even if hidden, and additionally carries `hidden` (same `CharacterItemDetailFullSerializer` as the PC variant). Always sets `X-Skip-Cache: true` |

Unknown `game_slug`/`character_id`/`item_id`, or an id belonging to the opposite PC/NPC role,
→ 404. All four `GET` endpoints mirror the permission/visibility semantics of the equivalent list
endpoint above exactly, narrowed to a single row, but use detail-only serializer subclasses
(`CharacterItemDetailSerializer`/`CharacterItemDetailFullSerializer`, each extending the
corresponding index serializer) that add `description` back on top of the lean index fields —
no permission class changed, and the hidden-character gate on the two plain (non-`/full.json`)
variants behaves identically to the list endpoints'. See "Item update endpoints" below for the
`PATCH` variant of the plain (non-`/full.json`) route.

## Item update endpoints

| Endpoint | Method | Who can call | Request | Response |
|----------|--------|-------------|---------|----------|
| `/games/<slug>/pcs/<id>/items/<item_id>.json` | PATCH | **CharacterItemCreatePermission** — dm, admin, staff, or the PC's owning player | Partial `{ name?, description?, hidden? }` (`CharacterItemUpdateSerializer`) | `200` with `CharacterItemDetailFullSerializer` shape |
| `/games/<slug>/npcs/<id>/items/<item_id>.json` | PATCH | **CharacterItemCreatePermission** — dm, admin, or staff, additionally gated by the same hidden-NPC-visibility pre-check as `GET /games/<slug>/npcs/<id>` (`_hidden_gate_response`): 404s *before* the permission check even runs when the NPC is hidden and the requester cannot edit it, so a global-staff account loses access it would otherwise have | Same as above | Same as above |

Both share the same route as the `GET` detail endpoint above (`item_detail`, generated per PC/NPC
via `build_item_detail_view`, now handles `GET` and `PATCH`). Only `name`/`description`/`hidden`
are writable — `photo` stays on its own dedicated upload endpoint below, and `game_item`/
`character`/`id` are not part of the update serializer's field allowlist, so they cannot be
smuggled into the payload. Submitting `name`/`description` as an empty string persists `null`
(`CharacterItemUpdateSerializer.validate()` maps `''` → `None`), reverting to the linked
`GameItem`'s value via the existing fallback resolution below — `hidden` has no such fallback and
is stored as submitted. Error responses: `401` `{"errors": {"detail": ["authentication
required"]}}` if unauthenticated; `403` `{"errors": {"detail": ["not allowed"]}}` if authenticated
but not permitted; `404` for an unknown `game_slug`/`character_id`/`item_id`, an id belonging to
the opposite PC/NPC role, or (NPC only) a hidden NPC the requester cannot view; `400`
`{"errors": {"<field>": ["<message>", ...]}}` on validation failure.

## Item creation endpoints

| Endpoint | Method | Who can call | Request | Response |
|----------|--------|-------------|---------|----------|
| `/games/<slug>/pcs/<id>/items.json` | POST | **CharacterItemCreatePermission** — dm, admin, staff, or the PC's owning player | `{ name: string, description?: string, hidden?: boolean }` (`name` required, non-blank, ≤200 chars; `description` defaults to `''`; `hidden` defaults to `false`) | `201` with `CharacterItemDetailFullSerializer` shape (`id`, `game_item_id`, `name`, `photo_path`, `description`, `hidden`) — the created item is returned in full (detail-shaped), unlike the lean list endpoints above |
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

## Item photo upload

| Endpoint | Method | Who can call | Request | Response |
|----------|--------|-------------|---------|----------|
| `/games/<slug>/pcs/<id>/items/<item_id>/photo_upload.json` | POST | **CharacterItemPhotoUploadPermission** — dm, admin, staff, or the PC's owning player | `{ filename: string }` | `201` with `{ upload_id, token, item_id }` |
| `/games/<slug>/npcs/<id>/items/<item_id>/photo_upload.json` | POST | **CharacterItemPhotoUploadPermission** — dm, admin, or staff (NPCs have no owner) | Same as above | Same as above |

Both are init-only endpoints (issue #750), following the same two-step upload flow as every
other photo (`POST .../photo_upload.json` → proxy-handled multipart submit → `PATCH
/uploads/<upload_id>.json` finalize). The storage path is fixed/deterministic, not
hash-randomized (`photos/games/<slug>/<pcs|npcs>/<character_id>/items/<item_id>/photo.<ext>`) —
a `CharacterItem.photo` is a single nullable override FK, not a gallery, so each upload reuses
(or creates once) the same `CharacterItemPhoto` row, always replacing the previous file. The
`upload_finalize` endpoint learns a matching `CharacterItemPhoto` branch, unconditionally setting
`CharacterItem.photo` to the finalized photo (never "if unset", like `Treasure`/`GameItem`).

`CharacterItemPhotoUploadPermission` (`backend/games/permissions.py`) is `user.is_staff or
character.can_be_edited_by(user)` — identical to `CharacterItemCreatePermission`'s formula
(dm/admin/staff for both kinds, plus the owning player for PCs), deliberately narrower than
`CharacterPhotoUploadPermission`'s broader "any player of the game" grant used for a character's
own photo. Kept as its own permission class (not a reuse of `CharacterItemCreatePermission`) so
the two actions' rules can diverge independently later. Error responses: `401`
`{"errors": {"detail": ["authentication required"]}}` if unauthenticated; `403`
`{"errors": {"detail": ["not allowed"]}}` if authenticated but not permitted; `404` for an
unknown `game_slug`/`character_id`/`item_id` (or an id belonging to the opposite PC/NPC role);
`400` `{"errors": {"<field>": ["<message>", ...]}}` on validation failure.

A `can_upload_item_photo` boolean (backed by the same `CharacterItemPhotoUploadPermission`) is
also exposed on the existing `.../permissions.json` response (`CharacterPermissionsSerializer`),
for both the real-identity and role-simulated (`?role=`) paths — a separate field from
`can_create_item`, even though both resolve identically today, so the frontend can gate its
photo-upload button off an authoritative server-computed flag independent of item creation.

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
`game_item_id`, `name`, `photo_path` — all already fallback-resolved server-side (see below), so
the frontend never needs its own fallback logic. `description` (also fallback-resolved) is
exposed only on the detail/detail-all endpoints and the creation response above — intentionally
omitted from all four index/index-all endpoints. `hidden` is exposed on both `/all.json`
variants and the creation response only.

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
