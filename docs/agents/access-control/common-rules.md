# Common Rules

**Baseline** (never restated per rule below): superuser always passes; that game's dm (`Player`
with `is_dm=True`) always passes for anything scoped to their game — see [User
Roles](user-roles.md).

Shorthand used in the table:

- **AnyPlayer** (`is_player`) — `game.players.filter(user=user).exists()`. Currently always
  `false` for real users: `Player.games` is never written by any endpoint, only touched in a
  model test
- **Staff** — any global `user.is_staff` account

Every row's exact role list beyond baseline lives in the matching
`backend/games/permissions/config/<resource>/{endpoints,ui}.yml` file (linked per row); this
table states only the permission class name, the endpoint(s) it guards, and rationale/edge cases
the YAML can't express.

| Rule | Permission class | Beyond baseline |
|------|------|------|
| **GameEdit** | `GameEditPermission` | — ([`game/endpoints.yml`](../../../backend/games/permissions/config/game/endpoints.yml)'s `restricted.edit`) |
| **GameRegularEdit** | (config-driven via `EndpointPermission`) | Staff + AnyPlayer — narrow `description`/`links`-only `PATCH /games/<slug>.json` tier, `name` silently dropped if sent ([`game/endpoints.yml`](../../../backend/games/permissions/config/game/endpoints.yml)'s `regular.regular_edit`) |
| **CharacterEdit** | `CharacterEditPermission` | The character's own player (`Character.player.user`), PC only — [`game_pc/endpoints.yml`](../../../backend/games/permissions/config/game_pc/endpoints.yml) / [`game_npc/endpoints.yml`](../../../backend/games/permissions/config/game_npc/endpoints.yml)'s `restricted.edit` |
| **NpcPlayerEdit** | `NpcPlayerEditPermission` | CharacterEdit + AnyPlayer — NPC routes only ([`game_npc/endpoints.yml`](../../../backend/games/permissions/config/game_npc/endpoints.yml)'s `regular.player_edit`) |
| **CharacterPhotoUpload** | `CharacterPhotoUploadPermission` | NpcPlayerEdit + Staff — PC/NPC upload init/finalize, and "set as profile photo" ([`game_pc/endpoints.yml`](../../../backend/games/permissions/config/game_pc/endpoints.yml) / [`game_npc/endpoints.yml`](../../../backend/games/permissions/config/game_npc/endpoints.yml)'s `regular.photo_upload`) |
| **CharacterRegularEdit** | `CharacterRegularEditPermission` | CharacterEdit + Staff + AnyPlayer — **PC only**, narrow `PATCH /games/<slug>/pcs/<id>.json` (incl. `money`, since #915 dropped the dedicated endpoint); no NPC counterpart ([`game_pc/endpoints.yml`](../../../backend/games/permissions/config/game_pc/endpoints.yml)'s `regular.regular_edit`) |
| **CharacterTreasureExchange** | `CharacterTreasureExchangePermission` | CharacterEdit + Staff — no AnyPlayer; excludes the DM-only `/buy/all.json` route, gated by GameEdit alone ([`game_pc/endpoints.yml`](../../../backend/games/permissions/config/game_pc/endpoints.yml) / [`game_npc/endpoints.yml`](../../../backend/games/permissions/config/game_npc/endpoints.yml)'s `restricted.treasure_exchange`) |
| **TreasureEdit** | `TreasureEditPermission` | Global treasure (`game_id is None`): Staff — no dm branch, since there's no game. Game-scoped treasure routes skip this class entirely and check GameEdit directly ([`treasure/endpoints.yml`](../../../backend/games/permissions/config/treasure/endpoints.yml)'s `restricted.edit`) |
| **GameSessionEdit** | `GameSessionEditPermission` | Staff + AnyPlayer — broader than a plain GameEdit delegation ([`game_session/endpoints.yml`](../../../backend/games/permissions/config/game_session/endpoints.yml)'s `regular.edit`) |
| **TaskEdit** | `TaskEditPermission` | — (delegates to GameEdit against the task's game; unlike every other rule here, also gates reads, not just writes — see [Task](task.md); [`game_task/endpoints.yml`](../../../backend/games/permissions/config/game_task/endpoints.yml)'s `restricted.edit`) |
| **Staff-or-superuser** | inline `require_staff` check | `is_staff or is_superuser` — dm does **not** qualify here |
| **AllowAny** | DRF `AllowAny` | Anyone, unauthenticated included |

`Game.can_be_edited_by`/`Character.can_be_edited_by`/`Treasure.can_be_edited_by` implement the
GameEdit/CharacterEdit/TreasureEdit rows above directly (see [Treasure](treasure.md) for why
game-scoped treasure routes bypass the Treasure method instead of extending it).

Unless noted otherwise, an unauthenticated request to a non-AllowAny endpoint gets `401`
(`{"errors": {"detail": ["authentication required"]}}`), an authenticated request that fails the
permission check gets `403` (`{"errors": {"detail": ["not allowed"]}}`), an unknown/mismatched
path id gets `404`, and a validation failure gets `400`
(`{"errors": {"<field>": ["<message>", ...]}}`) — a resource file only needs to restate this shape
when it deviates (e.g. a 404 masking an authorization failure to avoid leaking existence).

**`UserProfile.status` gate:** every rule above assumes `UserProfile.status == approved`.
`CookieTokenAuthentication` — the project-wide default authentication class — resolves a
`pending`/`denied` user as fully unauthenticated, so any rule depending on "Authenticated" never
applies to them; they look anonymous everywhere except the handful of endpoints that resolve
status directly (login, status, recover, authorization-requests poll) — see [Standalone
endpoints](endpoints.md#userprofilestatus-authentication-gate).

## Role-simulated permission checks

`Game`, `Character`, and `Treasure` each also expose `can_be_edited_by_roles(is_superuser, is_dm,
is_owner=...)` — the same rule computed from simulated booleans instead of a real user, used by
the `role`-parameterized `permissions.json` endpoints below. `GameSession` and `Task` expose it
too, delegating to their game like `can_be_edited_by`, but have no `permissions.json` endpoint —
it exists there only for future use/consistency; their views still call `can_be_edited_by(user)`
directly.

## Access status endpoints (`access.json`)

Every `access.json` endpoint (Game, Character/PC/NPC, Treasure) shares one
`BaseAccessSerializer`-derived response shape, is readable by anyone, and always sets
`X-Skip-Cache: true`. Every field is `null` when unauthenticated except where noted:

| Field | Type | Value |
|-------|------|-------|
| `username` | `str \| null` | Requester's username |
| `is_superuser` | `bool \| null` | Django superuser flag |
| `is_staff` | `bool \| null` | Django staff flag |
| `is_dm` | `bool \| null` | `Player.is_dm=True` for the relevant game. For Treasure, `false` (not `null`) when authenticated but the treasure has no owning game |
| `is_player` | `bool \| null` | AnyPlayer, above. Always `false` (never `null`, even anonymous) for Treasure, which isn't nested under `/games/<slug>/` and never evaluates this |
| `is_owner` | `bool \| null` | **PC only**: `character.player.user_id == requester.id`. Always `false` (never `null`) for Game, NPC, and Treasure, which have no ownership concept |
| `is_logged` | `bool` | Never `null` (unlike every field above) — `true` iff the requester is authenticated. It IS the authentication signal itself, needed by anonymous callers too. Added by #922 so the frontend can always derive an explicit role set (including `logged`) for `permissions.json`, instead of that endpoint ever needing to fall back to inspecting the real session |

`can_edit` is **not** part of this shape — see "Edit permission endpoints" below.

## Edit permission endpoints (`permissions.json`)

Every resource with an `access.json` endpoint also has a `GET .../permissions.json` — anyone can
call it; response is `{"can_edit": <bool>}`.

Since #922, `permissions.json` is a **pure function of its `?role=` query string, in every case**
— it never inspects the real requester's session/identity, whether or not a `role` param is
present. `can_edit` is always computed via `<Model>.can_be_edited_by_roles(...)` from booleans
derived from the given value(s) (accepts repeated values, e.g. `?role=dm&role=owner`):

- `dm` → `is_dm = True`
- `superuser` → `is_superuser = True`
- `owner` → `is_owner = True` (only consulted by the Character/PC endpoint; a no-op elsewhere)
- `logged` → `is_logged = True` (added by #922). A no-op for every current `can_*` computation
  (absent from `can_be_edited_by_roles`'s signature) — accepted so the frontend can pass its full,
  accurate role set (mirroring `access.json`'s `is_logged`) without an "unrecognized value" branch,
  and so a future `can_*` rule can consult it without a parser change.
- `player`, `staff` → no-ops for `can_edit` (absent from `can_be_edited_by_roles`'s signature), accepted only so a caller can pass every role name it knows without an "unrecognized value" branch. `staff` still matters elsewhere: `can_create_item` (Character PC/NPC and Game) consumes `is_staff` via a separate `is_allowed_for_roles` method — see [character-item.md](character-item.md), [game-item.md](game-item.md#item-creation-endpoint)
- any other value → silently ignored (same tolerant convention as `?public_allegiance=`/`?public_slain=`)
- **No `role` param at all** → treated identically to a `role` param with only unrecognized/no-op
  values: every boolean (including `is_logged`) defaults `False`, i.e. the same anonymous/no-roles
  response as an explicit `?role=logged` would be absent. There is no real-identity fallback of any
  kind, with or without a `role` param — the frontend is responsible for deriving and always
  sending the caller's real roles (via its own prior `access.json` call) when it wants a
  real-identity-equivalent response, except when deliberately simulating "not logged" (sends none).
- The response is always cacheable publicly, since it's identity-independent in every case (and
  needed for UI-preview, e.g. showing an anonymous visitor what a dm would see): since #926, this
  is enforced by `CacheControlMiddleware` recognizing the `/permissions/` path prefix directly
  (see "Cache-bypass mechanism for access endpoints" below), not a per-response header. It never
  sets `X-Skip-Cache` (that header, and the whole real-identity code path, existed prior to #922
  and has been fully removed).

Role-parsing is shared verbatim by all five `permissions.json` endpoints (Game, PC, NPC, and
Treasure's two — global and game-exclusive, see [Treasure](treasure.md#edit-permission)).
Several resources' `permissions.json` also expose their own extra `can_*` fields following this
same real-identity/role-simulated pattern: `can_create_item`/`can_upload_item_photo` (Character
and Game — [character-item.md](character-item.md), [game-item.md](game-item.md#item-creation-endpoint)),
and `can_exchange_treasure`/`can_set_profile_photo`/`can_delete_photo` (Character only, moved off
the detail/full-detail response so those could become cacheable — see
[character.md](character.md#edit-access-status-permission)).

## Cache-bypass mechanism for access endpoints

Access-type endpoints return user-specific data, so caching them across users would serve stale
or incorrect values. Three layers enforce correctness:

1. **Backend header (identity-dependent path)** — every `access.json` view sets
   `X-Skip-Cache: true`, preventing Tent from caching it (it's the one place real identity is
   still read, e.g. for `is_logged`).
2. **Backend path-prefix rule (`permissions.json`, always)** — since #922, no `permissions.json`
   view ever reads the real requester's identity (see "Edit permission endpoints" above), so the
   response is always safe to cache publicly regardless of the real caller's auth state. Since
   #926 (when these endpoints moved to the entity-agnostic `/permissions/<entity_type>.json`
   shape), this is enforced by `CacheControlMiddleware` (`backend/games/middleware.py`) forcing
   the public/anonymous `Cache-Control` tier for any request path starting with `/permissions/`,
   unconditionally — no per-response header involved (the earlier `X-Force-Public-Cache: true`
   header this middleware used to key off of has been removed entirely, in favor of the
   path-prefix check). There is no `X-Skip-Cache` branch left for this endpoint either.
3. **Frontend header** — the frontend's base request client checks every request path against its
   own exact-path/path-suffix skip-cache config (e.g. suffix-matching `/access.json`) before
   `fetch`; a match sends `X-Skip-Cache: 1`, bypassing the Tent cache read.

**Rule for future access-type endpoints:** if a new endpoint's response depends on the
requester's identity, add its path (or suffix) to the frontend skip-cache config — suffix
matching exists because access-endpoint paths are dynamic (`<slug>`/`<id>`). An endpoint whose
response is a pure function of its query string, never the real requester's identity (like
`permissions.json`, since #922), needs no frontend bypass — its whole point is to be cacheable.

## Photo path fields

`Game.cover_photo_path`, `Character.profile_photo_path`, and `Treasure.photo_path` all follow the
same convention: `<model>.<photo-field>.path` (the raw relative storage key) or `null` when
unset, returned to anyone on that resource's list/detail endpoints. `Game` and `Character` may
hold at most one *current* cover/profile photo but keep every previous one in their gallery;
`Treasure` has at most one photo ever — re-uploading replaces it (see [Upload](upload.md)).

Exception: on the public `Character` endpoints (`pcs.json`/`npcs.json`/`pcs/<id>.json`/
`npcs/<id>.json`), `profile_photo_path` resolves to `null` whenever `incognito` is `true`,
regardless of whether a photo is set — see [`incognito`](character.md#incognito). The
private/full endpoints (`pcs/<id>/full.json`/`npcs/<id>/full.json`/`npcs/all.json`) are
unaffected and always return the real path.
