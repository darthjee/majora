# GameSessionMessage

A `GameSessionMessage` is a chat/message-board entry posted to a specific `GameSession`.
Unlike `GameSession` itself (whose write access mirrors `Game.can_be_edited_by` exactly, see
[GameSession](game-session.md)), messages introduce an independent, player/DM-based permission
model (**SessionMessagePermission**) with different rules for viewing versus posting.

| Action | Who can |
|--------|---------|
| List (`GET /games/<game_slug>/sessions/<session_id>/messages.json`) | Player of the session's game, that game's GameMaster, Superuser, or Staff (`is_staff`) — **SessionMessagePermission.check_view**; 401 if unauthenticated, 403 if authenticated but none of the above; 404 if the game slug or session id is unknown, or the session does not belong to that game |
| Create (`POST /games/<game_slug>/sessions/<session_id>/messages.json`) | Player of the session's game, or that game's GameMaster only — **SessionMessagePermission.check_create**; no Superuser/Staff bypass; 401 if unauthenticated, 403 if authenticated but not a player/DM of that game |
| Update/Delete | Not exposed by any endpoint (Django admin only, out of scope) |

**Pagination**: a distinct id-cursor style (`SessionMessagePaginator`), not the numbered-page
`Paginator` used elsewhere. Ordered by `id` descending (newest first), 20 per page.

- No `next-entry-id` query param: returns the most recent 20 messages.
- `?next-entry-id=<id>`: returns messages with `id <= <id>` (20 at a time), continuing the
  descending list — the boundary message is intentionally repeated as the first item of this
  page (the frontend dedupes it against what's already rendered).
- Response header `NEXT-ENTRY-ID`: the `id` of the oldest message in the page just returned, or
  empty when there are no older messages left.
- Response header `X-Skip-Cache: true` is always set on both `GET` and `POST` responses (see
  [Common Rules](common-rules.md) for the cache-bypass mechanism) — list results are
  user-specific/authorization-gated and change frequently, so they must never be served from the
  shared proxy cache. The frontend client correspondingly always sends the `X-Skip-Cache` request
  header for this endpoint (`/messages.json` is listed in the frontend's path-suffix cache-skip
  set), matching the same both-sides-must-opt-out contract described in Common Rules.

**Exposed fields** (list and create-response — same shape):
`id`, `content`, `user` (nested, reduced view — see below), `created_at`.

**Reduced author view** (`user` field): only `name` (the poster's username) and `avatar_url`
(the poster's Gravatar URL, built via the shared `GravatarUrlBuilder`, `null` when the poster has
no email hash) — no `email` or any other `User`/`UserProfile` field is ever exposed through this
endpoint.

**Write fields** (create): `content` only (required, length-bounded — see the model). `session`
is always assigned server-side from the URL segment; `user` is always the requester; `player` is
set server-side to the requester's `Player` row in that game when they post as a player, and left
`null` when they post as the game's DM (a DM has no matching `Player` row in that game).
