# Access Control Reference

This document is the authoritative reference for data access rules in Majora. Every model,
endpoint, and field is covered here. When a new model or endpoint is introduced, update this
document in the same PR.

**Out of scope:** Django admin pages. Superusers always have full access to everything,
regardless of any other rule listed below.

---

## User Roles

| Role | Description |
|------|-------------|
| **Anonymous** | Unauthenticated request (no `Authorization` header or session token) |
| **Authenticated user** | Valid token or session, but no special game-level role |
| **GameMaster** | Authenticated user with a `GameMaster` row linking them to a specific game |
| **Player** | Authenticated user whose `Player` record has `user` set and is linked to a character |
| **Superuser** | Django `is_superuser=True` — full access, no restrictions |
| **Staff** | Django `is_staff=True` — global (not game-scoped); grants access to the User-management endpoints below only, nothing else |

A user may simultaneously be a GameMaster for one game and a Player for another. The
"GameMaster" and "Player" roles are always scoped to a specific game. "Staff" and
"Superuser" are global roles, not scoped to any game.

---

## Common Rules

Named permission patterns, referenced by name throughout this document instead of being
restated in every section:

| Rule | Permission class | Grants access to |
|------|------|------|
| **GameEdit** | `GameEditPermission` | That game's GameMaster, or superuser |
| **CharacterEdit** | `CharacterEditPermission` | The character's own player, any GameMaster of that game, or superuser |
| **NpcPlayerEdit** | `NpcPlayerEditPermission` | Everyone CharacterEdit grants, OR any player of that game (`is_player`, below) — NPC routes only |
| **TreasureEdit** | `TreasureEditPermission` | Superuser only |
| **GameSessionEdit** | `GameSessionEditPermission` | Delegates entirely to GameEdit against the session's game |
| **TaskEdit** | `TaskEditPermission` | Delegates entirely to GameEdit against the task's game; unlike every other rule here, also gates reads, not just writes (see "Task" below) |
| **Staff-or-superuser** | inline `require_staff` check | `user.is_staff or user.is_superuser` |
| **AllowAny** | DRF `AllowAny` | Anyone, unauthenticated included |

Full derivations:
- `Game.can_be_edited_by(user)`: `True` when `user.is_superuser`, OR user has a `GameMaster` row for that game.
- `Character.can_be_edited_by(user)`: `True` when `user.is_superuser`, OR user is the character's linked `Player.user`, OR user has a `GameMaster` row for the character's game.
- `Treasure.can_be_edited_by(user)`: `True` when `user.is_superuser`. Game-scoped treasure routes (create/update/photo-upload under `/games/<slug>/...`) never use this method — they check GameEdit against the resolved game instead (see "Treasure" below), so a treasure's own edit-rights method stays narrow while broader, game-derived access is layered on top only for routes explicitly scoped to a game.
- `is_player` = `game.players.filter(user=user).exists()`. **Note:** `Player.games` is currently never written by any endpoint (only touched in a model test), so `is_player` reads `false` for every real authenticated user until a future issue builds a flow to populate it.

Unless noted otherwise, an unauthenticated request to a non-AllowAny endpoint gets 401, and an
authenticated request that fails the permission check gets 403.

### Role-simulated permission checks

`Game`, `Character`, and `Treasure` each also expose a `can_be_edited_by_roles(is_superuser,
is_dm, is_owner=...)` sibling of `can_be_edited_by`, computing the same rule from simulated role
booleans instead of a real user — used by the `role`-parameterized `permissions.json` endpoints
below. `GameSession` and `Task` expose the same sibling too, delegating it to their game exactly
like `can_be_edited_by`; no `permissions.json` endpoint exists for either of them, so it exists
there only for future use / consistency — their views still call `can_be_edited_by(user)`
directly.

### Access status endpoints (`access.json`)

Every `access.json` endpoint (Game, Character/PC/NPC, Treasure) shares one
`BaseAccessSerializer`-derived response shape, is readable by anyone, and always sets
`X-Skip-Cache: true`:

| Field | Type | Value |
|-------|------|-------|
| `username` | `str \| null` | Requester's username, or `null` if unauthenticated |
| `is_superuser` | `bool \| null` | Whether requester is a Django superuser, or `null` if unauthenticated |
| `is_staff` | `bool \| null` | Whether requester is Django staff, or `null` if unauthenticated |
| `is_dm` | `bool \| null` | Whether requester is a GameMaster of the relevant game, or `null` if unauthenticated. For Treasure, `false` (not `null`) when authenticated but the treasure has no owning game |
| `is_player` | `bool \| null` | `is_player` as defined above, or `null` if unauthenticated; always `false` (never `null`, even when anonymous) for Treasure, which isn't nested under `/games/<slug>/` and deliberately never evaluates this |
| `is_owner` | `bool \| null` | **PC only**: `character.player.user_id == requester.id`, or `null` if unauthenticated. Always `false` (never `null`) for Game, NPC, and Treasure, which have no ownership concept |

`can_edit` is **not** part of this shape — see "Edit permission endpoints" below.

### Edit permission endpoints (`permissions.json`)

Every resource with an `access.json` endpoint also has a `GET .../permissions.json` — anyone can
call it; response is `{"can_edit": <bool>}`.

- **No `?role=` param**: `can_edit` reflects the real requester's identity
  (`<Model>.can_be_edited_by(request.user)`), and the response sets `X-Skip-Cache: true` —
  identical to `access.json`'s per-caller behavior.
- **`?role=` present** (accepts repeated values, e.g. `?role=dm&role=owner`): the real
  requester's identity is ignored; `can_edit` is instead computed via
  `<Model>.can_be_edited_by_roles(...)` from booleans derived from the given value(s):
  - `dm` → `is_dm = True`
  - `superuser` → `is_superuser = True`
  - `owner` → `is_owner = True` (only ever consulted by the Character/PC endpoint; a no-op for Game, NPC, Treasure)
  - `player`, `staff` → recognized but always no-ops (neither appears in any `can_be_edited_by_roles` signature) — included only so a caller can pass every role name it knows without triggering an "unrecognized value" branch
  - any other value → silently ignored (same tolerant, no-400-on-a-typo convention as `?allegiance=`/`?slain=` elsewhere) — but a `role` param containing only unrecognized/no-op values still computes `can_edit` with every boolean `False`; it does not fall back to the real-identity path
  - Whenever `role` is present (recognized or not), the response sets `X-Force-Public-Cache: true` instead of `X-Skip-Cache: true` — the result is identity-independent, so it's safe (and necessary, for UI-preview use cases like showing an anonymous visitor what a DM would see) to cache in the public tier.

Parsed by `parse_role_booleans` in `source/games/views/common.py`, shared verbatim by all four
`permissions.json` endpoints (Game, PC, NPC, Treasure).

### Cache-bypass mechanism for access endpoints

Access-type endpoints return user-specific data, so caching them across users would serve stale
or incorrect values. Three layers enforce correctness:

1. **Backend header (real-identity path)** — every `access.json` view, and every
   `permissions.json` view with no `role` param, sets `X-Skip-Cache: true` on the response,
   preventing Tent from caching it.
2. **Backend header (role-simulated path)** — a `permissions.json` view with a `role` param
   sets `X-Force-Public-Cache: true` instead, telling `CacheControlMiddleware`
   (`source/games/middleware.py`) to always apply the public/anonymous `Cache-Control` tier,
   overriding what it would otherwise choose from the real requester's own `is_authenticated`
   state.
3. **Frontend header** — `BaseClient.request` (`frontend/assets/js/client/BaseClient.js`)
   checks every request path against `frontend/assets/js/client/config/skipCacheEndpoints.js`
   (exact static paths) and `skipCacheSuffixes.js` (path suffixes, e.g. `/access.json`) before
   calling `fetch`; a match sends `X-Skip-Cache: 1`, bypassing the Tent cache read.

**Rule for future access-type endpoints:** if a new endpoint's response depends on the
requester's identity or permissions, add its path (or suffix) to the appropriate frontend
config file — the suffix approach exists because access-endpoint paths are dynamic (contain
`<slug>`/`<id>`). A role-simulated, identity-independent endpoint (like `permissions.json` with
`role`) needs no frontend bypass at all — its whole point is to be cacheable.

### Photo path fields

`Game.cover_photo_path`, `Character.profile_photo_path`, and `Treasure.photo_path` all follow
the same convention: `<model>.<photo-field>.path` (the underlying photo's raw relative storage
key) or `null` when unset, returned to anyone on that resource's list/detail endpoints. `Game`
and `Character` may hold at most one *current* cover/profile photo but keep every previously
uploaded photo in their gallery; `Treasure` has at most one photo ever — re-uploading always
replaces it (see "Upload" below for how a photo becomes the selected one).

---

## Game

| Action | Who can |
|--------|---------|
| List (`GET /games.json`) | **AllowAny** |
| Detail (`GET /games/<slug>.json`) | **AllowAny** |
| Create (`POST /games.json`) | Any authenticated user |
| Update (`PATCH /games/<slug>.json`) | **GameEdit** |
| Delete | Superuser only (via Django admin, out of scope) |

**Exposed fields** (read): `name`, `game_slug`, `description`, links list, photos list, treasures
list (via `GET /games/<slug>/treasures.json`), `cover_photo_path` (see "Photo path fields"
above) — returned on both `GET /games.json` and `GET /games/<slug>.json`, to anyone.

**Write fields** (create/update): `name` (required for create, optional for update),
`description` (optional). `cover_photo_path` is read-only and cannot be set directly by any
client — it is only ever assigned server-side (see "Upload" below).

**Create response:** HTTP 201 with `GameDetailSerializer` body — `name`, `game_slug`,
`description`, `links`, `photos`. The `game_slug` is auto-generated from `name` by the model; it
cannot be set by the client.

### Edit access status

`GET /games/<slug>/access.json` — **AllowAny**; see "Access status endpoints" above for the
shared response shape. Game's `is_owner` is always `false` (games have no ownership concept).

### Edit permission

`GET /games/<slug>/permissions.json` — **AllowAny**; see "Edit permission endpoints" above.

---

## GamePhoto

Game photos are readable through the game detail endpoint (`photos` array in
`GameDetailSerializer`) and through a dedicated photo index endpoint.

**Exposed fields** (read): `id`, `path` — visible to anyone who can read the game detail or the
photo index endpoint below. The `ready` field is internal and never serialised. `path` is
serialised directly by `GamePhotoSerializer` (`fields = ['id', 'path']`) and, once a `GamePhoto`
becomes a game's `cover_photo`, also indirectly via `Game.cover_photo_path` — both exposures
apply simultaneously.

**Write access:**
- `POST /games/<slug>/photo_upload.json` — **GameEdit**. Creates a `GamePhoto` row with
  `ready=False` as part of the upload initialisation flow (see "Game photo upload init
  endpoint" below). Not visible in the game detail until the upload is finalised and `ready` is
  set to `True`.
- All other write operations: superuser only (via Django admin, out of scope).

### Photo index endpoint

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/photos.json` | GET | **AllowAny** | Paginated list of `GamePhotoSerializer` objects (`id`, `path`) for photos where `ready=True` |

Unknown `game_slug` → 404. Not-ready photos (still mid-upload) are excluded. `Game` has no
privacy/hidden concept, so this endpoint has no additional visibility gate.

---

## Upload

The `Upload` model tracks the lifecycle of a photo upload (pending → uploading → uploaded),
generically for a `GamePhoto`, `CharacterPhoto`, or `TreasurePhoto`, via a `GenericForeignKey`
(`content_type`/`object_id`/`content_object`).

| Action | Who can |
|--------|---------|
| Create (`POST /games/<slug>/photo_upload.json`) | **GameEdit** |
| Create (`POST /games/<slug>/pcs/<id>/photo_upload.json`) | **CharacterEdit** |
| Create (`POST /games/<slug>/npcs/<id>/photo_upload.json`) | **NpcPlayerEdit** |
| Create (`POST /treasures/<id>/photo_upload.json`) | Superuser, or that treasure's owning game's GameMaster when `treasure.game_id` is set (see "Treasure photo upload init endpoint" below) |
| Read | Only the user who initiated the upload (indirectly, via the 201 response at creation time) |
| Update / Delete | No public endpoint; status transitions are handled internally |

**Exposed fields:**
- `id` (int) and `token` (secret string) — returned in the 201 response to the authenticated
  initiator only. `token` is a `secrets.token_urlsafe(32)` value and must never be exposed to
  any user other than the one who created the upload, or through any endpoint other than the
  init response.
- All other fields (`file_path`, `expiration_time`, `status`, `user`, `content_type`,
  `object_id`) are internal and never returned by any endpoint.

**Side effect on finalisation:** `PATCH /uploads/<id>.json` with `status=uploaded` marks the
linked photo record as `ready=True` and, if its owner does not already have a primary photo,
sets that primary photo reference. Dispatches on the upload's `content_object` type:
- **`GamePhoto`**: if the photo's game does not already have a `cover_photo`, sets
  `Game.cover_photo` to that photo. Gated by **GameEdit**.
- **`CharacterPhoto`**: if the photo's character does not already have a `profile_photo`, sets
  `Character.profile_photo` to that photo. Gated by **CharacterEdit** for a PC, or
  **NpcPlayerEdit** for an NPC.
- **`TreasurePhoto`**: unconditionally sets `Treasure.photo` to that photo — unlike the
  `GamePhoto`/`CharacterPhoto` cases, there is no "if unset" guard, since a treasure has at most
  one photo and re-uploading always replaces it. Gated by **TreasureEdit** for a global
  treasure, or **GameEdit** when the treasure is exclusive to a game.

All three cases reuse the checks already enforced at upload creation (token match, requesting
user must be the upload's owner) — only the object-level permission class differs, chosen by the
`content_object`'s type.

---

## Game photo upload init endpoint

| Endpoint | Method | Who can call | Response fields |
|----------|--------|-------------|-----------------|
| `/games/<slug>/photo_upload.json` | POST | **GameEdit** | `upload_id`, `token`, `game_id` |

Unknown `game_slug` → 404. Missing or invalid `filename` body field → 400.

---

## Character photo upload init endpoints

| Endpoint | Method | Who can call | Response fields |
|----------|--------|-------------|-----------------|
| `/games/<slug>/pcs/<id>/photo_upload.json` | POST | **CharacterEdit** | `upload_id`, `token`, `character_id` |
| `/games/<slug>/npcs/<id>/photo_upload.json` | POST | **NpcPlayerEdit** | `upload_id`, `token`, `character_id` |

Unknown `game_slug` or `character_id` (or a `character_id` that does not belong to `game_slug`,
or is the wrong PC/NPC type for the endpoint) → 404. Missing or invalid `filename` body field →
400. Creates a `CharacterPhoto` row with `ready=False`; not visible in the character detail's
`photos` list, and cannot become `profile_photo`, until the upload is finalised.

---

## Treasure photo upload init endpoint

| Endpoint | Method | Who can call | Response fields |
|----------|--------|-------------|-----------------|
| `/treasures/<id>/photo_upload.json` | POST | Superuser always; additionally that treasure's owning game's GameMaster, when `treasure.game_id` is set | `upload_id`, `token`, `treasure_id` |

Uses a fixed, deterministic storage path (`photos/treasures/<id>/photo.<ext>`, no random UUID)
since a treasure has at most one photo. The permission check delegates to **GameEdit** against
the owning game when `treasure.game_id` is set, instead of the plain superuser-only
**TreasureEdit**; a global treasure (`game_id` is `None`) still requires a superuser.

Unknown `treasure_id` → 404. Missing or invalid `filename` body field → 400. If the treasure
already has a `photo` (`treasure.photo_id` is set), the existing `TreasurePhoto` row is reused
(its `path` updated, `ready` reset to `False`) rather than creating a second row; otherwise a new
`TreasurePhoto` row is created with `ready=False`. Either way, the photo is not visible via
`photo_path`, and does not become `Treasure.photo`, until the upload is finalised.

---

## Character (PC and NPC)

Characters are scoped to a game. Access is symmetric for PCs and NPCs unless noted.

### List

| Endpoint | Who can read | Fields returned |
|----------|-------------|-----------------|
| `GET /games/<slug>/pcs.json` | **AllowAny** | `id`, `name`, `game_slug`, `profile_photo_path`, `slain`, `allegiance` |
| `GET /games/<slug>/npcs.json` | **AllowAny** | Same as above |
| `GET /games/<slug>/npcs/all.json` | **GameEdit** | Same as `npcs.json` (via `CharacterFullListSerializer`), plus `public_allegiance` and `public_slain` — see "Allegiance fields" and "Slain fields" below. Includes hidden NPCs, unlike `npcs.json`. Always sets `X-Skip-Cache: true` |

### Detail

| Endpoint | Who can read | Fields returned |
|----------|-------------|-----------------|
| `GET /games/<slug>/pcs/<id>.json` | **AllowAny** | `id`, `name`, `role`, `public_description`, `is_pc`, `photos`, `links`, `game_slug`, `can_edit`, `profile_photo_path`, `profile_photo_id`, `money`, `slain`, `allegiance` |
| `GET /games/<slug>/npcs/<id>.json` | **AllowAny** | Same as above |

`profile_photo_path` — see "Photo path fields" above; returned on the list, detail, and
full-detail endpoints, to anyone.

`slain` is a `BooleanField` (default `False`) shared by `Character` for both PCs and NPCs,
returned read-only on the list and detail endpoints to anyone — there it is sourced from the
`public_slain` model field (see "Slain fields" below). Like `hidden`/`money`, it is writable
through `CharacterUpdateSerializer` — see "Slain fields" for write-access rules.

### Full detail (includes `private_description`)

| Endpoint | Who can read/write | Fields returned |
|----------|-------------|-----------------|
| `GET /games/<slug>/pcs/<id>/full.json` | **CharacterEdit** | All detail fields + `private_description` + `public_allegiance` + `public_slain` |
| `GET /games/<slug>/npcs/<id>/full.json` | **CharacterEdit** | Same as above |
| `PATCH /games/<slug>/pcs/<id>/full.json` | **CharacterEdit** | Same response shape as the `GET` above |
| `PATCH /games/<slug>/npcs/<id>/full.json` | **CharacterEdit** | Same as above |

The character update action lives here rather than on the plain detail endpoints below — see
"Update (PATCH)" for the write-field/error-status contract. Always sets `X-Skip-Cache: true`, on
both `GET` and `PATCH`.

### Allegiance fields

`Character` has two independent `CharField(choices=...)` fields, both defaulting to `'neutral'`,
with allowed values `'ally'`, `'enemy'`, `'neutral'`:

- `allegiance` — the character's real disposition, visible only to a DM/superuser.
- `public_allegiance` — the disposition shown to regular players.

**Read exposure** — the JSON key `allegiance` means something different depending on the
endpoint (so the frontend can always read a single `character.allegiance` key regardless of
which endpoint served the payload):

- On the public list/detail endpoints (`pcs.json`, `npcs.json`, `pcs/<id>.json`,
  `npcs/<id>.json`), `allegiance` is sourced from `public_allegiance` — the real field is never
  exposed there.
- On the DM/admin endpoints (`npcs/all.json`, `pcs/<id>/full.json`, `npcs/<id>/full.json`),
  `allegiance` is the real field, and `public_allegiance` is additionally exposed under its own
  key.

Applies uniformly to both PCs and NPCs (shared model/serializers), though the fields are only
meaningfully written for NPCs in practice — a PC's `allegiance`/`public_allegiance` stay at the
`'neutral'` default since no PC write path ever sets them.

**Write access**: both fields are on the shared `CharacterUpdateSerializer`
(**CharacterEdit**-gated), writable through either `PATCH /games/<slug>/pcs/<id>/full.json` or
`PATCH /games/<slug>/npcs/<id>/full.json`. Since NPCs have no player owner by product definition
(see `docs/agents/product.md`), this is DM/superuser-only in practice for NPCs; a PC's own
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

### Slain fields

`Character` has two independent `BooleanField`s (both defaulting to `False`), following the same
real/public pattern as `allegiance`/`public_allegiance` above:

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

### Edit access status

`GET /games/<slug>/pcs/<id>/access.json`, `GET /games/<slug>/npcs/<id>/access.json` —
**AllowAny**; see "Access status endpoints" above for the shared response shape. `is_dm`/
`is_player` are evaluated against the character's game. `is_owner` is a real boolean for a PC
(`character.player.user_id == requester.id`); always `false` for an NPC (no player-ownership
concept).

### Edit permission

`GET /games/<slug>/pcs/<id>/permissions.json`, `GET /games/<slug>/npcs/<id>/permissions.json` —
**AllowAny**; see "Edit permission endpoints" above. Both PC and NPC routes share one
`CharacterPermissionsSerializer` — `is_owner` (and therefore the `owner` role) only ever affects
the result for a PC; it is always a no-op for an NPC.

### Update (PATCH)

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
accepted — see "CharacterLink" below for write semantics.

#### Narrow NPC slain-toggle PATCH

`PATCH /games/<slug>/npcs/<id>.json` (the plain NPC detail endpoint) accepts `PATCH` again, but
only for a single, narrow purpose: toggling the NPC's player-facing `public_slain` state.

| Endpoint | Who can write | Body | Effect |
|----------|--------------|------|--------|
| `PATCH /games/<slug>/npcs/<id>.json` | **NpcPlayerEdit** | `{"slain": true \| false}` only — any other key is silently ignored | Writes `Character.public_slain`; the real `slain` field is untouched and stays `full.json`-only |

Validated by `NpcSlainUpdateSerializer` (`source/games/serializers/npc_slain_update.py`), a
`ModelSerializer` with a single `slain = BooleanField(source='public_slain')` field.

The hidden-NPC gate (see "Detail" above) still applies: a hidden NPC returns 404 to a caller who
is not an editor, same as `GET`. Success response: `200` with the same `CharacterDetailSerializer`
body `GET` returns on this route, with `X-Skip-Cache: true`. This is additive only — the PC
plain endpoint stays `GET`-only, and the DM-facing edit form/slain-toggle keep using `full.json`.

### Create

| Endpoint | Who can write |
|----------|--------------|
| `POST /games/<slug>/npcs.json` | **GameEdit** |

There is no equivalent PC creation endpoint.

**Write fields**: `name` (required), `role`, `public_description`, `private_description`,
`hidden`, `money`, `allegiance`, `public_allegiance` (all optional except `name` — see
"Allegiance fields" above), and `links` (optional array — see "CharacterLink" below). `game` and
`npc` are never accepted from the request payload — `game` is always assigned server-side from
the `<slug>` URL segment, and `npc` is always forced to `True`. `player` is not accepted at all
— NPCs created this way have no player.

**Create response:** HTTP 201 with `CharacterDetailSerializer` body (same fields as "Detail"
above) — note it does not include `private_description`, even though the create serializer
accepts it as input, mirroring the PATCH behavior.

---

## GameMaster

| Action | Who can |
|--------|---------|
| List (`GET /games/<slug>/game-masters.json`) | **AllowAny** |
| Create (`POST /games/<slug>/game-masters.json`) | Any authenticated user (self-assignment only; duplicates rejected with 400) |
| Delete (`DELETE /games/<slug>/game-masters/<id>.json`) | The GameMaster themselves, or a superuser; others → 403 |

**Exposed fields** (read): `id`, `user` reference (serialized by `GameMasterSerializer`).

---

## Player

Players have no dedicated public endpoint. They are read indirectly through character data.
The `Player` model (`name`, `games` M2M) is not exposed in any list or detail endpoint as a
standalone resource; no write endpoint exists.

---

## User (Staff Management)

Unlike `Player`, the Django `User` model is exposed directly, but only to **Staff-or-superuser**
— never publicly. All endpoints below require `CookieTokenAuthentication` and enforce
**Staff-or-superuser** inline via `require_staff` in `source/games/views/common.py` (matching
the `treasures_list.py` convention of enforcing auth inline rather than through DRF permission
classes). All GET and write responses set `X-Skip-Cache: true` since the data is
per-caller-authorization sensitive.

| Action | Who can |
|--------|---------|
| List (`GET /staff/users.json`) | **Staff-or-superuser** |
| Detail (`GET /staff/users/<id>.json`) | **Staff-or-superuser** |
| Update name/email (`PATCH /staff/users/<id>.json`) | **Staff-or-superuser** |
| Generate/reuse recovery link (`POST /staff/users/<id>/recovery-link.json`) | **Staff-or-superuser** |

**Exposed fields** (list and detail): `id`, `name` (Django `username`), `email`. No other `User`
field (password, `is_staff`, `is_superuser`, `is_active`, etc.) is ever serialized.

**Update rules**: only `name` and `email` may be changed; both are validated for uniqueness
against other `User` rows (`username` is unique at the DB level, `email` is not, so uniqueness
is enforced in `StaffUserUpdateSerializer`). No endpoint exists to create a user, delete a user,
change a password directly, or toggle `is_staff`/`is_superuser`/`is_active`.

**Recovery-link endpoint**: reuses a valid (unexpired, unused) `PasswordResetToken` for the
target user if one exists, otherwise creates a new one (`get_or_create_recovery_token` in
`source/games/views/password_reset/_shared.py`), and returns its URL directly in the response
body. Unlike `/users/recover.json`, it never sends an email — the URL is meant to be shared by
staff directly with the user out-of-band.

---

## CharacterPhoto

Character photos are readable through the character detail endpoints (`photos` array in
`CharacterDetailSerializer` and, by inheritance, `CharacterFullSerializer`) and through
dedicated photo index endpoints (one for PCs, one for NPCs). `CharacterPhoto` fully replaces the
legacy `Photo` model (which only had a bare `url` field and no upload/ready lifecycle) — serving
both the character's photo gallery (`character.photos`) and, via `Character.profile_photo`, its
profile picture.

**Exposed fields** (read): `id`, `path` — both visible to anyone who can read the character
detail or photo index endpoint (i.e. anyone, since PC endpoints are publicly accessible, and NPC
endpoints are publicly accessible for non-hidden NPCs — see "Photo index endpoints" below). The
`ready` field is internal and never serialised. As with `GamePhoto`, `path` is exposed both
directly by `CharacterPhotoSerializer` and indirectly via `Character.profile_photo_path` — both
apply simultaneously.

**Write access:**
- `POST /games/<slug>/pcs/<id>/photo_upload.json`, `POST /games/<slug>/npcs/<id>/photo_upload.json`
  — see "Character photo upload init endpoints" above. Creates a `CharacterPhoto` row with
  `ready=False`.
- All other write operations: superuser only (via Django admin, out of scope).

### Photo index endpoints

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/pcs/<id>/photos.json` | GET | **AllowAny** | Paginated list of `CharacterPhotoSerializer` objects (`id`, `path`) for photos where `ready=True` |
| `/games/<slug>/npcs/<id>/photos.json` | GET | **AllowAny**, but see hidden-NPC gate below | Same as above |

Unknown `game_slug` or `character_id` (or a `character_id` that does not belong to `game_slug`,
or is the wrong PC/NPC type) → 404. Not-ready photos are excluded.

**Hidden-NPC gate** (`game_npc_photos` only): if `character.hidden` is `True` and the requesting
user cannot edit the character (`not character.can_be_edited_by(request.user)`), the endpoint
raises `Http404` instead of returning the photo list — visible only to the character's player, a
GameMaster of that game, or a superuser. `PC` characters have no `hidden` concept, so
`game_pc_photos` has no equivalent gate. The same gate pattern is reused by the treasure index
endpoint below.

---

## CharacterTreasure

`CharacterTreasure` is a through model linking `Character` to `Treasure`, with its own
`quantity` (non-negative integer, default `0`) — the first through-model-with-an-extra-field in
the codebase (the `Game`↔`Treasure` M2M is a bare relationship with no through model or extra
fields). It is read-only through two dedicated index endpoints (one for PCs, one for NPCs), plus
four acquire/sell mutation endpoints scoped to the owning player/GameMaster/superuser. There is
no direct create/update/delete endpoint for a `CharacterTreasure` row itself — only the atomic
acquire/sell operations below, plus Django admin for superusers.

### Treasure index endpoints

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/pcs/<id>/treasures.json` | GET | **AllowAny** | Paginated list of `CharacterTreasureSerializer` objects (`id`, `treasure_id`, `name`, `quantity`, `value`, `photo_path`) for that PC's `CharacterTreasure` rows with `quantity > 0` |
| `/games/<slug>/npcs/<id>/treasures.json` | GET | **AllowAny**, but see hidden-NPC gate above | Same as above, for that NPC |

Unknown `game_slug` or `character_id` (or mismatched/wrong type) → 404. Both endpoints filter to
`quantity__gt=0` — rows zeroed out by selling all owned units are kept in the database (to
preserve history and avoid re-creating the row on re-acquisition) but never listed. The
hidden-NPC gate from "CharacterPhoto" above applies identically to `game_npc_treasures`.

**Exposed fields** (read): `id` (the `CharacterTreasure` row id, not the `Treasure` id),
`treasure_id`, `name`, `value`, `photo_path` (from the related `Treasure`; nullable), `quantity`
(the through model's own field) — all non-sensitive; `treasure_id` and `photo_path` are not new
disclosures, since both are already publicly exposed for the same `Treasure` via
`/treasures.json`, `/treasures/<id>.json`, and `/games/<slug>/treasures.json`.

### Treasure acquire/sell endpoints

| Endpoint | Method | Who can call | Effect |
|----------|--------|-------------|--------|
| `/games/<slug>/pcs/<character_id>/treasures/acquire.json` | POST | **CharacterEdit** | Spends `quantity * treasure.value` from `character.money` to add `quantity` of `treasure_id` |
| `/games/<slug>/pcs/<character_id>/treasures/sell.json` | POST | **CharacterEdit** | Removes `quantity` of `treasure_id`, refunding `quantity * treasure.value` into `character.money` |
| `/games/<slug>/npcs/<character_id>/treasures/acquire.json` | POST | **CharacterEdit** (note: *not* NpcPlayerEdit, unlike NPC photo uploads) | Same as the PC acquire endpoint, for an NPC |
| `/games/<slug>/npcs/<character_id>/treasures/sell.json` | POST | **CharacterEdit** | Same as the PC sell endpoint, for an NPC |

Request body: `{"treasure_id": <int>, "quantity": <int, >= 1>}`. Success (200) for sell:
`{"quantity": <new owned quantity>, "money": <new character.money>}`. Success (200) for acquire:
same two fields plus `acquired` — the number of units actually acquired, which may be less than
requested when the treasure has a stock cap and fewer units are available (partial fulfillment —
see "GameTreasure" below; never a 400, even when `acquired` is `0`).

Failure: 401, 403 (not the owning player/GameMaster/superuser), 404 (`treasure_id` does not
resolve to a treasure available in this game — scoped via the same
`Q(linked_game=game) | Q(game=game)` filter used by the game treasure list — or, for sell, no
owned `CharacterTreasure` row exists), 400 (`{"errors": {"quantity": ["insufficient funds"]}}`
on acquire when `acquired * treasure.value > character.money` — checked against the capped
`acquired` amount, not the requested `quantity` — or `{"errors": {"quantity": ["not enough
owned"]}}` on sell). Both operations run inside `transaction.atomic()` and never delete the
`CharacterTreasure` row, even when a full sell brings `quantity` to `0`.

These endpoints do not re-apply the hidden-NPC `Http404` gate before the permission check
(unlike the read endpoint above) — a hidden NPC's existence is confirmed via 401/403 rather than
masked behind a 404, mirroring the same no-masking convention used by
`PATCH /games/<slug>/npcs/<id>/full.json`.

### `max_value` filter on the game treasure list

`/games/<slug>/treasures.json` (GET, **AllowAny**, documented under "Treasure" below) accepts an
optional `max_value` query parameter (integer, copper pieces): the queryset is filtered to
`value__lte=max_value`; a missing or non-numeric value is silently ignored. Exposes no
additional data — it only narrows the same publicly readable list.

---

## GameTreasure

`GameTreasure` is the `through` model backing `Game.treasures` (the shared many-to-many
relationship between `Game` and `Treasure` — distinct from, and independent of, the separate
"exclusive" `Treasure.game` FK documented under "Treasure" below, which has no stock-cap
concept). It carries a per-`(game, treasure)` stock cap: a nullable `max_units` (unlimited when
`null`) and an internal `acquired_units` bookkeeping counter (starts at `0`), from which a
derived `available_units = max(max_units - acquired_units, 0)` (or `null` when `max_units` is
`null`) is computed. There is no dedicated CRUD endpoint for `GameTreasure` itself — it is only
ever read/written indirectly, through the `Treasure` endpoints below.

| Action | Who can |
|--------|---------|
| Read `available_units`/`max_units` | **AllowAny**, via the game-scoped `Treasure` read endpoints — see "Treasure" below |
| Write `max_units` | **GameEdit**, via `PATCH /games/<slug>/treasures/<int:treasure_id>.json` when the treasure is M2M-linked to the game |
| Write `acquired_units` | Never directly by any client — only ever incremented/decremented as a side effect of the acquire/sell endpoints above |
| Create/Delete the `(game, treasure)` link itself | Superuser only, via Django admin's `GameTreasureInline` on the `Game` admin page (no application-level endpoint) |

**Exposed fields** (read, as `available_units`/`max_units` on `TreasureListSerializer`/
`TreasureDetailSerializer`): see "Treasure" below for full exposure rules.

**Write fields**: `max_units` only (`int >= 0`, or `null` for unlimited), via
`GameTreasureUpdateSerializer` — an explicit allowlist that excludes `game`, `treasure`, and
`acquired_units`.

**Stock-cap enforcement on acquire/sell**: when a character acquires `quantity` of a treasure
that is M2M-linked to the game with a `GameTreasure` row, the acquired amount is capped at
`available_units` instead of rejecting an over-sized request — the response's `acquired` field
reports how many units were actually granted, and `acquired_units` is incremented by that
amount. Selling decrements `acquired_units` by the sold quantity (floored at `0`). Both
operations lock the `GameTreasure` row (`select_for_update()`) inside the same transaction as
the character/`CharacterTreasure` locks, in a consistent lock order, to prevent concurrent
requests from over-selling the available stock. A treasure with `available_units == 0` is not
hidden from any list — it simply cannot be acquired further (an acquire request against it
succeeds with `acquired: 0`).

---

## Link

Links are read-only through the game detail endpoint (`links` array in `GameDetailSerializer`).
No direct link create/update/delete endpoint exists.

**Exposed fields** (read): `id`, `text`, `url`, `link_type` — visible to anyone who can read the
game detail (i.e. anyone). `link_type` is a non-sensitive display-icon enum (`''` or
`lootstudio`) driving which icon the frontend renders next to the link; it carries no
access-control implications.

**Write access:** superuser only (via Django admin, out of scope).

---

## CharacterLink

Character links are read through the character detail endpoints (`links` array in
`CharacterDetailSerializer` and, by inheritance, `CharacterFullSerializer`). Links are writable,
nested inside the character create/update payloads — there is no standalone `CharacterLink`
create/update/delete endpoint.

**Exposed fields** (read): `id`, `text`, `url`, `link_type` — visible to anyone who can read the
character detail (i.e. anyone, since both PC and NPC detail endpoints are publicly accessible).
`link_type` carries no access-control implications (same enum as `Link` above).

**Write access:** no dedicated `CharacterLink` endpoint — links are written exclusively as a
nested `links` array inside the character payload, gated by the same permission as the character
write itself:

- `PATCH /games/<slug>/pcs/<id>/full.json`, `PATCH /games/<slug>/npcs/<id>/full.json` — via
  `CharacterUpdateSerializer`'s `links` field, **CharacterEdit**.
- `POST /games/<slug>/npcs.json` — via `CharacterCreateSerializer`'s `links` field, **GameEdit**.

**Write semantics** (`CharacterLinkWriteSerializer` + `CharacterLinksSync`, in
`source/games/serializers/character_link_write.py`): each entry in the `links` array accepts
`id` (optional int), `text`, `url`, `link_type`, and a transient `delete` flag (not a model
field). Routing per entry, applied server-side after the character's own fields are saved:
- `delete: true` — deletes the existing link matching `id`. `id` is required whenever
  `delete: true`; a delete entry with no `id` → 400.
- `id` present (no `delete`) — updates the existing link matching `id`; only the fields present
  in the entry are changed (blank fields keep their existing value).
- `id` absent — creates a new `CharacterLink` owned by the target character. `url` is required
  for any new entry that isn't a delete; missing `url` on a create entry → 400. An update entry
  does not require `url`.

On create (`CharacterLinksSync.create_all()`), any `id`/`delete` in the entries is ignored and a
link is unconditionally created per entry — there is no existing character yet to update or
delete against.

**Batch size cap:** the `links` array is capped at `MAX_LINKS` (50) entries per request,
rejected with 400 when exceeded — each entry drives at least one synchronous DB query.

**Atomicity:** `CharacterLinksSync.apply()` and `.create_all()` each run their per-entry loop
inside `transaction.atomic()` — if any entry in the batch fails, every entry already
applied/created earlier in the same request is rolled back.

**Ownership check:** for update and delete, `id` must resolve to a `CharacterLink` already owned
by the target character (`character.links.filter(id=link_id)`) — an `id` for a link that doesn't
exist, or belongs to a different character, is rejected with 400
(`{"errors": {"links": ["Unknown link id <id>."]}}`, via the `save_or_error()` helper in
`source/games/views/common.py`), never silently ignored and never allowed to affect another
character's link.

---

## Access-route config endpoint

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/access-route-config.json` | GET | **AllowAny** | Static JSON object keyed by page identifier (see below) |

Sourced from the plain Python dict `ACCESS_ROUTE_CONFIG` in
`source/games/access_route_config.py`. Returns no model data and no user data — a static,
non-paginated, always-public-cache-tier config describing, for each frontend page identifier
(the same identifiers `HashRouteResolver#getPage` produces — `game`, `gameEdit`, `pcCharacter`,
`treasureEdit`, `staffUsers`, ...), which resource-kind access check(s) that page must perform
before rendering. Each page key maps to a list of descriptors — most pages need only one, but
e.g. `treasureEdit` needs both a superuser check and a treasure-ownership check — each descriptor
a `{"kind": ...}` dict (`"game"`, `"character"`, `"treasure"`, `"superuser"`, or
`"staffOrSuperuser"`), with `"character"` descriptors additionally carrying a `"characterKind"`
key (`"pcs"` or `"npcs"`). Page identifiers with no access check at all (e.g. `games`, `home`)
have no entry.

This endpoint carries no URL patterns — route paths and param names remain frontend-owned
routing knowledge (see `frontend.md`). Authentication classes are explicitly empty
(`@authentication_classes([])`) and permissions are `AllowAny`, identical to the health check
endpoint below — this response never varies by caller, so it always gets the public/anonymous
`Cache-Control` tier.

---

## Health check endpoint

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/health.json` | GET | **AllowAny** | `{"status": "ok"}` |

Returns no model data and no user data. Used by the frontend to periodically verify backend
connectivity. Authentication classes are explicitly empty (`@authentication_classes([])`) and
permissions are `AllowAny`.

---

## Authentication endpoints

These endpoints manage identity; they do not expose domain data beyond confirmation of
success/failure. They are listed here for completeness.

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/users/login.json` | POST | Anyone |
| `/users/logout.json` | POST | Authenticated (`IsAuthenticated`) |
| `/users/register.json` | POST | Anyone |
| `/users/status.json` | GET | Anyone (returns `logged_in`, and when true, `is_superuser`/`is_staff` for the requester) |
| `/users/test-email.json` | POST | Authenticated |
| `/users/recover.json` | POST | Anyone |
| `/users/reset-password.json` | POST | Anyone (requires valid reset token) |
| `/users/language.json` | POST | Authenticated |
| `/users/account.json` | GET/PATCH | Authenticated; always scoped to the requesting user, never a different user id |

---

## Treasure

Treasures are global by default, but may optionally be exclusive to one game via a `game` FK.
All read endpoints are public; write endpoints on the global routes (create and update) remain
restricted to superusers. Treasures may also be associated with games via a separate, untouched
M2M relationship and retrieved through the game-scoped list endpoint below — a treasure can be
M2M-linked to any number of games *and/or* exclusively owned (via `game`) by at most one game,
independently.

| Action | Who can |
|--------|---------|
| List (`GET /treasures.json`) | **AllowAny** — returns only global treasures (`game__isnull=True`); game-exclusive treasures are excluded |
| Detail (`GET /treasures/<id>.json`) | **AllowAny** |
| List by game (`GET /games/<slug>/treasures.json`) | **AllowAny** — returns the union of treasures M2M-linked to that game and treasures whose `game` FK points at it, excluding any with `hidden=True`; 404 if game slug unknown |
| List all by game, including hidden (`GET /games/<slug>/treasures/all.json`) | **GameEdit** — same unfiltered union, without the `hidden=True` exclusion. Always sets `X-Skip-Cache: true` (stricter than `npcs/all.json`, which relies on cache invalidation instead) |
| Create by game (`POST /games/<slug>/treasures.json`) | **GameEdit** — `game` is set server-side from the resolved game and never accepted from the request body |
| Detail by game (`GET /games/<slug>/treasures/<int:treasure_id>.json`) | **AllowAny**, unless `hidden=True` — 404 if the treasure's `game` does not match the resolved game (including a global treasure id, or one exclusive to a different game), **and** 404 if the treasure is hidden and the requester cannot edit the game. A hidden treasure's detail is only visible to that game's GameMaster or a superuser; sets `X-Skip-Cache: true` whenever the treasure is hidden |
| Update by game (`PATCH /games/<slug>/treasures/<int:treasure_id>.json`) | **GameEdit** — same 404 rule as the detail endpoint; a `PATCH` by a non-editor on a hidden treasure also 404s (not 403), so existence is not leaked. Also resolves treasures M2M-linked to the game (not just exclusive ones): for an exclusive treasure it updates `name`/`value`/`hidden`; for an M2M-linked treasure it instead accepts and persists `max_units` onto that game's `GameTreasure` row — `name`/`value`/`hidden` in the body are ignored in that case, and `acquired_units` can never be set through this endpoint |
| Create (`POST /treasures.json`) | Superuser only |
| Update (`PATCH /treasures/<id>.json`) | Superuser only (includes the GameMaster of a game-exclusive treasure's own owning game — the global endpoint stays superuser-only regardless of `game`) |
| Create photo (`POST /treasures/<id>/photo_upload.json`) | Superuser always; additionally that treasure's owning game's GameMaster, when `treasure.game_id` is set |
| Delete | Superuser only (via Django admin, out of scope) — deleting a treasure's owning `Game` also cascade-deletes the treasure; it does not delete treasures merely M2M-linked to that game |

**Exposed fields** (read): `id`, `name`, `value`, `photo_path`, `game_slug`, `available_units`,
`max_units` — all non-sensitive.

`available_units`/`max_units` (`int|null`) are derived from a `GameTreasure` row (see
"GameTreasure" above). Returned, computed relative to the resolved game, on
`GET /games/<slug>/treasures.json`, `GET /games/<slug>/treasures/all.json`, and
`GET /games/<slug>/treasures/<int:treasure_id>.json` (shared `GameTreasureFieldsMixin`). Null on
the global, non-game-scoped endpoints (no game to scope to), and for treasures exclusive to a
game (no `GameTreasure` row exists for those, since `max_units`/`acquired_units` only apply to
the shared M2M relationship).

`photo_path` — see "Photo path fields" above; returned on both `GET /treasures.json` and
`GET /treasures/<id>.json`, to anyone.

`game_slug` is `treasure.game.game_slug` — the slug of the game the treasure is *exclusively*
owned by (via the `game` FK), or `null` when the treasure is global or only M2M-linked to one or
more games. Returned on `GET /treasures.json`, `GET /treasures/<id>.json`, and the game-scoped
list/detail endpoints, to anyone.

**Write fields** (create/update): `name` (required for create, optional for update), `value`
(required for create, optional for update), `hidden` (optional, defaults to `False`).
`photo_path` and `game_slug` are read-only and cannot be set directly by any client — `game` is
only ever assigned server-side, either left `null` (global create) or set from the `<slug>` URL
segment (game-scoped create); `photo_path` is only ever assigned via "Upload" above.

`hidden` is a `BooleanField` (default `False`) on `Treasure`, settable via
`TreasureCreateSerializer`/`TreasureUpdateSerializer` on both global and game-scoped treasures
(shared serializers). It is **not** exposed in any read serializer — used purely server-side to
filter/gate the game-scoped endpoints: `GET /games/<slug>/treasures.json` excludes
`hidden=True`, `GET /games/<slug>/treasures/<int:treasure_id>.json` 404s for a hidden treasure
unless the requester can edit the game, and `GET /games/<slug>/treasures/all.json` deliberately
reveals hidden treasures to an authorized DM/superuser. A character's own treasure listings
(`CharacterTreasure`-backed) are unaffected by `hidden` — a character keeps seeing treasure it
already owns even if that treasure is later hidden from the catalog.

**Scope limitation:** `hidden` currently has no filtering effect on the global, non-game-scoped
endpoints (`GET /treasures.json`, `GET /treasures/<id>.json`) — a superuser can set
`hidden=True` on a global treasure via those endpoints' create/update, but the global list/detail
endpoints do not honor it, so the treasure remains publicly visible there. This is a deliberate
scope decision (only the game-scoped catalog was in scope), not an oversight — global treasures
are already fully public by design (`GET /treasures.json` is **AllowAny** regardless of
`hidden`), so this grants no caller any additional access. A future issue can extend the same
filter/gate used on the game-scoped endpoints to `treasures_list`/`treasure_detail`.

### Edit access status

`GET /treasures/<id>/access.json` — **AllowAny**; see "Access status endpoints" above for the
shared response shape. Edit permission is computed via *any* available path: the global
superuser-only route, **or** the game-scoped route (that treasure's owning game's GameMaster,
when `treasure.game_id` is set) — computed separately in `TreasurePermissionsSerializer`, not by
`Treasure.can_be_edited_by` itself (see "Common Rules" above). The path ends with `/access.json`,
already listed in `frontend/assets/js/client/config/skipCacheSuffixes.js`, so no additional
frontend config is needed.

### Edit permission

`GET /treasures/<id>/permissions.json` — **AllowAny**; see "Edit permission endpoints" above.
With a `role` param, `can_edit` is computed via `Treasure.can_be_edited_by_roles(is_superuser,
is_dm)` — a global treasure (`game_id` is `None`) is superuser-only even under simulation (the
`dm` role is always a no-op there); only a game-exclusive treasure's `dm` role additionally
grants `can_edit`, preserving the same dual-path logic as the real-identity check above.

---

## GameSession

Sessions are scoped to a game and record when a session happened. There is no independent
owner/player concept for sessions — write access mirrors `Game.can_be_edited_by` exactly
(**GameSessionEdit**).

| Action | Who can |
|--------|---------|
| List (`GET /games/<slug>/sessions.json`) | **AllowAny** — paginated, ordered by `id` (creation order, not `date`); 404 if game slug unknown |
| Detail (`GET /games/<slug>/sessions/<id>.json`) | **AllowAny**; 404 if game slug unknown, session id unknown, or the session does not belong to that game |
| Create (`POST /games/<slug>/sessions.json`) | **GameSessionEdit** |
| Update (`PATCH /games/<slug>/sessions/<id>.json`) | **GameSessionEdit** |
| Delete | Superuser only (via Django admin, out of scope) |

**Exposed fields** (list): `id`, `title`, `date`, `game_slug`.

**Exposed fields** (detail): all list fields plus `can_edit` — computed the same way the
`Character` detail serializer surfaces it (a `SerializerMethodField` evaluated against
`request.user` from the serializer context), unlike `Treasure`, which uses a separate
`access.json` endpoint. There is no separate `GET /games/<slug>/sessions/<id>/access.json`
endpoint: since a session's edit rights are identical to its game's, the frontend relies on the
existing `GET /games/<slug>/access.json` endpoint already used for `GameEdit`.

**Write fields** (create/update): `title` (required for create, optional for update), `date`
(optional, nullable `YYYY-MM-DD`). `game` is never accepted from the request payload — it is
always assigned server-side from the `game_slug` URL segment.

---

## Task

Tasks are a DM-private checklist scoped to a game (and optionally one of its `GameSession`s),
mirroring `GameSession`'s "delegates edit rights to its game" ownership pattern
(**TaskEdit**). Unlike every other resource in this document, **Task has no public read path**:
List and Detail are gated by `TaskEditPermission` exactly like Create and Update, since a task
may hold DM-only prep notes. There is no `GameSession`/`Treasure`-style `AllowAny` GET anywhere
on this resource — `TaskEditPermission.check()` is invoked unconditionally at the top of both
`game_tasks_list` (for `GET` and `POST` alike) and `game_task_detail` (for its sole `PATCH`
method), the first resource in this codebase where read access requires the same authorization
as write access.

| Action | Who can |
|--------|---------|
| List (`GET /games/<slug>/tasks.json`) | **TaskEdit**; paginated, ordered by `id` (creation order); 404 if game slug unknown |
| Create (`POST /games/<slug>/tasks.json`) | Same as List |
| Update (`PATCH /games/<slug>/tasks/<id>.json`) | Same as List; 404 if task id unknown or the task does not belong to that game |
| Delete | Superuser only (via Django admin, out of scope) — no `DELETE` endpoint exists |

There is no standalone detail-GET endpoint (`GET /games/<slug>/tasks/<id>.json` does not exist):
since every viewer of a task is already an editor (List already returns the full item shape,
including `long_description`), a separate detail read path would carry no additional
information. `PATCH` is the only method registered on the `<id>.json` route.

**Exposed fields** (list, create-response, and update-response — all three share
`GameTaskListSerializer`): `id`, `short_description`, `long_description`, `completed`,
`session` (nullable `GameSession` id).

**Write fields** (create/update): `short_description` (required for create, optional for
update), `long_description` (optional, may contain line breaks), `completed` (optional,
defaults to `False`), `session` (optional, nullable — settable, changeable, or clearable via
`null`). `game` is never accepted from the request payload — always assigned server-side from
the `game_slug` URL segment.

**`session` validation**: when provided (non-null) on create or update, `session` must be a
`GameSession` belonging to the same game as the task, or the request is rejected with 400
(`{"errors": {"session": [...]}}`) — enforced in `validate_session` on both
`GameTaskCreateSerializer` and `GameTaskUpdateSerializer`, which read the resolved `Game`
instance from serializer `context={'game': game}`.

**`session`'s own `on_delete` behavior:** the `session` FK uses `on_delete=models.SET_NULL` (not
`CASCADE`), so deleting a `GameSession` via Django admin detaches its tasks (sets
`task.session` to `null`) rather than deleting them — a task is expected to outlive the session
it was originally scoped to.

---

## Historical records (`versioning` app)

`django-simple-history` generates one `Historical<Model>` table per tracked model — `Game`,
`Player`, `Character`, `Treasure`, `CharacterTreasure`, `GamePhoto`, `CharacterPhoto`, `Link`,
`CharacterLink`, `TreasurePhoto` — living in the `versioning` app (see
`docs/agents/architecture.md`'s "`versioning/`" section). `GameTreasure` is not tracked.

These tables carry the full field state of every tracked model at every past save/delete, plus
`history_user` (the acting user, when known). **They are exposed only via Django Admin — out of
scope per this document's own rule above — and never through any API endpoint or serializer.**
There is no read or write path to a `Historical<Model>` row from any client-facing route; a
future issue that wants to surface history through the API would need its own dedicated review
and its own entry in this document.

**`history_user` has no DB-level foreign-key constraint** (`user_db_constraint=False` on every
`HistoricalRecords(...)` call) — required to avoid MySQL deadlocks under the `games/tests/views/`
suite (a hard FK from ten `Historical<Model>` tables to `auth_user` caused intermittent deadlock
failures; disabling the constraint resolved them, matching the "loose FK" treatment
`django-simple-history` already applies by default to the tracked model's own relations, e.g.
`game`/`player`/`profile_photo`). Integrity of `history_user_id` after a user is deleted
therefore relies on the deletion going through Django's ORM (`on_delete=models.SET_NULL` still
runs via Django's own signal/collector machinery, independent of `db_constraint`) rather than a
DB-level constraint — true for every current user-deletion path in this codebase. If a future
raw-SQL or bulk user-purge tool is ever added, it should explicitly null out `history_user_id` on
the ten `Historical<Model>` tables (or reuse Django's ORM delete) to avoid an orphaned reference;
`_history_user_getter` already handles a missing user gracefully (returns `None`), so this
remains a data-integrity nuance, not a crash or disclosure risk.

---

## Adding a new model

When a new model is introduced, add it to this document in the same PR:

1. List the user roles that can read each field.
2. List the user roles that can create, update, and delete records.
3. Note whether superuser-only access applies and why.
