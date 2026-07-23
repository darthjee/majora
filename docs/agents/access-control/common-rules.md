# Common Rules

Named permission patterns, referenced by name throughout this document instead of being
restated in every section:

| Rule | Permission class | Grants access to |
|------|------|------|
| **GameEdit** | `GameEditPermission` | That game's GameMaster, or superuser |
| **CharacterEdit** | `CharacterEditPermission` | The character's own player, any GameMaster of that game, or superuser |
| **NpcPlayerEdit** | `NpcPlayerEditPermission` | Everyone CharacterEdit grants, OR any player of that game (`is_player`, below) — NPC routes only |
| **CharacterPhotoUpload** | `CharacterPhotoUploadPermission` | Everyone CharacterEdit grants, OR any player of that game, OR any global Staff account (`user.is_staff`) — PC and NPC photo-upload flow: both the init routes (issue #619 for PC, #713 for NPC) and the finalize route's PC and NPC branches (issue #668 for PC, #713 for NPC) |
| **CharacterMoneyEdit** | `CharacterMoneyEditPermission` | Everyone CharacterEdit grants, OR any global Staff account (`user.is_staff`) — no "any player of the game" grant, unlike CharacterPhotoUpload; PC/NPC money-only routes (issue #615) |
| **CharacterTreasureExchange** | `CharacterTreasureExchangePermission` | Everyone CharacterEdit grants, OR any global Staff account (`user.is_staff`) — no "any player of the game" grant (unlike CharacterMoneyEdit); PC/NPC treasure buy/sell routes only, not the DM-only `/buy/all.json` hidden-treasure variant, which stays gated by GameEdit alone (issue #712) |
| **TreasureEdit** | `TreasureEditPermission` | Superuser or Staff (staff only for a global treasure; a game-scoped treasure still requires GameEdit) |
| **GameSessionEdit** | `GameSessionEditPermission` | Delegates entirely to GameEdit against the session's game |
| **TaskEdit** | `TaskEditPermission` | Delegates entirely to GameEdit against the task's game; unlike every other rule here, also gates reads, not just writes (see [Task](task.md)) |
| **Staff-or-superuser** | inline `require_staff` check | `user.is_staff or user.is_superuser` |
| **AllowAny** | DRF `AllowAny` | Anyone, unauthenticated included |

Full derivations:
- `Game.can_be_edited_by(user)`: `True` when `user.is_superuser`, OR user has a `Player` row with `is_dm=True` for that game.
- `Character.can_be_edited_by(user)`: `True` when `user.is_superuser`, OR user is the character's linked `Player.user`, OR user has a `Player` row with `is_dm=True` for the character's game.
- `Treasure.can_be_edited_by(user)`: `True` when `user.is_superuser`, OR (`user.is_staff` AND the treasure is global, i.e. `game_id is None`). Game-scoped treasure routes (create/update/photo-upload under `/games/<slug>/...`) never use this method — they check GameEdit against the resolved game instead (see [Treasure](treasure.md)), so a treasure's own edit-rights method stays narrow while broader, game-derived access is layered on top only for routes explicitly scoped to a game.
- `is_player` = `game.players.filter(user=user).exists()`. **Note:** `Player.games` is currently never written by any endpoint (only touched in a model test), so `is_player` reads `false` for every real authenticated user until a future issue builds a flow to populate it.

Unless noted otherwise, an unauthenticated request to a non-AllowAny endpoint gets 401, and an
authenticated request that fails the permission check gets 403.

## Role-simulated permission checks

`Game`, `Character`, and `Treasure` each also expose a `can_be_edited_by_roles(is_superuser,
is_dm, is_owner=...)` sibling of `can_be_edited_by`, computing the same rule from simulated role
booleans instead of a real user — used by the `role`-parameterized `permissions.json` endpoints
below. `GameSession` and `Task` expose the same sibling too, delegating it to their game exactly
like `can_be_edited_by`; no `permissions.json` endpoint exists for either of them, so it exists
there only for future use / consistency — their views still call `can_be_edited_by(user)`
directly.

## Access status endpoints (`access.json`)

Every `access.json` endpoint (Game, Character/PC/NPC, Treasure) shares one
`BaseAccessSerializer`-derived response shape, is readable by anyone, and always sets
`X-Skip-Cache: true`:

| Field | Type | Value |
|-------|------|-------|
| `username` | `str \| null` | Requester's username, or `null` if unauthenticated |
| `is_superuser` | `bool \| null` | Whether requester is a Django superuser, or `null` if unauthenticated |
| `is_staff` | `bool \| null` | Whether requester is Django staff, or `null` if unauthenticated |
| `is_dm` | `bool \| null` | Whether requester has a `Player` row with `is_dm=True` for the relevant game, or `null` if unauthenticated. For Treasure, `false` (not `null`) when authenticated but the treasure has no owning game |
| `is_player` | `bool \| null` | `is_player` as defined above, or `null` if unauthenticated; always `false` (never `null`, even when anonymous) for Treasure, which isn't nested under `/games/<slug>/` and deliberately never evaluates this |
| `is_owner` | `bool \| null` | **PC only**: `character.player.user_id == requester.id`, or `null` if unauthenticated. Always `false` (never `null`) for Game, NPC, and Treasure, which have no ownership concept |

`can_edit` is **not** part of this shape — see "Edit permission endpoints" below.

## Edit permission endpoints (`permissions.json`)

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
  - `player`, `staff` → recognized but always no-ops for `can_edit`/`can_be_edited_by_roles` specifically (neither appears in its signature) — included only so a caller can pass every role name it knows without triggering an "unrecognized value" branch. `staff` is **not** a no-op for every field on every `permissions.json` response, though: the Character (PC/NPC) endpoint's `can_create_item` field consumes `is_staff` via a separate `is_allowed_for_roles` method — see [character-item.md](character-item.md).
  - any other value → silently ignored (same tolerant, no-400-on-a-typo convention as `?allegiance=`/`?slain=` elsewhere) — but a `role` param containing only unrecognized/no-op values still computes `can_edit` with every boolean `False`; it does not fall back to the real-identity path
  - Whenever `role` is present (recognized or not), the response sets `X-Force-Public-Cache: true` instead of `X-Skip-Cache: true` — the result is identity-independent, so it's safe (and necessary, for UI-preview use cases like showing an anonymous visitor what a DM would see) to cache in the public tier.

Parsed by `parse_role_booleans` in `backend/games/views/common.py`, shared verbatim by all four
`permissions.json` endpoints (Game, PC, NPC, Treasure).

## Cache-bypass mechanism for access endpoints

Access-type endpoints return user-specific data, so caching them across users would serve stale
or incorrect values. Three layers enforce correctness:

1. **Backend header (real-identity path)** — every `access.json` view, and every
   `permissions.json` view with no `role` param, sets `X-Skip-Cache: true` on the response,
   preventing Tent from caching it.
2. **Backend header (role-simulated path)** — a `permissions.json` view with a `role` param
   sets `X-Force-Public-Cache: true` instead, telling `CacheControlMiddleware`
   (`backend/games/middleware.py`) to always apply the public/anonymous `Cache-Control` tier,
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

## Photo path fields

`Game.cover_photo_path`, `Character.profile_photo_path`, and `Treasure.photo_path` all follow
the same convention: `<model>.<photo-field>.path` (the underlying photo's raw relative storage
key) or `null` when unset, returned to anyone on that resource's list/detail endpoints. `Game`
and `Character` may hold at most one *current* cover/profile photo but keep every previously
uploaded photo in their gallery; `Treasure` has at most one photo ever — re-uploading always
replaces it (see [Upload](upload.md) for how a photo becomes the selected one).
