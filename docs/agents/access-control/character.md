# Character (PC and NPC)

**[Game resource](principles.md#resource-categories).** Characters are scoped to a game. Access is
symmetric for PCs and NPCs unless noted. As per [principles](principles.md#partial-vs-full-access-pattern),
endpoints have regular and restricted (`full.json`/`all.json`) versions.

## Regular access for `GET`

Everyone (**AllowAny**).

## Regular access for mutation

- PC narrow PATCH (`PATCH /games/<slug>/pcs/<id>.json`) — **CharacterRegularEdit**: admin, staff,
  dm, the PC's own player, or any other player of the game.
- NPC narrow PATCH (`PATCH /games/<slug>/npcs/<id>.json`) — **NpcPlayerEdit**: admin, staff, dm,
  or any player of the game.
- NPC narrow create (`POST /games/<slug>/npcs.json`) — **NpcPlayerCreate**: same as NpcPlayerEdit.

## Restricted access (`full.json`/`all.json`)

- **CharacterEdit**: admin, dm, or (PC only) the character's own owning player.
- NPC full create (`POST /games/<slug>/npcs/full.json`) — **GameEdit**: admin or dm only.

There is no PC creation endpoint.

## Endpoints

### Regular endpoints with a restricted counterpart
- `GET`/full update `/games/<slug>/npcs.json` ↔ `/games/<slug>/npcs/all.json`
- `GET`/full update `/games/<slug>/pcs/<id>.json` ↔ `/games/<slug>/pcs/<id>/full.json`
- `GET`/full update `/games/<slug>/npcs/<id>.json` ↔ `/games/<slug>/npcs/<id>/full.json`

The general character `PATCH` (all scalar fields plus `links`) lives only on the `full.json`
routes above — never on the plain detail routes, which instead accept only their own narrow,
player-safe field set (see "Narrow player-facing PATCH" below).

### Regular endpoint missing its restricted counterpart

- `GET /games/<slug>/pcs.json` — no `/all.json` sibling yet (tracked for future API symmetry).

### Additional endpoints (deviations from the CRUD pattern)

- `GET/PATCH .../access.json`, `GET .../permissions.json` — see "Edit access status/permission"
  below.

There is no dedicated money-only edit endpoint (removed by issue #915) — `money` is writable
through the regular narrow `PATCH` routes for both PCs and NPCs (see "Narrow player-facing PATCH"
below).

## Filters

#### `GET /games/<slug>/npcs.json`
- `public_allegiance=` (`ally`/`enemy`/`neutral`)
- `public_slain=` (`true`/`false`)
- `name=`

Invalid values are silently ignored (tolerant convention — no `400`).

#### `GET /games/<slug>/npcs/all.json`

Everything above, plus, per the [filter-visibility rule](principles.md#filter-visibility-rule):
- `private_allegiance=`, `private_slain=`, `hidden=`

No `?incognito=` filter exists on any endpoint.

## Fields

**List** (`pcs.json`/`npcs.json`) — per the [list field
convention](principles.md#listshow-serializer-defaults): `id`, `name`, `game_slug`,
`profile_photo_path`, plus badge fields `public_slain`, `public_allegiance`, `treasure_value`.

**Detail** (`pcs/<id>.json`/`npcs/<id>.json`) — adds `role`, `public_description`, `is_pc`,
`links`, `profile_photo_id`, `money` on top of the list fields.

**Restricted** (`npcs/all.json`, `pcs|npcs/<id>/full.json`) — adds, on top of the regular fields,
`private_allegiance`, `private_slain`, `hidden`, `incognito`, and (full-detail only)
`private_description`.

`treasure_value` (sum of the character's held-treasure value, see
[CharacterTreasure](character-treasure.md)) is deliberately exposed on the public list endpoints
too, not gated — it discloses nothing beyond what's already computable by summing the
publicly-visible per-treasure `value`/`quantity`.

## Field-specific deviations

### Allegiance / Slain (`public_x`/`private_x` pairs)
Both follow the [public vs regular attribute pattern](principles.md#public-vs-regular-attribute-pattern)
with no deviation. Writable via `full.json` (**CharacterEdit**); `public_slain`/`public_allegiance`
are additionally writable via the narrow player-facing NPC PATCH (**NpcPlayerEdit**) —
`private_*` never is. Both default to `'neutral'`/`False` and are meaningful mostly for NPCs (a
PC's fields sit at the default in practice, though nothing blocks a PC's own player from writing
them via `full.json`).

### `hidden`
Standard [`hidden` convention](principles.md#hidden) applied to Character itself —
`npcs.json`/`npcs/all.json` is the [default hidden-gated collection
pattern](principles.md#default-hidden-gated-collection-pattern) applied here. Writable only via
`full.json`/`npcs/full.json` — never via the narrow player-facing PATCH/create paths.

### `incognito`

Same restricted-visibility treatment as `hidden` per the [`incognito`
convention](principles.md#incognito), Character-specific. Does not gate the character's own
visibility (an incognito NPC still appears on the public list/detail) — it only nulls
`profile_photo_path` on the public endpoints (see [Photo path
fields](common-rules.md#photo-path-fields)), and empties (to `[]`, not `404`) the public
[CharacterDocument](character-document.md#document-filesphotos-shortlist-endpoints) files/photos
shortlist endpoints. When a character is both `hidden` and `incognito`, `hidden`'s gate applies
first and `incognito` has no additional observable effect. Writable only via the same routes as
`hidden`.

### Hidden-detail cache deviation

A non-hidden character's detail response is cacheable like Game/Treasure detail; a **hidden**
character's detail response still sets `X-Skip-Cache: true` regardless of viewer — a deviation
from the [`X-Skip-Cache` rule](principles.md#x-skip-cache-rule) (this is an `AllowAny` route),
needed so Tent's cache can't replay an editor's view of a hidden character to a later unauthorized
caller.

## Edit access status / permission

`GET .../access.json` — **AllowAny**, standard shape per [Access status
endpoints](common-rules.md#access-status-endpoints-accessjson). `is_dm`/`is_player` are evaluated
against the character's game; `is_owner` is real for a PC, always `false` for an NPC.

`GET /permissions/game_pc.json` (PC) / `GET /permissions/game_npc.json` (NPC) — entity-agnostic
(no path parameters, since #926), **AllowAny**, standard shape per [Edit permission
endpoints](common-rules.md#edit-permission-endpoints-permissionsjson); PC and NPC share one
serializer, and `owner`/`is_owner` are no-ops for an NPC. Beyond `can_edit` and
`can_create_item`/`can_upload_item_photo` (see [CharacterItem](character-item.md)), this endpoint
exposes:

- `can_set_profile_photo` — **CharacterPhotoUpload** shape: admin, dm, superuser, staff, or any
  player of the game, both kinds — see [CharacterPhoto](character-photo.md).
- `can_exchange_treasure` — **CharacterTreasureExchange** shape: admin, dm, superuser, staff, or
  (PC only) the owning player — deliberately no "any player of the game" leniency.
- `can_delete_photo` — admin, dm, superuser, or staff only — no owner/player leniency at all.

All four follow the same real-identity vs. role-simulated dual path as `can_edit`.

## Create

Regular (`POST /games/<slug>/npcs.json`) accepts a curated player-safe field set: `name`
(required), `role`, `public_description`, `public_allegiance`, `public_slain`, `links` (all other
optional). Full (`POST /games/<slug>/npcs/full.json`) additionally accepts `private_description`,
`hidden`, `incognito`, `money`, `private_allegiance`. `game`/`npc`/`player` are always
server-assigned, never accepted from the payload — a player-created NPC can never carry
`hidden`/`incognito`/`private_description`/`money` regardless of what the payload sends. Create
response never includes `private_description`, even on the full endpoint, mirroring `PATCH`.

## Narrow player-facing PATCH

The plain detail routes accept `PATCH` for a small, curated, player-safe field set distinct from
the full-editor field set — additive only, the full-editor form keeps using `full.json`.

- **NPC** (`PATCH /games/<slug>/npcs/<id>.json`, **NpcPlayerEdit**): writes `name`, `role`,
  `public_description`, `public_allegiance`, `public_slain`, `money`, and syncs `links`;
  `private_description`, `private_allegiance`, `private_slain` stay `full.json`-only (issue #915
  moved `money` from the removed money-only endpoint onto this route). The hidden-NPC gate still
  applies (404 to a non-editor on a hidden NPC).
- **PC** (`PATCH /games/<slug>/pcs/<id>.json`, **CharacterRegularEdit**): writes `name`, `role`,
  `public_description`, `money`, and syncs `links`; `private_description`, `hidden`,
  `private_allegiance`, `public_allegiance`, `private_slain`, `public_slain` stay `full.json`-only.
  PC-only — there is no NPC equivalent of this specific route/field-set pairing.

`links` syncing follows [CharacterLink](character-link.md)'s write semantics in both cases.
