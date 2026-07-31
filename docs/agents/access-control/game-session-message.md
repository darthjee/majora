# GameSessionMessage

**[Game resource](principles.md#resource-categories).** A chat/message-board entry posted to a
specific `GameSession`. Unlike `GameSession` itself, messages use an independent, player/DM-based
permission model (**SessionMessagePermission**) with different rules for viewing versus posting.

| Action | Who can |
|--------|---------|
| List (`GET /games/<game_slug>/sessions/<session_id>/messages.json`) | Player of the session's game, that game's GameMaster, superuser, or staff — `check_view` |
| Create (`POST /games/<game_slug>/sessions/<session_id>/messages.json`) | Player of the session's game, or that game's GameMaster only — `check_create`; **no** superuser/staff bypass |
| Update/Delete | Not exposed by any endpoint (Django admin only) |

## Pagination

A distinct id-cursor style, not the numbered-page paginator used elsewhere. Ordered by `id`
descending (newest first), 20 per page.
- No `next-entry-id` param: returns the most recent 20.
- `?next-entry-id=<id>`: returns messages with `id <= <id>` (20 at a time) — the boundary message
  is intentionally repeated as the first item (frontend dedupes it).
- Response header `NEXT-ENTRY-ID`: the oldest message's `id` in the page, or empty if none older.
- Always sets `X-Skip-Cache: true` on both `GET` and `POST`, per the [`X-Skip-Cache`
  rule](principles.md#x-skip-cache-rule) — list results are user-specific/authorization-gated and
  change frequently.

## Fields
**List and create-response** (same shape): `id`, `content`, `user` (reduced: `name` —
`UserProfile.display_name`, never the real username — and Gravatar-based `avatar_url`), `created_at`.

**Write fields** (create): `content` only (required, length-bounded). `session` is server-assigned
from the URL; `user` is always the requester; `player` is set to the requester's `Player` row when
they post as a player, `null` when posting as DM (a DM has no `Player` row in that game).
