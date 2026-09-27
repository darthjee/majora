# GameSession

**[Game resource](principles.md#resource-categories).** Sessions are scoped to a game; write
access is gated by **GameSessionEdit**, whose roles beyond baseline (dm/admin) are staff and any
player of the game — see
[`game_session/endpoints.yml`](../../../backend/games/permissions/config/game_session/endpoints.yml)
(`regular.edit`) and [Common Rules](common-rules.md). Follows the [default resource CRUD
pattern](principles.md#default-resource-crud-pattern) (Create/Update = **GameSessionEdit**, Delete
= superuser-only via Django admin), with one deviation: List is split into three separate
endpoints, plus a fourth search endpoint backing the task session picker.

| Action | Who can |
|--------|---------|
| List past (`GET /games/<slug>/sessions/past.json`) | **AllowAny** — `date < today`, most-recent-first |
| List future (`GET /games/<slug>/sessions/future.json`) | **AllowAny** — `date >= today`, soonest-first |
| List unscheduled (`GET /games/<slug>/sessions/unscheduled.json`) | **AllowAny** — `date is null`, ordered by `id` |
| Search (`GET /games/<slug>/sessions.json`) | **AllowAny** — every session of the game, optional `name` filter (case-insensitive substring on `title`), ordered `date` desc (dateless last) then `id` desc |
| Detail (`GET /games/<slug>/sessions/<id>.json`) | **AllowAny** |
| Create (`POST /games/<slug>/sessions.json`) | **GameSessionEdit** |
| Update (`PATCH /games/<slug>/sessions/<id>.json`) | **GameSessionEdit** |

## Fields

**List** (all three past/future/unscheduled): `id`, `title`, `date`, `game_slug`. **Search**:
`id`, `name` (a copy of `title`, for the frontend resource picker), `title`, `date` — no field
beyond what the public lists already expose. **Detail**: adds `description`. There is no `access.json`/`permissions.json` for a session — since edit rights are
identical to its game's, the frontend reuses [Game](game.md)'s own access/permission endpoints.

**Write fields** (create/update): `title` (required for create), `date` (optional, nullable),
`description` (optional, nullable). `game` is always server-assigned from the URL segment.

## Sub-resource

Session messages (`/games/<slug>/sessions/<id>/messages.json`) use an independent,
player/DM-based permission model distinct from **GameSessionEdit** — see
[GameSessionMessage](game-session-message.md).
