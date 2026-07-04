# Plan: Add game sessions

Issue: [277-add-game-sessions.md](../issues/277-add-game-sessions.md)

## Overview

Add a new `GameSession` entity (game FK, required `title`, optional `date`) as a full CRUD
resource scoped to a `Game`, following the layered structure already used by `Treasure` and
`GameMaster` (permission class, model, per-verb serializers, per-verb views, urls) plus a new
set of frontend pages (index/new/show/edit) and a "Sessions" link on the game show page. Write
access mirrors `Game.can_be_edited_by` exactly (GameMaster of that game, or superuser); read
access is public. The game-scoped list is paginated like `game_treasures`. Navi's warm-up chain
is extended so the new endpoints are pre-cached after release, the same way `game_treasures` is
today.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [infra](infra.md)

## Shared contracts

**New endpoints** (backend produces, frontend consumes):

| Method | URL | Auth | Request body | Response |
|--------|-----|------|---------------|----------|
| `GET` | `/games/<slug:game_slug>/sessions.json` | Public | — | Paginated list of `{id, title, date, game_slug}` (headers: `page`, `pages`, `per_page`, `total`) |
| `POST` | `/games/<slug:game_slug>/sessions.json` | GameMaster of that game, or superuser | `{title (required), date (optional, "YYYY-MM-DD" or null)}` | 201 with detail body; 401 unauthenticated; 403 not a GameMaster/superuser; 400 invalid payload; 404 unknown `game_slug` |
| `GET` | `/games/<slug:game_slug>/sessions/<int:session_id>.json` | Public | — | `{id, title, date, game_slug, can_edit}` |
| `PATCH` | `/games/<slug:game_slug>/sessions/<int:session_id>.json` | GameMaster of that game, or superuser | `{title (optional), date (optional)}` | 200 with detail body; 401/403/400 as above; 404 unknown `game_slug`/`session_id`, or `session_id` not belonging to `game_slug` |

No DELETE endpoint (admin-only via Django admin — matches Game/Character/Treasure convention).

`can_edit` on the detail response is computed the same way `Character`/`Treasure` detail
serializers surface it, so the frontend edit/new pages can gate on it without needing a
separate `access.json` endpoint — there is no independent `GameSessionEditPermission` concept
beyond `game.can_be_edited_by(user)`, so the frontend may instead reuse the existing
`GET /games/<slug>.json` + `GET /games/<slug>/access.json` pair (already fetched for
`GameEdit`) to decide whether to show the "New session" / "Edit" actions, rather than requiring
a new per-session access endpoint. Either approach is acceptable; the frontend plan below uses
the existing game access endpoint since sessions have no independent owner.

List is ordered by `id` (creation order) — no chronological sort by `date`, matching every
other entity's `Meta.ordering = ['id']` convention.

**Frontend routes** (frontend produces, no other agent depends on these, listed for completeness):
- `#/games/:game_slug/sessions` — index (paginated)
- `#/games/:game_slug/sessions/new` — create form
- `#/games/:game_slug/sessions/:id` — show
- `#/games/:game_slug/sessions/:id/edit` — edit form

**Navi warm-up** (infra depends on the backend endpoints above): a new `game_sessions` /
`paginated_game_sessions` / `session` resource chain mirroring `game_treasures` /
`paginated_game_treasures` (but, like `game_pcs`/`game_npcs`, chasing into per-item detail
since sessions have a real detail page), wired into `paginated_games`'s existing per-game
action list.
