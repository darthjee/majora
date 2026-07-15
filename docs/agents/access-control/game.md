# Game

| Action | Who can |
|--------|---------|
| List (`GET /games.json`) | **AllowAny** |
| Detail (`GET /games/<slug>.json`) | **AllowAny** |
| Create (`POST /games.json`) | Any authenticated user |
| Update (`PATCH /games/<slug>.json`) | **GameEdit** |
| Delete | Superuser only (via Django admin, out of scope) |

**Exposed fields** (read): `name`, `game_slug`, `description`, links list, photos list, treasures
list (via `GET /games/<slug>/treasures.json`), `cover_photo_path` (see [Photo path fields](common-rules.md#photo-path-fields)
above) — returned on both `GET /games.json` and `GET /games/<slug>.json`, to anyone.

`next_session` (`{title, date} | null`) — read-only, computed server-side from the game's own
`GameSession`s (see [GameSession](game-session.md) above): the earliest-dated session with
`date >= today`; if no session has any date at all, falls back to the first session by id;
otherwise (every dated session is already in the past and none are unscheduled) `null`. No
additional permission required — same public access as the rest of `Game` detail. Returned only
on `GET /games/<slug>.json` (detail), **not** on `GET /games.json` (list).

**Write fields** (create/update): `name` (required for create, optional for update),
`description` (optional). `cover_photo_path` is read-only and cannot be set directly by any
client — it is only ever assigned server-side (see [Upload](upload.md) below).

**Create response:** HTTP 201 with `GameDetailSerializer` body — `name`, `game_slug`,
`description`, `links`, `photos`. The `game_slug` is auto-generated from `name` by the model; it
cannot be set by the client.

## Edit access status

`GET /games/<slug>/access.json` — **AllowAny**; see [Access status endpoints](common-rules.md#access-status-endpoints-accessjson) above for the
shared response shape. Game's `is_owner` is always `false` (games have no ownership concept).

## Edit permission

`GET /games/<slug>/permissions.json` — **AllowAny**; see [Edit permission endpoints](common-rules.md#edit-permission-endpoints-permissionsjson) above.
