# CharacterItem

**[Game resource](principles.md#resource-categories).** `CharacterItem` links a `Character` (PC or
NPC) to a `GameItem`, with its own optional `name`/`description`/`photo` overrides (nullable,
falling back to the linked `GameItem` — see "Fallback resolution" below) and its own `hidden`
(never inherited from `GameItem.hidden`, see [GameItem](game-item.md)). No uniqueness constraint on
`(character, game_item)` (dropped by issue #827) — a character may own several instances of the
same `GameItem` simultaneously, each its own `CharacterItem` row (no `quantity` field; "owning 3
potions" means 3 separate rows). Deletion outside the Remove endpoints below is Django-admin-only.

The index/detail pairs follow the [default hidden-gated collection
pattern](principles.md#default-hidden-gated-collection-pattern); everything past that — the
`PATCH` on the plain route, the available/acquire/remove endpoints, fallback resolution, and the
asymmetric `hidden` scope — is a deviation, documented below.

## Index and detail endpoints

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/pcs/<id>/items.json` | GET | **AllowAny** — non-hidden |
| `/games/<slug>/pcs/<id>/items/all.json` | GET | **CharacterEdit** — includes hidden, adds `hidden`. Always `X-Skip-Cache: true` |
| `/games/<slug>/npcs/<id>/items.json` | GET | **AllowAny**, plus the [hidden-NPC gate](character-photo.md#hidden-npc-gate) — excludes the NPC's own hidden rows |
| `/games/<slug>/npcs/<id>/items/all.json` | GET | **GameEdit** — includes hidden, adds `hidden`. Always `X-Skip-Cache: true` |
| `/games/<slug>/pcs/<id>/items/<item_id>.json` | GET | **AllowAny** — 404 if hidden or unknown |
| `/games/<slug>/pcs/<id>/items/<item_id>/full.json` | GET | **CharacterEdit** — returns even if hidden, adds `hidden`. Always `X-Skip-Cache: true` |
| `/games/<slug>/npcs/<id>/items/<item_id>.json` | GET | **AllowAny**, plus the hidden-NPC gate |
| `/games/<slug>/npcs/<id>/items/<item_id>/full.json` | GET | **GameEdit** (no owner concept for NPCs) |

All index endpoints order by `id` and omit `description` (detail endpoints add it back).

## Update and create endpoints

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/pcs/<id>/items/<item_id>.json` | PATCH | **CharacterItemCreatePermission** — roles per [`game_pc_item/endpoints.yml`](../../../backend/games/permissions/config/game_pc_item/endpoints.yml) (`restricted.create`) |
| `/games/<slug>/npcs/<id>/items/<item_id>.json` | PATCH | Same permission, roles per [`game_npc_item/endpoints.yml`](../../../backend/games/permissions/config/game_npc_item/endpoints.yml) (`restricted.create`; no owner concept); additionally re-applies the hidden-NPC gate *before* the permission check, so staff loses access on a hidden NPC it can't otherwise view |
| `/games/<slug>/pcs/<id>/items.json` | POST | Same as PC PATCH above |
| `/games/<slug>/npcs/<id>/items.json` | POST | Same as NPC PATCH above |
| `/games/<slug>/pcs\|npcs/<id>/items/<item_id>/photo_upload.json` | POST | **CharacterItemPhotoUploadPermission** — same formula as CharacterItemCreatePermission, deliberately narrower than [CharacterPhoto](character-photo.md)'s "any player of the game" grant; kept as its own permission class so the two can diverge later |

`PATCH` shares the same route as `GET` detail; only `name`/`description`/`hidden` are writable.
Submitting `name`/`description` as `""` reverts to the `GameItem`'s fallback value; `hidden` has no
fallback. `POST` shares the route as `GET` list, always creating a brand-new `GameItem` (scoped to
the game) with the submitted fields, then a `CharacterItem` linked to it — no option to link an
existing `GameItem` (see "Item available/acquire" below for that flow).

`CharacterItemCreatePermission`/`CharacterItemPhotoUploadPermission` are both `user.is_staff or
character.can_be_edited_by(user)` — `can_be_edited_by` alone already resolves to dm/admin for
NPCs, dm/admin/owner for PCs.

**Write fields** (create/update): `name` (required for create, non-blank, ≤200 chars),
`description` (defaults to `''`), `hidden` (defaults to `false`).

`can_create_item`/`can_upload_item_photo` booleans (same two permissions) are also exposed on
`.../permissions.json` — separate fields even though they resolve identically today, so the
frontend can gate item-creation and photo-upload independently.

## Fields

Index: `id` (the `CharacterItem` row id), `game_item_id`, `name`, `photo_path` — all
fallback-resolved server-side. Detail/creation-response add `description`. `/all.json`/`/full.json`
and the creation response add `hidden`.

## Item available (Acquire catalog) endpoints

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/pcs\|npcs/<id>/items/available.json` | GET | **AllowAny** — the game's `GameItem` catalog minus hidden items and items the character already owns |
| `/games/<slug>/pcs\|npcs/<id>/items/available/all.json` | GET | **GameEdit** (dm/admin only — **no owner leniency**, unlike the item-index `/all.json` endpoints) — includes hidden. Always `X-Skip-Cache: true` |

Backs the item-exchange modal's Acquire tab, since `CharacterItem` has no `quantity` (the catalog
must exclude already-owned items rather than show a duplicate-acquire affordance the way
[CharacterTreasure](character-treasure.md)'s Buy/Acquire tabs do). The `/all.json` variant here is
deliberately **game-level** (no owner), a narrower gate than `items/all.json`'s own
`CharacterEditPermission` (which does include the PC's owning player) — a PC's owning player must
not get hidden-catalog visibility just by owning the character.

## Item acquire/remove endpoints

| Endpoint | Method | Who can call | Effect |
|----------|--------|-------------|--------|
| `/games/<slug>/pcs\|npcs/<id>/items/acquire.json` | POST | **CharacterItemCreatePermission** | Always creates a new `CharacterItem` for the submitted `game_item_id` (falls back to the `GameItem`'s own info) — no dedup check (issue #827 dropped the `400` "already owned" response; duplicates are intentional, see the model note above). `404` if the `GameItem` is hidden (never bypassed here) or unknown; also `404` (never bypassed) via the [hidden-NPC gate](character-photo.md#hidden-npc-gate) if the target NPC itself is hidden (issue #947 — a PC's own `hidden` never gates its endpoints) |
| `/games/<slug>/pcs\|npcs/<id>/items/remove.json` | POST | **CharacterItemCreatePermission** | Deletes (at most) one of the character's `CharacterItem` rows for the submitted item (`.first()` when several instances exist). `404` if not owned, or owned but hidden (never bypassed here); also `404` via the hidden-NPC gate as above (issue #947) |
| `/games/<slug>/pcs\|npcs/<id>/items/acquire/all.json` | POST | **GameEdit** (dm/admin only, no staff leniency beyond what GameEdit grants) | DM-only variant: does not `404` on a hidden `GameItem`; also always creates, no dedup |
| `/games/<slug>/pcs/<id>/items/remove/all.json` | POST | **CharacterEdit** (dm, admin, or the PC's owning player — **not** staff) | Does not `404` on a hidden owned `CharacterItem` |
| `/games/<slug>/npcs/<id>/items/remove/all.json` | POST | **GameEdit** (dm/admin only) | Does not `404` on a hidden owned `CharacterItem` |

Two **distinct** permission scopes are load-bearing and must not be conflated: **catalog
visibility** (`available/all`, `acquire/all`) is game-level, dm/admin only, no owner — mirrors
[CharacterTreasure](character-treasure.md)'s `acquire/all.json` precedent exactly; **owned-item
visibility** (`remove/all`) is character-level, using the same asymmetric PC/NPC split
`items/all.json` already uses. Unlike `CharacterTreasure`, there is no `quantity` — acquire always
creates a brand-new row (issue #827: no dedup check, duplicates allowed — see the model note
above), remove deletes (at most) one row outright.

## Item quantity summary endpoints (issue #827)

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/items/<item_id>/pcs/<id>/summary.json` | GET | **AllowAny** — 404 if the `GameItem`/PC is unknown. Always `X-Skip-Cache: true` (deviation: an `AllowAny` endpoint that still opts out of the shared proxy cache, since responses are per-character-per-item and not worth caching) |
| `/games/<slug>/items/<item_id>/npcs/<id>/summary.json` | GET | **AllowAny**, plus the [hidden-NPC gate](character-photo.md#hidden-npc-gate) — 404 if hidden or unknown. Always `X-Skip-Cache: true` |
| `/games/<slug>/items/<item_id>/pcs/<id>/summary/all.json` | GET | **CharacterItemCreatePermission** (dm, admin, or the PC's owning player) — roles per [`game_pc_item/endpoints.yml`](../../../backend/games/permissions/config/game_pc_item/endpoints.yml) (`restricted.create`). Always `X-Skip-Cache: true` |
| `/games/<slug>/items/<item_id>/npcs/<id>/summary/all.json` | GET | **CharacterItemCreatePermission** (dm/admin only, no owner concept) — roles per [`game_npc_item/endpoints.yml`](../../../backend/games/permissions/config/game_npc_item/endpoints.yml) (`restricted.create`). The permission check runs **before** the NPC is resolved, so an unauthorized/unauthenticated caller gets the same `403`/`401` regardless of whether the target `id` is unknown, hidden, or visible — a hidden NPC's existence must never be distinguishable from a nonexistent one via this endpoint (same rule as [Character](character.md)'s own hidden-NPC gate). Always `X-Skip-Cache: true` |

Backs the give-item modal's right-side "receiving" list: `{"quantity": <int>}`, the count of
`CharacterItem` rows for that `(character, game_item)` pair. The regular variant excludes
`CharacterItem.hidden=True` rows; `/all.json` includes them. `GameItem.hidden` is irrelevant here —
whether the requester can reach the item at all is already gated by the item detail
page/endpoint, not by this summary endpoint.

## Fallback resolution

`name`, `description`, and `photo_path` are nullable overrides on `CharacterItem`: `null` falls
back to the linked `GameItem`'s own value. `hidden` is never part of this fallback — a plain field
on both models, read independently on each.

## `hidden`

Governs only whether a `CharacterItem` row itself is listed on the regular (non-`/all.json`)
endpoints — independent of [GameItem](game-item.md)'s own `hidden`. A hidden `CharacterItem` stays
fully visible to the character's owning player (PC) or that game's GameMaster/superuser via the
`/all.json` variant. Unlike [CharacterTreasure](character-treasure.md)'s NPC-only hidden filter
(which lives on the catalog row, and never affects a PC's own view), `CharacterItem.hidden` lives
directly on the character's own row — so **both** PC and NPC regular endpoints exclude a
character's own hidden items.
