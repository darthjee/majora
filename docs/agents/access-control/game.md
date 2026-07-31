# Game

**[Game resource](principles.md#resource-categories).** Follows the [default resource CRUD
pattern](principles.md#default-resource-crud-pattern) (List/Detail = **AllowAny**, Update =
**GameEdit**, Delete = superuser-only via Django admin), with one deviation: **Create**
(`POST /games.json`) requires only any authenticated user, not **GameEdit** — there is no existing
GameMaster to authorize a brand-new game.

## Fields
List/detail (`GET /games.json`/`GET /games/<slug>.json`): `name`, `game_slug`, `description`,
`game_type`, links list, photos list, treasures list, `cover_photo_path` (see [Photo path
fields](common-rules.md#photo-path-fields)). `game_type` (`dnd`/`deadlands`, default `dnd`) and
`next_session` (`{title, date}|null` — the earliest-dated upcoming session, or the first
unscheduled session, or `null`) are detail-only, per the [list/show
default](principles.md#listshow-serializer-defaults).

**Write fields** (create/update): `name` (required for create), `description` (optional),
`game_type` (create-only, defaults to `dnd`, fixed thereafter). `cover_photo_path`/`game_slug` are
read-only, server-assigned only (`game_slug` auto-generated from `name`; `cover_photo_path` set
only via [Upload](upload.md)).

## Edit access status

`GET /games/<slug>/access.json` — **AllowAny**, standard shape per [Access status
endpoints](common-rules.md#access-status-endpoints-accessjson). `is_owner` is always `false`
(games have no ownership concept).

## Edit permission

`GET /permissions/game.json` — entity-agnostic (no path parameters, since #926), **AllowAny**,
standard shape per [Edit permission
endpoints](common-rules.md#edit-permission-endpoints-permissionsjson). Beyond `can_edit`
(**GameEdit**), exposes:
- `can_create_item` — **GameItemCreatePermission**: dm, admin, or staff — broader than `can_edit`.
  See [GameItem](game-item.md#item-creation-endpoint).
- `can_create_document` — same shape, backed by the document-creation permission. See
  [GameDocument](game-document.md#document-creation-endpoint).

## My Games list

`GET /my-games.json` — any authenticated user; `401` if unauthenticated. Always sets
`X-Skip-Cache: true` per the [`X-Skip-Cache` rule](principles.md#x-skip-cache-rule) (per-viewer
data). Not paginated — bounded by how many games one user plays.

Returns one item per `Player` row belonging to the requester (every game they belong to, as player
or DM) — never another user's rows:

| Field | Type | Value |
|-------|------|-------|
| `game` | object | Same shape as `GET /games.json` (`name`, `game_slug`, `cover_photo_path`) |
| `role` | `"dm"` \| `"player"` | From that `Player` row's `is_dm` |
| `character` | object \| `null` | `name`, `photo_url` — see [Player](player.md) — or `null` when the role is `"dm"` or the player owns no PC yet in that game |
| `conversations.count` | int | Number of `Conversation`s the requester follows with at least one participant belonging to that game — see [Conversation](conversation.md) |
| `conversations.unread_count` | int | Subset of the above with at least one unread message for the requester |
