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

## Game

| Action | Who can |
|--------|---------|
| List (`GET /games.json`) | Anyone |
| Detail (`GET /games/<slug>.json`) | Anyone |
| Create (`POST /games.json`) | Any authenticated user |
| Update (`PATCH /games/<slug>.json`) | GameMaster of that game, or superuser |
| Delete | Superuser only (via Django admin, out of scope) |

**Exposed fields** (read): `name`, `game_slug`, `description`, links list, photos list, treasures list (via `GET /games/<slug>/treasures.json`), `cover_photo_path`.

`cover_photo_path` (added in issue #254) is `game.cover_photo.path` — the raw relative storage
key of the `GamePhoto` automatically selected as the game's cover (see the "GamePhoto" and
"Upload" sections below) — or `null` when the game has no cover photo yet. It is returned on
both `GET /games.json` and `GET /games/<slug>.json`, to anyone.

**Write fields** (create/update): `name` (required for create, optional for update), `description` (optional). `cover_photo_path` is read-only and cannot be set directly by any client — it is only ever assigned server-side (see "Upload" below).

**Create response:** HTTP 201 with `GameDetailSerializer` body — `name`, `game_slug`, `description`, `links`, `photos`. The `game_slug` is auto-generated from `name` by the model; it cannot be set by the client.

Unauthenticated `POST /games.json` → 401. Authenticated `PATCH /games/<slug>.json` by a non-GameMaster → 403.

### Edit access status

| Endpoint | Who can read | Response |
|----------|-------------|----------|
| `GET /games/<slug>/access.json` | Anyone | see below — cache-skipped |

As of issue #396, the response shares the same `BaseAccessSerializer`-derived shape used by the
Character and Treasure access endpoints below. As of issue #433, `can_edit` is no longer part
of this shape — it moved to the dedicated `permissions.json` endpoint below (identity-only vs.
permission-only, see "Edit permission (`permissions.json`)" for the full rationale):

| Field | Type | Value |
|-------|------|-------|
| `username` | `str \| null` | The requesting user's username, or `null` if unauthenticated |
| `is_superuser` | `bool \| null` | Whether the requesting user is a Django superuser, or `null` if unauthenticated |
| `is_staff` | `bool \| null` | Whether the requesting user is Django staff, or `null` if unauthenticated |
| `is_dm` | `bool \| null` | Whether the requesting user is a GameMaster of this game, or `null` if unauthenticated |
| `is_player` | `bool \| null` | Whether the requesting user is linked to this game via `Player.games`, or `null` if unauthenticated (added in issue #410) |
| `is_owner` | `bool \| null` | Always `false` (never `null`, even when anonymous) — games have no ownership concept |

All fields are `null` for an anonymous caller, with one exception: `is_owner`
is always `false` rather than `null`, since games have no ownership concept to report on in the
first place.

**Note (issue #410):** `Player.games` is currently never written by any endpoint — only
touched in a model test — so `is_player` reads `false` for every real authenticated user until
a follow-up issue builds a flow to populate it.

### Edit permission (`permissions.json`, added in issue #433)

| Endpoint | Who can read | Response |
|----------|-------------|----------|
| `GET /games/<slug>/permissions.json` | Anyone | `{"can_edit": <bool>}` — see below for the cache contract |

Split out of `access.json` (issue #433) so a cacheable, identity-independent permission check
(driven by the `role` query parameter, see below) can be served separately from the
per-caller-identity fields that must always bypass the cache. See "The `role` query parameter"
under the Character section below for the full parameter contract, shared verbatim by all four
`permissions.json` endpoints (game, PC, NPC, treasure).

Without a `role` param, `can_edit` reflects the real requester's identity
(`Game.can_be_edited_by(request.user)`, unchanged from the old `access.json` behavior) and the
response sets `X-Skip-Cache: true`, exactly like `access.json`. With a `role` param, `can_edit`
is computed from the simulated role booleans via `Game.can_be_edited_by_roles(is_superuser,
is_dm)` instead, and the response sets `X-Force-Public-Cache: true` (see "Cache-bypass mechanism
for access endpoints" below) so it is cached in the public/anonymous tier regardless of the real
caller's own auth state.

---

## GamePhoto

Game photos are readable through the game detail endpoint (`photos` array in
`GameDetailSerializer`) and, as of issue #275, through a dedicated photo index endpoint.

**Exposed fields** (read): `id`, `path` — both visible to anyone who can read the game detail
or the photo index endpoint below. The `url` field was removed in issue #254 (it was dead —
never populated by the production upload flow). The `ready` field remains internal and is
never serialised or returned by `GamePhotoSerializer`. As of issue #275, `path` is serialised
directly by `GamePhotoSerializer` itself (`fields = ['id', 'path']`) — previously it was only
indirectly exposed via `Game.cover_photo_path` once a `GamePhoto` became a game's
`cover_photo` (see the "Game" section above); that indirect exposure still applies in addition
to the direct one.

**Write access:**
- `POST /games/<slug>/photo_upload.json` — GameMaster of that game, or superuser. Creates
  a `GamePhoto` row with `ready=False` as part of the upload initialisation flow (issue #160,
  see "Game photo upload init endpoint" below). The record is not yet visible in the game
  detail until the upload is finalised and `ready` is set to `True` (issue #161).
- All other write operations: superuser only (via Django admin, out of scope).

### Photo index endpoint

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/photos.json` | GET | Anyone (`AllowAny`, no authentication required) | Paginated list of `GamePhotoSerializer` objects (`id`, `path`) for photos where `ready=True` |

Added in issue #275. Unknown `game_slug` → 404. Not-ready photos (still mid-upload) are
excluded from the list. `Game` has no privacy/hidden concept, so this endpoint has no
additional visibility gate beyond the game itself existing.

---

## Upload

The `Upload` model tracks the lifecycle of a photo upload (pending → uploading → uploaded),
generically for a `GamePhoto`, a `CharacterPhoto` (issue #255), or, as of issue #276, a
`TreasurePhoto` — via a `GenericForeignKey` (`content_type`/`object_id`/`content_object`).

| Action | Who can |
|--------|---------|
| Create (`POST /games/<slug>/photo_upload.json`) | GameMaster of that game, or superuser |
| Create (`POST /games/<slug>/pcs/<id>/photo_upload.json`) | Player of that character, any GameMaster of that game, or superuser |
| Create (`POST /games/<slug>/npcs/<id>/photo_upload.json`) | Player of that character, any GameMaster of that game, any player of that game, or superuser (issue #429, `NpcPlayerEditPermission`) |
| Create (`POST /treasures/<id>/photo_upload.json`) | Superuser only |
| Read | Only the user who initiated the upload (indirectly, via the 201 response at creation time) |
| Update / Delete | No public endpoint; status transitions are handled internally |

**Exposed fields:**
- `id` (int) and `token` (secret string) — returned in the 201 response to the authenticated
  initiator only.
- `token` is a `secrets.token_urlsafe(32)` value and must never be exposed to any user
  other than the one who created the upload, or through any endpoint other than the
  init response.
- All other fields (`file_path`, `expiration_time`, `status`, `user`, `content_type`,
  `object_id`) are internal and are never returned by any endpoint.

**Side effect on finalisation:** `PATCH /uploads/<id>.json` with `status=uploaded` marks the
linked photo record as `ready=True` and, if its owner does not already have a primary photo,
sets that primary photo reference. The exact behavior dispatches on the upload's
`content_object` type:
- **`GamePhoto`** (issue #254): if the photo's game does not already have a `cover_photo`,
  sets `Game.cover_photo` to that photo. Gated by `GameEditPermission` (GameMaster of that
  game, or superuser).
- **`CharacterPhoto`** (issue #255): if the photo's character does not already have a
  `profile_photo`, sets `Character.profile_photo` to that photo. Gated by
  `CharacterEditPermission` (player of that character, any GameMaster of that game, or
  superuser) for a PC; for an NPC, gated by `NpcPlayerEditPermission` instead (issue #429) — the
  same `CharacterEditPermission` checks, OR any player of that game, per the `is_player`
  computation.
- **`TreasurePhoto`** (issue #276): unconditionally sets `Treasure.photo` to that photo — unlike
  the `GamePhoto`/`CharacterPhoto` cases, there is no "if unset" guard, since a treasure has at
  most one photo and re-uploading always replaces it. Gated by `TreasureEditPermission`
  (superuser only) for a global treasure, or `GameEditPermission` (that game's GameMaster, or
  superuser) when the treasure is exclusive to a game (issue #296) — see the "Treasure photo
  upload init endpoint" section below.

All three cases reuse the same checks already enforced earlier in the same request (upload
token match, requesting user must be the upload's owner) — no new authorization path is
introduced; only the object-level permission class differs, chosen based on the
`content_object`'s type.

---

## Game photo upload init endpoint

| Endpoint | Method | Who can call | Response fields |
|----------|--------|-------------|-----------------|
| `/games/<slug>/photo_upload.json` | POST | GameMaster of that game, or superuser | `upload_id`, `token`, `game_id` |

- Unauthenticated → 401. Authenticated but not a GameMaster or superuser → 403.
- Unknown `game_slug` → 404.
- Missing or invalid `filename` body field → 400.

---

## Character photo upload init endpoints

| Endpoint | Method | Who can call | Response fields |
|----------|--------|-------------|-----------------|
| `/games/<slug>/pcs/<id>/photo_upload.json` | POST | Player of that character, any GameMaster of that game, or superuser | `upload_id`, `token`, `character_id` |
| `/games/<slug>/npcs/<id>/photo_upload.json` | POST | Player of that character, any GameMaster of that game, any player of that game, or superuser | `upload_id`, `token`, `character_id` |

Added in issue #255, mirroring the game photo upload init endpoint above but scoped to a
single character and gated by `CharacterEditPermission` instead of `GameEditPermission`. As of
issue #429, the NPC row is instead gated by `NpcPlayerEditPermission` — the same
`CharacterEditPermission` checks, OR any player of the game (per the `is_player` computation) —
broadening the NPC init endpoint beyond editors alone; the PC row is unaffected and stays
`CharacterEditPermission`-only.

- Unauthenticated → 401. Authenticated but not the character's player, a GameMaster of its
  game, a player of the game (NPC only, issue #429), or a superuser → 403.
- Unknown `game_slug` or `character_id` (or a `character_id` that does not belong to
  `game_slug`, or is the wrong PC/NPC type for the endpoint) → 404.
- Missing or invalid `filename` body field → 400.
- Creates a `CharacterPhoto` row with `ready=False` as part of the upload initialisation
  flow; the record is not visible in the character detail's `photos` list, and cannot become
  `profile_photo`, until the upload is finalised and `ready` is set to `True`.

---

## Character slain fields — write path history

Added in issue #315 as a single shared field; split into independent `slain`/`public_slain`
real/public fields in issue #397 (see "Slain fields" below for the full real/public split,
mirroring the `allegiance`/`public_allegiance` split). Issue #397 also introduced a dedicated
`PATCH /games/<slug>/npcs/<id>/slain.json` action endpoint (gated by a `CharacterEditPermission`-
checked `CharacterSlainUpdateSerializer`) as their only write path at the time, since neither
field was part of `CharacterUpdateSerializer` yet.

Issue #425/#426 removed that dedicated endpoint and its serializer, adding `slain` and
`public_slain` directly to `CharacterUpdateSerializer`'s field list instead — see "Slain fields"
below for the current write-access rules, which now mirror `allegiance`/`public_allegiance`
exactly (including the PC-facing write path this unlocked). Issue #428 subsequently moved that
write path's URL from the plain detail endpoints to the full-detail endpoints, along with every
other `CharacterUpdateSerializer` field — see "Update (PATCH)" below.

Issue #416 then reintroduced a narrow `PATCH` on the plain NPC detail endpoint
(`PATCH /games/<slug>/npcs/<id>.json`) — but unlike the pre-#425 endpoint this is
NPC-`public_slain`-only, gated by the new, generic `NpcPlayerEditPermission` (a player of the
game, per the `is_player` computation, OR the existing `CharacterEditPermission`), and uses a
new minimal `NpcSlainUpdateSerializer` (`slain` → `public_slain` only). The PC plain detail
endpoint is untouched by #416 and stays `GET`-only. See "Update (PATCH)" below for the current
combined picture across both plain and full-detail endpoints.

---

## Treasure photo upload init endpoint

| Endpoint | Method | Who can call | Response fields |
|----------|--------|-------------|-----------------|
| `/treasures/<id>/photo_upload.json` | POST | Superuser always; additionally that treasure's owning game's GameMaster, when `treasure.game_id` is set | `upload_id`, `token`, `treasure_id` |

Added in issue #276, mirroring the game/character photo upload init endpoints above and using a
fixed, deterministic storage path (`photos/treasures/<id>/photo.<ext>`, no random UUID) since a
treasure has at most one photo. As of issue #296, the permission check is DM-aware: if
`treasure.game_id` is set, the check delegates to `GameEditPermission` against that game
instead of the plain superuser-only `TreasureEditPermission`, so the owning game's GameMaster
can also initiate an upload for a game-exclusive treasure; a global treasure (`game_id` is
`None`) still requires a superuser.

- Unauthenticated → 401. Authenticated non-superuser → 403.
- Unknown `treasure_id` → 404.
- Missing or invalid `filename` body field → 400.
- If the treasure already has a `photo` (`treasure.photo_id` is set), the existing
  `TreasurePhoto` row is reused: its `path` is updated and `ready` is reset to `False`, rather
  than creating a second row. Otherwise a new `TreasurePhoto` row is created with `ready=False`.
  Either way, the photo is not visible via `photo_path`, and does not become `Treasure.photo`,
  until the upload is finalised and `ready` is set to `True` (see the "Upload" section above).

---

## Character (PC and NPC)

Characters are scoped to a game. Access is symmetric for PCs and NPCs unless noted.

### List

| Endpoint | Who can read | Fields returned |
|----------|-------------|-----------------|
| `GET /games/<slug>/pcs.json` | Anyone | `id`, `name`, `game_slug`, `profile_photo_path`, `slain`, `allegiance` |
| `GET /games/<slug>/npcs.json` | Anyone | `id`, `name`, `game_slug`, `profile_photo_path`, `slain`, `allegiance` |
| `GET /games/<slug>/npcs/all.json` | That game's GameMaster, or superuser (`GameEditPermission`) | Same as `npcs.json` (via `CharacterFullListSerializer`), plus `public_allegiance` and `public_slain` — see "Allegiance fields" and "Slain fields" below for how `allegiance`/`slain` differ here from the public list. Includes hidden NPCs, unlike `npcs.json`. Response always sets `X-Skip-Cache: true` |

This endpoint predates issue #360 (it already existed to reveal hidden NPCs to DMs) but had no
dedicated documentation row until now — it was previously only referenced indirectly from the
"Treasure" section's `treasures/all.json` entry, which was modeled after it.

### Detail

| Endpoint | Who can read | Fields returned |
|----------|-------------|-----------------|
| `GET /games/<slug>/pcs/<id>.json` | Anyone | `id`, `name`, `role`, `public_description`, `is_pc`, `photos`, `links`, `game_slug`, `can_edit`, `profile_photo_path`, `profile_photo_id`, `money`, `slain`, `allegiance` |
| `GET /games/<slug>/npcs/<id>.json` | Anyone | same as above |

`profile_photo_path` (added in issue #255) is `character.profile_photo.path` — same
`<model>.<photo-field>.path`-or-`null` convention as `Game.cover_photo_path` above, but for
the `CharacterPhoto` selected as the character's profile photo (see "CharacterPhoto" and
"Upload" below). Returned on the list, detail, and full-detail endpoints, to anyone.

`slain` (added in issue #315; split into real/public fields in issue #397) is a
`BooleanField` (default `False`) shared by the `Character` model for both PCs and NPCs, and
is returned read-only on the list and detail endpoints to anyone — on those public endpoints
the `slain` JSON key is sourced from the `public_slain` model field (see "Slain fields"
below). Like `hidden`/`money`, it is writable through `CharacterUpdateSerializer` — see the
"Slain fields" subsection below for its write-access rules.

### Full detail (includes `private_description`)

| Endpoint | Who can read/write | Fields returned |
|----------|-------------|-----------------|
| `GET /games/<slug>/pcs/<id>/full.json` | Player of this character, any GameMaster of this game, or superuser | All detail fields + `private_description` + `public_allegiance` + `public_slain` (see "Allegiance fields" and "Slain fields" below) |
| `GET /games/<slug>/npcs/<id>/full.json` | Player of this character, any GameMaster of this game, or superuser | Same as above |
| `PATCH /games/<slug>/pcs/<id>/full.json` | Player of this character, any GameMaster of this game, or superuser | Same response shape as the `GET` above |
| `PATCH /games/<slug>/npcs/<id>/full.json` | Player of this character, any GameMaster of this game, or superuser | Same as above |

Anonymous or insufficiently privileged authenticated users receive **401** or **403**.

As of issue #428, the character update action lives here rather than on the plain detail
endpoints below — see "Update (PATCH)" for the write-field/error-status contract, which is
unchanged, only the URL moved. The response always sets `X-Skip-Cache: true`, on both `GET`
and `PATCH`.

### Allegiance fields (added in issue #360)

`Character` has two independent `CharField(choices=...)` fields, both defaulting to
`'neutral'`, with allowed values `'ally'`, `'enemy'`, `'neutral'`:

- `allegiance` — the character's real disposition, visible only to a DM/superuser.
- `public_allegiance` — the disposition shown to regular players.

**Read exposure** — the JSON key `allegiance` means something different depending on the
endpoint, by design (it lets the frontend always read a single `character.allegiance` key
regardless of which endpoint served the payload):

- On the public list/detail endpoints (`pcs.json`, `npcs.json`, `pcs/<id>.json`,
  `npcs/<id>.json`), the `allegiance` JSON key is sourced from the `public_allegiance` model
  field — the real `allegiance` model field is never exposed there.
- On the DM/admin endpoints (`npcs/all.json`, `pcs/<id>/full.json`, `npcs/<id>/full.json`),
  `allegiance` is sourced from the real `allegiance` model field, and `public_allegiance` is
  additionally exposed under its own key with the public-facing value.

This applies uniformly to both PCs and NPCs (shared `Character` model/serializers), even
though the fields are only meaningfully written for NPCs in practice — the same precedent as
`slain` (see above): a PC's `allegiance`/`public_allegiance` stay at the `'neutral'` default
since no PC write path ever sets them.

**Write access**: both fields were added to the shared `CharacterUpdateSerializer`
(`CharacterEditPermission`-gated), so — like the pre-existing `hidden`/`private_description`/
`money` fields on that same serializer — they are technically writable through **either**
`PATCH /games/<slug>/pcs/<id>/full.json` or `PATCH /games/<slug>/npcs/<id>/full.json` (moved
from the plain detail endpoints in issue #428): the character's
own player, any GameMaster of that game, or a superuser. Since NPCs have no player owner by
product definition (see `docs/agents/product.md`), this is DM/superuser-only in practice for
NPCs, matching the issue's intent; a PC's own player can technically set their own PC's
`allegiance`/`public_allegiance` too (same as they already can for `hidden`/`money`), though in
practice nothing in the product currently reads or displays a PC's allegiance. Both fields are
also writable at create time (added in issue #387) via `CharacterCreateSerializer`
(`POST /games/<slug>/npcs.json`, `GameEditPermission`-gated — DM/superuser only, since NPC
creation has no player-accessible path); both remain optional and default to `'neutral'` via
the model default when omitted.

**Filtering**: `npcs.json` and `npcs/all.json` accept an optional `?allegiance=` query
parameter (`ally`/`enemy`/`neutral`; any other value is silently ignored, same tolerant
convention as `?slain=`). `npcs.json` filters on `public_allegiance`; `npcs/all.json` filters
on the real `allegiance` field — each endpoint filters on the same underlying field it exposes
under the `allegiance` key, so the query param never lets an unauthorized caller filter on data
it cannot otherwise read.

### Slain fields (real/public split added in issue #397)

`Character` has two independent `BooleanField`s (both defaulting to `False`), following the
same real/public pattern as `allegiance`/`public_allegiance` above:

- `slain` — the character's real death state, visible only to a DM/superuser.
- `public_slain` — the death state shown to regular players.

Both fields were added in issue #315 as a single shared field and split into this real/public
pair in issue #397; the migration that introduced `public_slain` backfilled it from each
existing row's `slain` value (rather than leaving it at the `False` default), so pre-existing
NPCs' public and real death state started out identical.

**Read exposure** — like `allegiance`, the JSON key `slain` means something different
depending on the endpoint:

- On the public list/detail endpoints (`pcs.json`, `npcs.json`, `pcs/<id>.json`,
  `npcs/<id>.json`), the `slain` JSON key is sourced from the `public_slain` model field — the
  real `slain` model field is never exposed there.
- On the DM/admin endpoints (`npcs/all.json`, `pcs/<id>/full.json`, `npcs/<id>/full.json`),
  `slain` is sourced from the real `slain` model field, and `public_slain` is additionally
  exposed under its own key with the public-facing value.

**Write access**: like `allegiance`/`public_allegiance`, both `slain` and `public_slain` are
fields on the shared `CharacterUpdateSerializer` (`CharacterEditPermission`-gated, added in
issue #425/#426), so they are writable through **either**
`PATCH /games/<slug>/pcs/<id>/full.json` or `PATCH /games/<slug>/npcs/<id>/full.json` (moved
from the plain detail endpoints in issue #428): the character's own player, any GameMaster of
that game, or a superuser. Since NPCs have no player owner by product definition (see
`docs/agents/product.md`), this is DM/superuser-only in practice for NPCs via `full.json`; a
PC's own player can PATCH their own PC's `slain`/`public_slain` too (same as they already can
for `allegiance`/`public_allegiance`, `hidden`/`money`).

Additionally, as of issue #416, `public_slain` alone (not `slain`) is writable for NPCs through
a second, much narrower path: `PATCH /games/<slug>/npcs/<id>.json` (the plain NPC detail
endpoint), gated by `NpcPlayerEditPermission` instead of `CharacterEditPermission` — open to any
player of the game, not just editors — see "Narrow NPC slain-toggle PATCH (issue #416)" under
"Update (PATCH)" below for the full contract. This does not apply to PCs.

**Filtering**: `npcs.json` filters `?slain=` on `public_slain`; `npcs/all.json` filters
`?slain=` on the real `slain` field — same tolerant/unauthorized-safe convention as the
`?allegiance=` filter above.

### Edit access status

| Endpoint | Who can read | Response |
|----------|-------------|----------|
| `GET /games/<slug>/pcs/<id>/access.json` | Anyone | see below — cache-skipped |
| `GET /games/<slug>/npcs/<id>/access.json` | Anyone | see below — cache-skipped |

As of issue #396, both endpoints share the same `BaseAccessSerializer`-derived response shape
used by every `access.json` endpoint (game and treasure, see their respective "Edit access
status" sections). As of issue #433, `can_edit` is no longer part of this shape — it moved to
the dedicated `permissions.json` endpoints below:

| Field | Type | Value |
|-------|------|-------|
| `username` | `str \| null` | The requesting user's username, or `null` if unauthenticated |
| `is_superuser` | `bool \| null` | Whether the requesting user is a Django superuser, or `null` if unauthenticated |
| `is_staff` | `bool \| null` | Whether the requesting user is Django staff, or `null` if unauthenticated |
| `is_dm` | `bool \| null` | Whether the requesting user is a GameMaster of this character's game, or `null` if unauthenticated |
| `is_player` | `bool \| null` | Whether the requesting user is linked to this character's game via `Player.games`, or `null` if unauthenticated (added in issue #410; see the "Note" under the Game section above — currently always `false` in practice, since nothing populates `Player.games` yet) |
| `is_owner` | `bool \| null` | **PC**: a real boolean — `character.player.user_id == requesting_user.id` — or `null` if unauthenticated. **NPC**: always `false` (never `null`, even when anonymous), since NPCs have no player-ownership concept |

All fields are `null` for an anonymous caller, with one exception: on the NPC
endpoint, `is_owner` is always `false` rather than `null`, since NPCs have no ownership concept
to report on in the first place (the PC endpoint's `is_owner`, by contrast, does follow the
general null-when-anonymous rule, since it reports real per-user ownership).

#### Edit permission (`permissions.json`, added in issue #433)

| Endpoint | Who can read | Response |
|----------|-------------|----------|
| `GET /games/<slug>/pcs/<id>/permissions.json` | Anyone | `{"can_edit": <bool>}` — see below for the cache contract |
| `GET /games/<slug>/npcs/<id>/permissions.json` | Anyone | Same as above |

Split out of `access.json` (issue #433): identity (`is_dm`/`is_owner`/etc., always tied to the
real requester and always cache-skipped) and permission (`can_edit`, optionally
role-simulated and cacheable) are different enough concerns — with different cache
contracts — to warrant separate endpoints, both backed by the shared
`Character.can_be_edited_by`/`can_be_edited_by_roles` pair (see "Edit rights logic" below).
Both PC and NPC routes share one `CharacterPermissionsSerializer` — `is_owner`
(and therefore the `owner` role) only ever affects the result for a PC (`character.is_pc`);
it is always a no-op for an NPC, matching `is_owner`'s no-ownership-concept treatment on the
identity side above.

Without a `role` param, `can_edit` reflects the real requester's identity
(`Character.can_be_edited_by(request.user)`, unchanged from the old `access.json` behavior) and
the response sets `X-Skip-Cache: true`, exactly like `access.json`. With a `role` param,
`can_edit` is computed from the simulated role booleans via
`Character.can_be_edited_by_roles(is_superuser, is_dm, is_owner)` instead, and the response sets
`X-Force-Public-Cache: true` instead (see "Cache-bypass mechanism for access endpoints" below)
so it is cached in the public/anonymous tier regardless of the real caller's own auth state.

#### The `role` query parameter (added in issue #433)

Shared verbatim by all four `permissions.json` endpoints (game, PC, NPC, treasure) — parsed by
`parse_role_booleans` in `source/games/views/common.py`. Accepts zero, one, or repeated
`?role=` values (e.g. `?role=dm`, `?role=dm&role=owner`):

- **No `role` param at all** → `None`: the endpoint falls back to computing `can_edit` from the
  real requester's identity (`request.user`), and the response is cache-skipped
  (`X-Skip-Cache: true`) — identical to `access.json`'s existing per-caller behavior.
- **`role` present at least once** → the real requester's identity is ignored entirely; instead
  three booleans are derived from the given value(s) and passed to that resource's
  `can_be_edited_by_roles(...)`:
  - `dm` → `is_dm = True`
  - `superuser` → `is_superuser = True`
  - `owner` → `is_owner = True` (only ever consulted by the Character/PC endpoints; a no-op
    everywhere else — Game, NPC, and Treasure have no ownership concept)
  - `player`, `staff` → recognized but always no-ops: neither ever appears in any
    `can_be_edited_by_roles` signature, per product-owner review — included only so a caller
    can pass every role name it knows about without triggering an "unrecognized value" branch
  - any other value → silently ignored (same tolerant, no-400-on-a-typo convention as
    `?allegiance=`/`?slain=` elsewhere in this codebase) — but note this does **not** fall back
    to the real-identity path: a `role` param containing only unrecognized/no-op values still
    computes `can_edit` with every boolean `False`, it simply never evaluates true
  - Repeated/combined values (e.g. `?role=dm&role=owner`) simultaneously set every boolean
    they correspond to — the resource's own rule (e.g. `is_superuser or is_dm`) then decides the
    result, exactly as it would for two real roles held by the same live user
- Whenever a `role` param is present (recognized or not), the response sets
  `X-Force-Public-Cache: true` instead of `X-Skip-Cache: true` — the result no longer depends on
  the real caller's identity, so it is safe (and necessary, for UI-preview use cases like
  showing an anonymous visitor what a DM would see) to cache in the public tier.

#### Cache-bypass mechanism for access endpoints

Access endpoints return user-specific data (identity fields reflect the requesting user), so caching them across users would serve stale or incorrect values. `permissions.json`'s real-identity path (no `role` param) carries the same requirement, since `can_edit` there is also tied to the real caller. Three layers enforce cache-bypass/cache-correctness:

1. **Backend response header (real-identity path)** — every `access.json` view, and every
   `permissions.json` view when no `role` param is given, sets `X-Skip-Cache: true` on the
   response. This prevents Tent from caching new responses.
2. **Backend response header (role-simulated path)** — a `permissions.json` view, when a `role`
   param **is** given, instead sets `X-Force-Public-Cache: true` (added in issue #433). This
   tells `CacheControlMiddleware` (`source/games/middleware.py`) to always apply the
   public/anonymous `Cache-Control` tier, overriding what it would otherwise choose based on the
   real requester's own `is_authenticated` state — necessary because a role-simulated result is
   identity-independent by construction, even when the actual caller happens to be logged in.
3. **Frontend request header** — `BaseClient.request` in `frontend/assets/js/client/BaseClient.js` inspects every request path against two centralized config files before calling `fetch`:
   - `frontend/assets/js/client/config/skipCacheEndpoints.js` — a `Set` of exact static paths (authentication endpoints).
   - `frontend/assets/js/client/config/skipCacheSuffixes.js` — a `Set` of path suffixes (e.g. `'/access.json'`). Any request whose path ends with a listed suffix automatically receives `X-Skip-Cache: 1`, bypassing the Tent cache read.

**Rule for future access-type endpoints:** if you add a new endpoint whose response depends on the requesting user's identity or permissions, add its path suffix (or exact path) to the appropriate config file. Access endpoints use the suffix approach because their paths are dynamic (contain `<slug>` and `<id>`). A role-simulated, identity-independent endpoint (like `permissions.json` with a `role` param) does not need this frontend bypass at all — its whole point is to be cacheable.

### Update (PATCH)

As of issue #428, the general character update action lives on the full-detail endpoints, not
here:

| Endpoint | Who can write |
|----------|--------------|
| `PATCH /games/<slug>/pcs/<id>/full.json` | Player of this character, any GameMaster of this game, or superuser |
| `PATCH /games/<slug>/npcs/<id>/full.json` | Player of this character, any GameMaster of this game, or superuser |

`PATCH /games/<slug>/pcs/<id>.json` (the plain PC detail endpoint documented under "Detail"
above) does not accept `PATCH` — only `GET` remains on that route, unchanged since #428.

Unauthenticated → 401. Authenticated but not an editor → 403.

**Write fields** (via `CharacterUpdateSerializer`, added in issue #392): in addition to the
scalar fields listed under "Create" below (`name`, `role`, `public_description`,
`private_description`, `hidden`, `money`, `allegiance`, `public_allegiance`, all optional here
too), a nested `links` array is accepted — see "CharacterLink" below for the full write
semantics (create/update/delete per entry, `id` ownership check).

#### Narrow NPC slain-toggle PATCH (issue #416)

`PATCH /games/<slug>/npcs/<id>.json` (the plain NPC detail endpoint) accepts `PATCH` again,
but only for a single, narrow purpose: toggling the NPC's player-facing `public_slain` state.

| Endpoint | Who can write | Body | Effect |
|----------|--------------|------|--------|
| `PATCH /games/<slug>/npcs/<id>.json` | A player of the game (per the `is_player` computation: `game.players.filter(user=user).exists()`), OR the existing `CharacterEditPermission` (this character's owning player — moot for NPCs —, any GameMaster of this game, or superuser) | `{"slain": true \| false}` only — any other key is silently ignored | Writes `Character.public_slain`; the real `slain` field is untouched and stays `full.json`-only |

Gated by the new, generic `NpcPlayerEditPermission` (`source/games/permissions.py`) rather than
`CharacterEditPermission` alone — the same class is reused as-is by the NPC photo-upload
endpoints (issue #429). Validated by the new `NpcSlainUpdateSerializer`
(`source/games/serializers/npc_slain_update.py`), a `ModelSerializer` with a single
`slain = BooleanField(source='public_slain')` field.

The hidden-NPC gate (see "Detail" above) still applies: a hidden NPC returns 404 to a caller
who is not an editor, same as `GET`. Unauthenticated → 401. Authenticated but neither a player
of the game nor an editor → 403. Success response: `200` with the same
`CharacterDetailSerializer` body `GET` returns on this route, with `X-Skip-Cache: true`. This
is additive only — the PC plain endpoint stays `GET`-only, and the DM-facing edit
form/slain-toggle keep using `full.json`.

### Create

| Endpoint | Who can write |
|----------|--------------|
| `POST /games/<slug>/npcs.json` | GameMaster of that game, or superuser — unauthenticated → 401, authenticated non-editor → 403 |

There is no equivalent PC creation endpoint — issue #307 scoped NPC creation only.

**Write fields**: `name` (required), `role`, `public_description`, `private_description`, `hidden`,
`money`, `allegiance`, `public_allegiance` (all optional except `name`; `allegiance`/
`public_allegiance` added in issue #387 — see "Allegiance fields" above), and `links` (optional
array, added in issue #392 — see "CharacterLink" below for write semantics). `game` and `npc` are
never accepted from the request payload — `game` is always assigned server-side from the
`<slug>` URL segment, and `npc` is always forced to `True`. `player` is not accepted at all —
NPCs created this way have no player.

**Create response:** HTTP 201 with `CharacterDetailSerializer` body (same fields documented
under "Detail" above) — note it does not include `private_description`, even though the create
serializer accepts it as input, mirroring the existing PATCH behavior where
`CharacterUpdateSerializer` is the input and `CharacterDetailSerializer` is the output.

### Edit rights logic

`Character.can_be_edited_by(user)` returns `True` when:

1. `user.is_superuser` is `True`, OR
2. The user is the character's linked `Player` user (`player.user == user`), OR
3. The user has a `GameMaster` row for the same game as the character.

---

## GameMaster

| Action | Who can |
|--------|---------|
| List (`GET /games/<slug>/game-masters.json`) | Anyone |
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

Introduced by issue #286. Unlike `Player`, the Django `User` model is exposed directly,
but only to Staff/Superuser accounts (`user.is_staff or user.is_superuser`) — never
publicly. All endpoints below require `CookieTokenAuthentication`; unauthenticated callers
get 401, authenticated non-staff/non-superuser callers get 403 (enforced inline via
`require_staff` in `source/games/views/common.py`, matching the `treasures_list.py`
convention of enforcing auth inline rather than through DRF permission classes). All GET
and write responses set `X-Skip-Cache: true` since the data is per-caller-authorization
sensitive and must never be served from the Tent proxy cache.

| Action | Who can |
|--------|---------|
| List (`GET /staff/users.json`) | Staff or Superuser only |
| Detail (`GET /staff/users/<id>.json`) | Staff or Superuser only |
| Update name/email (`PATCH /staff/users/<id>.json`) | Staff or Superuser only |
| Generate/reuse recovery link (`POST /staff/users/<id>/recovery-link.json`) | Staff or Superuser only |

**Exposed fields** (list and detail): `id`, `name` (Django `username`), `email`. No other
`User` field (password, `is_staff`, `is_superuser`, `is_active`, etc.) is ever serialized.

**Update rules**: only `name` and `email` may be changed; both are validated for
uniqueness against other `User` rows (the underlying `username` field is unique at the DB
level, `email` is not, so uniqueness is enforced in `StaffUserUpdateSerializer`). No
endpoint exists to create a user, delete a user, change a password directly, or toggle
`is_staff`/`is_superuser`/`is_active`.

**Recovery-link endpoint**: reuses a valid (unexpired, unused) `PasswordResetToken` for the
target user if one exists, otherwise creates a new one (`get_or_create_recovery_token` in
`source/games/views/password_reset/_shared.py`), and returns its URL directly in the
response body. Unlike `/users/recover.json`, it never sends an email — the URL is meant to
be shared by staff directly with the user out-of-band.

---

## CharacterPhoto

Character photos are readable through the character detail endpoints (`photos` array in
`CharacterDetailSerializer` and, by inheritance, `CharacterFullSerializer`) and, as of issue
#275, through dedicated photo index endpoints (one for PCs, one for NPCs). As of issue
#255, `CharacterPhoto` fully replaces the legacy `Photo` model (which only had a bare `url`
field and no upload/ready lifecycle) — serving both the character's photo gallery
(`character.photos`) and, via `Character.profile_photo`, its profile picture.

**Exposed fields** (read): `id`, `path` — both visible to anyone who can read the character
detail or photo index endpoint (i.e. anyone, since PC detail/index endpoints are publicly
accessible, and NPC detail/index endpoints are publicly accessible for non-hidden NPCs — see
"Photo index endpoints" below). The `ready` field is internal and never serialised by
`CharacterPhotoSerializer`. As with `GamePhoto` above, `path` is exposed both directly by
`CharacterPhotoSerializer` (`fields = ['id', 'path']`, added in issue #275) and indirectly
via `Character.profile_photo_path` once a `CharacterPhoto` becomes a character's
`profile_photo` — both apply simultaneously.

**Write access:**
- `POST /games/<slug>/pcs/<id>/photo_upload.json`, `POST /games/<slug>/npcs/<id>/photo_upload.json` —
  player of that character, any GameMaster of that game, or superuser. Creates a
  `CharacterPhoto` row with `ready=False` as part of the upload initialisation flow (see
  "Character photo upload init endpoints" above).
- All other write operations: superuser only (via Django admin, out of scope).

### Photo index endpoints

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/pcs/<id>/photos.json` | GET | Anyone (`AllowAny`, no authentication required) | Paginated list of `CharacterPhotoSerializer` objects (`id`, `path`) for photos where `ready=True` |
| `/games/<slug>/npcs/<id>/photos.json` | GET | Anyone (`AllowAny`), but see hidden-NPC gate below | Paginated list of `CharacterPhotoSerializer` objects (`id`, `path`) for photos where `ready=True` |

Added in issue #275. Unknown `game_slug` or `character_id` (or a `character_id` that does not
belong to `game_slug`, or is the wrong PC/NPC type for the endpoint) → 404. Not-ready photos
(still mid-upload) are excluded from the list.

For `game_npc_photos`, the same hidden-NPC visibility gate used by the NPC detail and list
endpoints applies: if `character.hidden` is `True` and the requesting user cannot edit the
character (`not character.can_be_edited_by(request.user)`), the endpoint raises `Http404`
instead of returning the photo list — hidden NPCs' photos are invisible to anonymous or
non-editor requests, only visible to the character's player, a GameMaster of that game, or a
superuser. `PC` characters have no `hidden` concept, so `game_pc_photos` has no equivalent
gate.

---

## CharacterTreasure

Added in issue #297. `CharacterTreasure` is a through model linking `Character` to
`Treasure`, with its own `quantity` (non-negative integer, default `0`) — the first
through-model-with-an-extra-field in the codebase (the pre-existing `Game`↔`Treasure`
relationship is a bare M2M with no through model or extra fields). It is read-only through
two dedicated index endpoints (one for PCs, one for NPCs), mirroring the `CharacterPhoto`
index endpoints above, plus (as of issue #312) four acquire/sell mutation endpoints scoped
to the owning player/GameMaster/superuser. There is no direct create/update/delete endpoint
for a `CharacterTreasure` row itself (e.g. no way to set an arbitrary `quantity` directly) —
only the atomic acquire/sell operations below, plus Django admin for superusers.

### Treasure index endpoints

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/pcs/<id>/treasures.json` | GET | Anyone (`AllowAny`, no authentication required) | Paginated list of `CharacterTreasureSerializer` objects (`id`, `treasure_id`, `name`, `quantity`, `value`, `photo_path`) for that PC's `CharacterTreasure` rows with `quantity > 0` |
| `/games/<slug>/npcs/<id>/treasures.json` | GET | Anyone (`AllowAny`), but see hidden-NPC gate below | Paginated list of `CharacterTreasureSerializer` objects (`id`, `treasure_id`, `name`, `quantity`, `value`, `photo_path`) for that NPC's `CharacterTreasure` rows with `quantity > 0` |

Unknown `game_slug` or `character_id` (or a `character_id` that does not belong to
`game_slug`, or is the wrong PC/NPC type for the endpoint) → 404. As of issue #312, both
endpoints filter to `quantity__gt=0` — rows zeroed out by selling all owned units are kept
in the database (to preserve history and avoid re-creating the row from scratch on
re-acquisition) but never listed.

For `game_npc_treasures`, the same hidden-NPC visibility gate used by the NPC detail,
list, and photo index endpoints applies: if `character.hidden` is `True` and the
requesting user cannot edit the character (`not character.can_be_edited_by(request.user)`),
the endpoint raises `Http404` instead of returning the treasure list — hidden NPCs'
treasures are invisible to anonymous or non-editor requests, only visible to the
character's player, a GameMaster of that game, or a superuser. `PC` characters have no
`hidden` concept, so `game_pc_treasures` has no equivalent gate.

**Exposed fields** (read): `id` (the `CharacterTreasure` row id, not the `Treasure` id),
`treasure_id` (the underlying `Treasure`'s id, added in issue #312), `name`, `value`, and
`photo_path` (sourced from the related `Treasure`; `photo_path` is nullable, `None` when
the treasure has no photo), `quantity` (the through model's own field) — all non-sensitive
and safe to return to anonymous callers under the same visibility rules as the endpoints
above. `treasure_id` and `photo_path` are not new information disclosures: both are already
publicly exposed for the same `Treasure` via `/treasures.json`, `/treasures/<id>.json`, and
`/games/<slug>/treasures.json`.

### Treasure acquire/sell endpoints (added in issue #312)

| Endpoint | Method | Who can call | Effect |
|----------|--------|-------------|--------|
| `/games/<slug>/pcs/<character_id>/treasures/acquire.json` | POST | The character's owning player, a GameMaster of the game, or a superuser (`CharacterEditPermission`) | Spends `quantity * treasure.value` from `character.money` to add `quantity` of `treasure_id` to the character's owned treasures |
| `/games/<slug>/pcs/<character_id>/treasures/sell.json` | POST | Same as above | Removes `quantity` of `treasure_id` from the character's owned treasures, refunding `quantity * treasure.value` into `character.money` |
| `/games/<slug>/npcs/<character_id>/treasures/acquire.json` | POST | Same as above | Same as the PC acquire endpoint, for an NPC |
| `/games/<slug>/npcs/<character_id>/treasures/sell.json` | POST | Same as above | Same as the PC sell endpoint, for an NPC |

Request body: `{"treasure_id": <int>, "quantity": <int, >= 1>}`. Success (200) for sell:
`{"quantity": <new owned quantity>, "money": <new character.money>}`. Success (200) for
acquire: same two fields plus `acquired` (added in issue #314) — the number of units actually
acquired in this request, which may be less than the requested `quantity` when the treasure is
M2M-linked to the game with a stock cap and fewer units than requested are available (partial
fulfillment — see "GameTreasure" below; this is never a 400, even when `acquired` is `0`).
Failure: 401 (unauthenticated), 403 (authenticated but not the owning player/GameMaster/superuser),
404 (`treasure_id` does not resolve to a treasure available in this game — scoped via the same
`Q(linked_game=game) | Q(game=game)` filter used by the game treasure list — or, for sell,
no owned `CharacterTreasure` row exists for that treasure), 400
(`{"errors": {"quantity": ["insufficient funds"]}}` on acquire when
`acquired * treasure.value > character.money` — note this is checked against the capped
`acquired` amount, not the originally requested `quantity`, or
`{"errors": {"quantity": ["not enough owned"]}}` on sell when `quantity` exceeds the
currently owned amount). Both operations run inside `transaction.atomic()` and never delete
the `CharacterTreasure` row, even when a full sell brings `quantity` to `0`.

These endpoints do not re-apply the hidden-NPC `Http404` gate before the permission check
(unlike `game_npc_treasures`'s read endpoint) — a hidden NPC's existence is confirmed via
401/403 rather than masked behind a 404. This mirrors the pre-existing, already-accepted
convention used by the NPC full-detail endpoint (`PATCH /games/<slug>/npcs/<id>/full.json`,
see "Full detail" above), which is also `CharacterEditPermission`-gated with no
hidden-existence masking.

**Write access:** the four acquire/sell endpoints above (added in issue #312), gated by
`CharacterEditPermission`. There is otherwise no direct create/update/delete endpoint for a
`CharacterTreasure` row — remaining management (e.g. correcting a row outside the normal
acquire/sell flow) is superuser-only, via Django admin.

### `max_value` filter on the game treasure list (added in issue #312)

`/games/<slug>/treasures.json` (GET, `AllowAny`, documented under "Treasure" above) accepts
an optional `max_value` query parameter (integer, copper pieces). When present, the
queryset is additionally filtered to `value__lte=max_value`; a missing or non-numeric value
is silently ignored (treated as absent), since this is a browsing/UX convenience filter, not
a validated write. It exposes no additional data — it only narrows the same publicly
readable list.

---

## GameTreasure

Added in issue #314. `GameTreasure` is the `through` model backing `Game.treasures` (the
shared many-to-many relationship between `Game` and `Treasure` — distinct from, and
independent of, the separate "exclusive" `Treasure.game` FK documented under "Treasure"
above, which has no stock-cap concept). It carries a per-`(game, treasure)` stock cap: a
nullable `max_units` (unlimited when `null`) and an internal `acquired_units` bookkeeping
counter (starts at `0`), from which a derived `available_units = max(max_units -
acquired_units, 0)` (or `null` when `max_units` is `null`) is computed. There is no dedicated
CRUD endpoint for `GameTreasure` itself — it is only ever read/written indirectly, through the
`Treasure` endpoints below.

| Action | Who can |
|--------|---------|
| Read `available_units`/`max_units` | Anyone, via the game-scoped `Treasure` read endpoints — see "Treasure" above |
| Write `max_units` | That game's GameMaster, or superuser — via `PATCH /games/<slug>/treasures/<int:treasure_id>.json` when the treasure is M2M-linked to the game (see "Update by game" under "Treasure" above) |
| Write `acquired_units` | Never directly by any client — only ever incremented/decremented as a side effect of the acquire/sell endpoints below |
| Create/Delete the `(game, treasure)` link itself | Superuser only, via Django admin's `GameTreasureInline` on the `Game` admin page (out of scope — there is no application-level endpoint that creates this M2M link) |

**Exposed fields** (read, as `available_units`/`max_units` on `TreasureListSerializer`/
`TreasureDetailSerializer`): see "Treasure" above for the full exposure rules (game-scoped
endpoints only, `null` on global endpoints and for exclusive treasures).

**Write fields**: `max_units` only (`int >= 0`, or `null` for unlimited), via
`GameTreasureUpdateSerializer` — an explicit allowlist that excludes `game`, `treasure`, and
`acquired_units`, so none of those can be set through the PATCH endpoint regardless of what the
request body contains.

**Stock-cap enforcement on acquire/sell** (see "Treasure acquire/sell endpoints" above): when a
character acquires `quantity` of a treasure that is M2M-linked to the game with a `GameTreasure`
row, the acquired amount is capped at `available_units` instead of rejecting an over-sized
request — the response's `acquired` field reports how many units were actually granted (see
above), and `acquired_units` is incremented by that amount. Selling decrements `acquired_units`
by the sold quantity (floored at `0`). Both operations lock the `GameTreasure` row
(`select_for_update()`) inside the same transaction as the character/`CharacterTreasure` locks,
in a consistent lock order, to prevent concurrent requests from over-selling the available stock.
A treasure with `available_units == 0` is not hidden from any list — it simply cannot be
acquired further (an acquire request against it succeeds with `acquired: 0`).

---

## Link

Links are read-only through the game detail endpoint (`links` array in
`GameDetailSerializer`). No direct link create/update/delete endpoint exists.

**Exposed fields** (read): `id`, `text`, `url`, `link_type` — visible to anyone who can
read the game detail (i.e., anyone, since the game detail endpoint is publicly accessible).
`link_type` is a non-sensitive display-icon enum (`''` or `lootstudio`) driving which icon
the frontend renders next to the link; it carries no access-control implications.

**Write access:** superuser only (via Django admin, out of scope).

---

## CharacterLink

Character links are read through the character detail endpoints (`links` array in
`CharacterDetailSerializer` and, by inheritance, `CharacterFullSerializer`). As of issue #392,
links are also writable, nested inside the character create/update payloads — there is still
no standalone `CharacterLink` create/update/delete endpoint.

**Exposed fields** (read): `id`, `text`, `url`, `link_type` — visible to anyone who can read the
character detail (i.e., anyone, since both PC and NPC detail endpoints are publicly
accessible). `link_type` is a non-sensitive display-icon enum (`''` or `lootstudio`) driving
which icon the frontend renders next to the link; it carries no access-control implications.

**Write access (added in issue #392):** there is no dedicated `CharacterLink` endpoint — links
are written exclusively as a nested `links` array inside the character payload, gated by the
same permission as the character write itself:

- `PATCH /games/<slug>/pcs/<id>/full.json`, `PATCH /games/<slug>/npcs/<id>/full.json` (moved
  from the plain detail endpoints in issue #428) — via `CharacterUpdateSerializer`'s `links`
  field, gated by `CharacterEditPermission` (player of that character, any GameMaster of that
  game, or superuser — same rule as the rest of the PATCH payload; see "Update (PATCH)" above).
- `POST /games/<slug>/npcs.json` — via `CharacterCreateSerializer`'s `links` field, gated by
  `GameEditPermission` (GameMaster of that game, or superuser — same rule as the rest of the
  create payload; see "Create" above).

**Write semantics** (`CharacterLinkWriteSerializer` + `CharacterLinksSync`, in
`source/games/serializers/character_link_write.py`): each entry in the `links` array accepts
`id` (optional int), `text`, `url`, `link_type`, and a transient `delete` flag (not a model
field). Routing per entry, applied server-side after the character's own fields are saved:
  - `delete: true` — deletes the existing link matching `id`. `id` is required whenever
    `delete: true` (validated in `CharacterLinkWriteSerializer.validate`); a delete entry with
    no `id` → 400, rather than raising an unhandled error at save time.
  - `id` present (no `delete`) — updates the existing link matching `id`; only the fields
    present in the entry are changed (fields already blank keep their existing value, since
    `_update` falls back to the current value via `entry.get(field, link.<field>)`).
  - `id` absent — creates a new `CharacterLink` owned by the target character. `url` is
    required for any new entry that isn't a delete (validated in `CharacterLinkWriteSerializer
    .validate`); missing `url` on a create entry → 400. An entry with an `id` (update) does not
    require `url` — an omitted field there simply leaves the existing value untouched.

  On create, `CharacterLinksSync.create_all()` ignores any `id`/`delete` in the entries and
  unconditionally creates a link per entry — there is no existing character yet to own a
  link to update or delete.

**Batch size cap:** the `links` array is capped at `MAX_LINKS` (50) entries per request —
enforced by `validate_links` on both `CharacterCreateSerializer` and `CharacterUpdateSerializer`
(delegating to `validate_links_count` in `character_link_write.py`), rejected with 400 when
exceeded — since each entry drives at least one synchronous DB query in `CharacterLinksSync`.

**Atomicity:** `CharacterLinksSync.apply()` and `.create_all()` each run their per-entry loop
inside `transaction.atomic()` — if any entry in the batch fails (e.g. an unknown/foreign link
`id`), every entry already applied/created earlier in the same request is rolled back, so a
failed request never leaves the character with a partially-applied `links` batch.

**Ownership check:** for update and delete, `id` must resolve to a `CharacterLink` already
owned by the target character (`character.links.filter(id=link_id)`) — an `id` for a link
that doesn't exist, or belongs to a different character, is rejected with 400
(`{"errors": {"links": ["Unknown link id <id>."]}}`, wrapped via the `save_or_error()` helper
in `source/games/views/common.py` since this specific error surfaces during `serializer.save()`
rather than `is_valid()` — consistent with the `{"errors": ...}` shape used everywhere else),
never silently ignored and never allowed to affect another character's link.

---

## Access-route config endpoint

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/access-route-config.json` | GET | Anyone (`AllowAny`, no authentication required) | Static JSON object keyed by page identifier (see below) |

Added in issue #433, sourced from the plain Python dict `ACCESS_ROUTE_CONFIG` in
`source/games/access_route_config.py`. Returns no model data and no user data — it is a static,
non-paginated, always-public-cache-tier config describing, for each frontend page identifier
(the same identifiers `HashRouteResolver#getPage` already produces — `game`, `gameEdit`,
`pcCharacter`, `treasureEdit`, `staffUsers`, ...), which resource-kind access check(s) that page
must perform before rendering. Each page key maps to a list of descriptors — most pages need
only one, but e.g. `treasureEdit` needs both a superuser check and a treasure-ownership check —
each descriptor a `{"kind": ...}` dict (`"game"`, `"character"`, `"treasure"`, `"superuser"`, or
`"staffOrSuperuser"`), with `"character"` descriptors additionally carrying a `"characterKind"`
key (`"pcs"` or `"npcs"`). Page identifiers with no access check at all (e.g. `games`, `home`)
have no entry, same as the pre-#433 frontend-hardcoded config it replaces.

This endpoint intentionally carries **no URL patterns** — route paths and param names remain
frontend-owned routing knowledge (see `frontend.md` for how the frontend combines this kind
config with its own URL templates). Authentication classes are explicitly empty
(`@authentication_classes([])`) and permissions are `AllowAny`, identical to the health check
endpoint below — this response never varies by caller, so it always gets the public/anonymous
`Cache-Control` tier.

---

## Health check endpoint

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/health.json` | GET | Anyone (no authentication required) | `{"status": "ok"}` |

This endpoint returns no model data and no user data. It is used by the frontend to
periodically verify backend connectivity. Authentication classes are explicitly empty
(`@authentication_classes([])`) and permissions are `AllowAny`.

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

Treasures are global by default, but may optionally be exclusive to one game via a `game` FK
(issue #296). All read endpoints are public; write endpoints on the global routes (create and
update) remain restricted to superusers. Treasures may also be associated with games via a
separate, untouched M2M relationship and retrieved through the game-scoped list endpoint below —
a treasure can be M2M-linked to any number of games *and/or* exclusively owned (via `game`) by
at most one game, independently.

| Action | Who can |
|--------|---------|
| List (`GET /treasures.json`) | Anyone (no authentication required) — returns only global treasures (`game__isnull=True`); game-exclusive treasures are excluded |
| Detail (`GET /treasures/<id>.json`) | Anyone (no authentication required) |
| List by game (`GET /games/<slug>/treasures.json`) | Anyone — returns the union of treasures M2M-linked to that game and treasures whose `game` FK points at it, excluding any with `hidden=True` (issue #313); 404 if game slug unknown |
| List all by game, including hidden (`GET /games/<slug>/treasures/all.json`) | That game's GameMaster, or superuser (`GameEditPermission`) — unauthenticated → 401, authenticated non-editor → 403 (issue #313, mirrors the `npcs/all.json` precedent for hidden NPCs). Same unfiltered union as the row above, but without the `hidden=True` exclusion. Response always sets `X-Skip-Cache: true` (stricter than `npcs/all.json`, which relies on cache invalidation instead) so Tent never caches this DM/admin-only view by URL |
| Create by game (`POST /games/<slug>/treasures.json`) | That game's GameMaster, or superuser (`GameEditPermission`) — unauthenticated → 401, authenticated non-editor → 403. `game` is set server-side from the resolved game and never accepted from the request body |
| Detail by game (`GET /games/<slug>/treasures/<int:treasure_id>.json`) | Anyone, unless `hidden=True` — 404 if the treasure's `game` does not match the resolved game (including a global treasure id, or one exclusive to a different game), **and** 404 if the treasure is hidden and the requester cannot edit the game (issue #313, mirrors the NPC hidden-gate precedent below). A hidden treasure's detail is only visible to that game's GameMaster or a superuser; the response sets `X-Skip-Cache: true` whenever the treasure is hidden, since the outcome is then requester-dependent |
| Update by game (`PATCH /games/<slug>/treasures/<int:treasure_id>.json`) | That game's GameMaster, or superuser (`GameEditPermission`) — unauthenticated → 401, authenticated non-editor → 403, same 404 rule as the detail endpoint above. A `PATCH` attempt by a non-editor on a hidden treasure also 404s (not 403), so existence is not leaked via a differing status code (issue #313). As of issue #314, this endpoint also resolves treasures M2M-linked to the game (not just exclusive ones): for an exclusive treasure it updates `name`/`value`/`hidden` as before; for an M2M-linked treasure it instead accepts and persists `max_units` onto that game's `GameTreasure` row (see "GameTreasure" below) — `name`/`value`/`hidden` in the body are ignored in that case, and `acquired_units` can never be set through this endpoint |
| Create (`POST /treasures.json`) | Superuser only — unauthenticated → 401, authenticated non-superuser → 403 |
| Update (`PATCH /treasures/<id>.json`) | Superuser only — unauthenticated → 401, authenticated non-superuser → 403 (this includes the GameMaster of a game-exclusive treasure's own owning game — that asymmetry is intentional: the global endpoint stays superuser-only regardless of `game`) |
| Create photo (`POST /treasures/<id>/photo_upload.json`) | Superuser always; additionally that treasure's owning game's GameMaster, when `treasure.game_id` is set — unauthenticated → 401, authenticated non-editor → 403 |
| Delete | Superuser only (via Django admin, out of scope) — deleting a treasure's owning `Game` also cascade-deletes the treasure (mirrors `Character`'s cascade behavior); it does not delete treasures merely M2M-linked to that game |

**Exposed fields** (read): `id`, `name`, `value`, `photo_path`, `game_slug`, `available_units`,
`max_units` — all fields are non-sensitive and safe to return to anonymous callers.

`available_units`/`max_units` (added in issue #314, both `int|null`) are derived from a `GameTreasure`
row (see "GameTreasure" below) — see that section for the full read/write contract. They are
returned, computed relative to the resolved game, on `GET /games/<slug>/treasures.json`,
`GET /games/<slug>/treasures/all.json`, and `GET /games/<slug>/treasures/<int:treasure_id>.json`
(both serializers use the shared `GameTreasureFieldsMixin`). They serialize as `null` on the
global, non-game-scoped `GET /treasures.json` and `GET /treasures/<id>.json` endpoints (no game
to scope to), and for treasures exclusive to a game (no `GameTreasure` row exists for those, since
`max_units`/`acquired_units` only apply to the shared M2M relationship, never to the exclusive
`Treasure.game` FK).

`photo_path` (added in issue #276) is `treasure.photo.path` — same convention as
`Game.cover_photo_path` and `Character.profile_photo_path` above, but for the
`TreasurePhoto` currently attached (see "Treasure photo upload init endpoint" and "Upload"
above). Returned on both `GET /treasures.json` and `GET /treasures/<id>.json`, to anyone.
Unlike `Game.cover_photo` and `Character.profile_photo`, a treasure has at most one photo
ever: re-uploading always replaces it rather than adding a second one.

`game_slug` (added in issue #296) is `treasure.game.game_slug` — the slug of the game the
treasure is *exclusively* owned by (via the `game` FK), or `null` when the treasure is global
or only M2M-linked to one or more games. It is returned on `GET /treasures.json`,
`GET /treasures/<id>.json`, and the game-scoped list/detail endpoints, to anyone.

**Write fields** (create/update): `name` (required for create, optional for update), `value` (required for create, optional for update), `hidden` (optional, defaults to `False`, added in issue #313). `photo_path` and `game_slug` are read-only and cannot be set directly by any client — `game` is only ever assigned server-side, either left `null` (global create) or set from the `<slug>` URL segment (game-scoped create); `photo_path` is only ever assigned via "Upload" below.

`hidden` (added in issue #313) is a `BooleanField` (default `False`) on `Treasure`, settable via
`TreasureCreateSerializer`/`TreasureUpdateSerializer` on both global and game-scoped treasures
(they share the same serializers). It is **not** exposed in any read serializer
(`TreasureListSerializer`/`TreasureDetailSerializer` do not include it) — it is used purely
server-side to filter/gate the game-scoped endpoints: `GET /games/<slug>/treasures.json`
excludes `hidden=True`, `GET /games/<slug>/treasures/<int:treasure_id>.json` 404s for a hidden
treasure unless the requester can edit the game (see "Detail by game" above), and
`GET /games/<slug>/treasures/all.json` deliberately reveals hidden treasures to an authorized
DM/superuser. A character's own treasure listings (`CharacterTreasure`-backed endpoints, see
"CharacterTreasure" above) are unaffected by `hidden` — a character keeps seeing treasure it
already owns even if that treasure is later hidden from the catalog.

**Scope limitation:** `hidden` currently has no filtering effect on the global,
non-game-scoped endpoints (`GET /treasures.json`, `GET /treasures/<id>.json`) — a superuser can
set `hidden=True` on a global treasure (`game IS NULL`) via those endpoints' create/update, but
the global list/detail endpoints do not honor it, so the treasure remains publicly visible
there. This is a deliberate scope decision from issue #313 (only the game-scoped catalog was in
scope), not an oversight — global treasures are already fully public by design (`GET
/treasures.json` is `AllowAny` regardless of `hidden`), so this does not grant any caller access
beyond what they already had. If hiding global treasures is ever needed, extend the same
filter/gate used on the game-scoped endpoints to `treasures_list`/`treasure_detail`.

### Edit access status

| Endpoint | Who can read | Response |
|----------|-------------|----------|
| `GET /treasures/<id>/access.json` | Anyone | see below — cache-skipped |

The access endpoint always sets `X-Skip-Cache: true`. The path ends with `/access.json`, which is already listed in `frontend/assets/js/client/config/skipCacheSuffixes.js`, so no additional frontend config is needed.

As of issue #296, edit permission for a treasure is computed via *any* available path: the
global superuser-only route, **or** the game-scoped route (that treasure's owning game's
GameMaster, when `treasure.game_id` is set). This does not change `Treasure.can_be_edited_by`
itself (see "Edit rights logic" below) — it is computed separately in
`TreasurePermissionsSerializer` (previously `TreasureAccessSerializer`, moved by issue #433, see
below).

As of issue #396, the response shares the same `BaseAccessSerializer`-derived shape used by the
Game and Character access endpoints above. As of issue #433, `can_edit` is no longer part of
this shape — it moved to the dedicated `permissions.json` endpoint below:

| Field | Type | Value |
|-------|------|-------|
| `username` | `str \| null` | The requesting user's username, or `null` if unauthenticated |
| `is_superuser` | `bool \| null` | Whether the requesting user is a Django superuser, or `null` if unauthenticated |
| `is_staff` | `bool \| null` | Whether the requesting user is Django staff, or `null` if unauthenticated |
| `is_dm` | `bool \| null` | Whether the requesting user is a GameMaster of the treasure's owning game, or `null` if unauthenticated. `false` when authenticated but the treasure has no `game_id` (global treasure) |
| `is_player` | `bool \| null` | Always `false` (never `null`, even when anonymous, and even when the treasure has an owning game the requester is a player of) — deliberately **not** evaluated for treasure access, since this route isn't nested under `/games/<slug>/` (added in issue #410; a deliberate scope decision, unlike `is_dm`'s treasure-access behavior) |
| `is_owner` | `bool \| null` | Always `false` (never `null`, even when anonymous) — treasures have no ownership concept |

All fields are `null` for an anonymous caller, with two exceptions: `is_owner`
is always `false` rather than `null`, since treasures have no ownership concept to report on in
the first place, and `is_player` is always `false` rather than `null` for the same
not-evaluated-here reason (see above).

### Edit permission (`permissions.json`, added in issue #433)

| Endpoint | Who can read | Response |
|----------|-------------|----------|
| `GET /treasures/<id>/permissions.json` | Anyone | `{"can_edit": <bool>}` — see below for the cache contract |

Split out of `access.json` (issue #433) — see "Edit permission (`permissions.json`, added in
issue #433)" under the Character section above for the full rationale and the "The `role` query
parameter" subsection there for the shared `role` contract used identically here.

Without a `role` param, `can_edit` reflects the real requester's identity, computed via any
available path exactly as described above (unchanged from the old `access.json` behavior), and
the response sets `X-Skip-Cache: true`. With a `role` param, `can_edit` is computed from the
simulated role booleans via `Treasure.can_be_edited_by_roles(is_superuser, is_dm)` instead — a
global treasure (`game_id` is `None`) is superuser-only even under simulation (the `dm` role is
always a no-op there); only a game-exclusive treasure's `dm` role additionally grants
`can_edit`, preserving the dual-path logic from issue #296. The response then sets
`X-Force-Public-Cache: true` instead (see "Cache-bypass mechanism for access endpoints" under
the Character section above) so it is cached in the public/anonymous tier regardless of the real
caller's own auth state.

### Edit rights logic

`Treasure.can_be_edited_by(user)` returns `True` when `user` is authenticated and
`user.is_superuser` is `True`. No game-scoped roles (GameMaster, Player) grant write access
through this method — it remains superuser-only and is the sole permission check backing the
global `PATCH /treasures/<id>.json` endpoint (via `TreasureEditPermission`).

As of issue #296, the new game-scoped `POST`/`PATCH /games/<slug>/treasures[/...].json`
endpoints, and the photo-upload endpoint when `treasure.game_id` is set, do **not** use
`Treasure.can_be_edited_by` at all — they check `GameEditPermission`/`Game.can_be_edited_by`
against the resolved game instead (that game's GameMaster, or superuser). This is a
deliberate split: a treasure's own edit-rights method stays narrow (superuser-only), while
broader, game-derived access is layered on top only for the routes that are explicitly
scoped to a game.

---

## GameSession

Sessions are scoped to a game and record when a session happened. There is no independent
owner/player concept for sessions — write access mirrors `Game.can_be_edited_by` exactly.

| Action | Who can |
|--------|---------|
| List (`GET /games/<slug>/sessions.json`) | Anyone — paginated, ordered by `id` (creation order, not `date`); 404 if game slug unknown |
| Detail (`GET /games/<slug>/sessions/<id>.json`) | Anyone; 404 if game slug unknown, session id unknown, or the session does not belong to that game |
| Create (`POST /games/<slug>/sessions.json`) | GameMaster of that game, or superuser — unauthenticated → 401, authenticated non-editor → 403 |
| Update (`PATCH /games/<slug>/sessions/<id>.json`) | GameMaster of that game, or superuser — unauthenticated → 401, authenticated non-editor → 403 |
| Delete | Superuser only (via Django admin, out of scope) |

**Exposed fields** (list): `id`, `title`, `date`, `game_slug`.

**Exposed fields** (detail): all list fields plus `can_edit` — computed the same way the
`Character` detail serializer surfaces it (a `SerializerMethodField` evaluated against
`request.user` from the serializer context), unlike `Treasure`, which uses a separate
`access.json` endpoint instead. There is no separate
`GET /games/<slug>/sessions/<id>/access.json` endpoint for sessions: since a session's edit
rights are identical to its game's, the frontend can equally rely on the existing
`GET /games/<slug>/access.json` endpoint already used for `GameEdit`.

**Write fields** (create/update): `title` (required for create, optional for update), `date`
(optional, nullable `YYYY-MM-DD`). `game` is never accepted from the request payload — it is
always assigned server-side from the `game_slug` URL segment.

### Edit rights logic

`GameSession.can_be_edited_by(user)` delegates entirely to `self.game.can_be_edited_by(user)` —
there is no independent `GameSession`-level ownership concept.

As of issue #433, `GameSession.can_be_edited_by_roles(is_superuser, is_dm)` is the role-simulated
sibling of the above (delegating identically to `self.game.can_be_edited_by_roles(...)`), added
for consistency with `Game`/`Character`/`Treasure`. No `permissions.json` endpoint exists for
sessions — this method exists only so the shared rule is available if a future issue needs it;
`GameSessionDetailSerializer.get_can_edit` still calls `can_be_edited_by(user)` directly, exactly
as before.

---

## Task

Added in issue #388. Tasks are a DM-private checklist scoped to a game (and optionally one of
its `GameSession`s), mirroring `GameSession`'s "delegates edit rights to its game" ownership
pattern. Unlike every other resource in this document, **Task has no public read path**: List
and Detail are gated by `TaskEditPermission` exactly like Create and Update, since a task may
hold DM-only prep notes. There is no `GameSession`/`Treasure`-style `AllowAny` GET anywhere on
this resource.

| Action | Who can |
|--------|---------|
| List (`GET /games/<slug>/tasks.json`) | GameMaster of that game, or superuser — unauthenticated → 401, authenticated non-editor → 403; paginated, ordered by `id` (creation order); 404 if game slug unknown |
| Create (`POST /games/<slug>/tasks.json`) | Same as List |
| Update (`PATCH /games/<slug>/tasks/<id>.json`) | Same as List; 404 if task id unknown or the task does not belong to that game |
| Delete | Superuser only (via Django admin, out of scope) — no `DELETE` endpoint exists |

There is no standalone detail-GET endpoint (`GET /games/<slug>/tasks/<id>.json` does not
exist): since every viewer of a task is already an editor (List already returns the full item
shape, including `long_description`), a separate detail read path would carry no additional
information. `PATCH` is the only method registered on the `<id>.json` route.

**Exposed fields** (list, create-response, and update-response — all three share the same
`GameTaskListSerializer`): `id`, `short_description`, `long_description`, `completed`,
`session` (nullable `GameSession` id).

**Write fields** (create/update): `short_description` (required for create, optional for
update), `long_description` (optional, may contain line breaks), `completed` (optional,
defaults to `False`), `session` (optional, nullable — settable, changeable, or clearable via
`null`). `game` is never accepted from the request payload — it is always assigned
server-side from the `game_slug` URL segment.

**`session` validation**: when provided (non-null) on create or update, `session` must be a
`GameSession` belonging to the same game as the task, or the request is rejected with 400
(`{"errors": {"session": [...]}}`). This is enforced in `validate_session` on both
`GameTaskCreateSerializer` and `GameTaskUpdateSerializer`, which read the resolved `Game`
instance from serializer `context={'game': game}` (the game isn't itself a serializer field,
so it can't be validated against `self.instance.game` alone on create).

### Edit rights logic

`Task.can_be_edited_by(user)` delegates entirely to `self.game.can_be_edited_by(user)` — there
is no independent `Task`-level ownership concept, identical to `GameSession` above.

As of issue #433, `Task.can_be_edited_by_roles(is_superuser, is_dm)` is the role-simulated
sibling of the above, added for the same consistency reason as `GameSession`'s — no
`permissions.json` endpoint exists for tasks; `TaskEditPermission` still delegates to
`can_be_edited_by(user)` directly, unchanged.

### `TaskEditPermission`

Unlike every other `_EditPermission` subclass in this codebase (which only gates writes),
`TaskEditPermission.check()` is invoked unconditionally at the top of both `game_tasks_list`
(for `GET` and `POST` alike) and `game_task_detail` (for its sole `PATCH` method) — there is no
branch of any Task endpoint that skips this check. This is the first resource where read access
requires the same authorization as write access.

**`session`'s own `on_delete` behavior:** the `session` FK uses `on_delete=models.SET_NULL`
(not `CASCADE`), so deleting a `GameSession` via Django admin detaches its tasks (sets
`task.session` to `null`) rather than deleting them — a task is expected to outlive the session
it was originally scoped to.

---

## Historical records (`versioning` app)

Added in issue #406. `django-simple-history` generates one `Historical<Model>` table per
tracked model — `Game`, `Player`, `Character`, `Treasure`, `CharacterTreasure`, `GamePhoto`,
`CharacterPhoto`, `Link`, `CharacterLink`, `TreasurePhoto` — living in the `versioning` app
(see `docs/agents/architecture.md`'s "`versioning/`" section). `GameTreasure` is not tracked.

These tables carry the full field state of every tracked model at every past save/delete,
plus `history_user` (the acting user, when known). **They are exposed only via Django
Admin — out of scope per this document's own rule above — and never through any API
endpoint or serializer.** There is no read or write path to a `Historical<Model>` row from
any client-facing route; a future issue that wants to surface history through the API would
need its own dedicated review and its own entry in this document.

**`history_user` has no DB-level foreign-key constraint** (`user_db_constraint=False` on every
`HistoricalRecords(...)` call) — this was required to avoid confirmed MySQL deadlocks under the
`games/tests/views/` suite (a hard FK from ten `Historical<Model>` tables to `auth_user` caused
intermittent `Deadlock found when trying to get lock` failures; disabling the constraint
resolved them, matching the "loose FK" treatment `django-simple-history` already applies by
default to the tracked model's own relations, e.g. `game`/`player`/`profile_photo`). Integrity
of `history_user_id` after a user is deleted therefore relies on the deletion going through
Django's ORM (`on_delete=models.SET_NULL` still runs via Django's own signal/collector
machinery, independent of `db_constraint`) rather than a DB-level constraint — true for every
current user-deletion path in this codebase. If a future raw-SQL or bulk user-purge tool is
ever added, it should explicitly null out `history_user_id` on the ten `Historical<Model>`
tables (or reuse Django's ORM delete) to avoid an orphaned reference; `_history_user_getter`
already handles a missing user gracefully (returns `None`), so this remains a data-integrity
nuance, not a crash or disclosure risk.

---

## Adding a new model

When a new model is introduced, add it to this document in the same PR:

1. List the user roles that can read each field.
2. List the user roles that can create, update, and delete records.
3. Note whether superuser-only access applies and why.
