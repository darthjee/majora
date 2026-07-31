# Common Rules

**Baseline** (never restated per rule below): superuser always passes; that game's dm (`Player`
with `is_dm=True`) always passes for anything scoped to their game — see [User
Roles](user-roles.md).

Shorthand used in the table:
- **AnyPlayer** (`is_player`) — `game.players.filter(user=user).exists()`. Currently always
  `false` for real users: `Player.games` is never written by any endpoint, only touched in a
  model test
- **Staff** — any global `user.is_staff` account

| Rule | Permission class | Beyond baseline |
|------|------|------|
| **GameEdit** | `GameEditPermission` | — |
| **CharacterEdit** | `CharacterEditPermission` | The character's own player (`Character.player.user`) |
| **NpcPlayerEdit** | `NpcPlayerEditPermission` | CharacterEdit + AnyPlayer — NPC routes only |
| **CharacterPhotoUpload** | `CharacterPhotoUploadPermission` | NpcPlayerEdit + Staff — PC/NPC upload init/finalize, and "set as profile photo" |
| **CharacterRegularEdit** | `CharacterRegularEditPermission` | CharacterEdit + Staff + AnyPlayer — **PC only**, narrow `PATCH /games/<slug>/pcs/<id>.json` (incl. `money`, since #915 dropped the dedicated endpoint); no NPC counterpart |
| **CharacterTreasureExchange** | `CharacterTreasureExchangePermission` | CharacterEdit + Staff — no AnyPlayer; excludes the DM-only `/buy/all.json` route, gated by GameEdit alone |
| **TreasureEdit** | `TreasureEditPermission` | Global treasure (`game_id is None`): Staff — no dm branch, since there's no game. Game-scoped treasure routes skip this class entirely and check GameEdit directly |
| **GameSessionEdit** | `GameSessionEditPermission` | — (delegates to GameEdit against the session's game) |
| **TaskEdit** | `TaskEditPermission` | — (delegates to GameEdit against the task's game; unlike every other rule here, also gates reads, not just writes — see [Task](task.md)) |
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

**`UserProfile.status` gate:** every rule above assumes the requesting user's `UserProfile.status`
is `approved`. `CookieTokenAuthentication` — the project-wide default authentication class —
resolves a `pending` or `denied` user as fully unauthenticated, so every rule in this document set
that depends on "Authenticated" (or any role built on top of it) simply never applies to them;
they look anonymous everywhere except the handful of endpoints that resolve status directly
(login, status, recover, authorization-requests poll) — see [Standalone
endpoints](endpoints.md#userprofilestatus-authentication-gate) for the full list and behavior.

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
  - `player`, `staff` → recognized but always no-ops for `can_edit`/`can_be_edited_by_roles` specifically (neither appears in its signature) — included only so a caller can pass every role name it knows without triggering an "unrecognized value" branch. `staff` is **not** a no-op for every field on every `permissions.json` response, though: the Character (PC/NPC) endpoint's `can_create_item` field consumes `is_staff` via a separate `is_allowed_for_roles` method — see [character-item.md](character-item.md) — and the Game endpoint's own `can_create_item` field does the same — see [game-item.md](game-item.md#item-creation-endpoint).
  - any other value → silently ignored (same tolerant, no-400-on-a-typo convention as `?public_allegiance=`/`?public_slain=` elsewhere) — but a `role` param containing only unrecognized/no-op values still computes `can_edit` with every boolean `False`; it does not fall back to the real-identity path
  - Whenever `role` is present (recognized or not), the response sets `X-Force-Public-Cache: true` instead of `X-Skip-Cache: true` — the result is identity-independent, so it's safe (and necessary, for UI-preview use cases like showing an anonymous visitor what a DM would see) to cache in the public tier.

Role-parsing is shared verbatim by all four `permissions.json` endpoints (Game, PC, NPC, Treasure).

The response shape above (`can_edit` plus role-parsing/cache-header behavior) is the shared
baseline — several resources' `permissions.json` additionally expose their own extra `can_*`
fields following this same real-identity/role-simulated dual pattern: `can_create_item`/
`can_upload_item_photo` (Character and Game, see [character-item.md](character-item.md)/
[game-item.md](game-item.md#item-creation-endpoint)), and `can_exchange_treasure`/
`can_set_profile_photo`/`can_delete_photo` (Character only, moved off the detail/full-detail
response onto this endpoint specifically so those responses could become cacheable — see
[character.md](character.md#edit-access-status-permission)).

## Cache-bypass mechanism for access endpoints

Access-type endpoints return user-specific data, so caching them across users would serve stale
or incorrect values. Three layers enforce correctness:

1. **Backend header (real-identity path)** — every `access.json` view, and every
   `permissions.json` view with no `role` param, sets `X-Skip-Cache: true` on the response,
   preventing Tent from caching it.
2. **Backend header (role-simulated path)** — a `permissions.json` view with a `role` param
   sets `X-Force-Public-Cache: true` instead, telling the cache-control middleware to always apply
   the public/anonymous `Cache-Control` tier, overriding what it would otherwise choose from the
   real requester's own `is_authenticated` state.
3. **Frontend header** — the frontend's base request client checks every request path against its
   own exact-path and path-suffix skip-cache config (e.g. suffix-matching `/access.json`) before
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

Exception: on the public `Character` endpoints (`pcs.json`/`npcs.json`/`pcs/<id>.json`/
`npcs/<id>.json`), `profile_photo_path` also resolves to `null` whenever the character's
`incognito` field is `true`, regardless of whether a `profile_photo` is set — see the
[`incognito`](character.md#incognito) section in [character.md](character.md). The private/full
endpoints
(`pcs/<id>/full.json`/`npcs/<id>/full.json`/`npcs/all.json`) are unaffected and always return the
real path.
