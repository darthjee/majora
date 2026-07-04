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

A user may simultaneously be a GameMaster for one game and a Player for another. The
"GameMaster" and "Player" roles are always scoped to a specific game.

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
| Create (`POST /games/<slug>/pcs/<id>/photo_upload.json`, `POST /games/<slug>/npcs/<id>/photo_upload.json`) | Player of that character, any GameMaster of that game, or superuser |
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
  superuser).
- **`TreasurePhoto`** (issue #276): unconditionally sets `Treasure.photo` to that photo — unlike
  the `GamePhoto`/`CharacterPhoto` cases, there is no "if unset" guard, since a treasure has at
  most one photo and re-uploading always replaces it. Gated by `TreasureEditPermission`
  (superuser only).

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
| `/games/<slug>/npcs/<id>/photo_upload.json` | POST | Player of that character, any GameMaster of that game, or superuser | `upload_id`, `token`, `character_id` |

Added in issue #255, mirroring the game photo upload init endpoint above but scoped to a
single character and gated by `CharacterEditPermission` instead of `GameEditPermission`.

- Unauthenticated → 401. Authenticated but not the character's player, a GameMaster of its
  game, or a superuser → 403.
- Unknown `game_slug` or `character_id` (or a `character_id` that does not belong to
  `game_slug`, or is the wrong PC/NPC type for the endpoint) → 404.
- Missing or invalid `filename` body field → 400.
- Creates a `CharacterPhoto` row with `ready=False` as part of the upload initialisation
  flow; the record is not visible in the character detail's `photos` list, and cannot become
  `profile_photo`, until the upload is finalised and `ready` is set to `True`.

---

## Treasure photo upload init endpoint

| Endpoint | Method | Who can call | Response fields |
|----------|--------|-------------|-----------------|
| `/treasures/<id>/photo_upload.json` | POST | Superuser only | `upload_id`, `token`, `treasure_id` |

Added in issue #276, mirroring the game/character photo upload init endpoints above but gated
by `TreasureEditPermission` (superuser only) and using a fixed, deterministic storage path
(`photos/treasures/<id>/photo.<ext>`, no random UUID) since a treasure has at most one photo.

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
| `GET /games/<slug>/pcs.json` | Anyone | `id`, `name`, `game_slug`, `profile_photo_path` |
| `GET /games/<slug>/npcs.json` | Anyone | `id`, `name`, `game_slug`, `profile_photo_path` |

### Detail

| Endpoint | Who can read | Fields returned |
|----------|-------------|-----------------|
| `GET /games/<slug>/pcs/<id>.json` | Anyone | `id`, `name`, `role`, `public_description`, `is_pc`, `photos`, `links`, `game_slug`, `can_edit`, `profile_photo_path` |
| `GET /games/<slug>/npcs/<id>.json` | Anyone | same as above |

`profile_photo_path` (added in issue #255) is `character.profile_photo.path` — the raw
relative storage key of the `CharacterPhoto` automatically selected as the character's
profile photo (see the "CharacterPhoto" and "Upload" sections below) — or `null` when the
character has no profile photo yet. It is returned on the list, detail, and full-detail
endpoints, to anyone.

### Full detail (includes `private_description`)

| Endpoint | Who can read | Fields returned |
|----------|-------------|-----------------|
| `GET /games/<slug>/pcs/<id>/full.json` | Player of this character, any GameMaster of this game, or superuser | All detail fields + `private_description` |
| `GET /games/<slug>/npcs/<id>/full.json` | Player of this character, any GameMaster of this game, or superuser | All detail fields + `private_description` |

Anonymous or insufficiently privileged authenticated users receive **401** or **403**.

### Edit access status

| Endpoint | Who can read | Response |
|----------|-------------|----------|
| `GET /games/<slug>/pcs/<id>/access.json` | Anyone | `{ "can_edit": true/false }` — cache-skipped |
| `GET /games/<slug>/npcs/<id>/access.json` | Anyone | `{ "can_edit": true/false }` — cache-skipped |

#### Cache-bypass mechanism for access endpoints

Access endpoints return user-specific data (`can_edit` reflects the requesting user's permissions), so caching them across users would serve stale or incorrect values. Two layers enforce cache-bypass:

1. **Backend response header** — `game_pc_access` and `game_npc_access` views always set `X-Skip-Cache: true` on the response. This prevents Tent from caching new responses.
2. **Frontend request header** — `BaseClient.request` in `frontend/assets/js/client/BaseClient.js` inspects every request path against two centralized config files before calling `fetch`:
   - `frontend/assets/js/client/config/skipCacheEndpoints.js` — a `Set` of exact static paths (authentication endpoints).
   - `frontend/assets/js/client/config/skipCacheSuffixes.js` — a `Set` of path suffixes (e.g. `'/access.json'`). Any request whose path ends with a listed suffix automatically receives `X-Skip-Cache: 1`, bypassing the Tent cache read.

**Rule for future access-type endpoints:** if you add a new endpoint whose response depends on the requesting user's identity or permissions, add its path suffix (or exact path) to the appropriate config file. Access endpoints use the suffix approach because their paths are dynamic (contain `<slug>` and `<id>`).

### Update (PATCH)

| Endpoint | Who can write |
|----------|--------------|
| `PATCH /games/<slug>/pcs/<id>.json` | Player of this character, any GameMaster of this game, or superuser |
| `PATCH /games/<slug>/npcs/<id>.json` | Player of this character, any GameMaster of this game, or superuser |

Unauthenticated → 401. Authenticated but not an editor → 403.

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
`CharacterPhotoSerializer`. As of issue #275, `path` is serialised directly by
`CharacterPhotoSerializer` itself (`fields = ['id', 'path']`) — previously it was only
indirectly exposed via `Character.profile_photo_path` once a `CharacterPhoto` became a
character's `profile_photo` (see the "Character" section above); that indirect exposure still
applies in addition to the direct one.

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

## Link

Links are read-only through the game detail endpoint (`links` array in
`GameDetailSerializer`). No direct link create/update/delete endpoint exists.

**Write access:** superuser only (via Django admin, out of scope).

---

## CharacterLink

Character links are read-only through the character detail endpoints (`links` array in
`CharacterDetailSerializer` and, by inheritance, `CharacterFullSerializer`). No direct
character link create/update/delete endpoint exists.

**Exposed fields** (read): `id`, `text`, `url` — visible to anyone who can read the
character detail (i.e., anyone, since both PC and NPC detail endpoints are publicly
accessible).

**Write access:** superuser only (via Django admin, out of scope).

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
| `/users/status.json` | GET | Anyone (returns `logged_in: true/false`) |
| `/users/test-email.json` | POST | Authenticated |
| `/users/recover.json` | POST | Anyone |
| `/users/reset-password.json` | POST | Anyone (requires valid reset token) |
| `/users/language.json` | POST | Authenticated |

---

## Treasure

Treasures are a global resource, not scoped to any game. All read endpoints are public; write endpoints (create and update) are restricted to superusers. Treasures may also be associated with games via a M2M relationship and retrieved through the game-scoped endpoint below.

| Action | Who can |
|--------|---------|
| List (`GET /treasures.json`) | Anyone (no authentication required) |
| Detail (`GET /treasures/<id>.json`) | Anyone (no authentication required) |
| List by game (`GET /games/<slug>/treasures.json`) | Anyone — returns only treasures linked to that game; 404 if game slug unknown |
| Create (`POST /treasures.json`) | Superuser only — unauthenticated → 401, authenticated non-superuser → 403 |
| Update (`PATCH /treasures/<id>.json`) | Superuser only — unauthenticated → 401, authenticated non-superuser → 403 |
| Create photo (`POST /treasures/<id>/photo_upload.json`) | Superuser only — unauthenticated → 401, authenticated non-superuser → 403 |
| Delete | Superuser only (via Django admin, out of scope) |

**Exposed fields** (read): `id`, `name`, `value`, `photo_path` — all fields are non-sensitive and safe to return to anonymous callers.

`photo_path` (added in issue #276) is `treasure.photo.path` — the raw relative storage key of
the `TreasurePhoto` currently attached to the treasure (see the "Treasure photo upload init
endpoint" and "Upload" sections above) — or `null` when the treasure has no photo yet. It is
returned on both `GET /treasures.json` and `GET /treasures/<id>.json`, to anyone. Unlike
`Game.cover_photo` and `Character.profile_photo`, a treasure has at most one photo ever:
re-uploading always replaces it rather than adding a second one.

**Write fields** (create/update): `name` (required for create, optional for update), `value` (required for create, optional for update). `photo_path` is read-only and cannot be set directly by any client — it is only ever assigned server-side (see "Upload" below).

### Edit access status

| Endpoint | Who can read | Response |
|----------|-------------|----------|
| `GET /treasures/<id>/access.json` | Anyone | `{ "can_edit": true/false }` — cache-skipped |

The access endpoint always sets `X-Skip-Cache: true`. The path ends with `/access.json`, which is already listed in `frontend/assets/js/client/config/skipCacheSuffixes.js`, so no additional frontend config is needed.

### Edit rights logic

`Treasure.can_be_edited_by(user)` returns `True` when `user` is authenticated and `user.is_superuser` is `True`. No game-scoped roles (GameMaster, Player) grant write access to Treasures.

---

## Adding a new model

When a new model is introduced, add it to this document in the same PR:

1. List the user roles that can read each field.
2. List the user roles that can create, update, and delete records.
3. Note whether superuser-only access applies and why.
