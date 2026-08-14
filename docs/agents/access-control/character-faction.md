# CharacterFaction

**[Game resource](principles.md#resource-categories).** `CharacterFaction` links a `Character`
(PC or NPC) to a [GameFaction](faction.md). A thin join — `name`/`photo_path` are always sourced
straight from the linked `GameFaction`, with no override/fallback logic. `hidden` is a plain
field, never inherited from `GameFaction` (which has no `hidden` concept of its own). No
`description` field, unlike [CharacterDocument](character-document.md) — `GameFaction` has none.
`unique_together = ('character', 'game_faction')`. No create, update, or photo-upload endpoint
for `CharacterFaction` itself (Django admin only) — rows are created/removed exclusively through
the enlist/quit ("acquire"/"remove") endpoints below.

Added in issue #943, alongside the removal of the plain `Character.factions` M2M it replaces (see
[GameFaction](faction.md)) and the `Faction`/`FactionPhoto` → `GameFaction`/`GameFactionPhoto`
rename.

The index/detail pairs follow the [default hidden-gated collection
pattern](principles.md#default-hidden-gated-collection-pattern) — no Create/Update deviation to
state, since neither exists. `CharacterFaction` carries no files/photos/incognito interaction of
its own (unlike `CharacterDocument`).

## Index and detail endpoints

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/pcs/<id>/factions.json` | GET | **AllowAny** — non-hidden |
| `/games/<slug>/pcs/<id>/factions/all.json` | GET | **CharacterEdit** — includes hidden, adds `hidden`. Always `X-Skip-Cache: true` |
| `/games/<slug>/npcs/<id>/factions.json` | GET | **AllowAny**, plus the [hidden-NPC gate](character-photo.md#hidden-npc-gate) |
| `/games/<slug>/npcs/<id>/factions/all.json` | GET | **GameEdit** — includes hidden, adds `hidden`. Always `X-Skip-Cache: true` |
| `/games/<slug>/pcs/<id>/factions/<faction_id>.json` | GET | **AllowAny** — 404 if hidden or unknown |
| `/games/<slug>/pcs/<id>/factions/<faction_id>/full.json` | GET | **CharacterEdit** — includes hidden, adds `hidden`. Always `X-Skip-Cache: true` |
| `/games/<slug>/npcs/<id>/factions/<faction_id>.json` | GET | **AllowAny**, plus the hidden-NPC gate |
| `/games/<slug>/npcs/<id>/factions/<faction_id>/full.json` | GET | **GameEdit** (no owner concept for NPCs). Always `X-Skip-Cache: true` |

All order by `id`.

## Fields

`id` (the `CharacterFaction` row id), `game_faction_id`, `name`, `photo_path` — all sourced
directly from the linked `GameFaction`. `hidden` is exposed on the `/all.json`/`/full.json`
variants only (`CharacterFactionAllSerializer`; the regular, player-facing endpoints use plain
`CharacterFactionSerializer`, which omits it).

## Faction available (Enlist catalog) endpoints

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/pcs\|npcs/<id>/factions/available.json` | GET | **AllowAny** — the game's `GameFaction` catalog minus factions the character already belongs to |
| `/games/<slug>/pcs\|npcs/<id>/factions/available/all.json` | GET | **GameEdit** (dm/admin only — **no owner leniency**, unlike the faction-index `/all.json` endpoints) — includes hidden. Always `X-Skip-Cache: true` |

Backs the faction-exchange modal's Enlist tab, since `CharacterFaction` allows at most one
instance per faction (`unique_together = ('character', 'game_faction')`) — the catalog must
exclude already-enlisted factions rather than show a duplicate-enlist affordance. `GameFaction`
has no `hidden` field of its own, so unlike [CharacterDocument](character-document.md#document-available-acquire-catalog-endpoints)'s
equivalent, there is no catalog-side hidden filtering to apply — `allow_hidden` here only ever
affects the hidden-character gate. Mirrors `CharacterDocument`'s own available/acquire pair
otherwise. Supports `?name=` (case-insensitive substring on `GameFaction.name`) and standard
pagination.

## Faction acquire (enlist) / remove (quit) endpoints

| Endpoint | Method | Who can call | Effect |
|----------|--------|-------------|--------|
| `/games/<slug>/pcs\|npcs/<id>/factions/acquire.json` | POST | `regular.create` on the `game_pc_faction`/`game_npc_faction` resource — per [`game_pc_faction/endpoints.yml`](../../../backend/permissions/config/game_pc_faction/endpoints.yml) (`staff`, `player`) / [`game_npc_faction/endpoints.yml`](../../../backend/permissions/config/game_npc_faction/endpoints.yml) (`staff`, `player`); dm/admin always bypass | Creates a `CharacterFaction` for the submitted `game_faction_id` (payload also accepts an optional `hidden`, defaulting to `False`). `404` if the `GameFaction` is unknown or in another game; **`422`** with `{errors: {game_faction_id: ['game_faction_already_enlisted']}}` if already enlisted; also `404` (never bypassed) via the [hidden-NPC gate](character-photo.md#hidden-npc-gate) if the target NPC itself is hidden (a PC's own `hidden` never gates its endpoints) |
| `/games/<slug>/pcs\|npcs/<id>/factions/remove.json` | POST | Same permission as acquire above (`regular.create`) | Deletes the character's `CharacterFaction` row for the submitted `game_faction_id`. `404` if not enlisted, or enlisted but hidden (never bypassed here); also `404` via the hidden-NPC gate as above |
| `/games/<slug>/pcs\|npcs/<id>/factions/acquire/all.json` | POST | `restricted.create` on `game_pc_faction`/`game_npc_faction` — PC: staff or the PC's owning player ([`game_pc_faction/endpoints.yml`](../../../backend/permissions/config/game_pc_faction/endpoints.yml)); NPC: staff only, no owner concept ([`game_npc_faction/endpoints.yml`](../../../backend/permissions/config/game_npc_faction/endpoints.yml)); dm/admin always bypass | DM/owner-only variant: does not `404` on a hidden target character (bypasses the hidden-NPC gate) |
| `/games/<slug>/pcs\|npcs/<id>/factions/remove/all.json` | POST | Same `restricted.create` tier as acquire/all above | Does not `404` on a hidden owned `CharacterFaction`, nor on a hidden target character |

Two **distinct** permission scopes are load-bearing and must not be conflated, exactly as with
[CharacterDocument](character-document.md#document-acquireremove-endpoints): **catalog
visibility** (`available/all`, the acquire/all hidden-character bypass) is effectively
game-level/DM-scoped; **owned-faction visibility** (the plain `regular.create` acquire/remove
pair, and their `restricted.create` `/all.json` counterparts) uses the `game_pc_faction`/
`game_npc_faction` permission-config resources — distinct from, and not to be confused with, the
`game_faction` resource that gates [GameFaction](faction.md)'s own create/photo-upload/edit
endpoints. There is no `quantity` — acquire always creates exactly one row, remove always deletes
the row outright. Like `CharacterDocument` (and unlike `CharacterItem`), acquiring an
already-enlisted faction returns **`422`**.

## Faction membership summary endpoints

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/factions/<faction_id>/pcs/<id>/summary.json` | GET | **AllowAny** — 404 if the faction/PC is unknown. Always `X-Skip-Cache: true` (deviation: an `AllowAny` endpoint that still opts out of the shared proxy cache, since responses are per-character-per-faction and not worth caching) |
| `/games/<slug>/factions/<faction_id>/npcs/<id>/summary.json` | GET | **AllowAny**, plus the [hidden-NPC gate](character-photo.md#hidden-npc-gate) — 404 if hidden or unknown. Always `X-Skip-Cache: true` |
| `/games/<slug>/factions/<faction_id>/pcs/<id>/summary/all.json` | GET | `restricted.create` on [`game_pc_faction/endpoints.yml`](../../../backend/permissions/config/game_pc_faction/endpoints.yml) (staff, or the PC's owning player). Always `X-Skip-Cache: true` |
| `/games/<slug>/factions/<faction_id>/npcs/<id>/summary/all.json` | GET | `restricted.create` on [`game_npc_faction/endpoints.yml`](../../../backend/permissions/config/game_npc_faction/endpoints.yml) (staff only, no owner concept). The permission check runs **before** the NPC is resolved, so an unauthorized/unauthenticated caller gets the same `403`/`401` regardless of whether the target `id` is unknown, hidden, or visible — a hidden NPC's existence must never be distinguishable from a nonexistent one via this endpoint (same rule as [Character](character.md)'s own hidden-NPC gate). Always `X-Skip-Cache: true` |

Backs the recruit modal's right-side "receiving" list: `{"enlisted": <bool>}` — whether
`CharacterFaction.objects.filter(character=character, game_faction=faction).exists()`. Boolean
instead of [treasure](character-treasure.md#treasure-quantity-summary-endpoints-issue-1001)'s
`quantity`, since `CharacterFaction` is a plain join with no quantity field. As with
`CharacterDocument`'s summary pair, the `/all.json` variants bypass the hidden-faction/
hidden-character gate for their authorized (staff/owning-player) caller, while the regular
`summary.json` variants still `404` on a hidden/unknown target.

## Faction-side characters list

`GameFaction` exposes its own reverse-listing endpoints for a faction's members — see
[GameFaction](faction.md#gamefaction)'s `/games/<slug>/factions/<id>/characters.json` and
`/characters/all.json` rows. These serialize the `Character` rows themselves (via
`GameFactionCharacterSerializer`: `id`, `name`, `photo_path`, `type`), not `CharacterFaction`
rows, and are documented there rather than duplicated here.

## `hidden`

Governs only whether a `CharacterFaction` row itself is listed on the regular
(non-`/all.json`/non-`/full.json`) endpoints — independent of [GameFaction](faction.md)'s (which
has no `hidden` concept at all). A hidden `CharacterFaction` stays fully visible to the
character's owning player (PC) or that game's GameMaster/superuser via the `/all.json`/`/full.json`
variant. Like [CharacterItem](character-item.md), `hidden` lives directly on the character's own
row, so **both** PC and NPC regular endpoints exclude a character's own hidden faction
memberships.
