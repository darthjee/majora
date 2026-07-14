# Character (PC and NPC)

Characters are scoped to a game. Access is symmetric for PCs and NPCs unless noted.

## List

| Endpoint | Who can read | Fields returned |
|----------|-------------|-----------------|
| `GET /games/<slug>/pcs.json` | **AllowAny** | `id`, `name`, `game_slug`, `profile_photo_path`, `slain`, `allegiance` |
| `GET /games/<slug>/npcs.json` | **AllowAny** | Same as above |
| `GET /games/<slug>/npcs/all.json` | **GameEdit** | Same as `npcs.json` (via `CharacterFullListSerializer`), plus `public_allegiance` and `public_slain` — see "Allegiance fields" and "Slain fields" below. Includes hidden NPCs, unlike `npcs.json`. Always sets `X-Skip-Cache: true` |

## Detail

| Endpoint | Who can read | Fields returned |
|----------|-------------|-----------------|
| `GET /games/<slug>/pcs/<id>.json` | **AllowAny** | `id`, `name`, `role`, `public_description`, `is_pc`, `photos`, `links`, `game_slug`, `can_edit`, `profile_photo_path`, `profile_photo_id`, `money`, `slain`, `allegiance` |
| `GET /games/<slug>/npcs/<id>.json` | **AllowAny** | Same as above |

`profile_photo_path` — see [Photo path fields](common-rules.md#photo-path-fields) above; returned on the list, detail, and
full-detail endpoints, to anyone.

`slain` is a `BooleanField` (default `False`) shared by `Character` for both PCs and NPCs,
returned read-only on the list and detail endpoints to anyone — there it is sourced from the
`public_slain` model field (see "Slain fields" below). Like `hidden`/`money`, it is writable
through `CharacterUpdateSerializer` — see "Slain fields" for write-access rules.

## Full detail (includes `private_description`)

This is the "full" route of the [partial vs full access
pattern](principles.md#partial-vs-full-access-pattern) — **CharacterEdit**-gated, distinct from
the plain detail endpoints above.

| Endpoint | Who can read/write | Fields returned |
|----------|-------------|-----------------|
| `GET /games/<slug>/pcs/<id>/full.json` | **CharacterEdit** | All detail fields + `private_description` + `public_allegiance` + `public_slain` |
| `GET /games/<slug>/npcs/<id>/full.json` | **CharacterEdit** | Same as above |
| `PATCH /games/<slug>/pcs/<id>/full.json` | **CharacterEdit** | Same response shape as the `GET` above |
| `PATCH /games/<slug>/npcs/<id>/full.json` | **CharacterEdit** | Same as above |

The character update action lives here rather than on the plain detail endpoints below — see
"Update (PATCH)" for the write-field/error-status contract. Always sets `X-Skip-Cache: true`, on
both `GET` and `PATCH`.

## Allegiance fields

`Character` has two independent `CharField(choices=...)` fields, both defaulting to `'neutral'`,
with allowed values `'ally'`, `'enemy'`, `'neutral'`, following the [public vs regular attribute
pattern](principles.md#public-vs-regular-attribute-pattern):

- `allegiance` — the character's real disposition, visible only to a DM/superuser.
- `public_allegiance` — the disposition shown to regular players.

**Read exposure**:

- On the public list/detail endpoints (`pcs.json`, `npcs.json`, `pcs/<id>.json`,
  `npcs/<id>.json`), the `allegiance` key is sourced from `public_allegiance`.
- On the DM/admin endpoints (`npcs/all.json`, `pcs/<id>/full.json`, `npcs/<id>/full.json`),
  `allegiance` is the real field, with `public_allegiance` additionally exposed under its own
  key.

Applies uniformly to both PCs and NPCs (shared model/serializers), though the fields are only
meaningfully written for NPCs in practice — a PC's `allegiance`/`public_allegiance` stay at the
`'neutral'` default since no PC write path ever sets them.

**Write access**: both fields are on the shared `CharacterUpdateSerializer`
(**CharacterEdit**-gated), writable through either `PATCH /games/<slug>/pcs/<id>/full.json` or
`PATCH /games/<slug>/npcs/<id>/full.json`. Since NPCs have no player owner by product definition
(see [`docs/agents/product.md`](../product.md)), this is DM/superuser-only in practice for NPCs; a PC's own
player can technically set their own PC's `allegiance`/`public_allegiance` too (same as
`hidden`/`money`), though nothing in the product currently reads or displays a PC's allegiance.
Both fields are also writable at create time via `CharacterCreateSerializer`
(`POST /games/<slug>/npcs.json`, **GameEdit**-gated); both remain optional and default to
`'neutral'` when omitted.

**Filtering**: `npcs.json` and `npcs/all.json` accept an optional `?allegiance=` query parameter
(`ally`/`enemy`/`neutral`; any other value is silently ignored, same tolerant convention as
`?slain=`). `npcs.json` filters on `public_allegiance`; `npcs/all.json` filters on the real
`allegiance` field — each endpoint filters on the same field it exposes under the `allegiance`
key, so the param never lets an unauthorized caller filter on data it cannot otherwise read.

## Slain fields

`Character` has two independent `BooleanField`s (both defaulting to `False`), following the same
[public vs regular attribute pattern](principles.md#public-vs-regular-attribute-pattern) as
`allegiance`/`public_allegiance` above:

- `slain` — the character's real death state, visible only to a DM/superuser.
- `public_slain` — the death state shown to regular players.

(`public_slain` was backfilled from each existing row's `slain` value when introduced, so
pre-existing NPCs' public and real death state started out identical.)

**Read exposure** — same pattern as `allegiance`: public list/detail endpoints source the
`slain` JSON key from `public_slain`; DM/admin endpoints (`npcs/all.json`,
`pcs/<id>/full.json`, `npcs/<id>/full.json`) use the real `slain` field and additionally expose
`public_slain` under its own key.

**Write access**: like `allegiance`/`public_allegiance`, both fields are on the shared
`CharacterUpdateSerializer` (**CharacterEdit**-gated), writable through either
`PATCH /games/<slug>/pcs/<id>/full.json` or `PATCH /games/<slug>/npcs/<id>/full.json` —
DM/superuser-only in practice for NPCs, but a PC's own player can PATCH their own PC's
`slain`/`public_slain` too.

Additionally, `public_slain` alone (not `slain`) is writable for NPCs through a second, narrower
path: `PATCH /games/<slug>/npcs/<id>.json` (the plain NPC detail endpoint), gated by
**NpcPlayerEdit** instead of **CharacterEdit** — open to any player of the game, not just
editors. See "Narrow NPC slain-toggle PATCH" under "Update (PATCH)" below. Does not apply to
PCs.

**Filtering**: `npcs.json` filters `?slain=` on `public_slain`; `npcs/all.json` filters
`?slain=` on the real `slain` field — same tolerant/unauthorized-safe convention as the
`?allegiance=` filter above.

## Edit access status

`GET /games/<slug>/pcs/<id>/access.json`, `GET /games/<slug>/npcs/<id>/access.json` —
**AllowAny**; see [Access status endpoints](common-rules.md#access-status-endpoints-accessjson) above for the shared response shape. `is_dm`/
`is_player` are evaluated against the character's game. `is_owner` is a real boolean for a PC
(`character.player.user_id == requester.id`); always `false` for an NPC (no player-ownership
concept).

## Edit permission

`GET /games/<slug>/pcs/<id>/permissions.json`, `GET /games/<slug>/npcs/<id>/permissions.json` —
**AllowAny**; see [Edit permission endpoints](common-rules.md#edit-permission-endpoints-permissionsjson) above. Both PC and NPC routes share one
`CharacterPermissionsSerializer` — `is_owner` (and therefore the `owner` role) only ever affects
the result for a PC; it is always a no-op for an NPC.

## Update (PATCH)

The general character update action lives on the full-detail endpoints, not the plain ones:

| Endpoint | Who can write |
|----------|--------------|
| `PATCH /games/<slug>/pcs/<id>/full.json` | **CharacterEdit** |
| `PATCH /games/<slug>/npcs/<id>/full.json` | **CharacterEdit** |

`PATCH /games/<slug>/pcs/<id>.json` (the plain PC detail endpoint) does not accept `PATCH` —
only `GET` remains on that route.

**Write fields** (via `CharacterUpdateSerializer`): in addition to the scalar fields listed
under "Create" below (`name`, `role`, `public_description`, `private_description`, `hidden`,
`money`, `allegiance`, `public_allegiance`, all optional here too), a nested `links` array is
accepted — see [CharacterLink](character-link.md) below for write semantics.

### Narrow NPC slain-toggle PATCH

`PATCH /games/<slug>/npcs/<id>.json` (the plain NPC detail endpoint) accepts `PATCH` again, but
only for a single, narrow purpose: toggling the NPC's player-facing `public_slain` state.

| Endpoint | Who can write | Body | Effect |
|----------|--------------|------|--------|
| `PATCH /games/<slug>/npcs/<id>.json` | **NpcPlayerEdit** | `{"slain": true \| false}` only — any other key is silently ignored | Writes `Character.public_slain`; the real `slain` field is untouched and stays `full.json`-only |

Validated by `NpcSlainUpdateSerializer` (`backend/games/serializers/npc_slain_update.py`), a
`ModelSerializer` with a single `slain = BooleanField(source='public_slain')` field.

The hidden-NPC gate (see "Detail" above) still applies: a hidden NPC returns 404 to a caller who
is not an editor, same as `GET`. Success response: `200` with the same `CharacterDetailSerializer`
body `GET` returns on this route, with `X-Skip-Cache: true`. This is additive only — the PC
plain endpoint stays `GET`-only, and the DM-facing edit form/slain-toggle keep using `full.json`.

## Create

| Endpoint | Who can write |
|----------|--------------|
| `POST /games/<slug>/npcs.json` | **GameEdit** |

There is no equivalent PC creation endpoint.

**Write fields**: `name` (required), `role`, `public_description`, `private_description`,
`hidden`, `money`, `allegiance`, `public_allegiance` (all optional except `name` — see
"Allegiance fields" above), and `links` (optional array — see [CharacterLink](character-link.md) below). `game` and
`npc` are never accepted from the request payload — `game` is always assigned server-side from
the `<slug>` URL segment, and `npc` is always forced to `True`. `player` is not accepted at all
— NPCs created this way have no player.

**Create response:** HTTP 201 with `CharacterDetailSerializer` body (same fields as "Detail"
above) — note it does not include `private_description`, even though the create serializer
accepts it as input, mirroring the PATCH behavior.
