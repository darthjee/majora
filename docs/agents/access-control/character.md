# Character (PC and NPC)

Characters are scoped to a game. Access is symmetric for PCs and NPCs unless noted.

## List

| Endpoint | Who can read | Fields returned |
|----------|-------------|-----------------|
| `GET /games/<slug>/pcs.json` | **AllowAny** | `id`, `name`, `game_slug`, `profile_photo_path`, `public_slain`, `public_allegiance`, `treasure_value` |
| `GET /games/<slug>/npcs.json` | **AllowAny** | Same as above |
| `GET /games/<slug>/npcs/all.json` | **GameEdit** | Same as `npcs.json` (via `CharacterFullListSerializer`), plus `private_allegiance`, `private_slain`, and `hidden` — see "Allegiance fields", "Slain fields", and "Hidden field" below. Includes hidden NPCs, unlike `npcs.json`. Accepts optional `?hidden=true\|false`, `?public_slain=`, `?private_slain=`, `?public_allegiance=`, `?private_allegiance=` filters (same tolerant convention as `npcs.json`'s filters below). Always sets `X-Skip-Cache: true` |

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
| `GET /games/<slug>/pcs/<id>.json` | **AllowAny** | `id`, `name`, `role`, `public_description`, `is_pc`, `links`, `game_slug`, `can_edit`, `can_edit_money`, `can_exchange_treasure`, `can_set_profile_photo`, `profile_photo_path`, `profile_photo_id`, `money`, `treasure_value`, `public_slain`, `public_allegiance` |
| `GET /games/<slug>/npcs/<id>.json` | **AllowAny** | Same as above |

Always sets `X-Skip-Cache: true` on the successful response, regardless of `check_hidden`
(issue #730): `CharacterDetailSerializer` embeds requester-identity-tied fields (`can_edit`,
`can_edit_money`, `can_exchange_treasure`, `can_set_profile_photo`, all computed from
`self.context['request']`), which must never be cached/shared across different requesters by the
Tent reverse proxy — the same reason "Full detail" and "Money-only update" below already set it
unconditionally.

`profile_photo_path` — see [Photo path fields](common-rules.md#photo-path-fields) above; returned on the list, detail, and
full-detail endpoints, to anyone.

`can_edit_money` — a `bool`, computed the same way as `can_edit` (from the requester's own
identity via `self.context['request']`) but against **CharacterMoneyEdit** instead of
**CharacterEdit** (issue #615): `true` for a superuser, any GameMaster of the game, the PC's own
owning player, or any global Staff account (`user.is_staff`), else `false`, including for an
anonymous requester. Returned on this detail endpoint and inherited onto the full-detail endpoint
below. Gates the money "Edit" link on the frontend show page, and is deliberately distinct from
`can_edit`, since a pure Staff account may edit money without qualifying as a full editor (see
"Money-only update" below).

`can_set_profile_photo` — a `bool`, computed the same way as `can_edit`/`can_edit_money` (from
the requester's own identity via `self.context['request']`) but against
**CharacterPhotoUpload** (issue #852): `true` for a superuser, any GameMaster of the game, the
PC's own owning player, any player of the game, or any global Staff account (`user.is_staff`),
else `false`, including for an anonymous requester — the same rule already used by the photo
upload endpoints (see [CharacterPhoto](character-photo.md)). Returned on this detail endpoint and
inherited onto the full-detail endpoint below. Gates the "set as profile photo" action on the
frontend show page and photos sub-page, and is deliberately distinct from `can_edit`, since a
player or Staff account may set a profile photo without qualifying as a full editor.

`can_exchange_treasure` — a `bool`, computed the same way as `can_edit`/`can_edit_money` (from
the requester's own identity via `self.context['request']`) but against
**CharacterTreasureExchangePermission** (issue #712): `true` for a superuser, any GameMaster of
the game, the character's own owning player (PC only — an NPC has no owner), or any global Staff
account (`user.is_staff`), else `false`, including for an anonymous requester. Unlike
`can_edit_money`, there is deliberately no "any player of the game" leniency for PCs. Returned on
this detail endpoint and inherited onto the full-detail endpoint below. Gates the treasure
buy/sell actions on the frontend show page.

`public_slain` is a `BooleanField` (default `False`) shared by `Character` for both PCs and NPCs,
returned read-only on the list and detail endpoints to anyone under its own key — no key
transformation happens on these public endpoints (see "Slain fields" below). Like `hidden`/
`money`, it is writable through `CharacterUpdateSerializer` — see "Slain fields" for write-access
rules.

## Full detail (includes `private_description`)

This is the "full" route of the [partial vs full access
pattern](principles.md#partial-vs-full-access-pattern) — **CharacterEdit**-gated, distinct from
the plain detail endpoints above.

| Endpoint | Who can read/write | Fields returned |
|----------|-------------|-----------------|
| `GET /games/<slug>/pcs/<id>/full.json` | **CharacterEdit** | All detail fields + `private_description` + `private_allegiance` + `private_slain` + `hidden` |
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

- `private_allegiance` — the character's real disposition, visible only to a DM/superuser.
- `public_allegiance` — the disposition shown to regular players.

Prior to issue #861 this pair was named `allegiance`/`public_allegiance`, with the public
endpoints aliasing `public_allegiance` onto a bare `allegiance` JSON key. That transformation has
been removed: every endpoint now exposes/accepts each field under its own real name, with no
key remapping anywhere.

**Read exposure**:

- On the public list/detail endpoints (`pcs.json`, `npcs.json`, `pcs/<id>.json`,
  `npcs/<id>.json`), only `public_allegiance` is exposed — `private_allegiance` never appears.
- On the DM/admin endpoints (`npcs/all.json`, `pcs/<id>/full.json`, `npcs/<id>/full.json`),
  both `private_allegiance` and `public_allegiance` are exposed under their own keys.

Applies uniformly to both PCs and NPCs (shared model/serializers), though the fields are only
meaningfully written for NPCs in practice — a PC's `private_allegiance`/`public_allegiance` stay
at the `'neutral'` default since no PC write path ever sets them.

**Write access**: both fields are on the shared `CharacterUpdateSerializer`
(**CharacterEdit**-gated), writable through either `PATCH /games/<slug>/pcs/<id>/full.json` or
`PATCH /games/<slug>/npcs/<id>/full.json`. Since NPCs have no player owner by product definition
(see [`docs/agents/product.md`](../product.md)), this is DM/superuser-only in practice for NPCs; a PC's own
player can technically set their own PC's `private_allegiance`/`public_allegiance` too (same as
`hidden`/`money`), though nothing in the product currently reads or displays a PC's allegiance.
Both fields are also writable at create time via `CharacterCreateSerializer`
(`POST /games/<slug>/npcs.json`, **GameEdit**-gated); both remain optional and default to
`'neutral'` when omitted.

**Filtering**: `npcs.json` accepts an optional `?public_allegiance=` query parameter
(`ally`/`enemy`/`neutral`; any other value is silently ignored, same tolerant convention as
`?public_slain=`) and ignores any `?private_allegiance=` param sent, even by a DM. `npcs/all.json`
accepts both `?public_allegiance=` and `?private_allegiance=` independently (combined as an AND
when both are given) — each filters on the identically-named model field, so the param never lets
an unauthorized caller filter on data it cannot otherwise read.

## Slain fields

`Character` has two independent `BooleanField`s (both defaulting to `False`), following the same
[public vs regular attribute pattern](principles.md#public-vs-regular-attribute-pattern) as
`private_allegiance`/`public_allegiance` above:

- `private_slain` — the character's real death state, visible only to a DM/superuser.
- `public_slain` — the death state shown to regular players.

Prior to issue #861 this pair was named `slain`/`public_slain`, with the public endpoints
aliasing `public_slain` onto a bare `slain` JSON key; that transformation has been removed, the
same as `allegiance`/`public_allegiance` above. (`public_slain` was backfilled from each existing
row's pre-rename `slain` value when it was introduced, so pre-existing NPCs' public and real
death state started out identical.)

**Read exposure** — same pattern as `private_allegiance`/`public_allegiance`: public list/detail
endpoints expose only `public_slain`, under its own key; DM/admin endpoints (`npcs/all.json`,
`pcs/<id>/full.json`, `npcs/<id>/full.json`) expose both `private_slain` and `public_slain` under
their own keys.

**Write access**: like `private_allegiance`/`public_allegiance`, both fields are on the shared
`CharacterUpdateSerializer` (**CharacterEdit**-gated), writable through either
`PATCH /games/<slug>/pcs/<id>/full.json` or `PATCH /games/<slug>/npcs/<id>/full.json` —
DM/superuser-only in practice for NPCs, but a PC's own player can PATCH their own PC's
`private_slain`/`public_slain` too.

Additionally, `public_slain` (alongside `public_description`, `public_allegiance`, and `links` —
never `private_slain`) is writable for NPCs through a second, narrower path:
`PATCH /games/<slug>/npcs/<id>.json` (the plain NPC detail endpoint), gated by
**NpcPlayerEdit** instead of **CharacterEdit** — open to any player of the game, not just
editors. See "Narrow player-facing NPC PATCH" under "Update (PATCH)" below. Does not apply to
PCs.

**Filtering**: `npcs.json` accepts `?public_slain=` and ignores any `?private_slain=` param sent;
`npcs/all.json` accepts both `?public_slain=` and `?private_slain=` independently (combined as an
AND when both are given) — same tolerant/unauthorized-safe convention as the allegiance filters
above.

## Hidden field

`Character.hidden` is a single `BooleanField` (default `False`), shared by both PCs and NPCs,
with no public/regular split (unlike `private_allegiance`/`private_slain` above) — there is only ever one real
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
(any other value silently ignored, same tolerant convention as `?public_slain=`/
`?public_allegiance=`); no other endpoint filters on it. The hidden-NPC gate on the plain detail
endpoints (see "Detail" above) is a separate, pre-existing mechanism (a 404 response, not a
filter param) and is unaffected by this query parameter.

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

`PATCH /games/<slug>/pcs/<id>.json` (the plain PC detail endpoint) also accepts `PATCH`, but only
for a narrower, player-writable field set, gated by **CharacterRegularEdit** rather than
**CharacterEdit** — see "Narrow player-facing PC PATCH" below (issue #865).

**Write fields** (via `CharacterUpdateSerializer`): in addition to the scalar fields listed
under "Create" below (`name`, `role`, `public_description`, `private_description`, `hidden`,
`money`, `private_allegiance`, `public_allegiance`, `private_slain`, `public_slain`, all optional
here too), a nested `links` array is accepted — see [CharacterLink](character-link.md) below for
write semantics.

### Narrow player-facing NPC PATCH

`PATCH /games/<slug>/npcs/<id>.json` (the plain NPC detail endpoint) accepts `PATCH` again, but
only for a small, curated, player-safe field set (originally just the `slain` toggle, issue
#416; widened to the full set below by issue #445; wire keys renamed from `allegiance`/`slain` to
`public_allegiance`/`public_slain` — direct passthrough, no transformation — by issue #861).

| Endpoint | Who can write | Body | Effect |
|----------|--------------|------|--------|
| `PATCH /games/<slug>/npcs/<id>.json` | **NpcPlayerEdit** | `{"public_description": "...", "public_allegiance": "ally"\|"enemy"\|"neutral", "public_slain": true\|false, "links": [...]}`, all keys optional — any other key is silently ignored | Writes `Character.public_description`, `Character.public_allegiance`, `Character.public_slain`, and syncs `links` (same shape/semantics as [CharacterLink](character-link.md)); `name`, `role`, `money`, `private_description`, `private_allegiance`, and `private_slain` are untouched and stay `full.json`-only |

Validated by `NpcPlayerUpdateSerializer`
(`backend/games/serializers/characters/npcs/npc_player_update.py`), a `ModelSerializer` whose
`Meta.fields` is exactly `['name', 'role', 'public_description', 'public_allegiance',
'public_slain', 'links']` — a direct field-name passthrough with no `source=` remapping, plus a
nested, writable `links` field using the same `CharacterLinkWriteSerializer`/`CharacterLinksSync`
pattern `CharacterUpdateSerializer` uses. `private_allegiance`/`private_slain` are not declared on
this serializer at all, so a player payload can never write them regardless of what keys it sends.

The hidden-NPC gate (see "Detail" above) still applies: a hidden NPC returns 404 to a caller who
is not an editor, same as `GET`. Success response: `200` with the same `CharacterDetailSerializer`
body `GET` returns on this route, with `X-Skip-Cache: true`. This is additive only — the
DM-facing edit form keeps using `full.json`.

### Narrow player-facing PC PATCH

`PATCH /games/<slug>/pcs/<id>.json` (the plain PC detail endpoint) also accepts `PATCH` (issue
#865), for a small, curated, player-safe field set — the PC analogue of the NPC path above, but
gated by a broader-audience permission (**CharacterRegularEdit** rather than **NpcPlayerEdit**)
and a different field set:

| Endpoint | Who can write | Body | Effect |
|----------|--------------|------|--------|
| `PATCH /games/<slug>/pcs/<id>.json` | **CharacterRegularEdit** | `{"name": "...", "role": "...", "public_description": "...", "money": <non-negative integer>, "links": [...]}`, all keys optional — any other key is silently ignored | Writes `Character.name`, `Character.role`, `Character.public_description`, `Character.money`, and syncs `links` (same shape/semantics as [CharacterLink](character-link.md)); `private_description`, `hidden`, `private_allegiance`, `public_allegiance`, `private_slain`, and `public_slain` are untouched and stay `full.json`-only |

Validated by `CharacterRegularUpdateSerializer`
(`backend/games/serializers/characters/character_regular_update.py`), a `ModelSerializer` whose
`Meta.fields` is exactly `['name', 'role', 'public_description', 'money', 'links']` — a direct
field-name passthrough with no `source=` remapping, plus a nested, writable `links` field using
the same `CharacterLinkWriteSerializer`/`CharacterLinksSync` pattern `CharacterUpdateSerializer`
and `NpcPlayerUpdateSerializer` use. `private_description`, `hidden`, `private_allegiance`, and
`private_slain` are not declared on this serializer at all, so a player/Staff payload can never
write them regardless of what keys it sends.

This route is **PC-only** — there is no NPC equivalent, and the view (`game_pc_detail.py`) never
routes an NPC id through this branch. Success response: `200` with the same
`CharacterDetailSerializer` body `GET` returns on this route, with `X-Skip-Cache: true`.
Unauthenticated → `401`; authenticated but not allowed → `403`. This is additive only — the
`full.json` route, its permission (**CharacterEdit**), and its own full field set are entirely
unchanged; a full editor (dm/admin/owner) continues to use `full.json` instead.

## Money-only update (PUT)

A narrower, dedicated route for adjusting just a character's `money`, added so a quick "Edit"
link can live directly on the show page without requiring full editor access (issue #615):

| Endpoint | Who can write | Body | Effect |
|----------|--------------|------|--------|
| `PUT /games/<slug>/pcs/<id>/money.json` | **CharacterMoneyEdit** | `{"money": <non-negative integer>}`, required | Writes `Character.money` only |
| `PUT /games/<slug>/npcs/<id>/money.json` | **CharacterMoneyEdit** | Same as above | Same as above |

**CharacterMoneyEdit** (`CharacterMoneyEditPermission`, `backend/games/permissions.py`): grants
the same access as **CharacterEdit** (superuser, the character's owning player, or a GameMaster
of the game) plus any global Staff account (`user.is_staff`), mirroring the Staff bypass
`CharacterPhotoUploadPermission` added for PC photo upload (issue #619). For a **PC**, this also
grants any player of that PC's game (issue #625), mirroring `CharacterPhotoUploadPermission`'s
"any player of the game" leniency — but that leniency is **PC-only**: since an NPC has no owning
player, NPC money edits stay admin/dm/staff-only, and a regular player who isn't otherwise a
GameMaster/superuser/staff gets no access to it.

Validated by `CharacterMoneyUpdateSerializer` (`backend/games/serializers/characters/character_money_update.py`),
a `ModelSerializer` restricted to `fields = ['money']` (required) — `money` being a
`PositiveIntegerField` on the model, DRF derives a `min_value=0` integer validator automatically;
a missing, negative, or non-integer `money` value returns `400`.

Success response: `200` with the same `CharacterDetailSerializer` body the plain detail endpoint
returns (not `CharacterFullSerializer` — so `private_description` and other full-editor-only
fields are never exposed to a Staff caller who edits money without being a full editor), with
`X-Skip-Cache: true`. Unauthenticated → `401`; authenticated but not allowed → `403`; unknown
`game_slug`/`character_id`, or an id belonging to the other PC/NPC kind → `404`.

For a PC, `money` is also writable — alongside `name`/`role`/`public_description`/`links` — through
the narrower "Narrow player-facing PC PATCH" route above (**CharacterRegularEdit**, issue #865),
an alternate write path with the exact same "any player of the game" leniency as
**CharacterMoneyEdit**; it grants no wider access to `money` than this dedicated route already
does.

## Create

| Endpoint | Who can write |
|----------|--------------|
| `POST /games/<slug>/npcs.json` | **GameEdit** |

There is no equivalent PC creation endpoint.

**Write fields**: `name` (required), `role`, `public_description`, `private_description`,
`hidden`, `money`, `private_allegiance`, `public_allegiance` (all optional except `name` — see
"Allegiance fields" above), and `links` (optional array — see [CharacterLink](character-link.md) below). `game` and
`npc` are never accepted from the request payload — `game` is always assigned server-side from
the `<slug>` URL segment, and `npc` is always forced to `True`. `player` is not accepted at all
— NPCs created this way have no player.

**Create response:** HTTP 201 with `CharacterDetailSerializer` body (same fields as "Detail"
above) — note it does not include `private_description`, even though the create serializer
accepts it as input, mirroring the PATCH behavior.
