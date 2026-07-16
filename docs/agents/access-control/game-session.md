# GameSession

Sessions are scoped to a game and record when a session happened. There is no independent
owner/player concept for sessions — write access mirrors `Game.can_be_edited_by` exactly
(**GameSessionEdit**).

| Action | Who can |
|--------|---------|
| List past (`GET /games/<slug>/sessions/past.json`) | **AllowAny** — paginated, `date < today`, ordered most-recent-first (`-date`); 404 if game slug unknown |
| List future (`GET /games/<slug>/sessions/future.json`) | **AllowAny** — paginated, `date >= today`, ordered soonest-first (`date`); 404 if game slug unknown |
| List unscheduled (`GET /games/<slug>/sessions/unscheduled.json`) | **AllowAny** — paginated, `date is null`, ordered by `id`; 404 if game slug unknown |
| Detail (`GET /games/<slug>/sessions/<id>.json`) | **AllowAny**; 404 if game slug unknown, session id unknown, or the session does not belong to that game |
| Create (`POST /games/<slug>/sessions.json`) | **GameSessionEdit** — this URL no longer accepts `GET` (405); the old flat list was replaced by the three endpoints above |
| Update (`PATCH /games/<slug>/sessions/<id>.json`) | **GameSessionEdit** |
| Delete | Superuser only (via Django admin, out of scope) |

**Exposed fields** (list — same fields on all three past/future/unscheduled endpoints):
`id`, `title`, `date`, `game_slug`.

**Exposed fields** (detail): all list fields plus `description` (nullable text). There is no
separate `GET /games/<slug>/sessions/<id>/access.json` endpoint: since a session's edit rights
are identical to its game's, the frontend relies on the existing `GET /games/<slug>/access.json`
endpoint already used for `GameEdit`. Likewise, there is no separate
`GET /games/<slug>/sessions/<id>/permissions.json` endpoint: since `GameSession.can_be_edited_by`
delegates entirely to `Game.can_be_edited_by`, the frontend reuses the existing
`GET /games/<slug>/permissions.json` endpoint instead of embedding a per-user `can_edit` field in
the (cacheable) session detail response.

**Write fields** (create/update): `title` (required for create, optional for update), `date`
(optional, nullable `YYYY-MM-DD`), `description` (optional, nullable text). `game` is never
accepted from the request payload — it is always assigned server-side from the `game_slug` URL
segment.

**Sub-resource**: session messages (`/games/<slug>/sessions/<id>/messages.json`) are a nested
sub-resource of a session but use an independent, player/DM-based permission model distinct from
**GameSessionEdit** — see [GameSessionMessage](game-session-message.md).
