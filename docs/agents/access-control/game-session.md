# GameSession

Sessions are scoped to a game and record when a session happened. There is no independent
owner/player concept for sessions — write access mirrors `Game.can_be_edited_by` exactly
(**GameSessionEdit**).

| Action | Who can |
|--------|---------|
| List (`GET /games/<slug>/sessions.json`) | **AllowAny** — paginated, ordered by `id` (creation order, not `date`); 404 if game slug unknown |
| Detail (`GET /games/<slug>/sessions/<id>.json`) | **AllowAny**; 404 if game slug unknown, session id unknown, or the session does not belong to that game |
| Create (`POST /games/<slug>/sessions.json`) | **GameSessionEdit** |
| Update (`PATCH /games/<slug>/sessions/<id>.json`) | **GameSessionEdit** |
| Delete | Superuser only (via Django admin, out of scope) |

**Exposed fields** (list): `id`, `title`, `date`, `game_slug`.

**Exposed fields** (detail): all list fields plus `can_edit` — computed the same way the
`Character` detail serializer surfaces it (a `SerializerMethodField` evaluated against
`request.user` from the serializer context), unlike `Treasure`, which uses a separate
`access.json` endpoint. There is no separate `GET /games/<slug>/sessions/<id>/access.json`
endpoint: since a session's edit rights are identical to its game's, the frontend relies on the
existing `GET /games/<slug>/access.json` endpoint already used for `GameEdit`.

**Write fields** (create/update): `title` (required for create, optional for update), `date`
(optional, nullable `YYYY-MM-DD`). `game` is never accepted from the request payload — it is
always assigned server-side from the `game_slug` URL segment.
