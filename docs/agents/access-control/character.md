# Character (PC and NPC)

Characters are scoped to a game. Access is symmetric for PCs and NPCs unless noted.

## List

| Endpoint | Who can read | Fields returned |
|----------|-------------|-----------------|
| `GET /games/<slug>/pcs.json` | **AllowAny** | `id`, `name`, `game_slug`, `profile_photo_path`, `slain`, `allegiance`, `treasure_value` |
| `GET /games/<slug>/npcs.json` | **AllowAny** | Same as above |
| `GET /games/<slug>/npcs/all.json` | **GameEdit** | Same as `npcs.json` (via `CharacterFullListSerializer`), plus `public_allegiance`, `public_slain`, and `hidden` — see "Allegiance fields", "Slain fields", and "Hidden field" below. Includes hidden NPCs, unlike `npcs.json`. Accepts an optional `?hidden=true\|false` filter (same tolerant convention as `?slain=`/`?allegiance=`). Always sets `X-Skip-Cache: true` |

`treasure_value` — an `IntegerField` computed as the sum of `total_value` across the
character's `CharacterTreasure` rows (see [CharacterTreasure](character-treasure.md)), exposed
read-only on every list/detail/full-detail endpoint below, at the same visibility level as the
endpoint itself (issue #581). Unlike `money`, it is intentionally exposed on the public list
endpoints (`pcs.json`/`npcs.json`) too — it discloses nothing not already computable by summing
the per-treasure `value`/`quantity` already public via the treasure endpoints, so it carries no
higher sensitivity than the data already available. Backed by a `Coalesce(Sum(...), 0)` queryset
annotation (`_with_treasure_value` in `backend/games/views/game/_shared.py`) so list responses
stay a single query; the serializer falls back to a live aggregate
(`games/serializers/characters/_treasure_value.py`) when an object hasn't gone through the
annotated queryset (e.g. serializer unit tests, or any other read path added in the future).

## Detail

| Endpoint | Who can read | Fields returned |
|----------|-------------|-----------------|
| `GET /games/<slug>/pcs/<id>.json` | **AllowAny** | `id`, `name`, `role`, `public_description`, `is_pc`, `photos`, `links`, `game_slug`, `can_edit`, `profile_photo_path`, `profile_photo_id`, `money`, `treasure_value`, `slain`, `allegiance` |
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
| `GET /games/<slug>/pcs/<id>/full.json` | **CharacterEdit** | All detail fields + `private_description` + `public_allegiance` + `public_slain` + `hidden` |
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

Additionally, `public_slain` (alongside `public_description`, `public_allegiance`, and `links` —
never the real `slain`) is writable for NPCs through a second, narrower path:
`PATCH /games/<slug>/npcs/<id>.json` (the plain NPC detail endpoint), gated by
**NpcPlayerEdit** instead of **CharacterEdit** — open to any player of the game, not just
editors. See "Narrow player-facing NPC PATCH" under "Update (PATCH)" below. Does not apply to
PCs.

**Filtering**: `npcs.json` filters `?slain=` on `public_slain`; `npcs/all.json` filters
`?slain=` on the real `slain` field — same tolerant/unauthorized-safe convention as the
`?allegiance=` filter above.

## Hidden field

`Character.hidden` is a single `BooleanField` (default `False`), shared by both PCs and NPCs,
with no public/regular split (unlike `allegiance`/`slain` above) — there is only ever one real
value, and it is never exposed on the public-facing endpoints at all (issue #545).

**Read exposure**: not returned on the public list/detail endpoints (`pcs.json`, `npcs.json`,
`pcs/<id>.json`, `npcs/<id>.json`) — those endpoints unconditionally exclude hidden NPCs from
`npcs.json`'s queryset instead of exposing the field. Returned read-only on the DM/admin
endpoints (`npcs/all.json` via `CharacterFullListSerializer`, `pcs/<id>/full.json` and
`npcs/<id>/full.json` via `CharacterFullSerializer`), which is also the only place a hidden NPC
is visible in a list at all.

**Write access**: writable through `CharacterUpdateSerializer` (**CharacterEdit**-gated, same
`full.json` routes as "Slain fields"/"Allegiance fields" above) and through
`CharacterCreateSerializer` (**GameEdit**-gated, `POST /games/<slug>/npcs.json`) — see "Update
(PATCH)" and "Create" below. Not accepted by the narrower `NpcPlayerUpdateSerializer`
(`PATCH /games/<slug>/npcs/<id>.json`) — a regular player can never toggle a character's
`hidden` state.

**Filtering**: `npcs/all.json` accepts an optional `?hidden=true|false` query parameter
(any other value silently ignored, same tolerant convention as `?slain=`/`?allegiance=`); no
other endpoint filters on it. The hidden-NPC gate on the plain detail endpoints (see "Detail"
above) is a separate, pre-existing mechanism (a 404 response, not a filter param) and is
unaffected by this query parameter.

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

### Narrow player-facing NPC PATCH

`PATCH /games/<slug>/npcs/<id>.json` (the plain NPC detail endpoint) accepts `PATCH` again, but
only for a small, curated, player-safe field set (originally just the `slain` toggle, issue
#416; widened to the full set below by issue #445).

| Endpoint | Who can write | Body | Effect |
|----------|--------------|------|--------|
| `PATCH /games/<slug>/npcs/<id>.json` | **NpcPlayerEdit** | `{"public_description": "...", "allegiance": "ally"\|"enemy"\|"neutral", "slain": true\|false, "links": [...]}`, all keys optional — any other key is silently ignored | Writes `Character.public_description`, `Character.public_allegiance`, `Character.public_slain`, and syncs `links` (same shape/semantics as [CharacterLink](character-link.md)); `name`, `role`, `money`, `private_description`, and the real `slain`/`allegiance` fields are untouched and stay `full.json`-only |

Validated by `NpcPlayerUpdateSerializer`
(`backend/games/serializers/characters/npcs/npc_player_update.py`), a `ModelSerializer` with
`public_description` (direct passthrough), `allegiance = ChoiceField(source='public_allegiance')`,
`slain = BooleanField(source='public_slain')`, and a nested, writable `links` field — the same
`CharacterLinkWriteSerializer`/`CharacterLinksSync` pattern `CharacterUpdateSerializer` uses.

The hidden-NPC gate (see "Detail" above) still applies: a hidden NPC returns 404 to a caller who
is not an editor, same as `GET`. Success response: `200` with the same `CharacterDetailSerializer`
body `GET` returns on this route, with `X-Skip-Cache: true`. This is additive only — the PC
plain endpoint stays `GET`-only, and the DM-facing edit form keeps using `full.json`.

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
