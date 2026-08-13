# CharacterPossession

**[Game resource](principles.md#resource-categories).** `CharacterPossession` links a `Character`
(PC or NPC) to a `GamePossession` (issue #1076). A thin join — `name`/`description`/`photo_path`
are always sourced straight from the linked `GamePossession` (see
[GamePossession](game-possession.md)), with no override/fallback logic, mirroring
[CharacterDocument](character-document.md) exactly. `hidden` is a plain field, never inherited
from `GamePossession.hidden`. `unique_together = ('character', 'game_possession')`. No `PATCH`/
photo-upload endpoint for `CharacterPossession` itself — editing name/description/photo goes
straight to [GamePossession](game-possession.md)'s own endpoints, against the linked
`GamePossession`'s id.

The index/detail pairs follow the [default hidden-gated collection
pattern](principles.md#default-hidden-gated-collection-pattern) — no Update deviation to state,
since there is none. Unlike `CharacterDocument`, `CharacterPossession` **does** support a
create-from-scratch endpoint and an available/acquire/remove flow, both borrowed from
`CharacterItem`'s shape — see below.

## Index and detail endpoints

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/pcs/<id>/possessions.json` | GET | **AllowAny** — non-hidden |
| `/games/<slug>/pcs/<id>/possessions/all.json` | GET | **CharacterEdit** — includes hidden, adds `hidden`. Always `X-Skip-Cache: true` |
| `/games/<slug>/npcs/<id>/possessions.json` | GET | **AllowAny**, plus the [hidden-NPC gate](character-photo.md#hidden-npc-gate) |
| `/games/<slug>/npcs/<id>/possessions/all.json` | GET | **GameEdit** — includes hidden, adds `hidden`. Always `X-Skip-Cache: true` |
| `/games/<slug>/pcs/<id>/possessions/<possession_id>.json` | GET | **AllowAny** — 404 if hidden or unknown |
| `/games/<slug>/pcs/<id>/possessions/<possession_id>/full.json` | GET | **CharacterEdit** — includes hidden, adds `hidden`. Always `X-Skip-Cache: true` |
| `/games/<slug>/npcs/<id>/possessions/<possession_id>.json` | GET | **AllowAny**, plus the hidden-NPC gate |
| `/games/<slug>/npcs/<id>/possessions/<possession_id>/full.json` | GET | **GameEdit** (no owner concept for NPCs) |

All order by `id`. Like `CharacterDocument`, `description` is exposed at every tier (no separate
"detail" tier gating it further).

## Fields

`id` (the `CharacterPossession` row id), `game_possession_id`, `name`, `description`,
`photo_path` — all sourced directly from the linked `GamePossession`. `hidden` is exposed on the
`/all.json`/`/full.json` variants only.

## Create-from-scratch endpoint

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/pcs\|npcs/<id>/possessions.json` | POST | roles per [`game_pc_possession/endpoints.yml`](../../../backend/permissions/config/game_pc_possession/endpoints.yml) (`regular.create_update`: staff, player, owner) / [`game_npc_possession/endpoints.yml`](../../../backend/permissions/config/game_npc_possession/endpoints.yml) (`regular.create_update`: staff, player; no owner concept) — borrowed unchanged from `game_pc_item`/`game_npc_item`'s player-facing creation tier |

Shares the route with the `GET` index above. Always creates a brand-new `GamePossession` (scoped
to the game) with the submitted fields, then a `CharacterPossession` linking it to the character —
no option to link an already-existing `GamePossession` (see "Possession available/acquire" below
for that flow). On an NPC, additionally re-applies the hidden-NPC gate *before* the permission
check (mirroring `CharacterItem`'s `POST`), so a player loses the create leniency on a hidden NPC
it can't otherwise view.

**Write fields** (create): `name` (required, non-blank, ≤200 chars), `description` (defaults to
`''`), `hidden` (defaults to `false`).

A `can_create_possession` boolean (same role gating) is exposed on the PC's/NPC's own
`permissions.json` — analogous to `can_create_item`, distinct from
[GamePossession](game-possession.md)'s own game-level `can_create_possession` flag on `Game`'s
`permissions.json`.

## Possession available (Acquire catalog) endpoints

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/pcs\|npcs/<id>/possessions/available.json` | GET | **AllowAny** — the game's `GamePossession` catalog minus hidden possessions and possessions the character already owns |
| `/games/<slug>/pcs\|npcs/<id>/possessions/available/all.json` | GET | **GameEdit** (dm/admin only — **no owner leniency**, unlike the possession-index `/all.json` endpoints) — includes hidden. Always `X-Skip-Cache: true` |

Backs the possession-exchange modal's Acquire tab, mirroring
[CharacterItem](character-item.md#item-available-acquire-catalog-endpoints)'s/
[CharacterDocument](character-document.md#document-available-acquire-catalog-endpoints)'s own
pair: `CharacterPossession` allows at most one instance per possession
(`unique_together = ('character', 'game_possession')`), so the catalog excludes already-owned
possessions. Supports `?name=` (case-insensitive substring on `GamePossession.name`) and standard
pagination.

## Possession acquire/remove endpoints

| Endpoint | Method | Who can call | Effect |
|----------|--------|-------------|--------|
| `/games/<slug>/pcs\|npcs/<id>/possessions/acquire.json` | POST | `restricted.create` on the `game_pc_possession`/`game_npc_possession` resource — per [`game_pc_possession/endpoints.yml`](../../../backend/permissions/config/game_pc_possession/endpoints.yml) (`staff`, `owner`) / [`game_npc_possession/endpoints.yml`](../../../backend/permissions/config/game_npc_possession/endpoints.yml) (`staff`; no owner concept) — **unconditionally restricted**, unlike `CharacterDocument`'s acquire/remove tier (which is the broader `regular.create`); possessions are narratively significant, unique belongings, so the stricter `CharacterItem`-style tier applies instead | Creates a `CharacterPossession` for the submitted `game_possession_id`. `404` if the `GamePossession` is hidden (never bypassed here) or unknown; **`422`** if already owned (like `CharacterDocument`, unlike `CharacterItem`'s no-dedup rows); also `404` (never bypassed) via the [hidden-NPC gate](character-photo.md#hidden-npc-gate) if the target NPC itself is hidden (a PC's own `hidden` never gates its endpoints) |
| `/games/<slug>/pcs\|npcs/<id>/possessions/remove.json` | POST | Same permission as acquire above (`restricted.create`) | Deletes the character's `CharacterPossession` row for the submitted possession — the underlying `GamePossession` is untouched. `404` if not owned, or owned but hidden (never bypassed here); also `404` via the hidden-NPC gate as above |
| `/games/<slug>/pcs\|npcs/<id>/possessions/acquire/all.json` | POST | **GameEdit** (dm/admin only, no staff leniency beyond what GameEdit grants) | DM-only variant: does not `404` on a hidden `GamePossession` |
| `/games/<slug>/pcs/<id>/possessions/remove/all.json` | POST | **CharacterEdit** (dm, admin, or the PC's owning player — **not** staff) | Does not `404` on a hidden owned `CharacterPossession` |
| `/games/<slug>/npcs/<id>/possessions/remove/all.json` | POST | **GameEdit** (dm/admin only) | Does not `404` on a hidden owned `CharacterPossession` |

Two **distinct** permission scopes are load-bearing and must not be conflated, exactly as with
[CharacterItem](character-item.md#item-acquireremove-endpoints)/
[CharacterDocument](character-document.md#document-acquireremove-endpoints): **catalog
visibility** (`available/all`, `acquire/all`) is game-level, dm/admin only, no owner;
**owned-possession visibility** (`remove/all`) is character-level, using the same asymmetric
PC/NPC split `possessions/all.json` already uses. There is no `quantity` — acquire always creates
exactly one row, remove always deletes the row outright.

## `hidden`

Governs only whether a `CharacterPossession` row itself is listed on the regular
(non-`/all.json`/non-`/full.json`) endpoints — independent of
[GamePossession](game-possession.md)'s own `hidden`. A hidden `CharacterPossession` stays fully
visible to the character's owning player (PC) or that game's GameMaster/superuser via the
`/all.json`/`/full.json` variant. Like [CharacterItem](character-item.md) and
[CharacterDocument](character-document.md) (and unlike
[CharacterTreasure](character-treasure.md)'s catalog-row filter), `hidden` lives directly on the
character's own row, so **both** PC and NPC regular endpoints exclude a character's own hidden
possessions.
