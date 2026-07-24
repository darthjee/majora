# Game

| Action | Who can |
|--------|---------|
| List (`GET /games.json`) | **AllowAny** |
| Detail (`GET /games/<slug>.json`) | **AllowAny** |
| Create (`POST /games.json`) | Any authenticated user |
| Update (`PATCH /games/<slug>.json`) | **GameEdit** |
| Delete | Superuser only (via Django admin, out of scope) |

**Exposed fields** (read): `name`, `game_slug`, `description`, `game_type`, links list, photos
list, treasures list (via `GET /games/<slug>/treasures.json`), `cover_photo_path` (see [Photo path fields](common-rules.md#photo-path-fields)
above) — returned on both `GET /games.json` and `GET /games/<slug>.json`, to anyone.

`game_type` (`dnd` | `deadlands`, default `dnd`) — returned only on `GET /games/<slug>.json`
(detail, via `GameDetailSerializer`), **not** on `GET /games.json` (list, via
`GameListSerializer`). Fixed at creation time; there is no way to change it afterwards —
`GameUpdateSerializer` does not expose it.

`next_session` (`{title, date} | null`) — read-only, computed server-side from the game's own
`GameSession`s (see [GameSession](game-session.md) above): the earliest-dated session with
`date >= today`; if no session has any date at all, falls back to the first session by id;
otherwise (every dated session is already in the past and none are unscheduled) `null`. No
additional permission required — same public access as the rest of `Game` detail. Returned only
on `GET /games/<slug>.json` (detail), **not** on `GET /games.json` (list).

**Write fields** (create/update): `name` (required for create, optional for update),
`description` (optional), `game_type` (optional, create only — defaults to `dnd` when omitted;
not writable via update). `cover_photo_path` is read-only and cannot be set directly by any
client — it is only ever assigned server-side (see [Upload](upload.md) below).

**Create response:** HTTP 201 with `GameDetailSerializer` body — `name`, `game_slug`,
`description`, `game_type`, `links`, `photos`. The `game_slug` is auto-generated from `name` by
the model; it cannot be set by the client.

## Edit access status

`GET /games/<slug>/access.json` — **AllowAny**; see [Access status endpoints](common-rules.md#access-status-endpoints-accessjson) above for the
shared response shape. Game's `is_owner` is always `false` (games have no ownership concept).

## Edit permission

`GET /games/<slug>/permissions.json` — **AllowAny**; see [Edit permission endpoints](common-rules.md#edit-permission-endpoints-permissionsjson) above.
Response shape is `{can_edit, can_create_item, can_create_document}` (`GamePermissionsSerializer`):
`can_edit` follows the shared `GameEdit` rule (dm/admin only); `can_create_item` (issue #784) is
backed by `GameItemCreatePermission` — dm, admin, **or staff** (broader than `can_edit`, mirroring
`CharacterPermissionsSerializer`'s `can_create_item` field — see [CharacterItem](character-item.md))
— for both the real-identity and role-simulated (`?role=`) paths. See
[GameItem](game-item.md#item-creation-endpoint) for the endpoint it gates. `can_create_document`
(issue #758) is computed identically, but backed by `GameDocumentCreatePermission` instead — see
[GameDocument](game-document.md#document-creation-endpoint) for the endpoint it gates.

## My Games list

`GET /my-games.json` — Any authenticated user; 401 (`UNAUTHENTICATED_RESPONSE_DATA`) if
unauthenticated, via the `require_authenticated` pattern (not DRF's `IsAuthenticated`) — same
idiom as `GET /games.json`'s create branch. **Cache**: `X-Skip-Cache: true` is always set on the
response (also registered as an exact path in the frontend's
`skipCacheEndpoints.js`) — see [Common Rules](common-rules.md#cache-bypass-mechanism-for-access-endpoints),
since this is per-viewer data.

Returns an array with one item per `Player` row belonging to `request.user` (i.e. every game the
requester belongs to, as player or DM) — never another user's rows:

| Field | Type | Value |
|-------|------|-------|
| `game` | object | Same shape as `GET /games.json` (`name`, `game_slug`, `cover_photo_path`) |
| `role` | `"dm"` \| `"player"` | From that `Player` row's `is_dm` |
| `character` | object \| `null` | `PlayerCharacterSerializer` shape (`name`, `photo_url`) — see [Player](player.md) — or `null` when the role is `"dm"` or the player owns no PC yet in that game |
| `conversations.count` | int | Number of `Conversation`s the requester follows (is a `ConversationParticipant` of) with at least one participant belonging to that game — see [Conversation](conversation.md) |
| `conversations.unread_count` | int | Subset of the above with at least one unread (`not_seen=True`) `MessageVisualisation` for the requester |

No pagination — bounded by how many games one user plays, unlike the public `/games.json` list.
